"use client";

export const dynamic = "force-dynamic";

import Image from "next/image";
import { useState } from "react";
import { useTranslation } from "@/i18n";
import { useEditorProject } from "@/hooks/useEditorProject";
import { useConfirm } from "@/components/dashboard/ConfirmModal";
import { useToast } from "@/components/dashboard/Toast";
import { FileUploader } from "@/components/dashboard/FileUploader";
import { RichTextEditor } from "@/components/dashboard/RichTextEditor";
import {
  inputClass,
  labelClass,
  fieldHint,
  btnPrimary,
  btnSecondary,
  sectionCard,
  emptyState,
  emptyStateIcon,
  emptyStateTitle,
  emptyStateDescription,
} from "@/components/dashboard/editor-styles";
import { PageHeader } from "@/components/dashboard/base/PageHeader";
import type { AvanceObra } from "@/types";
import {
  Plus,
  Loader2,
  Check,
  X,
  Pencil,
  Trash2,
  HardHat,
  Film,
  Calendar,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Avance Card (Webflow CMS style) ── */
function AvanceCard({
  avance,
  onEdit,
  onDelete,
  onToggleEstado,
  t,
}: {
  avance: AvanceObra;
  onEdit: () => void;
  onDelete: () => void;
  onToggleEstado: () => void;
  t: (key: string) => string;
}) {
  const formattedDate = new Date(avance.fecha + "T12:00:00").toLocaleDateString(
    "es",
    { day: "numeric", month: "short", year: "numeric" }
  );
  const isPublished = avance.estado === "publicado";
  const strippedDesc =
    avance.descripcion?.replace(/<[^>]*>/g, "").slice(0, 120) || "";

  return (
    <div className="group bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all overflow-hidden">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-[var(--surface-2)] overflow-hidden">
        {avance.imagen_url ? (
          <Image src={avance.imagen_url} alt={avance.titulo} fill className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <HardHat size={28} className="text-[var(--text-muted)]" />
          </div>
        )}
        {/* Status badge */}
        <button
          onClick={onToggleEstado}
          className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold backdrop-blur-sm transition-all ${
            isPublished
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
          }`}
        >
          {isPublished ? <Eye size={10} /> : <EyeOff size={10} />}
          {isPublished ? "Publicado" : "Borrador"}
        </button>
        {/* Video badge */}
        {avance.video_url && (
          <span className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-black/60 text-white backdrop-blur-sm">
            <Film size={10} />
            Video
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <h3 className="text-sm font-medium text-white truncate">
          {avance.titulo}
        </h3>
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)]">
          <Calendar size={11} />
          {formattedDate}
        </div>
        {strippedDesc && (
          <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
            {strippedDesc}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center border-t border-[var(--border-subtle)] opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-[var(--text-tertiary)] hover:text-white hover:bg-[var(--surface-2)] transition-colors"
        >
          <Pencil size={12} />
          {t("avances.edit")}
        </button>
        <div className="w-px h-5 bg-[var(--border-subtle)]" />
        <button
          onClick={onDelete}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/5 transition-colors"
        >
          <Trash2 size={12} />
          {t("avances.delete")}
        </button>
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function AvancesPage() {
  const { t } = useTranslation("editor");
  const { project, refresh, projectId } = useEditorProject();
  const { confirm } = useConfirm();
  const toast = useToast();

  const [form, setForm] = useState({
    titulo: "",
    fecha: new Date().toISOString().slice(0, 10),
    descripcion: "",
    video_url: "",
    imagen_url: "",
    estado: "borrador" as "borrador" | "publicado",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const avances = project.avances_obra || [];

  const openNew = () => {
    setForm({
      titulo: "",
      fecha: new Date().toISOString().slice(0, 10),
      descripcion: "",
      video_url: "",
      imagen_url: "",
      estado: "borrador",
    });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (avance: AvanceObra) => {
    setForm({
      titulo: avance.titulo,
      fecha: avance.fecha,
      descripcion: avance.descripcion || "",
      video_url: avance.video_url || "",
      imagen_url: avance.imagen_url || "",
      estado: avance.estado || "borrador",
    });
    setEditingId(avance.id);
    setShowForm(true);
  };

  const cancel = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const saveAvance = async () => {
    setSaving(true);
    const payload = {
      titulo: form.titulo,
      fecha: form.fecha,
      descripcion: form.descripcion || null,
      video_url: form.video_url || null,
      imagen_url: form.imagen_url || null,
      estado: form.estado,
    };
    try {
      if (editingId) {
        const res = await fetch(`/api/avances-obra/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          toast.error("Error al guardar avance");
          return;
        }
      } else {
        const res = await fetch("/api/avances-obra", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, proyecto_id: projectId }),
        });
        if (!res.ok) {
          toast.error("Error al crear avance");
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

  const deleteAvance = async (id: string) => {
    if (
      !(await confirm({
        title: t("avances.delete"),
        message: t("avances.deleteConfirm"),
      }))
    )
      return;
    try {
      const res = await fetch(`/api/avances-obra/${id}`, { method: "DELETE" });
      if (!res.ok) toast.error("Error al eliminar");
      await refresh();
    } catch {
      toast.error("Error de conexión");
    }
  };

  const toggleEstado = async (avance: AvanceObra) => {
    const newEstado =
      avance.estado === "publicado" ? "borrador" : "publicado";
    try {
      const res = await fetch(`/api/avances-obra/${avance.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: newEstado }),
      });
      if (!res.ok) toast.error("Error al cambiar estado");
      await refresh();
    } catch {
      toast.error("Error de conexión");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto"
    >
      {/* Page Header */}
      <PageHeader
        icon={HardHat}
        title={t("avances.title")}
        description={t("avances.description")}
        actions={
          !showForm ? (
            <button onClick={openNew} className={btnPrimary}>
              <Plus size={14} />
              {t("avances.addAvance")}
            </button>
          ) : undefined
        }
      />

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-6"
          >
            <div className={`${sectionCard} space-y-4`}>
              <h3 className="text-sm font-medium text-[var(--text-secondary)]">
                {editingId ? t("avances.editAvance") : t("avances.newAvance")}
              </h3>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className={labelClass}>
                    {t("avances.titleField")}
                  </label>
                  <input
                    type="text"
                    value={form.titulo}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, titulo: e.target.value }))
                    }
                    placeholder={t("avances.titlePlaceholder")}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    {t("avances.dateField")}
                  </label>
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, fecha: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Estado toggle */}
              <div>
                <label className={labelClass}>Estado</label>
                <div className="flex items-center gap-1 p-1 bg-[var(--surface-3)] rounded-lg w-fit">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((p) => ({ ...p, estado: "borrador" }))
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      form.estado === "borrador"
                        ? "bg-amber-500/20 text-amber-400 shadow-sm"
                        : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                    }`}
                  >
                    <EyeOff size={12} />
                    Borrador
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((p) => ({ ...p, estado: "publicado" }))
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      form.estado === "publicado"
                        ? "bg-emerald-500/20 text-emerald-400 shadow-sm"
                        : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                    }`}
                  >
                    <Eye size={12} />
                    Publicado
                  </button>
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  {t("avances.descriptionField")}
                </label>
                <RichTextEditor
                  content={form.descripcion}
                  onChange={(html) =>
                    setForm((p) => ({ ...p, descripcion: html }))
                  }
                  placeholder={t("avances.descriptionPlaceholder")}
                  enableMedia
                />
              </div>

              <div>
                <label className={labelClass}>
                  {t("avances.videoUrlField")}
                </label>
                <input
                  type="url"
                  value={form.video_url}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, video_url: e.target.value }))
                  }
                  placeholder={t("avances.videoUrlPlaceholder")}
                  className={inputClass}
                />
                <p className={fieldHint}>{t("avances.videoUrlHint")}</p>
              </div>

              <div>
                <label className={labelClass}>
                  {t("avances.coverImage")}
                </label>
                <FileUploader
                  onUpload={(url: string) =>
                    setForm((p) => ({ ...p, imagen_url: url }))
                  }
                  currentUrl={form.imagen_url || null}
                  folder="avances"
                  aspect="video"
                  label={t("avances.coverImage")}
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={saveAvance}
                  disabled={saving || !form.titulo.trim() || !form.fecha}
                  className={btnPrimary}
                >
                  {saving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  {editingId ? t("avances.update") : t("avances.create")}
                </button>
                <button onClick={cancel} className={btnSecondary}>
                  <X size={14} />
                  {t("avances.cancel")}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {avances.length === 0 && !showForm && (
        <div className={emptyState}>
          <div className={emptyStateIcon}>
            <HardHat size={24} className="text-[var(--text-muted)]" />
          </div>
          <h3 className={emptyStateTitle}>{t("avances.noAvances")}</h3>
          <p className={emptyStateDescription}>
            {t("avances.noAvancesDescription")}
          </p>
          <button onClick={openNew} className={btnPrimary}>
            <Plus size={14} />
            {t("avances.addAvance")}
          </button>
        </div>
      )}

      {/* Card Grid */}
      {avances.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {avances.map((avance) => (
            <AvanceCard
              key={avance.id}
              avance={avance}
              onEdit={() => openEdit(avance)}
              onDelete={() => deleteAvance(avance.id)}
              onToggleEstado={() => toggleEstado(avance)}
              t={t}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
