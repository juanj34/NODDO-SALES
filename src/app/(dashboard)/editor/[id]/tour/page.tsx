"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, useCallback, DragEvent } from "react";
import { useEditorProject } from "@/hooks/useEditorProject";
import { useToast } from "@/components/dashboard/Toast";
import { useConfirm } from "@/components/dashboard/ConfirmModal";
import { useTourUploadContext } from "@/contexts/TourUploadContext";
import { readDroppedFolder, pickFolderNative, hasNativeFolderPicker } from "@/hooks/useTourUpload";
import {
  inputClass, labelClass, fieldHint,
  sectionCard,
} from "@/components/dashboard/editor-styles";
import { PageHeader } from "@/components/dashboard/base/PageHeader";
import { View, Loader2, ExternalLink, CheckCircle2, AlertCircle, CloudUpload, Link2, Upload, FolderOpen, Trash2 } from "lucide-react";
import { extractTourUrl } from "@/lib/tour-utils";
import { motion } from "framer-motion";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { projectKeys } from "@/hooks/useProjectsQuery";
import type { ProyectoCompleto, Tipologia } from "@/types";

/* ─────────────────────────────────────────────── */
/* Tipología Tour Row                              */
/* ─────────────────────────────────────────────── */
function TipologiaTourRow({
  tipologia,
  projectId,
  tourUploadActive,
  activeTipologiaId,
}: {
  tipologia: Tipologia;
  projectId: string;
  tourUploadActive: boolean;
  activeTipologiaId: string | null;
}) {
  const { t } = useTranslation("editor");
  const toast = useToast();
  const { confirm } = useConfirm();
  const tourUpload = useTourUploadContext();
  const queryClient = useQueryClient();

  const [rawInput, setRawInput] = useState(tipologia.tour_360_url || "");
  const [url, setUrl] = useState(tipologia.tour_360_url || "");
  const [deleting, setDeleting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Sync when tipologia data changes externally
  useEffect(() => {
    setRawInput(tipologia.tour_360_url || "");
    setUrl(tipologia.tour_360_url || "");
  }, [tipologia.tour_360_url]);

  // Sync when upload completes for this tipología
  useEffect(() => {
    if (
      tourUpload.status === "complete" &&
      tourUpload.tourUrl &&
      activeTipologiaId === tipologia.id
    ) {
      setUrl(tourUpload.tourUrl);
      setRawInput(tourUpload.tourUrl);
    }
  }, [tourUpload.status, tourUpload.tourUrl, activeTipologiaId, tipologia.id]);

  const r2ToursUrl = process.env.NEXT_PUBLIC_R2_TOURS_URL || "";
  const isR2Hosted = !!(url && r2ToursUrl && url.startsWith(r2ToursUrl));
  const isUploading = tourUploadActive && activeTipologiaId === tipologia.id;

  const saveTourUrl = useCallback(
    (newUrl: string) => {
      fetch(`/api/tipologias/${tipologia.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tour_360_url: newUrl || null }),
      })
        .then(async (res) => {
          if (res.ok) {
            queryClient.setQueryData<ProyectoCompleto>(
              projectKeys.detail(projectId),
              (old) =>
                old
                  ? {
                      ...old,
                      tipologias: old.tipologias.map((t) =>
                        t.id === tipologia.id
                          ? { ...t, tour_360_url: newUrl || null }
                          : t
                      ),
                    }
                  : old
            );
          } else {
            toast.error(t("general.saveError"));
          }
        })
        .catch(() => toast.error(t("general.saveError")));
    },
    [tipologia.id, projectId, queryClient, toast, t]
  );

  const scheduleAutoSave = useCallback(
    (newUrl: string) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => saveTourUrl(newUrl), 1500);
    },
    [saveTourUrl]
  );

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const handleDeleteHosted = async () => {
    const ok = await confirm({
      title: t("config.tour.deleteHosted"),
      message: t("config.tour.confirmDelete"),
      confirmLabel: t("config.tour.deleteHosted"),
      variant: "danger",
    });
    if (!ok) return;

    setDeleting(true);
    try {
      const res = await fetch(
        `/api/tours/${projectId}?tipologia_id=${tipologia.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error");
      }
      setUrl("");
      setRawInput("");
      queryClient.setQueryData<ProyectoCompleto>(
        projectKeys.detail(projectId),
        (old) =>
          old
            ? {
                ...old,
                tipologias: old.tipologias.map((t) =>
                  t.id === tipologia.id ? { ...t, tour_360_url: null } : t
                ),
              }
            : old
      );
      toast.success(t("config.tour.uploadComplete"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setDeleting(false);
    }
  };

  const handleZipSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (zipInputRef.current) zipInputRef.current.value = "";
    tourUpload.upload(file, tipologia.id);
  };

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const snapshot: { file: File; path: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      snapshot.push({ file: f, path: f.webkitRelativePath || f.name });
    }
    if (folderInputRef.current) folderInputRef.current.value = "";
    tourUpload.uploadFolder(snapshot, tipologia.id);
  };

  const handleFolderClick = useCallback(async () => {
    if (hasNativeFolderPicker()) {
      const files = await pickFolderNative();
      if (files && files.length > 0) {
        tourUpload.uploadFolder(files, tipologia.id);
      }
      return;
    }
    folderInputRef.current?.click();
  }, [tourUpload, tipologia.id]);

  return (
    <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-[var(--text-primary)]">
          {tipologia.nombre}
        </h4>
        {url ? (
          <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-ui uppercase tracking-wider">
            <CheckCircle2 size={11} />
            {isR2Hosted
              ? t("config.tour.tipologiaTourHosted")
              : t("config.tour.tipologiaTourConfigured")}
          </span>
        ) : (
          <span className="text-[10px] text-[var(--text-muted)] font-ui uppercase tracking-wider">
            {t("config.tour.tipologiaTourNone")}
          </span>
        )}
      </div>

      {/* URL input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={rawInput}
          onChange={(e) => {
            const raw = e.target.value;
            setRawInput(raw);
            const extracted = extractTourUrl(raw);
            setUrl(extracted);
            scheduleAutoSave(extracted);
          }}
          placeholder={t("config.tour.tipologiaTourUrlPlaceholder")}
          className={cn(inputClass, "flex-1")}
          disabled={isUploading}
        />
        {/* Upload buttons */}
        {!isUploading && (
          <div className="flex gap-1 shrink-0">
            <button
              type="button"
              onClick={() => zipInputRef.current?.click()}
              disabled={tourUploadActive}
              className="p-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface-2)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-3)] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title={t("config.tour.selectZip")}
            >
              <Upload size={14} />
            </button>
            <button
              type="button"
              onClick={handleFolderClick}
              disabled={tourUploadActive}
              className="p-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface-2)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-3)] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title={t("config.tour.selectFolder")}
            >
              <FolderOpen size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Uploading indicator for this tipología */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Loader2 size={14} className="animate-spin text-[var(--site-primary)]" />
            <span className="text-xs text-[var(--text-secondary)]">
              {tourUpload.status === "extracting"
                ? t("config.tour.extracting")
                : `${t("config.tour.uploadingFiles")} (${tourUpload.filesUploaded}/${tourUpload.filesTotal})`}
            </span>
            {tourUpload.status === "uploading" && (
              <span className="text-xs text-[var(--text-muted)] ml-auto">{tourUpload.progress}%</span>
            )}
          </div>
          {tourUpload.status === "uploading" && tourUpload.totalBytes > 0 && (
            <div className="text-[11px] text-[var(--text-muted)] space-y-1">
              <div className="flex justify-between">
                <span>Velocidad: {(tourUpload.speed / 1024 / 1024).toFixed(1)} MB/s</span>
                <span>Tamaño: {(tourUpload.totalBytes / 1024 / 1024).toFixed(1)} MB</span>
              </div>
              <div>
                Estimado: {Math.floor(tourUpload.eta / 60)}m {Math.round(tourUpload.eta % 60)}s
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions row when URL exists */}
      {url && !isUploading && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="text-xs text-[var(--site-primary)] hover:underline cursor-pointer"
          >
            {showPreview ? "Ocultar" : t("config.tour.preview")}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--site-primary)] hover:underline flex items-center gap-1"
          >
            <ExternalLink size={11} />
          </a>
          {isR2Hosted && (
            <button
              onClick={handleDeleteHosted}
              disabled={deleting}
              className="text-xs text-red-400/70 hover:text-red-400 ml-auto flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              {deleting ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
              {t("config.tour.deleteHosted")}
            </button>
          )}
          {!isR2Hosted && url && (
            <button
              onClick={() => {
                setUrl("");
                setRawInput("");
                saveTourUrl("");
              }}
              className="text-xs text-red-400/70 hover:text-red-400 ml-auto flex items-center gap-1 cursor-pointer"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      )}

      {/* Preview iframe */}
      {showPreview && url && (
        <div className="w-full h-[180px] rounded-lg overflow-hidden border border-[var(--border-subtle)]">
          <iframe
            src={url}
            className="w-full h-full border-0"
            allowFullScreen
            title={`Tour 360 — ${tipologia.nombre}`}
          />
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={zipInputRef}
        type="file"
        accept=".zip,application/zip,application/x-zip-compressed"
        onChange={handleZipSelect}
        className="hidden"
      />
      <input
        ref={(el) => {
          (folderInputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
          if (el) el.setAttribute("webkitdirectory", "");
        }}
        type="file"
        onChange={handleFolderSelect}
        className="hidden"
      />
    </div>
  );
}

/* ─────────────────────────────────────────────── */
/* Tour Page                                       */
/* ─────────────────────────────────────────────── */
export default function TourPage() {
  const { project, save } = useEditorProject();
  const { t } = useTranslation("editor");
  const toast = useToast();
  const { confirm } = useConfirm();

  const [tour360Url, setTour360Url] = useState("");
  const [tour360RawInput, setTour360RawInput] = useState("");
  const [tourTab, setTourTab] = useState<"url" | "upload">("url");
  const initializedRef = useRef(false);
  const [tourDeleting, setTourDeleting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const tourZipInputRef = useRef<HTMLInputElement>(null);
  const tourFolderInputRef = useRef<HTMLInputElement>(null);
  const tourUpload = useTourUploadContext();

  useEffect(() => {
    if (!project || initializedRef.current) return;
    initializedRef.current = true;
    setTour360Url(project.tour_360_url || "");
    setTour360RawInput(project.tour_360_url || "");
  }, [project]);

  const handleSave = async () => {
    if (!initializedRef.current) return;
    const ok = await save({
      tour_360_url: tour360Url || null,
    });
    if (!ok) toast.error(t("general.saveError"));
  };

  /* ── Auto-save ── */
  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleAutoSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => handleSaveRef.current(), 1500);
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        handleSaveRef.current();
      }
    };
  }, []);

  // Detect if tour URL is hosted on R2
  const r2ToursUrl = process.env.NEXT_PUBLIC_R2_TOURS_URL || "";
  const isR2Hosted = !!(tour360Url && r2ToursUrl && tour360Url.startsWith(r2ToursUrl));

  // Sync local state when upload completes for project tour (not tipología)
  useEffect(() => {
    if (tourUpload.status === "complete" && tourUpload.tourUrl && !tourUpload.activeTipologiaId) {
      setTour360Url(tourUpload.tourUrl);
      setTour360RawInput(tourUpload.tourUrl);
    }
  }, [tourUpload.status, tourUpload.tourUrl, tourUpload.activeTipologiaId]);

  const handleTourZipSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (tourZipInputRef.current) tourZipInputRef.current.value = "";
    tourUpload.upload(file);
  };

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    // Snapshot files before clearing — FileList is a live reference that empties on clear
    const snapshot: { file: File; path: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      snapshot.push({ file: f, path: f.webkitRelativePath || f.name });
    }
    if (tourFolderInputRef.current) tourFolderInputRef.current.value = "";
    tourUpload.uploadFolder(snapshot);
  };

  const handleFolderClick = useCallback(async () => {
    // Use native File System Access API (no scary browser dialog)
    if (hasNativeFolderPicker()) {
      const files = await pickFolderNative();
      if (files && files.length > 0) {
        tourUpload.uploadFolder(files);
      }
      return;
    }
    // Fallback to webkitdirectory input
    tourFolderInputRef.current?.click();
  }, [tourUpload]);

  const handleDrop = useCallback(async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);

    // Check if a folder was dropped
    const folderFiles = await readDroppedFolder(e.dataTransfer.items);
    if (folderFiles && folderFiles.length > 0) {
      tourUpload.uploadFolder(folderFiles);
      return;
    }

    // Otherwise treat as ZIP file
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".zip")) {
      toast.error(t("config.tour.zipOrFolderOnly"));
      return;
    }
    tourUpload.upload(file);
  }, [tourUpload, toast, t]);

  const handleDeleteHostedTour = async () => {
    if (!project) return;
    const ok = await confirm({
      title: t("config.tour.deleteHosted"),
      message: t("config.tour.confirmDelete"),
      confirmLabel: t("config.tour.deleteHosted"),
      variant: "danger",
    });
    if (!ok) return;

    setTourDeleting(true);
    try {
      const res = await fetch(`/api/tours/${project.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error");
      }
      setTour360Url("");
      setTour360RawInput("");
      scheduleAutoSave();
      tourUpload.reset();
      toast.success(t("config.tour.uploadComplete"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setTourDeleting(false);
    }
  };

  const tipologias = project.tipologias || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      {/* Page Header */}
      <PageHeader
        icon={View}
        title={t("config.tour.title")}
        description={t("config.tour.description")}
      />

      {/* Tour Virtual Section (Project-level) */}
      <div className={cn(sectionCard, "space-y-6")}>
        {/* Tab toggle */}
        <div className="flex gap-1 p-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] w-fit">
          <button
            onClick={() => setTourTab("url")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-ui font-semibold uppercase tracking-wider transition-all cursor-pointer",
              tourTab === "url"
                ? "bg-[var(--surface-3)] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-tertiary)]"
            )}
          >
            <Link2 size={13} />
            {t("config.tour.tabUrl")}
          </button>
          <button
            onClick={() => setTourTab("upload")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-ui font-semibold uppercase tracking-wider transition-all cursor-pointer",
              tourTab === "upload"
                ? "bg-[var(--surface-3)] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-tertiary)]"
            )}
          >
            <CloudUpload size={13} />
            {t("config.tour.tabUpload")}
          </button>
        </div>

        {/* Tab: Paste URL */}
        {tourTab === "url" && (
          <div>
            <label className={labelClass}>{t("config.tour.urlLabel")}</label>
            <input
              type="text"
              value={tour360RawInput}
              onChange={(e) => {
                const raw = e.target.value;
                setTour360RawInput(raw);
                setTour360Url(extractTourUrl(raw));
                scheduleAutoSave();
              }}
              placeholder={t("config.tour.urlPlaceholder")}
              className={inputClass}
            />
            <p className={fieldHint}>
              {t("config.tour.urlHint")}
            </p>
          </div>
        )}

        {/* Tab: Upload */}
        {tourTab === "upload" && (
          <div className="space-y-4">
            {/* Already hosted on R2 */}
            {isR2Hosted && tourUpload.status === "idle" && (
              <div className="flex items-center gap-3 p-3 rounded-[1.25rem] bg-emerald-500/8 border border-emerald-500/15">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-emerald-300 font-medium">{t("config.tour.hostedOnNoddo")}</p>
                  <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{tour360Url}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => tourZipInputRef.current?.click()}
                    className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                  >
                    {t("config.tour.replaceHosted")}
                  </button>
                  <button
                    onClick={handleDeleteHostedTour}
                    disabled={tourDeleting}
                    className="text-xs text-red-400/70 hover:text-red-400 px-2.5 py-1.5 rounded-lg border border-red-500/15 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {tourDeleting ? <Loader2 size={12} className="animate-spin" /> : t("config.tour.deleteHosted")}
                  </button>
                </div>
              </div>
            )}

            {/* Extracting / scanning state */}
            {tourUpload.status === "extracting" && !tourUpload.activeTipologiaId && (
              <div className="flex flex-col items-center justify-center gap-3 p-10 rounded-[1.25rem] bg-[var(--surface-2)] border border-[var(--border-subtle)]">
                <Loader2 size={24} className="animate-spin text-[var(--site-primary)]" />
                <p className="text-sm text-[var(--text-secondary)]">{t("config.tour.extracting")}</p>
              </div>
            )}

            {/* Uploading state */}
            {tourUpload.status === "uploading" && !tourUpload.activeTipologiaId && (
              <div className="p-6 rounded-[1.25rem] bg-[var(--surface-2)] border border-[var(--border-subtle)] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CloudUpload size={18} className="text-[var(--site-primary)]" />
                    <p className="text-sm text-[var(--text-secondary)]">
                      {t("config.tour.uploadingFiles")} ({tourUpload.filesUploaded}/{tourUpload.filesTotal})
                    </p>
                  </div>
                  <button
                    onClick={tourUpload.cancel}
                    className="text-xs text-[var(--text-muted)] hover:text-red-400 transition-colors cursor-pointer"
                  >
                    {t("config.tour.cancel")}
                  </button>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[var(--surface-3)] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "var(--site-primary)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${tourUpload.progress}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[var(--text-muted)]">{tourUpload.progress}%</p>
                </div>
                {tourUpload.totalBytes > 0 && (
                  <div className="text-[11px] text-[var(--text-muted)] space-y-2 pt-2 border-t border-[var(--border-subtle)]">
                    <div className="flex justify-between">
                      <span>Velocidad:</span>
                      <span className="text-[var(--text-secondary)]">{(tourUpload.speed / 1024 / 1024).toFixed(1)} MB/s</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tamaño:</span>
                      <span className="text-[var(--text-secondary)]">{(tourUpload.totalBytes / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tiempo estimado:</span>
                      <span className="text-[var(--text-secondary)]">{Math.floor(tourUpload.eta / 60)}m {Math.round(tourUpload.eta % 60)}s</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Upload complete */}
            {tourUpload.status === "complete" && !tourUpload.activeTipologiaId && (
              <div className="flex items-center gap-3 p-3 rounded-[1.25rem] bg-emerald-500/8 border border-emerald-500/15">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                <p className="text-sm text-emerald-300">{t("config.tour.uploadComplete")}</p>
              </div>
            )}

            {/* Error state */}
            {tourUpload.status === "error" && !tourUpload.activeTipologiaId && (
              <div className="flex items-center gap-3 p-3 rounded-[1.25rem] bg-red-500/8 border border-red-500/15">
                <AlertCircle size={18} className="text-red-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-red-300">{tourUpload.error}</p>
                </div>
                <button
                  onClick={tourUpload.reset}
                  className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                >
                  {t("config.tour.retry")}
                </button>
              </div>
            )}

            {/* Drop zone (shown when idle and not already hosted) */}
            {tourUpload.status === "idle" && !isR2Hosted && (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-4 p-4 sm:p-8 rounded-[1.25rem] border-2 border-dashed transition-all duration-200",
                  dragOver
                    ? "border-[var(--site-primary)] bg-[rgba(var(--site-primary-rgb),0.06)]"
                    : "border-[var(--border-default)] bg-[var(--surface-1)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)]"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                  dragOver
                    ? "bg-[rgba(var(--site-primary-rgb),0.15)]"
                    : "bg-[var(--surface-3)]"
                )}>
                  <Upload size={20} className={cn(
                    "transition-colors",
                    dragOver ? "text-[var(--site-primary)]" : "text-[var(--text-tertiary)]"
                  )} />
                </div>
                <div className="text-center space-y-1.5">
                  <p className="text-sm text-[var(--text-secondary)]">
                    {t("config.tour.dropzoneTitle")}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {t("config.tour.dropzoneOr")}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); tourZipInputRef.current?.click(); }}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-ui font-semibold uppercase tracking-wider border border-[var(--border-default)] bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    <Upload size={13} />
                    {t("config.tour.selectZip")}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleFolderClick(); }}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-ui font-semibold uppercase tracking-wider border border-[var(--site-primary)]/30 bg-[rgba(var(--site-primary-rgb),0.08)] text-[var(--site-primary)] hover:bg-[rgba(var(--site-primary-rgb),0.15)] transition-colors cursor-pointer"
                  >
                    <FolderOpen size={13} />
                    {t("config.tour.selectFolder")}
                  </button>
                </div>
                <p className="text-[10px] text-[var(--text-muted)] tracking-wide uppercase font-ui">
                  {t("config.tour.dropzoneFormats")}
                </p>
              </div>
            )}

            <p className={fieldHint}>{t("config.tour.uploadHint")}</p>

            <input
              ref={tourZipInputRef}
              type="file"
              accept=".zip,application/zip,application/x-zip-compressed"
              onChange={handleTourZipSelect}
              className="hidden"
            />
            <input
              ref={(el) => {
                (tourFolderInputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
                if (el) el.setAttribute("webkitdirectory", "");
              }}
              type="file"
              onChange={handleFolderSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Preview (shown for both tabs when URL exists) */}
        {tour360Url && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-tertiary)]">{t("config.tour.preview")}</span>
              <a
                href={tour360Url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--site-primary)] hover:underline flex items-center gap-1"
              >
                <ExternalLink size={11} />
                {t("config.tour.openInTab")}
              </a>
            </div>
            <div className="w-full h-[220px] rounded-xl overflow-hidden border border-[var(--border-subtle)]">
              <iframe
                src={tour360Url}
                className="w-full h-full border-0"
                allowFullScreen
                title="Tour 360 preview"
              />
            </div>
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────── */}
      {/* Tours de Tipologías Section             */}
      {/* ──────────────────────────────────────── */}
      {tipologias.length > 0 && (
        <div className={cn(sectionCard, "space-y-5")}>
          <div>
            <h3 className="font-heading text-lg text-[var(--text-primary)]">
              {t("config.tour.tipologiaTours")}
            </h3>
            <p className={fieldHint}>{t("config.tour.tipologiaToursDesc")}</p>
          </div>
          <div className="space-y-3">
            {tipologias.map((tipo) => (
              <TipologiaTourRow
                key={tipo.id}
                tipologia={tipo}
                projectId={project.id}
                tourUploadActive={tourUpload.isActive}
                activeTipologiaId={tourUpload.activeTipologiaId}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
