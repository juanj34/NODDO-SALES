"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/i18n";
import { useEditorProject } from "@/hooks/useEditorProject";
import { useConfirm } from "@/components/dashboard/ConfirmModal";
import { useToast } from "@/components/dashboard/Toast";
import {
  inputClass,
  labelClass,
  fieldHint,
  btnPrimary,
  btnSecondary,
  btnDanger,
  pageHeader,
  pageTitle,
  pageDescription,
  sectionCard,
  listItem,
  emptyState,
  emptyStateIcon,
  emptyStateTitle,
  emptyStateDescription,
} from "@/components/dashboard/editor-styles";
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
} from "lucide-react";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";

/* ── Draggable video row (extracted so we can use useDragControls hook) ── */
function DraggableVideo({
  video,
  thumb,
  onEdit,
  onDelete,
  t,
}: {
  video: Video;
  thumb: string | null;
  onEdit: () => void;
  onDelete: () => void;
  t: (key: string) => string;
}) {
  const controls = useDragControls();

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
      <div className="w-32 h-20 rounded-lg overflow-hidden bg-[var(--surface-2)] flex items-center justify-center shrink-0">
        {thumb ? (
          <img src={thumb} alt="" className="w-full h-full object-cover" />
        ) : (
          <Film size={20} className="text-[var(--text-muted)]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-white">
          {video.titulo || "Sin titulo"}
        </h3>
        <p className="text-xs text-[var(--text-tertiary)] truncate mt-0.5">
          {video.url}
        </p>
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="flex items-center gap-1 px-3 py-1.5 text-xs text-[var(--text-tertiary)] hover:text-white hover:bg-[var(--surface-2)] rounded-lg transition-colors"
        >
          <Pencil size={12} />
          {t("videos.edit")}
        </button>
        <button onClick={onDelete} className={btnDanger}>
          <Trash2 size={12} />
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

  const [videoForm, setVideoForm] = useState({ titulo: "", url: "" });
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [orderedVideos, setOrderedVideos] = useState<Video[]>(project.videos);

  // Sync local order with project data when it changes
  useEffect(() => {
    setOrderedVideos(project.videos);
  }, [project.videos]);

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
    setShowVideoForm(true);
  };

  const openEdit = (video: Video) => {
    setVideoForm({ titulo: video.titulo || "", url: video.url || "" });
    setEditingVideoId(video.id);
    setShowVideoForm(true);
  };

  const cancel = () => {
    setShowVideoForm(false);
    setEditingVideoId(null);
    setVideoForm({ titulo: "", url: "" });
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
      cancel();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const deleteVideo = async (videoId: string) => {
    if (!(await confirm({ title: "Eliminar video", message: "¿Seguro que deseas eliminar este video?" }))) return;
    try {
      const res = await fetch(`/api/videos/${videoId}`, { method: "DELETE" });
      if (!res.ok) toast.error("Error al eliminar video");
      await refresh();
    } catch {
      toast.error("Error de conexión");
    }
  };

  const getYouTubeThumbnail = (url: string): string | null => {
    const match = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      {/* Page Header */}
      <div className={pageHeader}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center">
            <Film size={18} className="text-[var(--site-primary)]" />
          </div>
          <div>
            <h2 className={pageTitle}>{t("videos.title")}</h2>
            <p className={pageDescription}>
              {t("videos.description")}
            </p>
          </div>
        </div>
        {!showVideoForm && (
          <button onClick={openNew} className={btnPrimary}>
            <Plus size={14} />
            {t("videos.addVideo")}
          </button>
        )}
      </div>

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
              <h3 className="text-sm font-medium text-[var(--text-secondary)]">
                {editingVideoId ? t("videos.editVideo") : t("videos.newVideo")}
              </h3>
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
                  <img
                    src={getYouTubeThumbnail(videoForm.url)!}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
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
                <button onClick={cancel} className={btnSecondary}>
                  <X size={14} />
                  {t("videos.cancel")}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video List */}
      {orderedVideos.length === 0 && !showVideoForm && (
        <div className={emptyState}>
          <div className={emptyStateIcon}>
            <Film size={24} className="text-[var(--text-muted)]" />
          </div>
          <h3 className={emptyStateTitle}>{t("videos.noVideos")}</h3>
          <p className={emptyStateDescription}>
            {t("videos.noVideosDescription")}
          </p>
          <button onClick={openNew} className={btnPrimary}>
            <Plus size={14} />
            {t("videos.addVideo")}
          </button>
        </div>
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
              thumb={video.thumbnail_url || getYouTubeThumbnail(video.url)}
              onEdit={() => openEdit(video)}
              onDelete={() => deleteVideo(video.id)}
              t={t}
            />
          ))}
        </Reorder.Group>
      )}
    </motion.div>
  );
}
