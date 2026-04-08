"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { useTourUpload } from "@/hooks/useTourUpload";
import { useEditorProject } from "@/hooks/useEditorProject";
import { useToast } from "@/components/dashboard/Toast";
import { useTranslation } from "@/i18n";
import { FloatingTourProgress } from "@/components/dashboard/FloatingTourProgress";
import { useQueryClient } from "@tanstack/react-query";
import { projectKeys } from "@/hooks/useProjectsQuery";
import type { ProyectoCompleto } from "@/types";

type Status = "idle" | "extracting" | "uploading" | "complete" | "error";

export interface TourUploadContextValue {
  status: Status;
  progress: number;
  speed: number;
  eta: number;
  filesUploaded: number;
  filesTotal: number;
  error: string | null;
  tourUrl: string | null;
  upload: (file: File, tipologiaId?: string) => Promise<void>;
  uploadFolder: (
    files: FileList | { file: File; path: string }[],
    tipologiaId?: string
  ) => Promise<void>;
  reset: () => void;
  cancel: () => void;
  isActive: boolean;
  isMinimized: boolean;
  setMinimized: (v: boolean) => void;
  activeTipologiaId: string | null;
}

const TourUploadCtx = createContext<TourUploadContextValue | null>(null);

export function useTourUploadContext(): TourUploadContextValue {
  const ctx = useContext(TourUploadCtx);
  if (!ctx) {
    throw new Error(
      "useTourUploadContext must be used within TourUploadProvider"
    );
  }
  return ctx;
}

export function TourUploadProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { project, save } = useEditorProject();
  const tourUpload = useTourUpload();
  const toast = useToast();
  const { t } = useTranslation("editor");
  const [isMinimized, setMinimized] = useState(true);
  const [activeTipologiaId, setActiveTipologiaId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const isActive =
    tourUpload.status === "extracting" || tourUpload.status === "uploading";

  /* ── Auto-save: when upload completes, persist tour_360_url ── */
  const prevStatusRef = useRef(tourUpload.status);
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = tourUpload.status;

    if (
      prev !== "complete" &&
      tourUpload.status === "complete" &&
      tourUpload.tourUrl
    ) {
      if (activeTipologiaId) {
        // Save to tipología
        const tipoId = activeTipologiaId;
        const tourUrl = tourUpload.tourUrl;
        fetch(`/api/tipologias/${tipoId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tour_360_url: tourUrl }),
        })
          .then(async (res) => {
            if (res.ok) {
              // Update React Query cache
              queryClient.setQueryData<ProyectoCompleto>(
                projectKeys.detail(project.id),
                (old) =>
                  old
                    ? {
                        ...old,
                        tipologias: old.tipologias.map((t) =>
                          t.id === tipoId
                            ? { ...t, tour_360_url: tourUrl }
                            : t
                        ),
                      }
                    : old
              );
              toast.success(t("config.tour.uploadComplete"));
            } else {
              toast.error(t("config.tour.uploadError"));
            }
          })
          .catch(() => {
            toast.error(t("config.tour.uploadError"));
          });
      } else {
        // Save to project (existing behavior)
        save({ tour_360_url: tourUpload.tourUrl }).then((ok) => {
          if (ok) {
            toast.success(t("config.tour.uploadComplete"));
          } else {
            toast.error(t("config.tour.uploadError"));
          }
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourUpload.status, tourUpload.tourUrl]);

  /* ── beforeunload: prevent accidental browser close ── */
  useEffect(() => {
    if (!isActive) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isActive]);

  /* ── Wrap upload functions to auto-inject projectId ── */
  const upload = useCallback(
    async (file: File, tipologiaId?: string) => {
      setActiveTipologiaId(tipologiaId || null);
      await tourUpload.upload(file, project.id, tipologiaId);
    },
    [tourUpload, project.id]
  );

  const uploadFolder = useCallback(
    async (files: FileList | { file: File; path: string }[], tipologiaId?: string) => {
      setActiveTipologiaId(tipologiaId || null);
      await tourUpload.uploadFolder(files, project.id, tipologiaId);
    },
    [tourUpload, project.id]
  );

  const contextValue = useMemo<TourUploadContextValue>(
    () => ({
      status: tourUpload.status,
      progress: tourUpload.progress,
      speed: tourUpload.speed,
      eta: tourUpload.eta,
      filesUploaded: tourUpload.filesUploaded,
      filesTotal: tourUpload.filesTotal,
      error: tourUpload.error,
      tourUrl: tourUpload.tourUrl,
      upload,
      uploadFolder,
      reset: tourUpload.reset,
      cancel: tourUpload.cancel,
      isActive,
      isMinimized,
      setMinimized,
      activeTipologiaId,
    }),
    [tourUpload, upload, uploadFolder, isActive, isMinimized, activeTipologiaId]
  );

  return (
    <TourUploadCtx.Provider value={contextValue}>
      {children}
      <FloatingTourProgress />
    </TourUploadCtx.Provider>
  );
}
