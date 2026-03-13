"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/i18n";
import { useEditorProject } from "@/hooks/useEditorProject";
import {
  inputClass,
  labelClass,
  btnPrimary,
  btnSecondary,
  btnDanger,
  pageHeader,
  pageTitle,
  pageDescription,
} from "@/components/dashboard/editor-styles";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { FileUploader } from "@/components/dashboard/FileUploader";
import { PlanoHotspotEditor } from "@/components/dashboard/PlanoHotspotEditor";
import { useToast } from "@/components/dashboard/Toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Map,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  X,
  Save,
  Image as ImageIcon,
  Pencil,
  Check,
} from "lucide-react";
import type { PlanoInteractivo, PlanoPunto } from "@/types";

/* ------------------------------------------------------------------
   Page
   ------------------------------------------------------------------ */
export default function PlanoInteractivoPage() {
  const { project, projectId, refresh } = useEditorProject();
  const { t } = useTranslation("editor");
  const toast = useToast();

  /* ---- Local state ---- */
  const [planos, setPlanos] = useState<PlanoInteractivo[]>([]);
  const [puntos, setPuntos] = useState<PlanoPunto[]>([]);
  const [selectedPlanoId, setSelectedPlanoId] = useState<string | null>(null);

  // Modal "add plano" form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNombre, setNewNombre] = useState("");
  const [newDescripcion, setNewDescripcion] = useState("");
  const [newImagenUrl, setNewImagenUrl] = useState("");
  const [addingPlano, setAddingPlano] = useState(false);

  // Inline description editing
  const [editingDescripcion, setEditingDescripcion] = useState(false);
  const [descTemp, setDescTemp] = useState("");

  // Busy indicators
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  /* ---- Sync from context ---- */
  useEffect(() => {
    if (!project) return;
    setPlanos(project.planos_interactivos ?? []);
    setPuntos(project.plano_puntos ?? []);
  }, [project]);

  /* ---- Filtered data (urbanismo only) ---- */
  const filteredPlanos = planos
    .filter((p) => p.tipo === "urbanismo")
    .sort((a, b) => a.orden - b.orden);

  const selectedPlano = filteredPlanos.find((p) => p.id === selectedPlanoId) ?? null;

  const selectedPuntos = selectedPlano
    ? puntos
        .filter((pt) => pt.plano_id === selectedPlano.id)
        .sort((a, b) => a.orden - b.orden)
    : [];

  /* ---- Auto-select first plano when planos change ---- */
  useEffect(() => {
    if (filteredPlanos.length > 0) {
      const stillExists = filteredPlanos.find((p) => p.id === selectedPlanoId);
      if (!stillExists) {
        setSelectedPlanoId(filteredPlanos[0].id);
      }
    } else {
      setSelectedPlanoId(null);
    }
  }, [filteredPlanos, selectedPlanoId]);

  /* ------------------------------------------------------------------
     CRUD: Plano
     ------------------------------------------------------------------ */
  const handleAddPlano = async () => {
    if (!newNombre.trim() || !newImagenUrl) return;
    setAddingPlano(true);
    try {
      const res = await fetch("/api/planos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proyecto_id: projectId,
          nombre: newNombre.trim(),
          descripcion: newDescripcion.trim() || null,
          imagen_url: newImagenUrl,
          tipo: "urbanismo",
        }),
      });
      if (res.ok) {
        const created: PlanoInteractivo = await res.json();
        setPlanos((prev) => [...prev, created]);
        setSelectedPlanoId(created.id);
        setNewNombre("");
        setNewDescripcion("");
        setNewImagenUrl("");
        setShowAddForm(false);
        await refresh();
        toast.success(t("planos.toastCreated"));
      } else {
        const err = await res.json().catch(() => ({ error: t("planos.toastUnknownError") }));
        toast.error(err.error || `Error ${res.status}`);
        console.error("Plano creation failed:", res.status, err);
      }
    } catch (err) {
      toast.error(t("planos.toastConnectionError"));
      console.error("Plano creation error:", err);
    } finally {
      setAddingPlano(false);
    }
  };

  const handleDeletePlano = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/planos/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPlanos((prev) => prev.filter((p) => p.id !== id));
        setPuntos((prev) => prev.filter((pt) => pt.plano_id !== id));
        await refresh();
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleVisibility = async (plano: PlanoInteractivo) => {
    setTogglingId(plano.id);
    try {
      const res = await fetch(`/api/planos/${plano.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible: !plano.visible }),
      });
      if (res.ok) {
        setPlanos((prev) =>
          prev.map((p) =>
            p.id === plano.id ? { ...p, visible: !p.visible } : p
          )
        );
        await refresh();
      }
    } finally {
      setTogglingId(null);
    }
  };

  /* ------------------------------------------------------------------
     Update plano description
     ------------------------------------------------------------------ */
  const handleSaveDescripcion = async (planoId: string, desc: string) => {
    const trimmed = desc.trim() || null;
    setPlanos((prev) =>
      prev.map((p) => (p.id === planoId ? { ...p, descripcion: trimmed } : p))
    );
    setEditingDescripcion(false);
    await fetch(`/api/planos/${planoId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ descripcion: trimmed }),
    });
    await refresh();
  };

  /* ------------------------------------------------------------------
     CRUD: Punto
     ------------------------------------------------------------------ */
  const handleAddPunto = useCallback(
    async (data: {
      plano_id: string;
      titulo: string;
      descripcion: string | null;
      imagen_url: string | null;
      render_url: string | null;
      fachada_id: string | null;
      x: number;
      y: number;
    }) => {
      const res = await fetch("/api/plano-puntos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const created: PlanoPunto = await res.json();
        setPuntos((prev) => [...prev, created]);
        await refresh();
      } else {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }));
        toast.error(err.error || `Error ${res.status}`);
      }
    },
    [refresh, toast]
  );

  const handleUpdatePunto = useCallback(
    async (
      id: string,
      data: Partial<Pick<PlanoPunto, "titulo" | "descripcion" | "imagen_url" | "render_url" | "fachada_id" | "x" | "y">>
    ) => {
      setPuntos((prev) =>
        prev.map((pt) => (pt.id === id ? { ...pt, ...data } : pt))
      );
      const res = await fetch(`/api/plano-puntos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }));
        toast.error(err.error || `Error ${res.status}`);
      }
      await refresh();
    },
    [refresh, toast]
  );

  const handleDeletePunto = useCallback(
    async (id: string) => {
      setPuntos((prev) => prev.filter((pt) => pt.id !== id));
      const res = await fetch(`/api/plano-puntos/${id}`, { method: "DELETE" });
      if (res.ok) {
        await refresh();
      }
    },
    [refresh]
  );

  /* ------------------------------------------------------------------
     Render
     ------------------------------------------------------------------ */
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Page Header */}
      <div className={pageHeader}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center">
            <Map size={18} className="text-[var(--site-primary)]" />
          </div>
          <div>
            <h2 className={pageTitle}>{t("planos.title")}</h2>
            <p className={pageDescription}>
              {t("planos.description")}
            </p>
          </div>
        </div>
        <button onClick={() => setShowAddForm(true)} className={btnPrimary}>
          <Plus size={14} />
          {t("planos.addPlan")}
        </button>
      </div>

      {/* Empty state */}
      {filteredPlanos.length === 0 && (
        <DashboardEmptyState
          variant="planos"
          title={t("planos.noPlans")}
          description={t("planos.noPlansDescription")}
        >
          <div className="flex gap-6 text-center mb-5">
            {[
              t("planos.instructions.upload"),
              t("planos.instructions.click"),
              t("planos.instructions.addRender"),
            ].map((text, i) => (
              <div key={i} className="flex flex-col items-center gap-2 max-w-[140px]">
                <div className="w-8 h-8 rounded-full bg-[rgba(var(--site-primary-rgb),0.15)] text-[var(--site-primary)] flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </div>
                <p className="text-xs text-[var(--text-tertiary)]">{text}</p>
              </div>
            ))}
          </div>
          <button onClick={() => setShowAddForm(true)} className={btnPrimary}>
            <Plus size={14} />
            {t("planos.addFirstPlan")}
          </button>
        </DashboardEmptyState>
      )}

      {/* Main layout: vertical thumbnails | editor */}
      {filteredPlanos.length > 0 && (
        <div className="flex gap-3">
          {/* Left: Vertical thumbnail strip */}
          <div className="flex flex-col gap-2 w-20 shrink-0 overflow-y-auto max-h-[70vh] scrollbar-thin">
            {filteredPlanos.map((p) => {
              const count = puntos.filter((pt) => pt.plano_id === p.id).length;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlanoId(p.id)}
                  className={`relative rounded-lg overflow-hidden border-2 transition-all group cursor-pointer ${
                    selectedPlanoId === p.id
                      ? "border-[var(--site-primary)] shadow-lg shadow-[rgba(var(--site-primary-rgb),0.15)]"
                      : "border-[var(--border-subtle)] hover:border-[var(--border-default)]"
                  }`}
                >
                  <div className="aspect-square bg-black/40">
                    {p.imagen_url ? (
                      <img
                        src={p.imagen_url}
                        alt={p.nombre}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                        <ImageIcon size={14} />
                      </div>
                    )}
                  </div>
                  <div className="px-1 py-1 bg-[var(--surface-2)] text-center">
                    <span className="text-[9px] text-[var(--text-secondary)] truncate block">
                      {p.nombre}
                    </span>
                  </div>

                  {/* Visibility toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleVisibility(p);
                    }}
                    disabled={togglingId === p.id}
                    className={`absolute top-0.5 left-0.5 opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center rounded-full transition-all ${
                      p.visible
                        ? "bg-[rgba(var(--site-primary-rgb),0.8)] text-black"
                        : "bg-black/60 text-[var(--text-muted)]"
                    }`}
                    title={p.visible ? t("planos.visible") : t("planos.hidden")}
                  >
                    {togglingId === p.id ? (
                      <Loader2 size={8} className="animate-spin" />
                    ) : p.visible ? (
                      <Eye size={8} />
                    ) : (
                      <EyeOff size={8} />
                    )}
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePlano(p.id);
                    }}
                    disabled={deletingId === p.id}
                    className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center rounded-full bg-black/60 text-red-400/70 hover:text-red-400 transition-all"
                  >
                    {deletingId === p.id ? (
                      <Loader2 size={8} className="animate-spin" />
                    ) : (
                      <Trash2 size={8} />
                    )}
                  </button>

                  {/* Point count badge */}
                  {count > 0 && (
                    <div className="absolute bottom-[calc(100%-16px)] right-0.5 min-w-[16px] h-[16px] flex items-center justify-center px-0.5 bg-[var(--site-primary)] text-black text-[8px] font-bold rounded-full">
                      {count}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right: Hotspot editor + points */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {selectedPlano && (
                <motion.div
                  key={selectedPlano.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {/* Plano info bar */}
                  <div className="px-3 py-2 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-white">
                          {selectedPlano.nombre}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {t("planos.pointCount", { n: selectedPuntos.length })}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            selectedPlano.visible
                              ? "bg-green-500/15 text-green-400"
                              : "bg-[var(--surface-3)] text-[var(--text-muted)]"
                          }`}
                        >
                          {selectedPlano.visible ? t("planos.visible") : t("planos.hidden")}
                        </span>
                      </div>
                      <button
                        onClick={() => handleToggleVisibility(selectedPlano)}
                        disabled={togglingId === selectedPlano.id}
                        className={btnSecondary}
                      >
                        {togglingId === selectedPlano.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : selectedPlano.visible ? (
                          <EyeOff size={12} />
                        ) : (
                          <Eye size={12} />
                        )}
                        {selectedPlano.visible ? t("planos.hide") : t("planos.show")}
                      </button>
                    </div>

                    {/* Inline description */}
                    {editingDescripcion ? (
                      <div className="flex items-start gap-2">
                        <textarea
                          value={descTemp}
                          onChange={(e) => setDescTemp(e.target.value)}
                          placeholder={t("planos.descriptionPlaceholder")}
                          rows={2}
                          className={`${inputClass} text-xs !py-1.5 flex-1 resize-none`}
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveDescripcion(selectedPlano.id, descTemp)}
                          className="p-1.5 rounded-lg bg-[rgba(var(--site-primary-rgb),0.15)] text-[var(--site-primary)] hover:bg-[rgba(var(--site-primary-rgb),0.25)] transition-colors"
                        >
                          <Check size={12} />
                        </button>
                        <button
                          onClick={() => setEditingDescripcion(false)}
                          className="p-1.5 rounded-lg bg-[var(--surface-3)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setDescTemp(selectedPlano.descripcion || "");
                          setEditingDescripcion(true);
                        }}
                        className="group flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                      >
                        <Pencil size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        {selectedPlano.descripcion
                          ? <span className="text-[var(--text-secondary)] line-clamp-1">{selectedPlano.descripcion}</span>
                          : <span className="italic">{t("planos.descriptionPlaceholder")}</span>
                        }
                      </button>
                    )}
                  </div>

                  {/* Hotspot editor (side-by-side layout) */}
                  <div className="min-h-[420px]">
                    <PlanoHotspotEditor
                      imagenUrl={selectedPlano.imagen_url}
                      puntos={selectedPuntos}
                      fachadas={[]}
                      tipo="urbanismo"
                      onAddPunto={async (data) => {
                        await handleAddPunto({ ...data, render_url: data.render_url ?? null, plano_id: selectedPlano.id });
                      }}
                      onUpdatePunto={handleUpdatePunto}
                      onDeletePunto={handleDeletePunto}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Add Plano Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowAddForm(false);
              setNewNombre("");
              setNewDescripcion("");
              setNewImagenUrl("");
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-2xl p-6 bg-[var(--surface-1)] rounded-2xl border border-[var(--border-default)] shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm text-[var(--text-primary)] font-medium">
                  {t("planos.newPlan")}
                </h3>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewNombre("");
                    setNewImagenUrl("");
                  }}
                  className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div>
                <label className={labelClass}>{t("planos.nameLabel")}</label>
                <input
                  type="text"
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  placeholder={t("planos.namePlaceholder")}
                  className={inputClass}
                  autoFocus
                />
              </div>
              <div>
                <label className={labelClass}>{t("planos.descriptionLabel")}</label>
                <textarea
                  value={newDescripcion}
                  onChange={(e) => setNewDescripcion(e.target.value)}
                  placeholder={t("planos.descriptionPlaceholder")}
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </div>
              <div>
                <label className={labelClass}>{t("planos.imageLabel")}</label>
                <FileUploader
                  currentUrl={newImagenUrl || null}
                  onUpload={(url) => setNewImagenUrl(url)}
                  folder={`proyectos/${projectId}/planos`}
                  label={t("planos.uploadImage")}
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleAddPlano}
                  disabled={addingPlano || !newNombre.trim() || !newImagenUrl}
                  className={btnPrimary}
                >
                  {addingPlano ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  {addingPlano ? t("planos.saving") : t("planos.savePlan")}
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewNombre("");
                    setNewImagenUrl("");
                  }}
                  className={btnSecondary}
                >
                  {t("planos.cancel")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
