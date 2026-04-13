"use client";

export const dynamic = "force-dynamic";

import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { useEditorProject } from "@/hooks/useEditorProject";
import { useConfirm } from "@/components/dashboard/ConfirmModal";
import { useToast } from "@/components/dashboard/Toast";
import { UploadModal } from "@/components/dashboard/UploadModal";
import { NodDoDropdown } from "@/components/ui/NodDoDropdown";
import { PageHeader } from "@/components/dashboard/base/PageHeader";
import {
  inputClass,
  btnPrimary,
  btnSecondary,
  btnDanger,
  badgeGold,
} from "@/components/dashboard/editor-styles";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import {
  Image as ImageIcon,
  Plus,
  Loader2,
  Check,
  X,
  Trash2,
  GripVertical,
  Upload,
  Type,
} from "lucide-react";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
import { useTranslation } from "@/i18n";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import type { GaleriaCategoria, GaleriaImagen, GaleriaGrupo } from "@/types";

/* ── Draggable pill for category tab bar ── */
function DraggablePill({
  cat,
  isActive,
  onSelect,
  grupos,
}: {
  cat: GaleriaCategoria;
  isActive: boolean;
  onSelect: () => void;
  grupos: GaleriaGrupo[];
}) {
  const controls = useDragControls();
  const count = cat.imagenes?.length || 0;
  const grupo = cat.galeria_grupo_id ? grupos.find((g) => g.id === cat.galeria_grupo_id) : null;

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
        onPointerDown={(e) => { e.preventDefault(); controls.start(e); }}
        className="cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors touch-none"
      >
        <GripVertical size={12} />
      </div>
      <button onClick={onSelect} className="flex items-center gap-1.5">
        {cat.nombre}
        {grupo && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[rgba(var(--site-primary-rgb),0.12)] text-[var(--site-primary)] truncate max-w-[70px]">
            {grupo.nombre}
          </span>
        )}
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
  const { t: tTooltips } = useTranslation("tooltips");
  const { confirm } = useConfirm();
  const toast = useToast();

  const [localGrupos, setLocalGrupos] = useState<GaleriaGrupo[]>(project.galeria_grupos || []);
  const hasGrupos = localGrupos.length > 0;

  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [orderedCategories, setOrderedCategories] = useState<GaleriaCategoria[]>(
    project.galeria_categorias
  );
  const [scopeFilter, setScopeFilter] = useState<string | null>(null); // null=all, torre.id=independent torre
  const [showCatForm, setShowCatForm] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newCatNombre, setNewCatNombre] = useState("");
  const [newCatGrupoId, setNewCatGrupoId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showScopeForm, setShowScopeForm] = useState(false);
  const [newScopeName, setNewScopeName] = useState("");
  const [savingScope, setSavingScope] = useState(false);

  // Filtered categories by grupo scope
  const filteredCategories = orderedCategories.filter((cat) => {
    if (scopeFilter === null) return true;
    return cat.galeria_grupo_id === scopeFilter;
  });

  // Sync from project
  useEffect(() => {
    setOrderedCategories(project.galeria_categorias);
  }, [project.galeria_categorias]);
  useEffect(() => {
    setLocalGrupos(project.galeria_grupos || []);
  }, [project.galeria_grupos]);

  // Auto-select first visible category or fix invalid selection
  useEffect(() => {
    if (filteredCategories.length === 0) {
      setSelectedCatId(null);
      return;
    }
    const exists = filteredCategories.some((c) => c.id === selectedCatId);
    if (!exists) {
      setSelectedCatId(filteredCategories[0].id);
    }
  }, [filteredCategories, selectedCatId]);

  const selectedCat = orderedCategories.find((c) => c.id === selectedCatId) || null;
  const imageCount = selectedCat?.imagenes?.length || 0;

  /* ── Reorder ── */
  const reorderTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const handleReorder = (newOrder: GaleriaCategoria[]) => {
    // When filtered, splice reordered subset back into full list
    let fullOrder: GaleriaCategoria[];
    if (scopeFilter !== null) {
      fullOrder = [...orderedCategories];
      const filteredIds = new Set(newOrder.map((c) => c.id));
      let insertIdx = 0;
      for (let i = 0; i < fullOrder.length; i++) {
        if (filteredIds.has(fullOrder[i].id)) {
          fullOrder[i] = newOrder[insertIdx++];
        }
      }
    } else {
      fullOrder = newOrder;
    }
    setOrderedCategories(fullOrder);
    clearTimeout(reorderTimerRef.current);
    reorderTimerRef.current = setTimeout(async () => {
      try {
        const ids = fullOrder.map((cat) => cat.id);
        const res = await fetch("/api/galeria/categorias/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });
        if (!res.ok) toast.error(t("galeria.reorderError"));
      } catch {
        toast.error(t("errors.connectionError"));
      }
    }, 300);
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
          galeria_grupo_id: newCatGrupoId,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Error al crear la categoría");
        return;
      }
      const created = await res.json();
      // Optimistic: add category to local state immediately
      setOrderedCategories((prev) => [...prev, { ...created, imagenes: [] }]);
      setSelectedCatId(created.id);
      setNewCatNombre("");
      setNewCatGrupoId(null);
      setShowCatForm(false);
      toast.success(`Categoría "${created.nombre}" creada`);
      // Background sync
      refresh().catch(() => {});
    } catch {
      toast.error("Error de conexión al crear la categoría");
    } finally {
      setSaving(false);
    }
  };

  const deleteScope = async (grupoId: string) => {
    const grupo = localGrupos.find((g) => g.id === grupoId);
    if (!grupo) return;
    const catsInScope = orderedCategories.filter((c) => c.galeria_grupo_id === grupoId);
    if (!(await confirm({
      title: "Eliminar grupo de galería",
      message: `¿Eliminar el grupo "${grupo.nombre}"?`,
      description: catsInScope.length > 0
        ? `${catsInScope.length} categoría(s) serán desvinculadas y volverán a la lista general.`
        : undefined,
      typeToConfirm: grupo.nombre,
    }))) return;
    // Optimistic: unassign categories + remove grupo
    setOrderedCategories((prev) =>
      prev.map((c) => c.galeria_grupo_id === grupoId ? { ...c, galeria_grupo_id: null } : c)
    );
    setLocalGrupos((prev) => prev.filter((g) => g.id !== grupoId));
    setScopeFilter(null);
    toast.success(`Grupo "${grupo.nombre}" eliminado`);
    // Fire-and-forget: DELETE removes grupo + FK sets categories to null
    fetch(`/api/galeria/grupos/${grupoId}`, { method: "DELETE" })
      .then(() => refresh().catch(() => {}))
      .catch(() => toast.error("Error al eliminar grupo"));
  };

  const addScope = async () => {
    if (!newScopeName.trim()) return;
    setSavingScope(true);
    try {
      const res = await fetch("/api/galeria/grupos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proyecto_id: projectId,
          nombre: newScopeName.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Error al crear el grupo");
        return;
      }
      const created = await res.json();
      setLocalGrupos((prev) => [...prev, created]);
      toast.success(`Grupo "${created.nombre}" creado`);
      setNewScopeName("");
      setShowScopeForm(false);
      refresh().catch(() => {});
    } catch {
      toast.error("Error de conexión al crear el grupo");
    } finally {
      setSavingScope(false);
    }
  };

  const deleteCategoriaAction = useAsyncAction(async () => {
    if (!selectedCatId) return;
    const cat = orderedCategories.find((c) => c.id === selectedCatId);
    if (!cat) return;
    const nImages = cat.imagenes?.length ?? 0;
    if (!(await confirm({
      title: t("galeria.deleteCategory"),
      message: t("galeria.deleteCategoryConfirm"),
      description: cat.nombre,
      details: nImages > 0 ? t("galeria.deleteImageCount", { count: nImages }) : undefined,
      typeToConfirm: cat.nombre,
    }))) return;
    const deletedId = selectedCatId;
    // Optimistic: remove from local state immediately
    setOrderedCategories((prev) => prev.filter((c) => c.id !== deletedId));
    setSelectedCatId(null);
    fetch(`/api/galeria/categorias/${deletedId}`, { method: "DELETE" })
      .then((res) => {
        if (!res.ok) toast.error(t("galeria.deleteCategoryError"));
        refresh().catch(() => {});
      })
      .catch(() => toast.error(t("errors.connectionError")));
  });

  const deleteImage = (imgId: string) => {
    // Optimistic: remove from local state immediately
    setLocalImages((prev) => prev.filter((i) => i.id !== imgId));
    fetch(`/api/galeria/imagenes/${imgId}`, { method: "DELETE" })
      .then((res) => {
        if (!res.ok) toast.error(t("galeria.deleteImageError"));
        refresh().catch(() => {});
      })
      .catch(() => toast.error(t("errors.connectionError")));
  };

  /* ── Image reorder (HTML5 drag-and-drop for grid) ── */
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dropTargetIdx, setDropTargetIdx] = useState<number | null>(null);
  const [localImages, setLocalImages] = useState<GaleriaImagen[]>([]);

  // Sync localImages from selectedCat
  useEffect(() => {
    setLocalImages(selectedCat?.imagenes ?? []);
  }, [selectedCat?.imagenes]);

  const handleImageDragStart = useCallback((idx: number) => {
    setDraggedIdx(idx);
  }, []);

  const handleImageDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTargetIdx(idx);
  }, []);

  const handleImageDrop = useCallback(async (targetIdx: number) => {
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null);
      setDropTargetIdx(null);
      return;
    }
    const reordered = [...localImages];
    const [moved] = reordered.splice(draggedIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    setLocalImages(reordered);
    setDraggedIdx(null);
    setDropTargetIdx(null);

    // Persist (fire-and-forget)
    fetch("/api/galeria/imagenes/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: reordered.map((img) => img.id) }),
    })
      .then((res) => {
        if (!res.ok) toast.error(t("galeria.reorderError"));
        refresh().catch(() => {});
      })
      .catch(() => toast.error(t("errors.connectionError")));
  }, [draggedIdx, localImages, refresh, toast, t]);

  const handleImageDragEnd = useCallback(() => {
    setDraggedIdx(null);
    setDropTargetIdx(null);
  }, []);

  /* ── Image title editing ── */
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [titleValue, setTitleValue] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  const startEditTitle = useCallback((img: GaleriaImagen) => {
    setEditingTitleId(img.id);
    setTitleValue(img.alt_text || "");
    setTimeout(() => titleInputRef.current?.focus(), 50);
  }, []);

  const saveTitle = useCallback(async () => {
    if (!editingTitleId) return;
    const newTitle = titleValue.trim() || null;
    const img = localImages.find((i) => i.id === editingTitleId);
    if (img && (img.alt_text || null) === newTitle) {
      setEditingTitleId(null);
      return;
    }
    // Optimistic update
    setLocalImages((prev) =>
      prev.map((i) => (i.id === editingTitleId ? { ...i, alt_text: newTitle } : i))
    );
    setEditingTitleId(null);
    try {
      const res = await fetch(`/api/galeria/imagenes/${editingTitleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alt_text: newTitle }),
      });
      if (!res.ok) toast.error(t("galeria.saveTitleError"));
      refresh().catch(() => {});
    } catch {
      toast.error(t("errors.connectionError"));
    }
  }, [editingTitleId, titleValue, localImages, refresh, toast]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Page Header */}
      <PageHeader
        icon={ImageIcon}
        title={t("galeria.title")}
        description={<>{t("galeria.description")} <InfoTooltip content={tTooltips("galeria.concepto.short")} variant="dashboard" /></>}
      />

      {/* Empty state when no categories */}
      {orderedCategories.length === 0 && !showCatForm && (
        <DashboardEmptyState
          variant="galeria"
          title={t("galeria.noCategories")}
          description={t("galeria.createFirstCategory")}
        >
          <button onClick={() => setShowCatForm(true)} className={btnPrimary}>
            <Plus size={14} />
            {t("galeria.createFirstButton")}
          </button>
        </DashboardEmptyState>
      )}

      {/* Category tab bar + content */}
      {(orderedCategories.length > 0 || showCatForm) && (
        <div className="space-y-4">
          {/* Scope filter + group creation */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {hasGrupos && [
              { id: null, label: t("galeria.scopeAll") },
              ...localGrupos.map((grupo) => ({ id: grupo.id, label: grupo.nombre })),
            ].map((scope) => (
              <div key={scope.id ?? "all"} className="flex items-center shrink-0 group/scope">
                <button
                  onClick={() => setScopeFilter(scope.id)}
                  className={`px-3 py-1 rounded-lg text-[10px] tracking-wide uppercase font-medium transition-all ${
                    scopeFilter === scope.id
                      ? "bg-[rgba(var(--site-primary-rgb),0.15)] text-[var(--site-primary)] border border-[rgba(var(--site-primary-rgb),0.3)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-transparent hover:border-[var(--border-subtle)]"
                  }${scope.id ? " rounded-r-none border-r-0" : ""}`}
                >
                  {scope.label}
                </button>
                {scope.id && (
                  <button
                    onClick={() => deleteScope(scope.id!)}
                    className={`px-1 py-1 rounded-r-lg text-[10px] transition-all opacity-0 group-hover/scope:opacity-100 ${
                      scopeFilter === scope.id
                        ? "bg-[rgba(var(--site-primary-rgb),0.15)] border border-l-0 border-[rgba(var(--site-primary-rgb),0.3)] text-[var(--text-secondary)] hover:text-red-400"
                        : "border border-l-0 border-transparent text-[var(--text-muted)] hover:text-red-400"
                    }`}
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            ))}

            {/* Add group button / inline form */}
            {!showScopeForm ? (
              <button
                onClick={() => setShowScopeForm(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)] border border-dashed border-[var(--border-default)] transition-all shrink-0"
              >
                <Plus size={10} />
                {t("galeria.newScope")}
              </button>
            ) : (
              <div className="flex items-center gap-1 shrink-0">
                <input
                  type="text"
                  value={newScopeName}
                  onChange={(e) => setNewScopeName(e.target.value)}
                  placeholder={t("galeria.scopeNamePlaceholder")}
                  className="px-2 py-1 rounded-lg text-[10px] bg-[var(--surface-2)] border border-[var(--border-default)] text-white placeholder:text-[var(--text-muted)] outline-none focus:border-[rgba(var(--site-primary-rgb),0.4)] w-32"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addScope();
                    if (e.key === "Escape") { setShowScopeForm(false); setNewScopeName(""); }
                  }}
                  autoFocus
                />
                <button
                  onClick={addScope}
                  disabled={savingScope || !newScopeName.trim()}
                  className="p-1 rounded-lg text-[var(--site-primary)] hover:bg-[rgba(var(--site-primary-rgb),0.1)] disabled:opacity-40 transition-all"
                >
                  {savingScope ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                </button>
                <button
                  onClick={() => { setShowScopeForm(false); setNewScopeName(""); }}
                  className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-all"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>

          {/* Category tab bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {filteredCategories.length > 0 && (
              <Reorder.Group
                axis="x"
                values={filteredCategories}
                onReorder={handleReorder}
                className="flex items-center gap-1.5"
                style={{ listStyle: "none" }}
              >
                {filteredCategories.map((cat) => (
                  <DraggablePill
                    key={cat.id}
                    cat={cat}
                    isActive={selectedCatId === cat.id}
                    onSelect={() => setSelectedCatId(cat.id)}
                    grupos={localGrupos}
                  />
                ))}
              </Reorder.Group>
            )}

            {/* Add category button */}
            {!showCatForm && (
              <button
                onClick={() => {
                  if (scopeFilter) {
                    setNewCatGrupoId(scopeFilter);
                  } else {
                    setNewCatGrupoId(null);
                  }
                  setShowCatForm(true);
                }}
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
                  {hasGrupos && (
                    <div className="w-auto min-w-[140px]">
                      <NodDoDropdown
                        variant="dashboard"
                        size="md"
                        value={newCatGrupoId ?? ""}
                        onChange={(val) => setNewCatGrupoId(val || null)}
                        options={[
                          { value: "", label: t("galeria.scopeProjectWide") },
                          ...localGrupos.map((g) => ({ value: g.id, label: g.nombre })),
                        ]}
                      />
                    </div>
                  )}
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
                      setNewCatGrupoId(null);
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
                  {/* Group assignment dropdown */}
                  {hasGrupos && (
                    <NodDoDropdown
                      variant="dashboard"
                      size="md"
                      value={selectedCat.galeria_grupo_id ?? ""}
                      onChange={async (val) => {
                        const newGrupoId = val || null;
                        setOrderedCategories((prev) =>
                          prev.map((c) => c.id === selectedCat.id ? { ...c, galeria_grupo_id: newGrupoId } : c)
                        );
                        try {
                          const res = await fetch(`/api/galeria/categorias/${selectedCat.id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ galeria_grupo_id: newGrupoId }),
                          });
                          if (!res.ok) toast.error("Error al asignar grupo");
                          refresh().catch(() => {});
                        } catch {
                          toast.error("Error de conexión");
                        }
                      }}
                      options={[
                        { value: "", label: "Sin grupo" },
                        ...localGrupos.map((g) => ({ value: g.id, label: g.nombre })),
                      ]}
                    />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className={btnPrimary}
                  >
                    <Upload size={14} />
                    {t("galeria.uploadImages")}
                  </button>
                  <button onClick={deleteCategoriaAction.execute} disabled={deleteCategoriaAction.loading} className={btnDanger}>
                    {deleteCategoriaAction.loading ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    {t("galeria.delete")}
                  </button>
                </div>
              </div>

              {/* Image grid */}
              {localImages.length > 0 ? (
                <div className="grid grid-cols-5 gap-2">
                  {localImages.map((img, idx) => (
                    <div
                      key={img.id}
                      draggable
                      onDragStart={() => handleImageDragStart(idx)}
                      onDragOver={(e) => handleImageDragOver(e, idx)}
                      onDrop={() => handleImageDrop(idx)}
                      onDragEnd={handleImageDragEnd}
                      className={`relative aspect-video rounded-lg overflow-hidden bg-[var(--surface-2)] group cursor-grab active:cursor-grabbing transition-all ${
                        draggedIdx === idx ? "opacity-40 scale-95" : ""
                      } ${
                        dropTargetIdx === idx && draggedIdx !== idx
                          ? "ring-2 ring-[var(--site-primary)] ring-offset-1 ring-offset-[var(--surface-0)]"
                          : ""
                      }`}
                    >
                      <Image src={img.thumbnail_url || img.url} alt={img.alt_text || ""} fill className="w-full h-full object-cover pointer-events-none" />

                      {/* Drag handle */}
                      <div className="absolute top-1 left-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-all">
                        <GripVertical size={10} />
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteImage(img.id); }}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X size={10} />
                      </button>

                      {/* Title overlay — bottom of thumbnail */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-6 pb-1.5 px-2">
                        {editingTitleId === img.id ? (
                          <input
                            ref={titleInputRef}
                            type="text"
                            value={titleValue}
                            onChange={(e) => setTitleValue(e.target.value)}
                            onBlur={saveTitle}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveTitle();
                              if (e.key === "Escape") setEditingTitleId(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            placeholder={t("galeria.imageTitlePlaceholder")}
                            className="w-full bg-transparent text-[10px] text-white placeholder:text-white/30 border-b border-white/30 focus:border-[var(--site-primary)] outline-none pb-0.5"
                          />
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); startEditTitle(img); }}
                            className="w-full text-left flex items-center gap-1 group/title"
                          >
                            {img.alt_text ? (
                              <span className="text-[10px] text-white/80 truncate">{img.alt_text}</span>
                            ) : (
                              <span className="text-[10px] text-white/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                <Type size={8} />
                                {t("galeria.addTitle")}
                              </span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <DashboardEmptyState
                  variant="imagenes"
                  title={t("galeria.noImages")}
                  description={t("galeria.uploadHint")}
                >
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className={btnPrimary}
                  >
                    <Upload size={14} />
                    {t("galeria.uploadImages")}
                  </button>
                </DashboardEmptyState>
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
