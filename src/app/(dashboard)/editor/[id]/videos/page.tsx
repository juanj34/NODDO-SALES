"use client";

export const dynamic = "force-dynamic";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { useTranslation } from "@/i18n";
import { useEditorProject } from "@/hooks/useEditorProject";
import { useConfirm } from "@/components/dashboard/ConfirmModal";
import { useToast } from "@/components/dashboard/Toast";
import { useVideoUpload } from "@/hooks/useVideoUpload";
import { cn } from "@/lib/utils";
import {
  inputClass,
  labelClass,
  fieldHint,
  btnPrimary,
  btnSecondary,
  btnDanger,
  sectionCard,
  listItem,
} from "@/components/dashboard/editor-styles";
import { PageHeader } from "@/components/dashboard/base/PageHeader";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import type { Video } from "@/types";
import {
  Plus,
  Loader2,
  Check,
  X,
  Pencil,
  Trash2,
  Film,
  GripVertical,
  Upload,
  Link2,
  CloudUpload,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";

/* ── Helpers ── */

function getYouTubeThumbnail(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getVideoThumbnail(video: Video): string | null {
  if (video.thumbnail_url) return video.thumbnail_url;
  if (video.stream_uid) return `https://videodelivery.net/${video.stream_uid}/thumbnails/thumbnail.jpg`;
  return getYouTubeThumbnail(video.url);
}

/* ── Draggable video row ── */
function DraggableVideo({
  video,
  onEdit,
  onDelete,
  deleteLoading,
  t,
}: {
  video: Video;
  onEdit: () => void;
  onDelete: () => void;
  deleteLoading: boolean;
  t: (key: string) => string;
}) {
  const controls = useDragControls();
  const thumb = getVideoThumbnail(video);
  const isProcessing = video.stream_uid && video.stream_status !== "ready" && video.stream_status !== "error";
  const isError = video.stream_status === "error";

  return (
    <Reorder.Item
      value={video}
      dragListener={false}
      dragControls={controls}
      className={listItem}
      whileDrag={{ scale: 1.02, boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}
    >
      <div
        onPointerDown={(e) => controls.start(e)}
        className="cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors shrink-0 touch-none"
      >
        <GripVertical size={16} />
      </div>
      <div className="w-20 h-14 sm:w-32 sm:h-20 rounded-lg overflow-hidden bg-[var(--surface-2)] flex items-center justify-center shrink-0 relative">
        {isProcessing ? (
          <div className="flex flex-col items-center gap-1">
            <Loader2 size={20} className="text-[var(--site-primary)] animate-spin" />
            <span className="text-[9px] text-[var(--text-muted)]">{t("videos.processingStatus")}</span>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-1">
            <AlertCircle size={20} className="text-red-400" />
            <span className="text-[9px] text-red-400">Error</span>
          </div>
        ) : thumb ? (
          <Image src={thumb} alt="undefined" fill className="w-full h-full object-cover" />
        ) : (
          <Film size={20} className="text-[var(--text-muted)]" />
        )}
        {/* Duration badge */}
        {video.duration && video.stream_status === "ready" && (
          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[10px] text-white tabular-nums">
            {formatDuration(video.duration)}
          </div>
        )}
        {/* Stream badge */}
        {video.stream_uid && video.stream_status === "ready" && (
          <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-[var(--site-primary)]/20 text-[9px] text-[var(--site-primary)]">
            Stream
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-white">
          {video.titulo || "Sin titulo"}
        </h3>
        <p className="text-xs text-[var(--text-tertiary)] truncate mt-0.5">
          {video.stream_uid
            ? (video.stream_status === "ready" ? t("videos.readyStatus") : t("videos.processingStatus"))
            : video.url}
        </p>
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {!video.stream_uid && (
          <button
            onClick={onEdit}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-[var(--text-tertiary)] hover:text-white hover:bg-[var(--surface-2)] rounded-lg transition-colors"
          >
            <Pencil size={12} />
            {t("videos.edit")}
          </button>
        )}
        <button onClick={onDelete} disabled={deleteLoading} className={btnDanger}>
          {deleteLoading ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
          {t("videos.delete")}
        </button>
      </div>
    </Reorder.Item>
  );
}

/* ── Main page ── */
export default function VideosPage() {
  const { t } = useTranslation("editor");
  const { project, refresh, projectId } = useEditorProject();
  const { confirm } = useConfirm();
  const toast = useToast();
  const videoUpload = useVideoUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [videoForm, setVideoForm] = useState({ titulo: "", url: "" });
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [formTab, setFormTab] = useState<"url" | "upload">("url");
  const [saving, setSaving] = useState(false);
  const [orderedVideos, setOrderedVideos] = useState<Video[]>(project.videos);
  const [dragging, setDragging] = useState(false);

  // Sync local order with project data when it changes
  useEffect(() => {
    setOrderedVideos(project.videos);
  }, [project.videos]);

  // When upload completes, refresh project data
  useEffect(() => {
    if (videoUpload.status === "ready") {
      refresh();
      toast.success(t("videos.uploadComplete"));
    }
  }, [videoUpload.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll for processing videos
  useEffect(() => {
    const processingVideos = orderedVideos.filter(
      (v) => v.stream_uid && v.stream_status !== "ready" && v.stream_status !== "error"
    );
    if (processingVideos.length === 0) return;

    const interval = setInterval(async () => {
      let anyUpdated = false;
      for (const video of processingVideos) {
        try {
          const res = await fetch(`/api/videos/stream/status/${video.stream_uid}`);
          if (!res.ok) continue;
          const data = await res.json();
          if (data.ready || data.state === "error") {
            anyUpdated = true;
          }
        } catch {
          // ignore
        }
      }
      if (anyUpdated) refresh();
    }, 8000);

    return () => clearInterval(interval);
  }, [orderedVideos, refresh]);

  const handleReorder = async (newOrder: Video[]) => {
    setOrderedVideos(newOrder);
    try {
      const ids = newOrder.map((v) => v.id);
      const res = await fetch("/api/videos/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) toast.error("Error al reordenar");
    } catch {
      toast.error("Error de conexión");
    }
  };

  const openNew = () => {
    setVideoForm({ titulo: "", url: "" });
    setEditingVideoId(null);
    setFormTab("url");
    setShowVideoForm(true);
  };

  const openEdit = (video: Video) => {
    setVideoForm({ titulo: video.titulo || "", url: video.url || "" });
    setEditingVideoId(video.id);
    setFormTab("url");
    setShowVideoForm(true);
  };

  const cancelForm = () => {
    setShowVideoForm(false);
    setEditingVideoId(null);
    setVideoForm({ titulo: "", url: "" });
    videoUpload.reset();
  };

  const saveVideo = async () => {
    setSaving(true);
    const payload = {
      titulo: videoForm.titulo || null,
      url: videoForm.url,
    };
    try {
      if (editingVideoId) {
        const res = await fetch(`/api/videos/${editingVideoId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          toast.error("Error al guardar video");
          return;
        }
      } else {
        const res = await fetch("/api/videos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, proyecto_id: projectId }),
        });
        if (!res.ok) {
          toast.error("Error al crear video");
          return;
        }
      }
      await refresh();
      cancelForm();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = (file: File) => {
    videoUpload.upload(file, projectId);
    setShowVideoForm(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const deleteVideoAction = useAsyncAction(async (videoId: string) => {
    const video = orderedVideos.find((v) => v.id === videoId);
    const msg = video?.stream_uid
      ? t("videos.deleteStreamConfirm")
      : "¿Seguro que deseas eliminar este video?";
    if (!(await confirm({ title: "Eliminar video", message: msg }))) return;
    try {
      const res = await fetch(`/api/videos/${videoId}`, { method: "DELETE" });
      if (!res.ok) toast.error("Error al eliminar video");
      await refresh();
    } catch {
      toast.error("Error de conexión");
    }
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      {/* Page Header */}
      <PageHeader
        icon={Film}
        title={t("videos.title")}
        description={t("videos.description")}
        actions={
          !showVideoForm && videoUpload.status === "idle" ? (
            <button onClick={openNew} className={btnPrimary}>
              <Plus size={14} />
              {t("videos.addVideo")}
            </button>
          ) : undefined
        }
      />

      {/* Upload Progress (shown outside form when uploading/processing) */}
      <AnimatePresence>
        {videoUpload.status !== "idle" && videoUpload.status !== "ready" && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mb-6"
          >
            <div className={`${sectionCard} space-y-3`}>
              {videoUpload.status === "requesting" && (
                <div className="flex items-center gap-3">
                  <Loader2 size={16} className="text-[var(--site-primary)] animate-spin" />
                  <span className="text-sm text-[var(--text-secondary)]">Preparando subida...</span>
                </div>
              )}

              {videoUpload.status === "uploading" && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CloudUpload size={16} className="text-[var(--site-primary)]" />
                      <span className="text-sm text-[var(--text-secondary)]">{t("videos.uploading")}</span>
                    </div>
                    <span className="text-xs text-[var(--text-muted)] tabular-nums">{videoUpload.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-[var(--site-primary)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${videoUpload.progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <button
                    onClick={() => { videoUpload.cancel(); }}
                    className={btnSecondary}
                  >
                    <X size={12} />
                    {t("videos.cancel")}
                  </button>
                </>
              )}

              {videoUpload.status === "processing" && (
                <>
                  <div className="flex items-center gap-2">
                    <Loader2 size={16} className="text-[var(--site-primary)] animate-spin" />
                    <span className="text-sm text-[var(--text-secondary)]">{t("videos.processing")}</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    {t("videos.processingHint")}
                  </p>
                  {videoUpload.progress > 0 && (
                    <div className="w-full h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-[var(--site-primary)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${videoUpload.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  )}
                </>
              )}

              {videoUpload.status === "error" && (
                <>
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-red-400" />
                    <span className="text-sm text-red-400">{t("videos.uploadError")}</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">{videoUpload.error}</p>
                  <button onClick={() => videoUpload.reset()} className={btnSecondary}>
                    {t("videos.cancel")}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Form */}
      <AnimatePresence>
        {showVideoForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-6"
          >
            <div className={`${sectionCard} space-y-4`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-[var(--text-secondary)]">
                  {editingVideoId ? t("videos.editVideo") : t("videos.newVideo")}
                </h3>
              </div>

              {/* Tab toggle — only for new videos */}
              {!editingVideoId && (
                <div className="flex gap-1 p-1 rounded-lg bg-[var(--surface-2)]">
                  <button
                    onClick={() => setFormTab("url")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                      formTab === "url"
                        ? "bg-[var(--surface-3)] text-white"
                        : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                    )}
                  >
                    <Link2 size={12} />
                    {t("videos.tabUrl")}
                  </button>
                  <button
                    onClick={() => setFormTab("upload")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                      formTab === "upload"
                        ? "bg-[var(--surface-3)] text-white"
                        : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                    )}
                  >
                    <Upload size={12} />
                    {t("videos.tabUpload")}
                  </button>
                </div>
              )}

              {/* URL Tab */}
              {formTab === "url" && (
                <>
                  <div>
                    <label className={labelClass}>{t("videos.titleField")}</label>
                    <input
                      type="text"
                      value={videoForm.titulo}
                      onChange={(e) =>
                        setVideoForm((p) => ({ ...p, titulo: e.target.value }))
                      }
                      placeholder={t("videos.titlePlaceholder")}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{t("videos.urlField")}</label>
                    <input
                      type="url"
                      value={videoForm.url}
                      onChange={(e) =>
                        setVideoForm((p) => ({ ...p, url: e.target.value }))
                      }
                      placeholder={t("videos.urlPlaceholder")}
                      className={inputClass}
                    />
                    <p className={fieldHint}>
                      {t("videos.urlHint")}
                    </p>
                  </div>
                  {videoForm.url && getYouTubeThumbnail(videoForm.url) && (
                    <div className="w-48 aspect-video rounded-lg overflow-hidden bg-[var(--surface-2)]">
                      <Image src={getYouTubeThumbnail(videoForm.url)!} alt="Preview" fill className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={saveVideo}
                      disabled={saving || !videoForm.url.trim()}
                      className={btnPrimary}
                    >
                      {saving ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Check size={14} />
                      )}
                      {editingVideoId ? t("videos.update") : t("videos.create")}
                    </button>
                    <button onClick={cancelForm} className={btnSecondary}>
                      <X size={14} />
                      {t("videos.cancel")}
                    </button>
                  </div>
                </>
              )}

              {/* Upload Tab */}
              {formTab === "upload" && !editingVideoId && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".mp4,.mov,.webm,.mkv,.avi,video/mp4,video/quicktime,video/webm,video/x-matroska,video/x-msvideo"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    className={cn(
                      "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
                      dragging
                        ? "border-[var(--site-primary)] bg-[rgba(var(--site-primary-rgb),0.05)]"
                        : "border-[var(--border-default)] hover:border-[var(--border-strong)]"
                    )}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <CloudUpload
                      size={32}
                      className={cn(
                        "mx-auto mb-3 transition-colors",
                        dragging ? "text-[var(--site-primary)]" : "text-[var(--text-muted)]"
                      )}
                    />
                    <p className="text-sm text-[var(--text-secondary)] mb-1">
                      {t("videos.uploadButton")}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {t("videos.dragHint")}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-2">
                      {t("videos.uploadHint")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button onClick={cancelForm} className={btnSecondary}>
                      <X size={14} />
                      {t("videos.cancel")}
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video List */}
      {orderedVideos.length === 0 && !showVideoForm && videoUpload.status === "idle" && (
        <DashboardEmptyState
          variant="videos"
          title={t("videos.noVideos")}
          description={t("videos.noVideosDescription")}
        >
          <button onClick={openNew} className={btnPrimary}>
            <Plus size={14} />
            {t("videos.addVideo")}
          </button>
        </DashboardEmptyState>
      )}

      {orderedVideos.length > 0 && (
        <Reorder.Group
          axis="y"
          values={orderedVideos}
          onReorder={handleReorder}
          className="space-y-3"
        >
          {orderedVideos.map((video) => (
            <DraggableVideo
              key={video.id}
              video={video}
              onEdit={() => openEdit(video)}
              onDelete={() => deleteVideoAction.execute(video.id)}
              deleteLoading={deleteVideoAction.loading}
              t={t}
            />
          ))}
        </Reorder.Group>
      )}
    </motion.div>
  );
}
