"use client";

import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Loader2,
  Search,
  X,
  ChevronDown,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AmenidadItem } from "@/types";
import {
  AMENIDADES_CATALOG,
  AMENIDADES_CATEGORIAS,
  DynamicIcon,
} from "@/data/amenidades-catalog";
import { FileUploader } from "@/components/dashboard/FileUploader";
import {
  inputClass,
  labelClass,
  btnPrimary,
  btnSecondary,
  sectionCard,
} from "@/components/dashboard/editor-styles";

/* ════════════════════════════════════════════════════════════════════
   AmenidadesEditor — Generic amenidades picker & custom amenity editor

   Works for any entity (Torre, PlanoInteractivo, etc.) that has:
   - id: string
   - amenidades_data: AmenidadItem[] | null
   ════════════════════════════════════════════════════════════════════ */

interface AmenidadesEditorProps {
  entity: { id: string; amenidades_data: AmenidadItem[] | null };
  projectId: string;
  onUpdate: (entityId: string, data: { amenidades_data: AmenidadItem[] }) => Promise<void>;
  /** When true, renders without the outer sectionCard wrapper (for embedding inside another card) */
  embedded?: boolean;
}

export function AmenidadesEditor({ entity, projectId, onUpdate, embedded }: AmenidadesEditorProps) {
  const [search, setSearch] = useState("");
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());
  const [customNombre, setCustomNombre] = useState("");
  const [customIconUrl, setCustomIconUrl] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Local state for batch selection — only synced to DB on save
  const saved: AmenidadItem[] = useMemo(() => entity.amenidades_data ?? [], [entity.amenidades_data]);
  const [localSelected, setLocalSelected] = useState<AmenidadItem[]>(saved);

  // Sync local state when server data changes (e.g. after save completes)
  useEffect(() => {
    setLocalSelected(saved);
  }, [saved]);

  const selectedIds = new Set(localSelected.map((a) => a.id));
  const savedIds = new Set(saved.map((a) => a.id));
  const isDirty = localSelected.length !== saved.length || localSelected.some((a) => !savedIds.has(a.id)) || saved.some((a) => !selectedIds.has(a.id));

  const toggleCat = (cat: string) => {
    setCollapsedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const toggle = (item: { id: string; nombre: string; icono: string }) => {
    setLocalSelected((prev) => {
      if (prev.some((a) => a.id === item.id)) {
        return prev.filter((a) => a.id !== item.id);
      }
      return [...prev, { id: item.id, nombre: item.nombre, icono: item.icono }];
    });
  };

  const remove = (id: string) => {
    setLocalSelected((prev) => prev.filter((a) => a.id !== id));
  };

  const addCustom = () => {
    if (!customNombre.trim()) return;
    const id = `custom-${Date.now()}`;
    setLocalSelected((prev) => [
      ...prev,
      {
        id,
        nombre: customNombre.trim(),
        icono: "Star",
        ...(customIconUrl ? { icon_url: customIconUrl } : {}),
      },
    ]);
    setCustomNombre("");
    setCustomIconUrl("");
    setShowCustomForm(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(entity.id, { amenidades_data: localSelected });
    setSaving(false);
  };

  const handleDiscard = () => {
    setLocalSelected(saved);
  };

  const filteredCatalog = search.trim()
    ? AMENIDADES_CATALOG.filter((a) =>
        a.nombre.toLowerCase().includes(search.toLowerCase())
      )
    : AMENIDADES_CATALOG;

  const categoriesWithItems = AMENIDADES_CATEGORIAS.filter((cat) =>
    filteredCatalog.some((a) => a.categoria === cat)
  );

  return (
    <div className={embedded ? "" : sectionCard}>
      {/* Save / discard bar */}
      <AnimatePresence>
        {isDirty && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mb-4 flex items-center gap-2 p-2.5 rounded-lg bg-[rgba(var(--site-primary-rgb),0.08)] border border-[rgba(var(--site-primary-rgb),0.2)]"
          >
            <span className="text-xs text-[var(--site-primary)] flex-1">
              {localSelected.length} amenidades seleccionadas — cambios sin guardar
            </span>
            <button onClick={handleDiscard} className={btnSecondary + " !py-1.5 !px-3 !text-xs"}>
              Descartar
            </button>
            <button onClick={handleSave} disabled={saving} className={btnPrimary + " !py-1.5 !px-3 !text-xs"}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Guardar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected amenities */}
      {localSelected.length > 0 && (
        <div className="mb-4">
          <p className="font-ui text-[10px] text-[var(--text-tertiary)] tracking-wider uppercase font-bold mb-2">
            Seleccionadas ({localSelected.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {localSelected.map((a) => (
              <span
                key={a.id}
                className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 bg-[rgba(var(--site-primary-rgb),0.1)] border border-[rgba(var(--site-primary-rgb),0.2)] rounded-lg text-xs text-[var(--site-primary)]"
              >
                {a.icon_url ? (
                  <Image src={a.icon_url} alt="undefined" width={400} height={300} className="w-3.5 h-3.5 object-contain" />
                ) : (
                  <DynamicIcon name={a.icono} size={12} />
                )}
                {a.nombre}
                <button
                  onClick={() => remove(a.id)}
                  className="ml-0.5 p-0.5 rounded hover:bg-white/10 transition-colors"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={inputClass + " pl-10"}
          placeholder="Buscar amenidades..."
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Catalog by categories */}
      <div className="space-y-3 max-h-[420px] overflow-y-auto scrollbar-hide">
        {categoriesWithItems.map((cat) => {
          const items = filteredCatalog.filter((a) => a.categoria === cat);
          const isCollapsed = collapsedCats.has(cat);

          return (
            <div key={cat}>
              <button
                onClick={() => toggleCat(cat)}
                className="flex items-center gap-2 w-full text-left mb-2 group"
              >
                <ChevronDown
                  size={12}
                  className={cn(
                    "text-[var(--text-muted)] transition-transform",
                    isCollapsed && "-rotate-90"
                  )}
                />
                <span className="font-ui text-[10px] tracking-wider uppercase font-bold text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-colors">
                  {cat}
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  {items.filter((i) => selectedIds.has(i.id)).length}/{items.length}
                </span>
              </button>
              {!isCollapsed && (
                <div className="grid grid-cols-2 gap-1.5 ml-4">
                  {items.map((item) => {
                    const isSelected = selectedIds.has(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggle(item)}
                        className={cn(
                          "flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-all text-left",
                          isSelected
                            ? "bg-[rgba(var(--site-primary-rgb),0.1)] border border-[rgba(var(--site-primary-rgb),0.25)] text-[var(--site-primary)]"
                            : "bg-[var(--surface-2)] border border-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-3)]"
                        )}
                      >
                        <DynamicIcon name={item.icono} size={14} className="flex-shrink-0" />
                        <span className="truncate">{item.nombre}</span>
                        {isSelected && <Check size={12} className="ml-auto flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Custom amenity */}
      <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
        {showCustomForm ? (
          <div className="space-y-3">
            <p className="font-ui text-[10px] tracking-wider uppercase font-bold text-[var(--text-tertiary)]">
              Amenidad personalizada
            </p>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className={labelClass}>Nombre</label>
                <input
                  type="text"
                  value={customNombre}
                  onChange={(e) => setCustomNombre(e.target.value)}
                  className={inputClass}
                  placeholder="Ej: Sala de lectura"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustom();
                    }
                  }}
                />
              </div>
              <div className="w-20">
                <label className={labelClass}>Icono</label>
                <div className="w-full">
                  <FileUploader
                    currentUrl={customIconUrl || null}
                    onUpload={(url) => setCustomIconUrl(url)}
                    folder={`proyectos/${projectId}/amenidades`}
                    label=""
                    aspect="square"
                    minWidth={64}
                    minHeight={64}
                    enablePaste={false}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={addCustom} disabled={!customNombre.trim()} className={btnPrimary}>
                <Plus size={14} />
                Agregar
              </button>
              <button
                onClick={() => {
                  setShowCustomForm(false);
                  setCustomNombre("");
                  setCustomIconUrl("");
                }}
                className={btnSecondary}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCustomForm(true)}
            className={cn(btnSecondary, "w-full justify-center")}
          >
            <Plus size={14} />
            Amenidad personalizada
          </button>
        )}
      </div>
    </div>
  );
}
