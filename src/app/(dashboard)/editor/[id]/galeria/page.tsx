"use client";

import { useState, useEffect } from "react";
import { useEditorProject } from "@/hooks/useEditorProject";
import { useConfirm } from "@/components/dashboard/ConfirmModal";
import { useToast } from "@/components/dashboard/Toast";
import { UploadModal } from "@/components/dashboard/UploadModal";
import {
  inputClass,
  btnPrimary,
  btnSecondary,
  btnDanger,
  pageHeader,
  pageTitle,
  pageDescription,
  badgeGold,
  emptyState,
  emptyStateIcon,
  emptyStateTitle,
  emptyStateDescription,
} from "@/components/dashboard/editor-styles";
import {
  Image as ImageIcon,
  Plus,
  Loader2,
  Check,
  X,
  Trash2,
  GripVertical,
  Upload,
} from "lucide-react";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
import { useTranslation } from "@/i18n";
import type { GaleriaCategoria } from "@/types";

/* ── Draggable pill for category tab bar ── */
function DraggablePill({
  cat,
  isActive,
  onSelect,
}: {
  cat: GaleriaCategoria;
  isActive: boolean;
  onSelect: () => void;
}) {
  const controls = useDragControls();
  const count = cat.imagenes?.length || 0;

  return (
    <Reorder.Item
      value={cat}
      dragListener={false}
      dragControls={controls}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all select-none shrink-0 ${
        isActive
          ? "bg-[var(--surface-3)] text-white border border-[rgba(var(--site-primary-rgb),0.3)] shadow-[0_0_8px_rgba(var(--site-primary-rgb),0.1)]"
          : "bg-[var(--surface-2)] text-[var(--text-tertiary)] border border-transparent hover:text-[var(--text-secondary)] hover:bg-[var(--surface-3)]"
      }`}
      whileDrag={{ scale: 1.05, zIndex: 10 }}
    >
      <div
        onPointerDown={(e) => controls.start(e)}
        className="cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors touch-none"
      >
        <GripVertical size={12} />
      </div>
      <button onClick={onSelect} className="flex items-center gap-1.5">
        {cat.nombre}
        {count > 0 && (
          <span className={`${isActive ? "bg-[rgba(var(--site-primary-rgb),0.2)] text-[var(--site-primary)]" : "bg-[var(--surface-3)] text-[var(--text-muted)]"} text-[10px] px-1.5 py-0.5 rounded-full font-medium`}>
            {count}
          </span>
        )}
      </button>
    </Reorder.Item>
  );
}

/* ── Main page ── */
export default function GaleriaPage() {
  const { project, refresh, projectId } = useEditorProject();
  const { t } = useTranslation("editor");
  const { confirm } = useConfirm();
  const toast = useToast();

  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [orderedCategories, setOrderedCategories] = useState<GaleriaCategoria[]>(
    project.galeria_categorias
  );
  const [showCatForm, setShowCatForm] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newCatNombre, setNewCatNombre] = useState("");
  const [saving, setSaving] = useState(false);

  // Sync categories from project
  useEffect(() => {
    setOrderedCategories(project.galeria_categorias);
  }, [project.galeria_categorias]);

  // Auto-select first category or fix invalid selection
  useEffect(() => {
    if (orderedCategories.length === 0) {
      setSelectedCatId(null);
      return;
    }
    const exists = orderedCategories.some((c) => c.id === selectedCatId);
    if (!exists) {
      setSelectedCatId(orderedCategories[0].id);
    }
  }, [orderedCategories, selectedCatId]);

  const selectedCat = orderedCategories.find((c) => c.id === selectedCatId) || null;
  const imageCount = selectedCat?.imagenes?.length || 0;

  /* ── Reorder ── */
  const handleReorder = async (newOrder: GaleriaCategoria[]) => {
    setOrderedCategories(newOrder);
    try {
      const ids = newOrder.map((cat) => cat.id);
      const res = await fetch("/api/galeria/categorias/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) toast.error("Error al reordenar categorías");
    } catch {
      toast.error("Error de conexión");
    }
  };

  /* ── CRUD ── */
  const addCategoria = async () => {
    if (!newCatNombre.trim()) return;
    setSaving(true);
    const catSlug = newCatNombre
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    try {
      const res = await fetch("/api/galeria/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proyecto_id: projectId,
          nombre: newCatNombre.trim(),
          slug: catSlug,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        await refresh();
        setSelectedCatId(created.id);
      } else {
        await refresh();
      }
      setNewCatNombre("");
      setShowCatForm(false);
    } finally {
      setSaving(false);
    }
  };

  const deleteCategoria = async () => {
    if (!selectedCatId) return;
    if (!(await confirm({ title: "Eliminar categoría", message: "¿Seguro que deseas eliminar esta categoría y todas sus imágenes?" }))) return;
    try {
      const res = await fetch(`/api/galeria/categorias/${selectedCatId}`, {
        method: "DELETE",
      });
      if (!res.ok) toast.error("Error al eliminar categoría");
      setSelectedCatId(null);
      await refresh();
    } catch {
      toast.error("Error de conexión");
    }
  };

  const deleteImage = async (imgId: string) => {
    try {
      const res = await fetch(`/api/galeria/imagenes/${imgId}`, { method: "DELETE" });
      if (!res.ok) toast.error("Error al eliminar imagen");
      await refresh();
    } catch {
      toast.error("Error de conexión");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Page Header */}
      <div className={pageHeader}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[rgba(var(--site-primary-rgb),0.1)] border border-[rgba(var(--site-primary-rgb),0.2)] flex items-center justify-center">
            <ImageIcon size={18} className="text-[var(--site-primary)]" />
          </div>
          <div>
            <h2 className={pageTitle}>{t("galeria.title")}</h2>
            <p className={pageDescription}>
              {t("galeria.description")}
            </p>
          </div>
        </div>
      </div>

      {/* Empty state when no categories */}
      {orderedCategories.length === 0 && !showCatForm && (
        <div className={emptyState}>
          <div className={emptyStateIcon}>
            <ImageIcon size={24} className="text-[var(--text-muted)]" />
          </div>
          <p className={emptyStateTitle}>{t("galeria.noCategories")}</p>
          <p className={emptyStateDescription}>
            {t("galeria.createFirstCategory")}
          </p>
          <button onClick={() => setShowCatForm(true)} className={btnPrimary}>
            <Plus size={14} />
            {t("galeria.createFirstButton")}
          </button>
        </div>
      )}

      {/* Category tab bar + content */}
      {(orderedCategories.length > 0 || showCatForm) && (
        <div className="space-y-4">
          {/* Tab bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {orderedCategories.length > 0 && (
              <Reorder.Group
                axis="x"
                values={orderedCategories}
                onReorder={handleReorder}
                className="flex items-center gap-1.5"
                style={{ listStyle: "none" }}
              >
                {orderedCategories.map((cat) => (
                  <DraggablePill
                    key={cat.id}
                    cat={cat}
                    isActive={selectedCatId === cat.id}
                    onSelect={() => setSelectedCatId(cat.id)}
                  />
                ))}
              </Reorder.Group>
            )}

            {/* Add category button */}
            {!showCatForm && (
              <button
                onClick={() => setShowCatForm(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)] border border-dashed border-[var(--border-default)] transition-all shrink-0"
              >
                <Plus size={11} />
                {t("galeria.newCategory")}
              </button>
            )}
          </div>

          {/* Inline new category form */}
          <AnimatePresence>
            {showCatForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-center gap-2 p-3 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)]">
                  <input
                    type="text"
                    value={newCatNombre}
                    onChange={(e) => setNewCatNombre(e.target.value)}
                    placeholder={t("galeria.categoryNamePlaceholder")}
                    className={`${inputClass} flex-1`}
                    onKeyDown={(e) => e.key === "Enter" && addCategoria()}
                    autoFocus
                  />
                  <button
                    onClick={addCategoria}
                    disabled={saving || !newCatNombre.trim()}
                    className={btnPrimary}
                  >
                    {saving ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Check size={14} />
                    )}
                    {t("galeria.create")}
                  </button>
                  <button
                    onClick={() => {
                      setShowCatForm(false);
                      setNewCatNombre("");
                    }}
                    className={btnSecondary}
                  >
                    <X size={14} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Selected category content */}
          {selectedCat && (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-medium text-white">
                    {selectedCat.nombre}
                  </h3>
                  <span className={badgeGold}>
                    {t("galeria.imageCount", { count: String(imageCount) })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className={btnPrimary}
                  >
                    <Upload size={14} />
                    {t("galeria.uploadImages")}
                  </button>
                  <button onClick={deleteCategoria} className={btnDanger}>
                    <Trash2 size={12} />
                    {t("galeria.delete")}
                  </button>
                </div>
              </div>

              {/* Image grid */}
              {imageCount > 0 ? (
                <div className="grid grid-cols-5 gap-2">
                  {selectedCat.imagenes?.map((img) => (
                    <div
                      key={img.id}
                      className="relative aspect-video rounded-lg overflow-hidden bg-[var(--surface-2)] group"
                    >
                      <img
                        src={img.thumbnail_url || img.url}
                        alt={img.alt_text || ""}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => deleteImage(img.id)}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={emptyState}>
                  <div className={emptyStateIcon}>
                    <ImageIcon size={24} className="text-[var(--text-muted)]" />
                  </div>
                  <p className={emptyStateTitle}>{t("galeria.noImages")}</p>
                  <p className={emptyStateDescription}>
                    {t("galeria.uploadHint")}
                  </p>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className={btnPrimary}
                  >
                    <Upload size={14} />
                    {t("galeria.uploadImages")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {selectedCat && (
        <UploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          categoryName={selectedCat.nombre}
          categoryId={selectedCat.id}
          projectId={projectId}
          folder={`proyectos/${projectId}/galeria/${selectedCat.slug}`}
          onUploaded={refresh}
        />
      )}
    </motion.div>
  );
}
