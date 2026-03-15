"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useEditorProject } from "@/hooks/useEditorProject";
import {
  inputClass,
  labelClass,
  btnPrimary,
  btnSecondary,
} from "@/components/dashboard/editor-styles";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { FileUploader } from "@/components/dashboard/FileUploader";
import { HotspotEditor } from "@/components/dashboard/HotspotEditor";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Save,
  Loader2,
  Trash2,
  X,
  MousePointerClick,
  Layers,
  Building2,
  Copy,
  Maximize,
  Palmtree,
  LayoutGrid,
  BedDouble,
  Bath,
  Car,
  Archive,
  DollarSign,
} from "lucide-react";
import { useToast } from "@/components/dashboard/Toast";
import { useConfirm } from "@/components/dashboard/ConfirmModal";
import { useTranslation } from "@/i18n";
import type { Tipologia, TipologiaHotspot } from "@/types";
import { AITextImprover } from "@/components/dashboard/AITextImprover";
import { tipologiaSchema } from "@/lib/validation/schemas";
import { InlineError } from "@/components/ui/ErrorBoundary";
import { ZodError } from "zod";

/* ─── Form types ─── */

interface TipoForm {
  nombre: string;
  descripcion: string;
  area_m2: string;
  habitaciones: string;
  banos: string;
  precio_desde: string;
  plano_url: string;
  renders: string[];
  caracteristicas: string[];
  parqueaderos: string;
  depositos: string;
  area_balcon: string;
  hotspots: TipologiaHotspot[];
  ubicacion_plano_url: string;
  torre_ids: string[];
}

const emptyTipologia: TipoForm = {
  nombre: "",
  descripcion: "",
  area_m2: "",
  habitaciones: "",
  banos: "",
  precio_desde: "",
  plano_url: "",
  renders: [],
  caracteristicas: [],
  parqueaderos: "",
  depositos: "",
  area_balcon: "",
  hotspots: [],
  ubicacion_plano_url: "",
  torre_ids: [],
};

function tipologiaToForm(t: Tipologia): TipoForm {
  return {
    nombre: t.nombre,
    descripcion: t.descripcion || "",
    area_m2: t.area_m2 != null ? String(t.area_m2) : "",
    habitaciones: t.habitaciones != null ? String(t.habitaciones) : "",
    banos: t.banos != null ? String(t.banos) : "",
    precio_desde: t.precio_desde != null ? String(t.precio_desde) : "",
    plano_url: t.plano_url || "",
    renders: t.renders || [],
    caracteristicas: t.caracteristicas || [],
    parqueaderos: t.parqueaderos != null ? String(t.parqueaderos) : "",
    depositos: t.depositos != null ? String(t.depositos) : "",
    area_balcon: t.area_balcon != null ? String(t.area_balcon) : "",
    hotspots: t.hotspots || [],
    ubicacion_plano_url: t.ubicacion_plano_url || "",
    torre_ids: t.torre_ids || [],
  };
}

function parseOptionalNumber(val: string): number | null {
  if (!val.trim()) return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

/* ─── Tabs ─── */

type TipoTab = "general" | "especificaciones" | "plano" | "hotspots";

/* ─── Page ─── */

export default function TipologiasPage() {
  const { project, refresh, projectId } = useEditorProject();
  const toast = useToast();
  const { confirm } = useConfirm();
  const { t } = useTranslation("editor");

  const TIPO_TABS: { id: TipoTab; label: string }[] = [
    { id: "general", label: t("tipologias.tabs.general") },
    { id: "especificaciones", label: t("tipologias.tabs.specs") },
    { id: "plano", label: t("tipologias.tabs.floorPlan") },
    { id: "hotspots", label: t("tipologias.tabs.hotspots") },
  ];

  const tipologias = useMemo(() => project.tipologias || [], [project.tipologias]);
  const unidades = useMemo(() => project.unidades || [], [project.unidades]);
  const torres = useMemo(() => project.torres || [], [project.torres]);
  const isMultiTorre = torres.length > 1;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<TipoForm>({ ...emptyTipologia });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [caracInput, setCaracInput] = useState("");
  const [activeTab, setActiveTab] = useState<TipoTab>("general");
  const [activeTorreId, setActiveTorreId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const filteredTipologias = useMemo(() => {
    if (!isMultiTorre || activeTorreId === null) return tipologias;
    if (activeTorreId === "__none__") return tipologias.filter(t => !t.torre_ids || t.torre_ids.length === 0);
    return tipologias.filter(t => t.torre_ids?.includes(activeTorreId));
  }, [tipologias, isMultiTorre, activeTorreId]);

  /* Auto-select first tipologia on mount or when list changes */
  useEffect(() => {
    if (tipologias.length > 0 && !selectedId && !isCreating) {
      selectTipologia(tipologias[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipologias.length]);

  /* Reset selection when torre filter changes */
  useEffect(() => {
    setIsCreating(false);
    if (filteredTipologias.length > 0) {
      selectTipologia(filteredTipologias[0]);
    } else {
      setSelectedId(null);
      setForm({ ...emptyTipologia });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTorreId]);

  const selectTipologia = useCallback((t: Tipologia) => {
    setSelectedId(t.id);
    setIsCreating(false);
    setForm(tipologiaToForm(t));
    setCaracInput("");
    setActiveTab("general");
  }, []);

  const startCreating = () => {
    setSelectedId(null);
    setIsCreating(true);
    setForm({ ...emptyTipologia, torre_ids: activeTorreId && activeTorreId !== "__none__" ? [activeTorreId] : [] });
    setCaracInput("");
    setActiveTab("general");
  };

  const updateForm = (field: keyof TipoForm, value: string | string[] | TipologiaHotspot[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCaracKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = caracInput.trim();
      if (val && !form.caracteristicas.includes(val)) {
        updateForm("caracteristicas", [...form.caracteristicas, val]);
      }
      setCaracInput("");
    }
  };

  const removeCaracteristica = (idx: number) => {
    updateForm("caracteristicas", form.caracteristicas.filter((_, i) => i !== idx));
  };

  /* Compute cheapest available unit price for selected tipologia */
  const computedPrecioDesde = useMemo(() => {
    if (!selectedId) return "";
    const tipoUnits = unidades.filter(
      (u) => u.tipologia_id === selectedId && u.estado === "disponible" && u.precio != null
    );
    if (tipoUnits.length === 0) return "";
    const min = Math.min(...tipoUnits.map((u) => u.precio!));
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(min);
  }, [selectedId, unidades]);

  const buildPayload = () => ({
    nombre: form.nombre,
    descripcion: form.descripcion || null,
    area_m2: parseOptionalNumber(form.area_m2),
    habitaciones: parseOptionalNumber(form.habitaciones),
    banos: parseOptionalNumber(form.banos),
    precio_desde: parseOptionalNumber(form.precio_desde),
    plano_url: form.plano_url || null,
    renders: form.renders.filter((r) => r),
    caracteristicas: form.caracteristicas,
    parqueaderos: parseOptionalNumber(form.parqueaderos),
    depositos: parseOptionalNumber(form.depositos),
    area_balcon: parseOptionalNumber(form.area_balcon),
    hotspots: form.hotspots,
    ubicacion_plano_url: form.ubicacion_plano_url || null,
    torre_ids: isMultiTorre ? form.torre_ids : [],
  });

  const handleSave = async () => {
    if (!form.nombre.trim()) return;
    setSaving(true);
    setValidationError(null);

    try {
      const payload = buildPayload();

      // Validate tipologia data
      tipologiaSchema.parse(payload);

      if (selectedId && !isCreating) {
        const res = await fetch(`/api/tipologias/${selectedId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          toast.error("Error al guardar tipología");
          return;
        }
        await refresh();
      } else {
        const res = await fetch("/api/tipologias", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ proyecto_id: projectId, ...payload }),
        });
        if (!res.ok) {
          toast.error("Error al crear tipología");
          return;
        }
        const created = await res.json();
        await refresh();
        // Select the newly created tipologia
        if (created?.id) {
          setSelectedId(created.id);
          setIsCreating(false);
        }
      }
    } catch (err) {
      if (err instanceof ZodError) {
        const zodError = err as ZodError;
        if (zodError.issues?.length > 0) {
          setValidationError(zodError.issues[0].message);
          toast.error(zodError.issues[0].message);
        }
      } else {
        toast.error("Error de conexión");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm({ title: "Eliminar tipología", message: "¿Seguro que deseas eliminar esta tipología?" }))) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/tipologias/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Error al eliminar tipología");
        return;
      }
      await refresh();
      // Select next tipologia
      if (selectedId === id) {
        const remaining = filteredTipologias.filter((t) => t.id !== id);
        if (remaining.length > 0) {
          selectTipologia(remaining[0]);
        } else {
          setSelectedId(null);
          setForm({ ...emptyTipologia });
        }
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicate = async (tip: Tipologia) => {
    if (!(await confirm({ title: t("tipologias.duplicateTitle"), message: t("tipologias.duplicateConfirm") }))) return;
    setDuplicatingId(tip.id);
    try {
      const payload = {
        proyecto_id: projectId,
        nombre: `${tip.nombre} (copia)`,
        descripcion: tip.descripcion || null,
        area_m2: tip.area_m2,
        habitaciones: tip.habitaciones,
        banos: tip.banos,
        precio_desde: tip.precio_desde,
        plano_url: tip.plano_url || null,
        renders: tip.renders || [],
        caracteristicas: tip.caracteristicas || [],
        parqueaderos: tip.parqueaderos,
        depositos: tip.depositos,
        area_balcon: tip.area_balcon,
        hotspots: tip.hotspots || [],
        ubicacion_plano_url: tip.ubicacion_plano_url || null,
        torre_ids: tip.torre_ids || [],
      };
      const res = await fetch("/api/tipologias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const created = await res.json();
        await refresh();
        if (created?.id) {
          setSelectedId(created.id);
          setIsCreating(false);
          setForm(tipologiaToForm(created));
        }
        toast.success(t("tipologias.duplicated"));
      } else {
        toast.error(t("tipologias.duplicateError"));
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setDuplicatingId(null);
    }
  };

  const hasEditor = selectedId || isCreating;

  /* ─── Empty state ─── */
  if (tipologias.length === 0 && !isCreating) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <DashboardEmptyState
          variant="tipologias"
          title={t("tipologias.noTypes")}
          description={t("tipologias.createFirst")}
        >
          <button onClick={startCreating} className={btnPrimary}>
            <Plus size={14} />
            {t("tipologias.createFirstButton")}
          </button>
        </DashboardEmptyState>
      </motion.div>
    );
  }

  /* ─── 3-Panel Layout ─── */
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={isMultiTorre ? "h-[calc(100vh-96px)] min-h-[500px] flex flex-col" : "h-[calc(100vh-96px)] min-h-[500px]"}
    >
      {/* ═══ TORRE TABS ═══ */}
      {isMultiTorre && (
        <div className="flex items-center gap-1 p-1 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] mb-4">
          <button
            onClick={() => setActiveTorreId(null)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              activeTorreId === null
                ? "bg-[var(--surface-3)] text-white shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
            )}
          >
            {t("tipologias.all")}
            <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-[var(--surface-3)] text-[var(--text-muted)]">
              {tipologias.length}
            </span>
          </button>
          {torres.map((t) => {
            const count = tipologias.filter(tip => tip.torre_ids?.includes(t.id)).length;
            return (
              <button key={t.id} onClick={() => setActiveTorreId(t.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  activeTorreId === t.id
                    ? "bg-[var(--surface-3)] text-white shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                )}
              >
                <Building2 size={13} />
                {t.nombre}
                {count > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-[var(--surface-3)] text-[var(--text-muted)]">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
          {tipologias.some(t => !t.torre_ids || t.torre_ids.length === 0) && (
            <button onClick={() => setActiveTorreId("__none__")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                activeTorreId === "__none__"
                  ? "bg-[var(--surface-3)] text-white shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
              )}
            >
              {t("tipologias.noTower")}
              <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-[var(--surface-3)] text-[var(--text-muted)]">
                {tipologias.filter(t => !t.torre_ids || t.torre_ids.length === 0).length}
              </span>
            </button>
          )}
        </div>
      )}

      <div className={cn("rounded-xl border border-[var(--border-subtle)] overflow-hidden flex", isMultiTorre ? "flex-1 min-h-0" : "h-full")}>
        {/* ═══ LEFT PANEL: Tipologias List ═══ */}
        <div className="w-[220px] shrink-0 bg-[var(--surface-1)] border-r border-[var(--border-subtle)] flex flex-col">
          {/* List header */}
          <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-[var(--site-primary)]" />
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  {t("tipologias.listTitle")}
                </span>
              </div>
              <span className="text-[10px] text-[var(--text-muted)]">
                {filteredTipologias.length}
              </span>
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto py-1">
            {filteredTipologias.map((t) => (
              <div
                key={t.id}
                onClick={() => selectTipologia(t)}
                className={cn(
                  "w-full text-left px-3 py-2.5 transition-all group relative cursor-pointer",
                  selectedId === t.id && !isCreating
                    ? "bg-[var(--surface-3)] border-l-2 border-l-[var(--site-primary)]"
                    : "border-l-2 border-l-transparent hover:bg-[var(--surface-2)]"
                )}
              >
                <p
                  className={cn(
                    "text-[13px] font-medium truncate",
                    selectedId === t.id && !isCreating
                      ? "text-white"
                      : "text-[var(--text-secondary)]"
                  )}
                >
                  {t.nombre}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[var(--text-muted)]">
                  {t.area_m2 != null && <span>{t.area_m2}m²</span>}
                  {t.habitaciones != null && <span>{t.habitaciones} hab</span>}
                  {t.banos != null && <span>{t.banos} baños</span>}
                </div>

                {/* Action buttons — visible on hover */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicate(t);
                    }}
                    disabled={duplicatingId === t.id}
                    title="Duplicar"
                  >
                    {duplicatingId === t.id ? (
                      <Loader2 size={12} className="animate-spin text-[var(--text-muted)]" />
                    ) : (
                      <Copy size={12} className="text-[var(--text-muted)] hover:text-[var(--site-primary)]" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(t.id);
                    }}
                    disabled={deletingId === t.id}
                  >
                    {deletingId === t.id ? (
                      <Loader2 size={12} className="animate-spin text-[var(--text-muted)]" />
                    ) : (
                      <Trash2 size={12} className="text-[var(--text-muted)] hover:text-red-400" />
                    )}
                  </button>
                </div>
              </div>
            ))}

            {/* "Creating new" item */}
            {isCreating && (
              <div className="px-3 py-2.5 bg-[var(--surface-3)] border-l-2 border-l-[var(--site-primary)]">
                <p className="text-[13px] font-medium text-[var(--site-primary)]">
                  + {t("tipologias.newType")}
                </p>
              </div>
            )}
          </div>

          {/* Add button */}
          <div className="p-3 border-t border-[var(--border-subtle)]">
            <button
              onClick={startCreating}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] rounded-lg transition-all border border-[var(--border-subtle)]"
            >
              <Plus size={12} />
              {t("tipologias.newType")}
            </button>
          </div>
        </div>

        {/* ═══ CENTER PANEL: Tab Content ═══ */}
        <div className="flex-1 flex flex-col min-w-0 bg-[var(--surface-0)]">
          {hasEditor ? (
            <>
              {/* Header + Horizontal Tabs */}
              <div className="shrink-0 border-b border-[var(--border-subtle)]">
                {/* Title row */}
                <div className="px-6 pt-3 pb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-[var(--text-secondary)] truncate">
                    {isCreating ? t("tipologias.newType") : form.nombre || "—"}
                  </h3>
                  {isCreating && (
                    <button
                      onClick={() => {
                        setIsCreating(false);
                        if (filteredTipologias.length > 0) selectTipologia(filteredTipologias[0]);
                      }}
                      className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Tab bar */}
                <div className="px-6 flex gap-0.5">
                  {TIPO_TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const hasPlano = !!form.plano_url;
                    const hotspotCount = form.hotspots.length;

                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          "px-4 py-2 text-xs font-medium rounded-t-lg transition-all flex items-center gap-2",
                          isActive
                            ? "bg-[var(--site-primary)] text-black"
                            : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                        )}
                      >
                        {tab.label}
                        {tab.id === "hotspots" && hotspotCount > 0 && (
                          <span
                            className={cn(
                              "text-[9px] px-1.5 py-px rounded-full leading-tight",
                              isActive
                                ? "bg-black/20 text-black"
                                : "bg-[rgba(var(--site-primary-rgb),0.2)] text-[var(--site-primary)]"
                            )}
                          >
                            {hotspotCount}
                          </span>
                        )}
                        {tab.id === "plano" && hasPlano && (
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              isActive ? "bg-black/40" : "bg-[var(--site-primary)]"
                            )}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab content — scrollable (reduced padding for hotspots) */}
              <div className={cn(
                "flex-1 min-h-0",
                activeTab === "hotspots" ? "px-3 py-3" : "px-6 py-5 overflow-y-auto"
              )}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.15 }}
                    className={activeTab === "hotspots" ? "h-full" : "space-y-5"}
                  >
                    {/* ── TAB: General ── */}
                    {activeTab === "general" && (
                      <>
                        <div>
                          <label className={labelClass}>{t("tipologias.nameRequired")}</label>
                          <input
                            type="text"
                            value={form.nombre}
                            onChange={(e) => updateForm("nombre", e.target.value)}
                            placeholder={t("tipologias.namePlaceholder")}
                            className={inputClass}
                          />
                        </div>
                        {isMultiTorre && (
                          <div>
                            <label className={labelClass}>Torres</label>
                            <div className="flex flex-wrap gap-2">
                              {torres.map((torre) => {
                                const checked = form.torre_ids.includes(torre.id);
                                return (
                                  <label
                                    key={torre.id}
                                    className={cn(
                                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-all border",
                                      checked
                                        ? "bg-[rgba(var(--site-primary-rgb),0.15)] border-[rgba(var(--site-primary-rgb),0.3)] text-[var(--site-primary)]"
                                        : "bg-[var(--surface-2)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                                    )}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => {
                                        const next = checked
                                          ? form.torre_ids.filter((id) => id !== torre.id)
                                          : [...form.torre_ids, torre.id];
                                        updateForm("torre_ids", next);
                                      }}
                                      className="sr-only"
                                    />
                                    <Building2 size={12} />
                                    {torre.nombre}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        <div>
                          <AITextImprover
                            value={form.descripcion}
                            onChange={(newValue) => updateForm("descripcion", newValue)}
                            rows={3}
                            placeholder={t("tipologias.descriptionPlaceholder")}
                            label={t("tipologias.description")}
                            maxLength={5000}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>{t("tipologias.features")}</label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {form.caracteristicas.map((c, i) => (
                              <span
                                key={i}
                                className="flex items-center gap-1 px-3 py-1 bg-[rgba(var(--site-primary-rgb),0.15)] text-[var(--site-primary)] text-xs rounded-full border border-[rgba(var(--site-primary-rgb),0.2)]"
                              >
                                {c}
                                <button
                                  onClick={() => removeCaracteristica(i)}
                                  className="hover:text-white transition-colors"
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            ))}
                          </div>
                          <input
                            type="text"
                            value={caracInput}
                            onChange={(e) => setCaracInput(e.target.value)}
                            onKeyDown={handleCaracKeyDown}
                            placeholder={t("tipologias.featuresPlaceholder")}
                            className={inputClass}
                          />
                        </div>
                      </>
                    )}

                    {/* ── TAB: Especificaciones ── */}
                    {activeTab === "especificaciones" && (
                      <div className="space-y-5">
                        {/* ── Áreas ── */}
                        <div>
                          <p className="font-ui text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2 font-bold">
                            {t("tipologias.specsAreas")}
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div className="flex items-center gap-3 p-3 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all">
                              <div className="w-9 h-9 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                                <Maximize size={16} className="text-[var(--text-tertiary)]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-ui text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold mb-0.5">{t("tipologias.internalArea")}</p>
                                <input type="number" value={form.area_m2} onChange={(e) => updateForm("area_m2", e.target.value)} placeholder="0" className="w-full bg-transparent text-sm text-white placeholder:text-[var(--text-muted)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                              </div>
                              {form.area_m2 && <span className="text-[11px] text-[var(--text-muted)] shrink-0">m²</span>}
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all">
                              <div className="w-9 h-9 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                                <Palmtree size={16} className="text-[var(--text-tertiary)]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-ui text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold mb-0.5">{t("tipologias.balconyArea")}</p>
                                <input type="number" value={form.area_balcon} onChange={(e) => updateForm("area_balcon", e.target.value)} placeholder="0" className="w-full bg-transparent text-sm text-white placeholder:text-[var(--text-muted)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                              </div>
                              {form.area_balcon && <span className="text-[11px] text-[var(--text-muted)] shrink-0">m²</span>}
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-[var(--surface-1)] rounded-xl border border-[rgba(var(--site-primary-rgb),0.15)] transition-all">
                              <div className="w-9 h-9 rounded-lg bg-[rgba(var(--site-primary-rgb),0.12)] flex items-center justify-center shrink-0">
                                <LayoutGrid size={16} className="text-[var(--site-primary)]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-ui text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold mb-0.5">{t("tipologias.totalArea")}</p>
                                <p className="text-sm font-medium text-[var(--site-primary)]">
                                  {form.area_m2 || form.area_balcon
                                    ? `${((parseFloat(form.area_m2) || 0) + (parseFloat(form.area_balcon) || 0)).toFixed(1)} m²`
                                    : "—"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* ── Espacios ── */}
                        <div>
                          <p className="font-ui text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2 font-bold">
                            {t("tipologias.specsSpaces")}
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div className="flex items-center gap-3 p-3 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all">
                              <div className="w-9 h-9 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                                <BedDouble size={16} className="text-[var(--text-tertiary)]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-ui text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold mb-0.5">{t("tipologias.bedrooms")}</p>
                                <input type="number" value={form.habitaciones} onChange={(e) => updateForm("habitaciones", e.target.value)} placeholder="0" className="w-full bg-transparent text-sm text-white placeholder:text-[var(--text-muted)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all">
                              <div className="w-9 h-9 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                                <Bath size={16} className="text-[var(--text-tertiary)]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-ui text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold mb-0.5">{t("tipologias.bathrooms")}</p>
                                <input type="number" value={form.banos} onChange={(e) => updateForm("banos", e.target.value)} placeholder="0" className="w-full bg-transparent text-sm text-white placeholder:text-[var(--text-muted)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all">
                              <div className="w-9 h-9 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                                <Car size={16} className="text-[var(--text-tertiary)]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-ui text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold mb-0.5">{t("tipologias.parking")}</p>
                                <input type="number" value={form.parqueaderos} onChange={(e) => updateForm("parqueaderos", e.target.value)} placeholder="0" className="w-full bg-transparent text-sm text-white placeholder:text-[var(--text-muted)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all">
                              <div className="w-9 h-9 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                                <Archive size={16} className="text-[var(--text-tertiary)]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-ui text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold mb-0.5">Depósitos</p>
                                <input type="number" value={form.depositos} onChange={(e) => updateForm("depositos", e.target.value)} placeholder="0" className="w-full bg-transparent text-sm text-white placeholder:text-[var(--text-muted)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* ── Precio ── */}
                        <div>
                          <p className="font-ui text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2 font-bold">
                            {t("tipologias.specsPricing")}
                          </p>
                          <div className="max-w-xs">
                            <div className="flex items-center gap-3 p-3 bg-[var(--surface-1)] rounded-xl border border-[rgba(var(--site-primary-rgb),0.15)] transition-all">
                              <div className="w-9 h-9 rounded-lg bg-[rgba(var(--site-primary-rgb),0.12)] flex items-center justify-center shrink-0">
                                <DollarSign size={16} className="text-[var(--site-primary)]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-ui text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold mb-0.5">{t("tipologias.priceFromComputed")}</p>
                                <p className="text-sm font-medium text-[var(--site-primary)]">
                                  {computedPrecioDesde || "—"}
                                </p>
                              </div>
                            </div>
                          </div>
                          <p className="text-[10px] text-[var(--text-muted)] mt-2 leading-relaxed">
                            {computedPrecioDesde
                              ? t("tipologias.priceComputedHint")
                              : t("tipologias.noUnitsHint")}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ── TAB: Plano ── */}
                    {activeTab === "plano" && (
                      <div className="space-y-6">
                        <div>
                          <label className={labelClass}>{t("tipologias.floorPlanImage")}</label>
                          <div className="max-w-[280px]">
                            <FileUploader
                              currentUrl={form.plano_url || null}
                              onUpload={(url) => updateForm("plano_url", url)}
                              folder={`proyectos/${projectId}/tipologias`}
                              label={t("tipologias.uploadFloorPlan")}
                              aspect="square"
                            />
                          </div>
                          {form.plano_url && (
                            <p className="text-[10px] text-[var(--text-muted)] mt-3">
                              {t("tipologias.floorPlanHotspotsHint")}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className={labelClass}>{t("tipologias.locationInProject")}</label>
                          <p className="text-[10px] text-[var(--text-muted)] mb-2">{t("tipologias.locationDescription")}</p>
                          <div className="max-w-[280px]">
                            <FileUploader
                              currentUrl={form.ubicacion_plano_url || null}
                              onUpload={(url) => setForm({ ...form, ubicacion_plano_url: url })}
                              folder={`proyectos/${projectId}/tipologias`}
                              label={t("tipologias.uploadLocation")}
                              aspect="square"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── TAB: Hotspots ── */}
                    {activeTab === "hotspots" && (
                      <div className="h-full">
                        {form.plano_url ? (
                          <HotspotEditor
                            imageUrl={form.plano_url}
                            hotspots={form.hotspots}
                            onChange={(hotspots) => updateForm("hotspots", hotspots)}
                            uploadFolder={`proyectos/${projectId}/tipologias`}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center py-16 text-center">
                            <MousePointerClick size={24} className="text-[var(--text-muted)] mb-3" />
                            <p className="text-sm text-[var(--text-tertiary)] mb-1">
                              {t("tipologias.noFloorPlan")}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">
                              {t("tipologias.uploadFloorPlanFirst")}
                            </p>
                            <button
                              onClick={() => setActiveTab("plano")}
                              className={btnSecondary + " mt-4"}
                            >
                              {t("tipologias.tabs.floorPlan")}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Save bar */}
              <div className="px-6 py-3 border-t border-[var(--border-subtle)] shrink-0 space-y-3">
                {validationError && (
                  <InlineError
                    message={validationError}
                    onRetry={() => setValidationError(null)}
                    variant="compact"
                  />
                )}
                <div className="flex items-center gap-3">
                  <button
                  onClick={handleSave}
                  disabled={saving || !form.nombre.trim()}
                  className={btnPrimary}
                >
                  {saving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  {saving ? t("general.saving") : isCreating ? t("galeria.create") : t("tipologias.save")}
                </button>
                {isCreating && (
                  <button
                    onClick={() => {
                      setIsCreating(false);
                      if (filteredTipologias.length > 0) selectTipologia(filteredTipologias[0]);
                    }}
                    className={btnSecondary}
                  >
                    {t("inventario.cancel")}
                  </button>
                )}
                </div>
              </div>
            </>
          ) : (
            /* No selection placeholder */
            <div className="flex-1 flex items-center justify-center text-xs text-[var(--text-muted)]">
              {t("tipologias.selectOrCreate")}
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
}
