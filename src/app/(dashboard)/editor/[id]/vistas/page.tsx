"use client";

export const dynamic = "force-dynamic";

import Image from "next/image";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "@/i18n";
import { useEditorProject } from "@/hooks/useEditorProject";
import { useToast } from "@/components/dashboard/Toast";
import { useConfirm } from "@/components/dashboard/ConfirmModal";
import { PageHeader } from "@/components/dashboard/base/PageHeader";
import { FileUploader } from "@/components/dashboard/FileUploader";
import { NodDoDropdown } from "@/components/ui/NodDoDropdown";
import {
  inputClass,
  labelClass,
  btnPrimary,
  btnSecondary,
  badgeGold,
  badgeMuted,
  sectionCard,
  emptyState,
  emptyStateIcon,
  emptyStateTitle,
  emptyStateDescription,
} from "@/components/dashboard/editor-styles";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  Plus,
  Loader2,
  Save,
  X,
  Trash2,
  Pencil,
  Building2,
  ChevronDown,
  ChevronRight,
  Users,
  Compass,
  Layers,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import type { VistaPiso, Torre, Tipologia, Unidad } from "@/types";

/* ── Orientation suggestions ── */
const ORIENTACIONES = [
  "Norte",
  "Sur",
  "Este",
  "Oeste",
  "Noreste",
  "Noroeste",
  "Sureste",
  "Suroeste",
];

/* ── Slide panel spring config ── */
const slidePanel = {
  initial: { x: "100%" },
  animate: { x: 0 },
  exit: { x: "100%" },
  transition: { type: "spring" as const, damping: 28, stiffness: 300 },
};

/* ── Form state interface ── */
interface VistaFormState {
  nombre: string;
  orientacion: string;
  piso_min: string;
  piso_max: string;
  torre_id: string;
  tipologia_ids: string[];
  imagen_url: string;
  descripcion: string;
}

const EMPTY_FORM: VistaFormState = {
  nombre: "",
  orientacion: "",
  piso_min: "",
  piso_max: "",
  torre_id: "",
  tipologia_ids: [],
  imagen_url: "",
  descripcion: "",
};

/* ==================================================================
   Page Component
   ================================================================== */
export default function VistasPage() {
  const { t } = useTranslation("editor");
  const { t: tTooltips } = useTranslation("tooltips");
  const { project, projectId, refresh } = useEditorProject();
  const toast = useToast();
  const { confirm } = useConfirm();

  /* ── Data from project context ── */
  const torres = useMemo<Torre[]>(() => project?.torres ?? [], [project]);
  const tipologias = useMemo<Tipologia[]>(() => project?.tipologias ?? [], [project]);
  const unidades = useMemo<Unidad[]>(() => project?.unidades ?? [], [project]);
  const isMultiTorre = torres.length > 1;

  /* ── Local state ── */
  const [vistas, setVistas] = useState<VistaPiso[]>([]);
  const [activeTorreTab, setActiveTorreTab] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [editingVistaId, setEditingVistaId] = useState<string | null>(null);
  const [form, setForm] = useState<VistaFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAssignment, setShowAssignment] = useState(false);

  /* ── Sync vistas from project ── */
  useEffect(() => {
    setVistas(project?.vistas_piso ?? []);
  }, [project]);

  /* ── Torre name lookup ── */
  const torreMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of torres) {
      map.set(t.id, t.nombre);
    }
    return map;
  }, [torres]);

  /* ── Tipologia name lookup ── */
  const tipologiaMap = useMemo(() => {
    const map = new Map<string, Tipologia>();
    for (const t of tipologias) {
      map.set(t.id, t);
    }
    return map;
  }, [tipologias]);

  /* ── Filtered vistas by tower tab ── */
  const filteredVistas = useMemo(() => {
    if (!isMultiTorre || activeTorreTab === null) return vistas;
    return vistas.filter((v) => v.torre_id === activeTorreTab);
  }, [vistas, isMultiTorre, activeTorreTab]);

  /* ── Count assigned units per vista ── */
  const assignmentCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const u of unidades) {
      if (u.vista_piso_id) {
        counts.set(u.vista_piso_id, (counts.get(u.vista_piso_id) ?? 0) + 1);
      }
    }
    return counts;
  }, [unidades]);

  /* ── Ensure torre tab validity ── */
  useEffect(() => {
    if (!isMultiTorre) {
      setActiveTorreTab(null);
      return;
    }
    if (activeTorreTab === null || !torres.find((t) => t.id === activeTorreTab)) {
      setActiveTorreTab(torres[0]?.id ?? null);
    }
  }, [torres, activeTorreTab, isMultiTorre]);

  /* ── Form helpers ── */
  const updateForm = useCallback(
    <K extends keyof VistaFormState>(key: K, value: VistaFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const openCreate = useCallback(() => {
    setEditingVistaId(null);
    setForm({
      ...EMPTY_FORM,
      torre_id: isMultiTorre && activeTorreTab ? activeTorreTab : "",
    });
    setShowPanel(true);
  }, [isMultiTorre, activeTorreTab]);

  const openEdit = useCallback(
    (vista: VistaPiso) => {
      setEditingVistaId(vista.id);
      setForm({
        nombre: vista.nombre,
        orientacion: vista.orientacion ?? "",
        piso_min: vista.piso_min !== null ? String(vista.piso_min) : "",
        piso_max: vista.piso_max !== null ? String(vista.piso_max) : "",
        torre_id: vista.torre_id ?? "",
        tipologia_ids: vista.tipologia_ids ?? [],
        imagen_url: vista.imagen_url,
        descripcion: vista.descripcion ?? "",
      });
      setShowPanel(true);
    },
    []
  );

  const closePanel = useCallback(() => {
    setShowPanel(false);
    setEditingVistaId(null);
    setForm(EMPTY_FORM);
  }, []);

  /* ── Toggle tipologia selection ── */
  const toggleTipologia = useCallback((tipoId: string) => {
    setForm((prev) => {
      const exists = prev.tipologia_ids.includes(tipoId);
      return {
        ...prev,
        tipologia_ids: exists
          ? prev.tipologia_ids.filter((id) => id !== tipoId)
          : [...prev.tipologia_ids, tipoId],
      };
    });
  }, []);

  /* ── Save (create or update) ── */
  const handleSave = async () => {
    if (!form.nombre.trim() || !form.imagen_url) return;
    setSaving(true);

    const payload: Record<string, unknown> = {
      proyecto_id: projectId,
      nombre: form.nombre.trim(),
      orientacion: form.orientacion.trim() || null,
      piso_min: form.piso_min ? parseInt(form.piso_min) : null,
      piso_max: form.piso_max ? parseInt(form.piso_max) : null,
      torre_id: form.torre_id || null,
      tipologia_ids: form.tipologia_ids,
      imagen_url: form.imagen_url,
      descripcion: form.descripcion.trim() || null,
    };

    try {
      const isEdit = editingVistaId !== null;
      const url = isEdit
        ? `/api/vistas-piso/${editingVistaId}`
        : "/api/vistas-piso";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const count = data._assigned_count ?? 0;
        if (count > 0) {
          toast.success(
            isEdit
              ? t("vistas.updatedWithCount", { count: String(count) })
              : t("vistas.createdWithCount", { count: String(count) })
          );
        } else {
          toast.success(isEdit ? t("vistas.updated") : t("vistas.created"));
        }
        closePanel();
        await refresh();
      } else {
        const err = await res.json().catch(() => null);
        toast.error(err?.error ?? t("vistas.saveError"));
      }
    } catch {
      toast.error(t("errors.connectionError"));
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete ── */
  const handleDelete = async (vista: VistaPiso) => {
    const ok = await confirm({
      title: t("vistas.deleteTitle"),
      message: t("vistas.deleteConfirm", { name: vista.nombre }),
    });
    if (!ok) return;

    setDeletingId(vista.id);
    try {
      const res = await fetch(`/api/vistas-piso/${vista.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(t("vistas.deleted"));
        await refresh();
      } else {
        toast.error(t("vistas.deleteError"));
      }
    } catch {
      toast.error(t("errors.connectionError"));
    } finally {
      setDeletingId(null);
    }
  };

  /* ── Assignment summary data ── */
  const assignmentRows = useMemo(() => {
    return unidades
      .filter((u) => u.vista_piso_id)
      .map((u) => {
        const vista = vistas.find((v) => v.id === u.vista_piso_id);
        return {
          id: u.id,
          identificador: u.identificador,
          piso: u.piso,
          vistaNombre: vista?.nombre ?? "—",
          torreNombre: u.torre_id ? torreMap.get(u.torre_id) ?? "—" : "—",
        };
      })
      .sort((a, b) => (a.piso ?? 0) - (b.piso ?? 0));
  }, [unidades, vistas, torreMap]);

  /* ── Tipologias filtered by selected torre ── */
  const filteredTipologias = useMemo(() => {
    if (!form.torre_id) return tipologias;
    return tipologias.filter(
      (t) => !t.proyecto_id || t.proyecto_id === projectId
    );
  }, [tipologias, form.torre_id, projectId]);

  /* ==================================================================
     Render
     ================================================================== */
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* ── Page Header ── */}
      <PageHeader
        icon={Eye}
        title={t("vistas.title")}
        description={t("vistas.description")}
        actions={
          <button onClick={openCreate} className={btnPrimary}>
            <Plus size={14} />
            {t("vistas.newVista")}
          </button>
        }
      />

      {/* ── Tower tabs (multi-torre) ── */}
      {isMultiTorre && (
        <div className="flex items-center gap-1 p-1 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] overflow-x-auto scrollbar-thin">
          {torres.map((torre) => {
            const count = vistas.filter((v) => v.torre_id === torre.id).length;
            return (
              <button
                key={torre.id}
                onClick={() => setActiveTorreTab(torre.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0",
                  activeTorreTab === torre.id
                    ? "bg-[var(--surface-3)] text-white shadow-sm"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                )}
              >
                <Building2 size={13} />
                {torre.nombre}
                {count > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[rgba(184,151,58,0.15)] text-[rgba(184,151,58,1)]">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Empty state ── */}
      {filteredVistas.length === 0 && (
        <div className={emptyState}>
          <div className={emptyStateIcon}>
            <Eye size={24} className="text-[var(--text-muted)]" />
          </div>
          <p className={emptyStateTitle}>{t("vistas.noVistas")}</p>
          <p className={emptyStateDescription}>
            {t("vistas.noVistasDescription")}
          </p>
          <button onClick={openCreate} className={btnPrimary}>
            <Plus size={14} />
            {t("vistas.createFirst")}
          </button>
        </div>
      )}

      {/* ── Vista cards grid ── */}
      {filteredVistas.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredVistas.map((vista) => {
            const assignedCount = assignmentCounts.get(vista.id) ?? 0;
            const torreName = vista.torre_id
              ? torreMap.get(vista.torre_id)
              : null;

            return (
              <motion.div
                key={vista.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="bg-[rgba(255,255,255,0.03)] border border-[var(--border-subtle)] rounded-[1.25rem] overflow-hidden group hover:border-[var(--border-default)] transition-all"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-[var(--surface-2)] overflow-hidden">
                  {vista.thumbnail_url || vista.imagen_url ? (
                    <Image src={vista.thumbnail_url || vista.imagen_url} alt="" fill className="w-full h-full object-cover transition-transform group-hover:scale-[1.02]" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon
                        size={32}
                        className="text-[var(--text-muted)]"
                      />
                    </div>
                  )}

                  {/* Hover action buttons */}
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(vista)}
                      className="w-8 h-8 rounded-lg bg-black/60 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(vista)}
                      disabled={deletingId === vista.id}
                      className="w-8 h-8 rounded-lg bg-black/60 backdrop-blur-sm flex items-center justify-center text-red-400/70 hover:text-red-400 transition-colors"
                    >
                      {deletingId === vista.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>

                  {/* Assigned count badge */}
                  <div className="absolute bottom-2 left-2">
                    <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-[10px] text-white/80">
                      <Users size={10} />
                      {assignedCount} unidad{assignedCount !== 1 ? "es" : ""}{" "}
                      asignada{assignedCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Card body */}
                <div className="px-4 py-3 space-y-2">
                  {/* Title + badges row */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-medium text-white truncate">
                      {vista.nombre}
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Orientation badge */}
                      {vista.orientacion && (
                        <span className={badgeGold}>
                          <Compass size={9} className="mr-0.5" />
                          {vista.orientacion}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info row: floor range + tower */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {(vista.piso_min !== null || vista.piso_max !== null) && (
                      <span className={badgeMuted}>
                        <Layers size={9} className="mr-0.5" />
                        Piso{" "}
                        {vista.piso_min !== null ? vista.piso_min : "?"}
                        {" - "}
                        {vista.piso_max !== null ? vista.piso_max : "?"}
                      </span>
                    )}
                    {torreName && (
                      <span className={badgeMuted}>
                        <Building2 size={9} className="mr-0.5" />
                        {torreName}
                      </span>
                    )}
                  </div>

                  {/* Tipologia chips */}
                  {vista.tipologia_ids?.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      {vista.tipologia_ids.map((tipoId) => {
                        const tipo = tipologiaMap.get(tipoId);
                        return (
                          <span
                            key={tipoId}
                            className="inline-flex items-center px-2 py-0.5 text-[9px] rounded-full bg-[var(--surface-3)] text-[var(--text-tertiary)] truncate max-w-[120px]"
                          >
                            {tipo?.nombre ?? "..."}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Assignment summary (collapsible) ── */}
      {assignmentRows.length > 0 && (
        <div className={sectionCard}>
          <button
            onClick={() => setShowAssignment((prev) => !prev)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Users size={14} className="text-[rgba(184,151,58,1)]" />
              <span className="font-ui text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
                {t("vistas.assignmentSummary")}
              </span>
              <span className={badgeGold}>{assignmentRows.length}</span>
            </div>
            {showAssignment ? (
              <ChevronDown
                size={14}
                className="text-[var(--text-tertiary)]"
              />
            ) : (
              <ChevronRight
                size={14}
                className="text-[var(--text-tertiary)]"
              />
            )}
          </button>

          <AnimatePresence>
            {showAssignment && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-4 max-h-64 overflow-y-auto scrollbar-thin rounded-xl border border-[var(--border-subtle)]">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[var(--surface-2)] text-[var(--text-tertiary)]">
                        <th className="text-left px-3 py-2 font-ui text-[10px] font-bold uppercase tracking-wider">
                          {t("vistas.table.unit")}
                        </th>
                        <th className="text-left px-3 py-2 font-ui text-[10px] font-bold uppercase tracking-wider">
                          {t("vistas.table.floor")}
                        </th>
                        {isMultiTorre && (
                          <th className="text-left px-3 py-2 font-ui text-[10px] font-bold uppercase tracking-wider">
                            {t("vistas.table.tower")}
                          </th>
                        )}
                        <th className="text-left px-3 py-2 font-ui text-[10px] font-bold uppercase tracking-wider">
                          {t("vistas.table.assignedView")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignmentRows.map((row) => (
                        <tr
                          key={row.id}
                          className="border-t border-[var(--border-subtle)] hover:bg-[var(--surface-2)] transition-colors"
                        >
                          <td className="px-3 py-2 text-[var(--text-secondary)]">
                            {row.identificador}
                          </td>
                          <td className="px-3 py-2 text-[var(--text-tertiary)]">
                            {row.piso ?? "—"}
                          </td>
                          {isMultiTorre && (
                            <td className="px-3 py-2 text-[var(--text-tertiary)]">
                              {row.torreNombre}
                            </td>
                          )}
                          <td className="px-3 py-2">
                            <span className="text-[rgba(184,151,58,1)]">
                              {row.vistaNombre}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ==================================================================
          SLIDE PANEL (create / edit)
          ================================================================== */}
      <AnimatePresence>
        {showPanel && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={closePanel}
            />

            {/* Panel */}
            <motion.div
              {...slidePanel}
              className="fixed top-0 right-0 z-50 h-full w-full max-w-lg bg-[var(--surface-1)] border-l border-[var(--border-default)] shadow-2xl flex flex-col"
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <Eye size={16} className="text-[rgba(184,151,58,1)]" />
                  {editingVistaId ? t("vistas.editVista") : t("vistas.newVista")}
                </h3>
                <button
                  onClick={closePanel}
                  className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Panel body (scrollable) */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {/* Nombre */}
                <div>
                  <label className={labelClass}>
                    {t("vistas.form.name")} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) => updateForm("nombre", e.target.value)}
                    placeholder={t("vistas.form.namePlaceholder")}
                    className={inputClass}
                    autoFocus
                  />
                </div>

                {/* Orientacion */}
                <div>
                  <label className={labelClass}>
                    {t("vistas.form.orientation")}
                    <InfoTooltip content={tTooltips("vistas.orientacion.short")} variant="dashboard" />
                  </label>
                  <input
                    type="text"
                    value={form.orientacion}
                    onChange={(e) => updateForm("orientacion", e.target.value)}
                    placeholder={t("vistas.form.orientationPlaceholder")}
                    className={inputClass}
                    list="orientacion-list"
                  />
                  <datalist id="orientacion-list">
                    {ORIENTACIONES.map((o) => (
                      <option key={o} value={o} />
                    ))}
                  </datalist>
                </div>

                {/* Piso min / max */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>
                      {t("vistas.form.floorMin")}
                      <InfoTooltip content={tTooltips("vistas.pisoRango.short")} variant="dashboard" />
                    </label>
                    <input
                      type="number"
                      value={form.piso_min}
                      onChange={(e) => updateForm("piso_min", e.target.value)}
                      placeholder={t("vistas.form.floorMinPlaceholder")}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{t("vistas.form.floorMax")}</label>
                    <input
                      type="number"
                      value={form.piso_max}
                      onChange={(e) => updateForm("piso_max", e.target.value)}
                      placeholder={t("vistas.form.floorMaxPlaceholder")}
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Torre dropdown (if multi-torre) */}
                {isMultiTorre && (
                  <div>
                    <label className={labelClass}>{t("vistas.form.tower")}</label>
                    <NodDoDropdown
                      variant="dashboard"
                      size="md"
                      value={form.torre_id}
                      onChange={(val) => updateForm("torre_id", val)}
                      options={[
                        { value: "", label: t("vistas.form.allTowers") },
                        ...torres.map((t) => ({
                          value: t.id,
                          label: t.nombre,
                        })),
                      ]}
                    />
                  </div>
                )}

                {/* Tipologia multi-select */}
                <div>
                  <label className={labelClass}>
                    {t("vistas.form.tipologias")}{" "}
                    <span className="text-[var(--text-muted)] font-normal">
                      {t("vistas.form.tipologiasHint")}
                    </span>
                  </label>
                  {filteredTipologias.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {filteredTipologias.map((tipo) => {
                        const isSelected = form.tipologia_ids.includes(tipo.id);
                        return (
                          <button
                            key={tipo.id}
                            type="button"
                            onClick={() => toggleTipologia(tipo.id)}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2.5 rounded-[0.625rem] text-left text-xs transition-all border",
                              isSelected
                                ? "bg-[rgba(184,151,58,0.12)] border-[rgba(184,151,58,0.35)] text-[rgba(184,151,58,1)]"
                                : "bg-[var(--surface-2)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-default)]"
                            )}
                          >
                            <div
                              className={cn(
                                "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all",
                                isSelected
                                  ? "bg-[rgba(184,151,58,1)] border-[rgba(184,151,58,1)]"
                                  : "border-[var(--border-default)] bg-transparent"
                              )}
                            >
                              {isSelected && (
                                <svg
                                  width="10"
                                  height="8"
                                  viewBox="0 0 10 8"
                                  fill="none"
                                >
                                  <path
                                    d="M1 4L3.5 6.5L9 1"
                                    stroke="#141414"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </div>
                            <span className="truncate">{tipo.nombre}</span>
                            {tipo.habitaciones !== null && (
                              <span className="text-[9px] text-[var(--text-muted)] ml-auto shrink-0">
                                {tipo.habitaciones} hab
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--text-muted)] py-3">
                      {t("vistas.form.noTipologias")}
                    </p>
                  )}
                  {form.tipologia_ids.length > 0 && (
                    <p className="text-[10px] text-[rgba(184,151,58,1)] mt-2">
                      {form.tipologia_ids.length} tipologia
                      {form.tipologia_ids.length > 1 ? "s" : ""} seleccionada
                      {form.tipologia_ids.length > 1 ? "s" : ""}
                    </p>
                  )}
                </div>

                {/* Image uploader */}
                <div>
                  <label className={labelClass}>
                    {t("vistas.form.image")} <span className="text-red-400">*</span>
                    <InfoTooltip content={tTooltips("vistas.imagen.short")} variant="dashboard" />
                  </label>
                  <FileUploader
                    currentUrl={form.imagen_url || null}
                    onUpload={(url) => updateForm("imagen_url", url)}
                    folder={`proyectos/${projectId}/vistas`}
                    label={t("vistas.form.uploadImage")}
                    aspect="video"
                  />
                </div>

                {/* Descripcion */}
                <div>
                  <label className={labelClass}>{t("vistas.form.description")}</label>
                  <textarea
                    value={form.descripcion}
                    onChange={(e) => updateForm("descripcion", e.target.value)}
                    placeholder={t("vistas.form.descriptionPlaceholder")}
                    rows={3}
                    className={inputClass + " resize-none"}
                  />
                </div>
              </div>

              {/* Panel footer */}
              <div className="flex items-center gap-2 px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--surface-0)]">
                <button
                  onClick={handleSave}
                  disabled={saving || !form.nombre.trim() || !form.imagen_url}
                  className={btnPrimary}
                >
                  {saving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  {saving
                    ? t("vistas.form.saving")
                    : editingVistaId
                      ? t("vistas.form.saveChanges")
                      : t("vistas.form.createVista")}
                </button>
                <button onClick={closePanel} className={btnSecondary}>
                  {t("vistas.form.cancel")}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
