"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { useEditorProject } from "@/hooks/useEditorProject";
import {
  inputClass,
  btnPrimary,
  btnSecondary,
} from "@/components/dashboard/editor-styles";
import { fontSize, gap, letterSpacing, radius, iconSize, lineHeight } from "@/lib/design-tokens";
import { Label } from "@/components/ui";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { FileUploader } from "@/components/dashboard/FileUploader";
import { HotspotEditor } from "@/components/dashboard/HotspotEditor";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
import {
  Plus,
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
  Home,
  MapPin,
  Ruler,
  LandPlot,
  ClipboardCopy,
  ChevronDown,
  FileText,
  Map,
  Video,
  View,
  GripVertical,
  Waves,
  UtensilsCrossed, Sun, TreePine, DoorClosed, BookOpen,
  Flame, MoveVertical, CloudSun, Store, Settings, RotateCcw, Package,
  type LucideIcon,
} from "lucide-react";
import { extractTourUrl } from "@/lib/tour-utils";
import { useToast } from "@/components/dashboard/Toast";
import { useConfirm } from "@/components/dashboard/ConfirmModal";
import { useTranslation } from "@/i18n";
import type { Tipologia, TipologiaHotspot, TipologiaPiso, TipoTipologia, Currency, TipologiaFieldsConfig } from "@/types";
import { resolvePisos } from "@/lib/piso-utils";
import { CurrencyInput } from "@/components/dashboard/CurrencyInput";
import { PriceAuditBadge } from "@/components/dashboard/PriceAuditBadge";
import { deriveTipoTipologia, getInventoryColumns, getHybridInventoryColumns } from "@/lib/inventory-columns";
import { getTipologiaFields, TIPOLOGIA_FIELD_KEYS } from "@/lib/tipologia-fields";
import { AITextImprover } from "@/components/dashboard/AITextImprover";
import { tipologiaSchema } from "@/lib/validation/schemas";
import { InlineError } from "@/components/ui/ErrorBoundary";
import { ZodError } from "zod";
import { useAutoSave } from "@/hooks/useAutoSave";
import { AutoSaveIndicator } from "@/components/dashboard/AutoSaveIndicator";
import { useQueryClient } from "@tanstack/react-query";
import { projectKeys } from "@/hooks/useProjectsQuery";
import { useBackgroundSave } from "@/hooks/useBackgroundSave";
import { useAuthRole } from "@/hooks/useAuthContext";
import type { ProyectoCompleto } from "@/types";

/* ─── Form types ─── */

interface TipoForm {
  nombre: string;
  descripcion: string;
  area_m2: string;
  area_construida: string;
  area_privada: string;
  area_lote: string;
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
  pisos: TipologiaPiso[];
  ubicacion_plano_url: string;
  torre_ids: string[];
  tipo_tipologia: TipoTipologia | "";
  video_id: string | null;
  tour_360_url: string;
  tiene_jacuzzi: boolean;
  tiene_piscina: boolean;
  tiene_bbq: boolean;
  tiene_terraza: boolean;
  tiene_jardin: boolean;
  tiene_cuarto_servicio: boolean;
  tiene_estudio: boolean;
  tiene_chimenea: boolean;
  tiene_doble_altura: boolean;
  tiene_rooftop: boolean;
}

/* ─── Extras toggle config (shared between config page and tipologias editor) ─── */

const TIPO_EXTRAS = [
  { field: "tiene_jacuzzi" as const, projectFlag: "habilitar_extra_jacuzzi", icon: Bath, labelKey: "tipologias.jacuzzi" },
  { field: "tiene_piscina" as const, projectFlag: "habilitar_extra_piscina", icon: Waves, labelKey: "tipologias.piscina" },
  { field: "tiene_bbq" as const, projectFlag: "habilitar_extra_bbq", icon: UtensilsCrossed, labelKey: "tipologias.bbq" },
  { field: "tiene_terraza" as const, projectFlag: "habilitar_extra_terraza", icon: Sun, labelKey: "tipologias.terraza" },
  { field: "tiene_jardin" as const, projectFlag: "habilitar_extra_jardin", icon: TreePine, labelKey: "tipologias.jardin" },
  { field: "tiene_cuarto_servicio" as const, projectFlag: "habilitar_extra_cuarto_servicio", icon: DoorClosed, labelKey: "tipologias.cuartoServicio" },
  { field: "tiene_estudio" as const, projectFlag: "habilitar_extra_estudio", icon: BookOpen, labelKey: "tipologias.estudio" },
  { field: "tiene_chimenea" as const, projectFlag: "habilitar_extra_chimenea", icon: Flame, labelKey: "tipologias.chimenea" },
  { field: "tiene_doble_altura" as const, projectFlag: "habilitar_extra_doble_altura", icon: MoveVertical, labelKey: "tipologias.dobleAltura" },
  { field: "tiene_rooftop" as const, projectFlag: "habilitar_extra_rooftop", icon: CloudSun, labelKey: "tipologias.rooftop" },
];

/* ─── Field config constants for config modal ─── */

const FIELD_ICON_MAP: Record<string, LucideIcon> = {
  Maximize, Ruler, Home, LandPlot, Palmtree,
  BedDouble, Bath, Car, Package, DollarSign,
};

const FIELD_CATEGORIES: { id: string; label: string; icon: LucideIcon; fields: (keyof TipologiaFieldsConfig)[] }[] = [
  { id: "dimensions", label: "Dimensiones", icon: Maximize, fields: ["area_m2", "area_construida", "area_privada", "area_lote", "area_balcon"] },
  { id: "spaces", label: "Espacios", icon: BedDouble, fields: ["habitaciones", "banos", "parqueaderos", "depositos"] },
  { id: "financial", label: "Financiero", icon: DollarSign, fields: ["precio"] },
];

const emptyTipologia: TipoForm = {
  nombre: "",
  descripcion: "",
  area_m2: "",
  area_construida: "",
  area_privada: "",
  area_lote: "",
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
  pisos: [],
  ubicacion_plano_url: "",
  torre_ids: [],
  tipo_tipologia: "",
  video_id: null,
  tour_360_url: "",
  tiene_jacuzzi: false,
  tiene_piscina: false,
  tiene_bbq: false,
  tiene_terraza: false,
  tiene_jardin: false,
  tiene_cuarto_servicio: false,
  tiene_estudio: false,
  tiene_chimenea: false,
  tiene_doble_altura: false,
  tiene_rooftop: false,
};

function tipologiaToForm(t: Tipologia): TipoForm {
  const resolved = resolvePisos(t);
  const pisos = resolved.map((p) => ({
    ...p,
    id: p.id === "legacy-piso-0" ? crypto.randomUUID() : p.id,
  }));
  return {
    nombre: t.nombre,
    descripcion: t.descripcion || "",
    area_m2: t.area_m2 != null ? String(t.area_m2) : "",
    area_construida: t.area_construida != null ? String(t.area_construida) : "",
    area_privada: t.area_privada != null ? String(t.area_privada) : "",
    area_lote: t.area_lote != null ? String(t.area_lote) : "",
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
    pisos,
    ubicacion_plano_url: t.ubicacion_plano_url || "",
    torre_ids: t.torre_ids || [],
    tipo_tipologia: t.tipo_tipologia || "",
    video_id: t.video_id ?? null,
    tour_360_url: t.tour_360_url || "",
    tiene_jacuzzi: t.tiene_jacuzzi ?? false,
    tiene_piscina: t.tiene_piscina ?? false,
    tiene_bbq: t.tiene_bbq ?? false,
    tiene_terraza: t.tiene_terraza ?? false,
    tiene_jardin: t.tiene_jardin ?? false,
    tiene_cuarto_servicio: t.tiene_cuarto_servicio ?? false,
    tiene_estudio: t.tiene_estudio ?? false,
    tiene_chimenea: t.tiene_chimenea ?? false,
    tiene_doble_altura: t.tiene_doble_altura ?? false,
    tiene_rooftop: t.tiene_rooftop ?? false,
  };
}

function parseOptionalNumber(val: string): number | null {
  if (!val.trim()) return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

/* ─── Copy hotspots dropdown ─── */

function CopyHotspotsDropdown({
  tipologias,
  currentId,
  currentHotspotCount,
  onCopy,
}: {
  tipologias: Tipologia[];
  currentId: string | null;
  currentHotspotCount: number;
  onCopy: (hotspots: TipologiaHotspot[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const { confirm } = useConfirm();
  const { t } = useTranslation("editor");
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const sources = tipologias.filter(
    (t) => t.id !== currentId && t.hotspots && t.hotspots.length > 0
  );

  if (sources.length === 0) return null;

  const handleSelect = async (source: Tipologia) => {
    setOpen(false);
    if (
      currentHotspotCount > 0 &&
      !(await confirm({
        title: t("tipologias.copyHotspots"),
        message: t("tipologias.copyHotspotsReplace", { current: currentHotspotCount, count: source.hotspots.length, name: source.nombre }),
      }))
    ) {
      return;
    }
    if (
      currentHotspotCount === 0 &&
      !(await confirm({
        title: t("tipologias.copyHotspots"),
        message: t("tipologias.copyHotspotsConfirm", { count: source.hotspots.length, name: source.nombre }),
      }))
    ) {
      return;
    }
    const copied = source.hotspots.map((h) => ({
      ...h,
      id: crypto.randomUUID(),
    }));
    onCopy(copied);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center px-2.5 py-1.5 font-medium text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-all border border-[var(--border-subtle)]",
          gap.normal,
          fontSize.body,
          radius.md
        )}
      >
        <ClipboardCopy size={iconSize.xs} />
        {t("tipologias.copyFromOther")}
        <ChevronDown size={10} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className={cn(
              "absolute left-0 top-full mt-1 z-30 w-64 bg-[var(--surface-2)] border border-[var(--border-default)] shadow-xl overflow-hidden",
              radius.xl
            )}
          >
            <div className="px-3 py-2 border-b border-[var(--border-subtle)]">
              <p className={cn(
                "text-[var(--text-muted)] uppercase font-bold",
                fontSize.label,
                letterSpacing.wider
              )}>
                {t("tipologias.withHotspots")}
              </p>
            </div>
            <div className="max-h-48 overflow-y-auto py-1">
              {sources.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelect(t)}
                  className={cn(
                    "w-full flex items-center px-3 py-2 hover:bg-[var(--surface-3)] transition-colors text-left",
                    gap.relaxed
                  )}
                >
                  <span className={cn(
                    "w-5 h-5 bg-[rgba(var(--site-primary-rgb),0.15)] flex items-center justify-center text-[var(--site-primary)] font-bold shrink-0",
                    fontSize.caption,
                    radius.full
                  )}>
                    {t.hotspots.length}
                  </span>
                  <span className={cn(
                    "text-[var(--text-secondary)] truncate",
                    fontSize.subtitle
                  )}>
                    {t.nombre}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Tipologías Config Modal ─── */

function TipologiasConfigModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { project, save } = useEditorProject();
  const { t } = useTranslation("editor");
  const toast = useToast();

  const tipoProyecto = (project.tipo_proyecto || "hibrido") as "apartamentos" | "casas" | "lotes" | "hibrido";
  const [tipologiaFields, setTipologiaFields] = useState<TipologiaFieldsConfig | null>(
    project.tipologia_fields ?? null
  );
  const [extrasEnabled, setExtrasEnabled] = useState<Record<string, boolean>>(() => {
    const state: Record<string, boolean> = {};
    for (const extra of TIPO_EXTRAS) {
      state[extra.projectFlag] = (project as unknown as Record<string, boolean>)[extra.projectFlag] ?? false;
    }
    return state;
  });

  /* Sync when project changes externally */
  const hasPendingSave = useRef(false);
  useEffect(() => {
    if (hasPendingSave.current) return;
    setTipologiaFields(project.tipologia_fields ?? null);
    const state: Record<string, boolean> = {};
    for (const extra of TIPO_EXTRAS) {
      state[extra.projectFlag] = (project as unknown as Record<string, boolean>)[extra.projectFlag] ?? false;
    }
    setExtrasEnabled(state);
  }, [project]);

  /* Close on Escape key */
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  const effectiveFields = useMemo(
    () => getTipologiaFields(tipoProyecto, tipologiaFields),
    [tipoProyecto, tipologiaFields]
  );
  const isCustomFields = tipologiaFields !== null;
  const activeFieldCount = useMemo(
    () => Object.values(effectiveFields).filter(Boolean).length,
    [effectiveFields]
  );

  /* Auto-save with debounce */
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef({ fields: tipologiaFields, extras: extrasEnabled });
  latestRef.current = { fields: tipologiaFields, extras: extrasEnabled };

  const flushSave = useCallback(async () => {
    const { fields, extras } = latestRef.current;
    const ok = await save({
      tipologia_fields: fields,
      ...extras,
    } as Record<string, unknown>);
    hasPendingSave.current = false;
    if (!ok) toast.error(t("general.saveError"));
  }, [save, toast, t]);

  const scheduleAutoSave = useCallback(() => {
    hasPendingSave.current = true;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => flushSave(), 1200);
  }, [flushSave]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        flushSave();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFieldToggle = (key: keyof TipologiaFieldsConfig) => {
    const current = getTipologiaFields(tipoProyecto, tipologiaFields);
    const updated = { ...current, [key]: !current[key] };
    setTipologiaFields(updated);
    scheduleAutoSave();
  };

  const handleResetFields = () => {
    setTipologiaFields(null);
    scheduleAutoSave();
  };

  const handleExtraToggle = (projectFlag: string) => {
    setExtrasEnabled(prev => ({ ...prev, [projectFlag]: !prev[projectFlag] }));
    scheduleAutoSave();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg max-h-[80vh] bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[1.25rem] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="shrink-0 px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[rgba(var(--site-primary-rgb),0.1)] flex items-center justify-center">
                  <Settings size={18} className="text-[var(--site-primary)]" />
                </div>
                <div>
                  <h2 className="text-base font-heading font-light text-[var(--text-primary)]">
                    Configuración de tipologías
                  </h2>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Campos visibles y extras habilitados
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-3)] transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

              {/* ── Fields Section ── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={cn("font-ui font-bold uppercase text-[var(--text-tertiary)]", fontSize.label, letterSpacing.wider)}>
                    Campos de tipología
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={cn("font-mono font-medium text-[var(--site-primary)]", fontSize.label)}>
                      {activeFieldCount}/{TIPOLOGIA_FIELD_KEYS.length}
                    </span>
                    {isCustomFields && (
                      <button
                        type="button"
                        onClick={handleResetFields}
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 font-ui font-bold uppercase text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-all cursor-pointer",
                          fontSize.caption,
                          letterSpacing.wider,
                          radius.md
                        )}
                      >
                        <RotateCcw size={9} />
                        {t("config.tipologiaFields.resetDefaults")}
                      </button>
                    )}
                  </div>
                </div>

                {!isCustomFields && (
                  <div className="mb-3 px-3 py-1.5 rounded-lg bg-[rgba(var(--site-primary-rgb),0.06)] border border-[rgba(var(--site-primary-rgb),0.15)]">
                    <span className={cn("font-ui font-bold uppercase text-[var(--site-primary)]", fontSize.caption, letterSpacing.wider)}>
                      {t("config.tipologiaFields.usingDefaults")}
                    </span>
                  </div>
                )}

                <div className="space-y-4">
                  {FIELD_CATEGORIES.map((category) => {
                    const CategoryIcon = category.icon;
                    return (
                      <div key={category.id}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <CategoryIcon size={11} className="shrink-0 text-[var(--text-muted)]" />
                          <span className={cn("font-ui font-bold uppercase text-[var(--text-muted)]", fontSize.caption, letterSpacing.wider)}>
                            {category.label}
                          </span>
                          <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {category.fields.map((fieldKey) => {
                            const fieldDef = TIPOLOGIA_FIELD_KEYS.find(f => f.key === fieldKey);
                            if (!fieldDef) return null;
                            const FieldIcon = FIELD_ICON_MAP[fieldDef.icon];
                            const isOn = effectiveFields[fieldKey];
                            return (
                              <button
                                key={fieldKey}
                                type="button"
                                onClick={() => handleFieldToggle(fieldKey)}
                                className={cn(
                                  "flex items-center gap-2.5 px-3 py-2 transition-all cursor-pointer",
                                  radius.md,
                                  isOn
                                    ? "bg-[var(--surface-2)] border-l-2 border-l-[var(--site-primary)] border-t border-r border-b border-t-[var(--border-subtle)] border-r-[var(--border-subtle)] border-b-[var(--border-subtle)]"
                                    : "bg-[var(--surface-0)] border-l-2 border-l-transparent border-t border-r border-b border-t-[var(--border-subtle)] border-r-[var(--border-subtle)] border-b-[var(--border-subtle)] hover:border-t-[var(--border-default)] hover:border-r-[var(--border-default)] hover:border-b-[var(--border-default)]"
                                )}
                              >
                                <div className={cn(
                                  "w-6 h-6 flex items-center justify-center shrink-0 transition-colors",
                                  radius.md,
                                  isOn ? "bg-[rgba(var(--site-primary-rgb),0.12)]" : "bg-[var(--surface-3)]"
                                )}>
                                  {FieldIcon && <FieldIcon size={12} className={cn("transition-colors", isOn ? "text-[var(--site-primary)]" : "text-[var(--text-muted)]")} />}
                                </div>
                                <span className={cn("flex-1 text-left font-medium transition-colors", fontSize.subtitle, isOn ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]")}>
                                  {t(fieldDef.labelKey)}
                                </span>
                                <div className={cn("relative inline-flex h-4 w-7 items-center rounded-full transition-colors shrink-0", isOn ? "bg-[var(--site-primary)]" : "bg-[var(--surface-3)]")}>
                                  <span className={cn("inline-block h-2.5 w-2.5 rounded-full bg-white shadow-sm transition-transform", isOn ? "translate-x-[14px]" : "translate-x-[3px]")} />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-[var(--border-subtle)]" />

              {/* ── Extras Section ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={cn("font-ui font-bold uppercase text-[var(--text-tertiary)]", fontSize.label, letterSpacing.wider)}>
                    {t("config.extras.title")}
                  </span>
                </div>
                <p className={cn("text-[var(--text-muted)] mb-3 leading-relaxed", fontSize.subtitle)}>
                  {t("config.extras.description")}
                </p>

                <div className="grid grid-cols-2 gap-1.5">
                  {TIPO_EXTRAS.map((extra) => {
                    const isOn = extrasEnabled[extra.projectFlag] ?? false;
                    const ExtraIcon = extra.icon;
                    return (
                      <button
                        key={extra.field}
                        type="button"
                        onClick={() => handleExtraToggle(extra.projectFlag)}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 transition-all cursor-pointer",
                          radius.md,
                          isOn
                            ? "bg-[var(--surface-2)] border-l-2 border-l-[var(--site-primary)] border-t border-r border-b border-t-[var(--border-subtle)] border-r-[var(--border-subtle)] border-b-[var(--border-subtle)]"
                            : "bg-[var(--surface-0)] border-l-2 border-l-transparent border-t border-r border-b border-t-[var(--border-subtle)] border-r-[var(--border-subtle)] border-b-[var(--border-subtle)] hover:border-t-[var(--border-default)] hover:border-r-[var(--border-default)] hover:border-b-[var(--border-default)]"
                        )}
                      >
                        <div className={cn(
                          "w-6 h-6 flex items-center justify-center shrink-0 transition-colors",
                          radius.md,
                          isOn ? "bg-[rgba(var(--site-primary-rgb),0.12)]" : "bg-[var(--surface-3)]"
                        )}>
                          <ExtraIcon size={12} className={cn("transition-colors", isOn ? "text-[var(--site-primary)]" : "text-[var(--text-muted)]")} />
                        </div>
                        <span className={cn("flex-1 text-left font-medium transition-colors", fontSize.subtitle, isOn ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]")}>
                          {t(extra.labelKey)}
                        </span>
                        <div className={cn("relative inline-flex h-4 w-7 items-center rounded-full transition-colors shrink-0", isOn ? "bg-[var(--site-primary)]" : "bg-[var(--surface-3)]")}>
                          <span className={cn("inline-block h-2.5 w-2.5 rounded-full bg-white shadow-sm transition-transform", isOn ? "translate-x-[14px]" : "translate-x-[3px]")} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Draggable list item ─── */

function TipologiaListItem({
  tipologia: t,
  isSelected,
  onSelect,
  onDuplicate,
  onDelete,
  isDuplicating,
  isDeleting,
}: {
  tipologia: Tipologia;
  isSelected: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  isDuplicating: boolean;
  isDeleting: boolean;
}) {
  const controls = useDragControls();
  const isDraggingRef = useRef(false);

  return (
    <Reorder.Item
      value={t}
      dragListener={false}
      dragControls={controls}
      onDragEnd={() => { setTimeout(() => { isDraggingRef.current = false; }, 0); }}
      className={cn(
        "w-full text-left px-3 py-2.5 transition-all group relative cursor-pointer flex items-center select-none",
        isSelected
          ? "bg-[var(--surface-3)] border-l-2 border-l-[var(--site-primary)]"
          : "border-l-2 border-l-transparent hover:bg-[var(--surface-2)]"
      )}
      onClick={() => { if (!isDraggingRef.current) onSelect(); }}
    >
      {/* Drag handle */}
      <div
        onPointerDown={(e) => { e.preventDefault(); isDraggingRef.current = true; controls.start(e); }}
        className="cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors shrink-0 touch-none mr-1.5 opacity-30 group-hover:opacity-70"
      >
        <GripVertical size={14} />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "font-medium truncate",
            fontSize.base,
            isSelected ? "text-white" : "text-[var(--text-secondary)]"
          )}
        >
          {t.nombre}
        </p>
        <div className={cn(
          "flex items-center mt-0.5 text-[var(--text-muted)]",
          gap.normal,
          fontSize.label
        )}>
          {t.tipo_tipologia === "local_comercial" && (
            <span className="px-1.5 py-px rounded-full text-[9px] font-ui font-bold uppercase tracking-wider bg-[rgba(var(--site-primary-rgb),0.12)] text-[var(--site-primary)]">
              Comercial
            </span>
          )}
          {t.area_m2 != null && <span>{t.area_m2}m²</span>}
          {t.habitaciones != null && <span>{t.habitaciones} hab</span>}
          {t.banos != null && <span>{t.banos} baños</span>}
        </div>
      </div>

      {/* Action buttons — visible on hover */}
      <div className={cn(
        "absolute right-2 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity",
        gap.compact
      )}>
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          disabled={isDuplicating}
          title="Duplicar"
        >
          {isDuplicating ? (
            <Loader2 size={iconSize.xs} className="animate-spin text-[var(--text-muted)]" />
          ) : (
            <Copy size={iconSize.xs} className="text-[var(--text-muted)] hover:text-[var(--site-primary)]" />
          )}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 size={iconSize.xs} className="animate-spin text-[var(--text-muted)]" />
          ) : (
            <Trash2 size={iconSize.xs} className="text-[var(--text-muted)] hover:text-red-400" />
          )}
        </button>
      </div>
    </Reorder.Item>
  );
}

/* ─── Tabs ─── */

type TipoTab = "general" | "multimedia" | "plano" | "hotspots";

/* ─── Page ─── */

export default function TipologiasPage() {
  const { project, refresh, updateLocal, projectId } = useEditorProject();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { confirm } = useConfirm();
  const { t } = useTranslation("editor");
  const { saveTipologia } = useBackgroundSave(projectId);
  const { role } = useAuthRole();
  const canConfigure = role === "admin" || role === "director";
  const [configModalOpen, setConfigModalOpen] = useState(false);

  const TIPO_TABS: { id: TipoTab; label: string; icon: LucideIcon }[] = [
    { id: "general", label: t("tipologias.tabs.general"), icon: FileText },
    { id: "multimedia", label: t("tipologias.tabs.multimedia"), icon: Video },
    { id: "plano", label: t("tipologias.tabs.floorPlan"), icon: Map },
    { id: "hotspots", label: t("tipologias.tabs.hotspots"), icon: MousePointerClick },
  ];

  const tipologias = useMemo(() => project.tipologias || [], [project.tipologias]);
  const unidades = useMemo(() => project.unidades || [], [project.unidades]);
  const torres = useMemo(() => project.torres || [], [project.torres]);
  const isMultiTorre = torres.length > 1;
  const torresLabel = project.tipo_proyecto === "apartamentos" ? "Torres" : "Grid";
  const isHibrido = project.tipo_proyecto === "hibrido";

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<TipoForm>({ ...emptyTipologia });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [caracInput, setCaracInput] = useState("");
  const [activeTab, setActiveTab] = useState<TipoTab>("general");
  const [activeTorreId, setActiveTorreId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [activePisoIndex, setActivePisoIndex] = useState(0);

  /* ─── Build payload helper ─── */
  const buildPayload = useCallback(() => ({
    nombre: form.nombre,
    descripcion: form.descripcion || null,
    area_m2: parseOptionalNumber(form.area_m2),
    area_construida: parseOptionalNumber(form.area_construida),
    area_privada: parseOptionalNumber(form.area_privada),
    area_lote: parseOptionalNumber(form.area_lote),
    habitaciones: parseOptionalNumber(form.habitaciones),
    banos: parseOptionalNumber(form.banos),
    precio_desde: parseOptionalNumber(form.precio_desde),
    plano_url: form.pisos.length > 0 ? (form.pisos[0].plano_url || null) : (form.plano_url || null),
    renders: form.renders.filter((r) => r),
    caracteristicas: form.caracteristicas,
    parqueaderos: parseOptionalNumber(form.parqueaderos),
    depositos: parseOptionalNumber(form.depositos),
    area_balcon: parseOptionalNumber(form.area_balcon),
    hotspots: form.pisos.length > 0 ? form.pisos[0].hotspots : form.hotspots,
    pisos: form.pisos.length > 0 ? form.pisos : null,
    ubicacion_plano_url: form.ubicacion_plano_url || null,
    torre_ids: isMultiTorre ? form.torre_ids : [],
    tipo_tipologia: isHibrido
      ? (form.tipo_tipologia || null)
      : (form.tipo_tipologia === "local_comercial"
          ? "local_comercial"
          : deriveTipoTipologia(project.tipo_proyecto)),
    video_id: form.video_id || null,
    tour_360_url: form.tour_360_url || null,
    tiene_jacuzzi: form.tiene_jacuzzi,
    tiene_piscina: form.tiene_piscina,
    tiene_bbq: form.tiene_bbq,
    tiene_terraza: form.tiene_terraza,
    tiene_jardin: form.tiene_jardin,
    tiene_cuarto_servicio: form.tiene_cuarto_servicio,
    tiene_estudio: form.tiene_estudio,
    tiene_chimenea: form.tiene_chimenea,
    tiene_doble_altura: form.tiene_doble_altura,
    tiene_rooftop: form.tiene_rooftop,
  }), [form, isMultiTorre, isHibrido, project.tipo_proyecto]);

  /* ─── Auto-save function ─── */
  const performSave = useCallback(async () => {
    const payload = buildPayload();

    // Validate
    tipologiaSchema.parse(payload);

    if (selectedId && !isCreating) {
      // Update existing
      const res = await fetch(`/api/tipologias/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || res.statusText);
      }

      // Merge server response into cache directly (no full project refetch)
      const updated = await res.json() as Tipologia;
      queryClient.setQueryData<ProyectoCompleto>(
        projectKeys.detail(projectId),
        (old) => old ? {
          ...old,
          tipologias: old.tipologias.map((t) =>
            t.id === selectedId ? { ...t, ...updated } : t
          ),
        } : old
      );
    } else if (isCreating) {
      // Create new
      const res = await fetch("/api/tipologias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proyecto_id: projectId, ...payload }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || res.statusText);
      }

      const created = await res.json() as Tipologia;

      // Add to cache directly (no full project refetch)
      queryClient.setQueryData<ProyectoCompleto>(
        projectKeys.detail(projectId),
        (old) => old ? {
          ...old,
          tipologias: [...old.tipologias, created],
        } : old
      );

      // Select the newly created tipologia
      if (created?.id) {
        setSelectedId(created.id);
        setIsCreating(false);
      }
    }
  }, [buildPayload, selectedId, isCreating, projectId, queryClient]);

  /* ─── Auto-save hook ─── */
  const { status: autoSaveStatus } = useAutoSave({
    data: form,
    onSave: performSave,
    delay: 1500,
    shouldSave: (data) => {
      // Only auto-save if we have a valid name
      if (!data.nombre.trim()) return false;
      // Only auto-save if we're editing an existing tipologia or creating a new one
      if (!selectedId && !isCreating) return false;
      return true;
    },
    onSaveError: (error) => {
      if (error instanceof ZodError) {
        setValidationError(error.issues[0]?.message || t("errors.validationError"));
        toast.error(error.issues[0]?.message || t("errors.validationError"));
      } else {
        toast.error(t("tipologias.saveError") + ": " + error.message);
      }
    },
  });

  const filteredTipologias = useMemo(() => {
    if (!isMultiTorre || activeTorreId === null) return tipologias;
    if (activeTorreId === "__none__") return tipologias.filter(t => !t.torre_ids || t.torre_ids.length === 0);
    return tipologias.filter(t => t.torre_ids?.includes(activeTorreId));
  }, [tipologias, isMultiTorre, activeTorreId]);

  /* ─── Ordered tipologias for drag-to-reorder ─── */
  const [orderedTipologias, setOrderedTipologias] = useState<Tipologia[]>(filteredTipologias);
  useEffect(() => {
    setOrderedTipologias(filteredTipologias);
  }, [filteredTipologias]);

  const reorderTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const handleReorder = (newOrder: Tipologia[]) => {
    setOrderedTipologias(newOrder);
    // Optimistically update cache
    queryClient.setQueryData<ProyectoCompleto>(
      projectKeys.detail(projectId),
      (old) => {
        if (!old) return old;
        const orderMap = Object.fromEntries(newOrder.map((t, i) => [t.id, i])) as Record<string, number>;
        return {
          ...old,
          tipologias: old.tipologias
            .map((t) => ({ ...t, orden: orderMap[t.id] ?? t.orden }))
            .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)),
        };
      }
    );
    // Debounce the API call — only persist after drag settles
    clearTimeout(reorderTimerRef.current);
    reorderTimerRef.current = setTimeout(async () => {
      try {
        const ids = newOrder.map((t) => t.id);
        const res = await fetch("/api/tipologias/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });
        if (!res.ok) toast.error(t("tipologias.reorderError"));
      } catch {
        toast.error(t("errors.connectionError"));
      }
    }, 300);
  };

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
    setActivePisoIndex(0);
  }, []);

  const startCreating = () => {
    setSelectedId(null);
    setIsCreating(true);
    setForm({ ...emptyTipologia, torre_ids: activeTorreId && activeTorreId !== "__none__" ? [activeTorreId] : [] });
    setCaracInput("");
    setActiveTab("general");
  };

  const updateForm = (field: keyof TipoForm, value: string | string[] | TipologiaHotspot[] | TipologiaPiso[] | boolean | null) => {
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

  /* ─── Floor (piso) helpers ─── */

  const addFloor = () => {
    const newPiso: TipologiaPiso = {
      id: crypto.randomUUID(),
      nombre: `Plano ${form.pisos.length + 1}`,
      plano_url: "",
      hotspots: [],
      orden: form.pisos.length,
    };
    setForm((prev) => ({ ...prev, pisos: [...prev.pisos, newPiso] }));
    setActivePisoIndex(form.pisos.length);
  };

  const removeFloor = async (index: number) => {
    if (
      !(await confirm({
        title: t("tipologias.removeFloor"),
        message: t("tipologias.removeFloorConfirm"),
      }))
    )
      return;
    setForm((prev) => ({
      ...prev,
      pisos: prev.pisos.filter((_, i) => i !== index).map((p, i) => ({ ...p, orden: i })),
    }));
    setActivePisoIndex((prev) => Math.max(0, prev >= index ? prev - 1 : prev));
  };

  const updatePiso = (index: number, updates: Partial<TipologiaPiso>) => {
    setForm((prev) => ({
      ...prev,
      pisos: prev.pisos.map((p, i) => (i === index ? { ...p, ...updates } : p)),
    }));
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

  const effectiveColumns = useMemo(() => {
    if (form.tipo_tipologia) {
      return getHybridInventoryColumns(form.tipo_tipologia as TipoTipologia, project.inventory_columns_by_type);
    }
    return getInventoryColumns(project.tipo_proyecto ?? "hibrido", project.inventory_columns);
  }, [form.tipo_tipologia, project.tipo_proyecto, project.inventory_columns, project.inventory_columns_by_type]);

  const tipFields = useMemo(() =>
    getTipologiaFields(project.tipo_proyecto ?? "hibrido", project.tipologia_fields),
    [project.tipo_proyecto, project.tipologia_fields]
  );


  const handleDelete = async (id: string) => {
    const tip = tipologias.find((t) => t.id === id);
    if (!tip) return;
    const nUnits = unidades.filter((u) => u.tipologia_id === id).length;
    if (!(await confirm({
      title: t("tipologias.deleteTitle"),
      message: t("tipologias.deleteConfirmMsg"),
      description: tip.nombre,
      details: nUnits > 0 ? t("tipologias.deleteUnitsWarning", { count: nUnits }) : undefined,
      typeToConfirm: tip.nombre,
    }))) return;
    setDeletingId(id);

    // Optimistic remove
    const snapshot = project.tipologias;
    updateLocal((prev) => ({
      ...prev,
      tipologias: prev.tipologias.filter((t) => t.id !== id),
    }));

    // Select next tipologia immediately
    if (selectedId === id) {
      const remaining = filteredTipologias.filter((t) => t.id !== id);
      if (remaining.length > 0) {
        selectTipologia(remaining[0]);
      } else {
        setSelectedId(null);
        setForm({ ...emptyTipologia });
      }
    }

    try {
      const res = await fetch(`/api/tipologias/${id}`, { method: "DELETE" });
      if (!res.ok) {
        updateLocal((prev) => ({ ...prev, tipologias: snapshot }));
        toast.error(t("tipologias.deleteError"));
      }
    } catch {
      updateLocal((prev) => ({ ...prev, tipologias: snapshot }));
      toast.error(t("errors.connectionError"));
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicate = async (tip: Tipologia) => {
    if (!(await confirm({ title: t("tipologias.duplicateTitle"), message: t("tipologias.duplicateConfirm") }))) return;
    setDuplicatingId(tip.id);

    const tempId = `temp-dup-${Date.now()}`;
    const tempTip = {
      ...tip,
      id: tempId,
      nombre: `${tip.nombre} (copia)`,
    };

    // Optimistic: add duplicate to list immediately
    updateLocal((prev) => ({
      ...prev,
      tipologias: [...prev.tipologias, tempTip],
    }));
    setSelectedId(tempId);
    setIsCreating(false);
    setForm(tipologiaToForm(tempTip));

    try {
      const payload = {
        proyecto_id: projectId,
        nombre: `${tip.nombre} (copia)`,
        descripcion: tip.descripcion || null,
        area_m2: tip.area_m2,
        area_construida: tip.area_construida,
        area_privada: tip.area_privada,
        area_lote: tip.area_lote,
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
        pisos: tip.pisos || null,
        ubicacion_plano_url: tip.ubicacion_plano_url || null,
        torre_ids: tip.torre_ids || [],
        video_id: tip.video_id || null,
        tiene_jacuzzi: tip.tiene_jacuzzi ?? false,
        tiene_piscina: tip.tiene_piscina ?? false,
        tiene_bbq: tip.tiene_bbq ?? false,
        tiene_terraza: tip.tiene_terraza ?? false,
        tiene_jardin: tip.tiene_jardin ?? false,
        tiene_cuarto_servicio: tip.tiene_cuarto_servicio ?? false,
        tiene_estudio: tip.tiene_estudio ?? false,
        tiene_chimenea: tip.tiene_chimenea ?? false,
        tiene_doble_altura: tip.tiene_doble_altura ?? false,
        tiene_rooftop: tip.tiene_rooftop ?? false,
      };
      const res = await fetch("/api/tipologias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const created = await res.json();
        // Replace temp with real
        updateLocal((prev) => ({
          ...prev,
          tipologias: prev.tipologias.map((t) =>
            t.id === tempId ? { ...t, ...created } : t
          ),
        }));
        if (created?.id) {
          setSelectedId(created.id);
          setForm(tipologiaToForm(created));
        }
        toast.success(t("tipologias.duplicated"));
      } else {
        // Rollback
        updateLocal((prev) => ({
          ...prev,
          tipologias: prev.tipologias.filter((t) => t.id !== tempId),
        }));
        toast.error(t("tipologias.duplicateError"));
      }
    } catch {
      updateLocal((prev) => ({
        ...prev,
        tipologias: prev.tipologias.filter((t) => t.id !== tempId),
      }));
      toast.error(t("errors.connectionError"));
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
            <Plus size={iconSize.sm} />
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
        <div className={cn(
          "flex items-center p-1 bg-[var(--surface-1)] border border-[var(--border-subtle)] mb-4",
          gap.compact,
          radius.xl
        )}>
          <button
            onClick={() => setActiveTorreId(null)}
            className={cn(
              "flex items-center px-3 py-1.5 font-medium transition-all",
              gap.normal,
              fontSize.subtitle,
              radius.md,
              activeTorreId === null
                ? "bg-[var(--surface-3)] text-white shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
            )}
          >
            {t("tipologias.all")}
            <span className={cn(
              "ml-1 px-1.5 py-0.5 bg-[var(--surface-3)] text-[var(--text-muted)]",
              fontSize.label,
              radius.full
            )}>
              {tipologias.length}
            </span>
          </button>
          {torres.map((t) => {
            const count = tipologias.filter(tip => tip.torre_ids?.includes(t.id)).length;
            return (
              <button key={t.id} onClick={() => setActiveTorreId(t.id)}
                className={cn(
                  "flex items-center px-3 py-1.5 font-medium transition-all",
                  gap.normal,
                  fontSize.subtitle,
                  radius.md,
                  activeTorreId === t.id
                    ? "bg-[var(--surface-3)] text-white shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                )}
              >
                <Building2 size={iconSize.sm} />
                {t.nombre}
                {count > 0 && (
                  <span className={cn(
                    "ml-1 px-1.5 py-0.5 bg-[var(--surface-3)] text-[var(--text-muted)]",
                    fontSize.label,
                    radius.full
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
          {tipologias.some(t => !t.torre_ids || t.torre_ids.length === 0) && (
            <button onClick={() => setActiveTorreId("__none__")}
              className={cn(
                "flex items-center px-3 py-1.5 font-medium transition-all",
                gap.normal,
                fontSize.subtitle,
                radius.md,
                activeTorreId === "__none__"
                  ? "bg-[var(--surface-3)] text-white shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
              )}
            >
              {t("tipologias.noTower")}
              <span className={cn(
                "ml-1 px-1.5 py-0.5 bg-[var(--surface-3)] text-[var(--text-muted)]",
                fontSize.label,
                radius.full
              )}>
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
              <div className={cn("flex items-center", gap.normal)}>
                <Layers size={iconSize.sm} className="text-[var(--site-primary)]" />
                <span className={cn(
                  "font-medium text-[var(--text-secondary)]",
                  fontSize.subtitle
                )}>
                  {t("tipologias.listTitle")}
                </span>
              </div>
              <div className={cn("flex items-center", gap.compact)}>
                <span className={cn(
                  "text-[var(--text-muted)]",
                  fontSize.label
                )}>
                  {filteredTipologias.length}
                </span>
                {canConfigure && (
                  <button
                    type="button"
                    onClick={() => setConfigModalOpen(true)}
                    className={cn(
                      "w-6 h-6 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--site-primary)] hover:bg-[rgba(var(--site-primary-rgb),0.08)] transition-all",
                      radius.md
                    )}
                    title="Configuración de tipologías"
                  >
                    <Settings size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto py-1">
            <Reorder.Group
              axis="y"
              values={orderedTipologias}
              onReorder={handleReorder}
              className="space-y-0"
            >
              {orderedTipologias.map((t) => (
                <TipologiaListItem
                  key={t.id}
                  tipologia={t}
                  isSelected={selectedId === t.id && !isCreating}
                  onSelect={() => selectTipologia(t)}
                  onDuplicate={() => handleDuplicate(t)}
                  onDelete={() => handleDelete(t.id)}
                  isDuplicating={duplicatingId === t.id}
                  isDeleting={deletingId === t.id}
                />
              ))}
            </Reorder.Group>

            {/* "Creating new" item */}
            {isCreating && (
              <div className="px-3 py-2.5 bg-[var(--surface-3)] border-l-2 border-l-[var(--site-primary)]">
                <p className={cn(
                  "font-medium text-[var(--site-primary)]",
                  fontSize.base
                )}>
                  + {t("tipologias.newType")}
                </p>
              </div>
            )}
          </div>

          {/* Add button */}
          <div className="p-3 border-t border-[var(--border-subtle)]">
            <button
              onClick={startCreating}
              className={cn(
                "w-full flex items-center justify-center px-3 py-2 font-medium text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-all border border-[var(--border-subtle)]",
                gap.normal,
                fontSize.subtitle,
                radius.md
              )}
            >
              <Plus size={iconSize.xs} />
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
                  <h3 className={cn(
                    "font-medium text-[var(--text-secondary)] truncate",
                    fontSize.md
                  )}>
                    {isCreating ? t("tipologias.newType") : form.nombre || "—"}
                  </h3>
                  <div className={cn("flex items-center", gap.normal)}>
                    {/* Auto-save indicator */}
                    {(selectedId || isCreating) && form.nombre.trim() && (
                      <AutoSaveIndicator status={autoSaveStatus} />
                    )}
                    {isCreating && (
                      <button
                        onClick={() => {
                          setIsCreating(false);
                          if (filteredTipologias.length > 0) selectTipologia(filteredTipologias[0]);
                        }}
                        className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                      >
                        <X size={iconSize.md} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Tab bar */}
                <div className={cn("px-6 flex", gap.compact)}>
                  {TIPO_TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const hasPlano = form.pisos.some((p) => !!p.plano_url);
                    const hotspotCount = form.pisos.reduce((sum, p) => sum + p.hotspots.length, 0);
                    const TabIcon = tab.icon;

                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          "px-4 py-2 font-medium rounded-t-lg transition-all flex items-center",
                          fontSize.subtitle,
                          gap.normal,
                          isActive
                            ? "bg-[var(--site-primary)] text-black"
                            : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                        )}
                      >
                        <TabIcon size={iconSize.sm} />
                        {tab.label}
                        {tab.id === "hotspots" && hotspotCount > 0 && (
                          <span
                            className={cn(
                              "px-1.5 py-px leading-tight",
                              fontSize.caption,
                              radius.full,
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
                              "w-1.5 h-1.5",
                              radius.full,
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
                    className={activeTab === "hotspots" ? "h-full" : "space-y-4"}
                  >
                    {/* ── TAB: General ── */}
                    {activeTab === "general" && (
                      <>
                        <div>
                          <Label>{t("tipologias.nameRequired")}</Label>
                          <input
                            type="text"
                            value={form.nombre}
                            onChange={(e) => updateForm("nombre", e.target.value)}
                            placeholder={t("tipologias.namePlaceholder")}
                            className={inputClass}
                          />
                        </div>
                        {isHibrido && (
                          <div>
                            <Label>{t("tipologias.tipoTipologia")}</Label>
                            <div className={cn("grid grid-cols-4 mt-1", gap.normal)}>
                              {([
                                { id: "apartamento" as const, icon: Building2, labelKey: "tipologias.tipoApartamento" },
                                { id: "casa" as const, icon: Home, labelKey: "tipologias.tipoCasa" },
                                { id: "lote" as const, icon: MapPin, labelKey: "tipologias.tipoLote" },
                                { id: "local_comercial" as const, icon: Store, labelKey: "tipologias.tipoLocalComercial" },
                              ] as const).map((tipo) => {
                                const isActive = form.tipo_tipologia === tipo.id;
                                const Icon = tipo.icon;
                                return (
                                  <button
                                    key={tipo.id}
                                    type="button"
                                    onClick={() => {
                                      updateForm("tipo_tipologia", tipo.id);
                                      // Immediate background save for discrete changes
                                      if (selectedId && !isCreating) {
                                        saveTipologia({
                                          tipologiaId: selectedId,
                                          payload: { tipo_tipologia: tipo.id },
                                          optimisticUpdate: (prev) => ({
                                            ...prev,
                                            tipologias: prev.tipologias.map((t) =>
                                              t.id === selectedId
                                                ? { ...t, tipo_tipologia: tipo.id }
                                                : t
                                            ),
                                          }),
                                        });
                                      }
                                    }}
                                    className={cn(
                                      "flex items-center px-3 py-2 border transition-all text-left",
                                      gap.normal,
                                      fontSize.subtitle,
                                      radius.md,
                                      isActive
                                        ? "bg-[rgba(var(--site-primary-rgb),0.08)] border-[rgba(var(--site-primary-rgb),0.3)] text-white"
                                        : "bg-[var(--surface-1)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--border-default)]"
                                    )}
                                  >
                                    <Icon size={iconSize.sm} className={isActive ? "text-[var(--site-primary)]" : ""} />
                                    {t(tipo.labelKey)}
                                  </button>
                                );
                              })}
                            </div>
                            <p className={cn(
                              "text-[var(--text-muted)] mt-1.5",
                              fontSize.label
                            )}>
                              {t("tipologias.tipoTipologiaHint")}
                            </p>
                          </div>
                        )}
                        {isMultiTorre && (
                          <div>
                            <Label>{torresLabel}</Label>
                            <div className={cn("flex flex-wrap", gap.normal)}>
                              {torres.map((torre) => {
                                const checked = form.torre_ids.includes(torre.id);
                                return (
                                  <label
                                    key={torre.id}
                                    className={cn(
                                      "flex items-center px-3 py-1.5 cursor-pointer transition-all border",
                                      gap.normal,
                                      radius.md,
                                      fontSize.subtitle,
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
                                        // Immediate background save for discrete changes
                                        if (selectedId && !isCreating) {
                                          saveTipologia({
                                            tipologiaId: selectedId,
                                            payload: { torre_ids: next },
                                            optimisticUpdate: (prev) => ({
                                              ...prev,
                                              tipologias: prev.tipologias.map((t) =>
                                                t.id === selectedId
                                                  ? { ...t, torre_ids: next }
                                                  : t
                                              ),
                                            }),
                                          });
                                        }
                                      }}
                                      className="sr-only"
                                    />
                                    <Building2 size={iconSize.xs} />
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

                        {/* ── Precio ── */}
                        <div>
                          <Label>Precio</Label>
                          {project?.precio_source === "tipologia" ? (
                            <>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-3 p-3 bg-[var(--surface-1)] rounded-xl border border-[rgba(var(--site-primary-rgb),0.15)] transition-all flex-1 min-w-0">
                                  <div className="w-9 h-9 rounded-lg bg-[rgba(var(--site-primary-rgb),0.12)] flex items-center justify-center shrink-0">
                                    <DollarSign size={iconSize.md} className="text-[var(--site-primary)]" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <CurrencyInput
                                      value={form.precio_desde ? Number(form.precio_desde) : ""}
                                      onChange={(v) => updateForm("precio_desde", v != null ? String(v) : "")}
                                      currency={(project?.moneda_base as Currency) || "COP"}
                                      placeholder="350,000,000"
                                      inputClassName="w-full bg-transparent text-sm font-mono font-medium text-[var(--site-primary)] placeholder:text-[var(--text-muted)] focus:outline-none border-none p-0"
                                    />
                                  </div>
                                </div>
                                {selectedId && (() => {
                                  const currentTipo = tipologias.find(t => t.id === selectedId);
                                  return currentTipo && (
                                    <PriceAuditBadge
                                      tipologiaId={currentTipo.id}
                                      updatedAt={currentTipo.precio_actualizado_en}
                                      updatedBy={currentTipo.precio_actualizado_por}
                                      currency={(project?.moneda_base as Currency) || "COP"}
                                    />
                                  );
                                })()}
                              </div>
                              <p className={cn(
                                "text-[var(--text-muted)] mt-2",
                                fontSize.label,
                                lineHeight.relaxed
                              )}>
                                {t("tipologias.precioTipologiaHint")}
                              </p>
                            </>
                          ) : (
                            <>
                              <div className="max-w-md">
                                <div className="flex items-center gap-3 p-3 bg-[var(--surface-1)] rounded-xl border border-[rgba(var(--site-primary-rgb),0.15)] transition-all">
                                  <div className="w-9 h-9 rounded-lg bg-[rgba(var(--site-primary-rgb),0.12)] flex items-center justify-center shrink-0">
                                    <DollarSign size={iconSize.md} className="text-[var(--site-primary)]" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <Label variant="card">Precio mínimo</Label>
                                    <p className="text-sm font-mono font-medium text-[var(--site-primary)]">
                                      {computedPrecioDesde || "—"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <p className={cn(
                                "text-[var(--text-muted)] mt-2",
                                fontSize.label,
                                lineHeight.relaxed
                              )}>
                                {computedPrecioDesde
                                  ? "Precio calculado desde las unidades disponibles de esta tipología"
                                  : t("tipologias.noUnitsHint")}
                              </p>
                            </>
                          )}
                        </div>

                        <div>
                          <Label>{t("tipologias.features")}</Label>
                          <div className={cn("flex flex-wrap mb-2", gap.normal)}>
                            {form.caracteristicas.map((c, i) => (
                              <span
                                key={i}
                                className={cn(
                                  "flex items-center px-3 py-1 bg-[rgba(var(--site-primary-rgb),0.15)] text-[var(--site-primary)] border border-[rgba(var(--site-primary-rgb),0.2)]",
                                  gap.compact,
                                  fontSize.subtitle,
                                  radius.full
                                )}
                              >
                                {c}
                                <button
                                  onClick={() => removeCaracteristica(i)}
                                  className="hover:text-white transition-colors"
                                >
                                  <X size={iconSize.xs} />
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

                        {/* ── Especificaciones (Áreas + Espacios unified) ── */}
                        <div>
                          <Label variant="section">{t("tipologias.specsAreas")}</Label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {tipFields.area_m2 && (
                              <div className="flex items-center gap-3 p-3 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all">
                                <div className="w-9 h-9 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                                  <Maximize size={iconSize.md} className="text-[var(--text-tertiary)]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <Label variant="card">{t("tipologias.internalArea")}</Label>
                                  <input type="number" value={form.area_m2} onChange={(e) => updateForm("area_m2", e.target.value)} placeholder="0" className="w-full bg-transparent text-sm font-mono text-white placeholder:text-[var(--text-muted)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                </div>
                                {form.area_m2 && <span className="text-[11px] font-mono text-[var(--text-muted)] shrink-0">m²</span>}
                              </div>
                            )}
                            {tipFields.area_balcon && (
                              <div className="flex items-center gap-3 p-3 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all">
                                <div className="w-9 h-9 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                                  <Palmtree size={iconSize.md} className="text-[var(--text-tertiary)]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <Label variant="card">{t("tipologias.balconyArea")}</Label>
                                  <input type="number" value={form.area_balcon} onChange={(e) => updateForm("area_balcon", e.target.value)} placeholder="0" className="w-full bg-transparent text-sm font-mono text-white placeholder:text-[var(--text-muted)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                </div>
                                {form.area_balcon && <span className="text-[11px] font-mono text-[var(--text-muted)] shrink-0">m²</span>}
                              </div>
                            )}
                            {tipFields.area_m2 && (
                              <div className="flex items-center gap-3 p-3 bg-[var(--surface-1)] rounded-xl border border-[rgba(var(--site-primary-rgb),0.15)] transition-all">
                                <div className="w-9 h-9 rounded-lg bg-[rgba(var(--site-primary-rgb),0.12)] flex items-center justify-center shrink-0">
                                  <LayoutGrid size={iconSize.md} className="text-[var(--site-primary)]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <Label variant="card">{t("tipologias.totalArea")}</Label>
                                  <p className="text-sm font-mono font-medium text-[var(--site-primary)]">
                                    {form.area_m2 || form.area_balcon
                                      ? `${((parseFloat(form.area_m2) || 0) + (parseFloat(form.area_balcon) || 0)).toFixed(1)} m²`
                                      : "—"}
                                  </p>
                                </div>
                              </div>
                            )}
                            {tipFields.area_construida && (
                            <div className="flex items-center gap-3 p-3 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all">
                              <div className="w-9 h-9 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                                <Ruler size={iconSize.md} className="text-[var(--text-tertiary)]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <Label variant="card">{t("inventario.columns.areaConstruida")}</Label>
                                <input type="number" value={form.area_construida} onChange={(e) => updateForm("area_construida", e.target.value)} placeholder="0" className="w-full bg-transparent text-sm font-mono text-white placeholder:text-[var(--text-muted)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                              </div>
                              {form.area_construida && <span className="text-[11px] font-mono text-[var(--text-muted)] shrink-0">m²</span>}
                            </div>
                            )}
                            {tipFields.area_privada && (
                            <div className="flex items-center gap-3 p-3 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all">
                              <div className="w-9 h-9 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                                <Home size={iconSize.md} className="text-[var(--text-tertiary)]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <Label variant="card">{t("inventario.columns.areaPrivada")}</Label>
                                <input type="number" value={form.area_privada} onChange={(e) => updateForm("area_privada", e.target.value)} placeholder="0" className="w-full bg-transparent text-sm font-mono text-white placeholder:text-[var(--text-muted)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                              </div>
                              {form.area_privada && <span className="text-[11px] font-mono text-[var(--text-muted)] shrink-0">m²</span>}
                            </div>
                            )}
                            {tipFields.area_lote && (
                              <div className="flex items-center gap-3 p-3 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all">
                                <div className="w-9 h-9 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                                  <LandPlot size={iconSize.md} className="text-[var(--text-tertiary)]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <Label variant="card">{t("inventario.columns.areaLote")}</Label>
                                  <input type="number" value={form.area_lote} onChange={(e) => updateForm("area_lote", e.target.value)} placeholder="0" className="w-full bg-transparent text-sm font-mono text-white placeholder:text-[var(--text-muted)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                </div>
                                {form.area_lote && <span className="text-[11px] font-mono text-[var(--text-muted)] shrink-0">m²</span>}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* ── Espacios ── */}
                        <div>
                          <Label variant="section">{t("tipologias.specsSpaces")}</Label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {tipFields.habitaciones && (
                            <div className="flex items-center gap-3 p-3 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all">
                              <div className="w-9 h-9 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                                <BedDouble size={iconSize.md} className="text-[var(--text-tertiary)]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <Label variant="card">{t("tipologias.bedrooms")}</Label>
                                <input type="number" value={form.habitaciones} onChange={(e) => updateForm("habitaciones", e.target.value)} placeholder="0" className="w-full bg-transparent text-sm font-mono text-white placeholder:text-[var(--text-muted)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                              </div>
                            </div>
                            )}
                            {tipFields.banos && (
                            <div className="flex items-center gap-3 p-3 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all">
                              <div className="w-9 h-9 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                                <Bath size={iconSize.md} className="text-[var(--text-tertiary)]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <Label variant="card">{t("tipologias.bathrooms")}</Label>
                                <input type="number" value={form.banos} onChange={(e) => updateForm("banos", e.target.value)} placeholder="0" className="w-full bg-transparent text-sm font-mono text-white placeholder:text-[var(--text-muted)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                              </div>
                            </div>
                            )}
                            {tipFields.parqueaderos && (
                            <div className="flex items-center gap-3 p-3 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all">
                              <div className="w-9 h-9 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                                <Car size={iconSize.md} className="text-[var(--text-tertiary)]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <Label variant="card">{t("tipologias.parking")}</Label>
                                <input type="number" value={form.parqueaderos} onChange={(e) => updateForm("parqueaderos", e.target.value)} placeholder="0" className="w-full bg-transparent text-sm font-mono text-white placeholder:text-[var(--text-muted)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                              </div>
                            </div>
                            )}
                            {tipFields.depositos && (
                            <div className="flex items-center gap-3 p-3 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all">
                              <div className="w-9 h-9 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                                <Archive size={iconSize.md} className="text-[var(--text-tertiary)]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <Label variant="card">Depósitos</Label>
                                <input type="number" value={form.depositos} onChange={(e) => updateForm("depositos", e.target.value)} placeholder="0" className="w-full bg-transparent text-sm font-mono text-white placeholder:text-[var(--text-muted)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                              </div>
                            </div>
                            )}
                          </div>
                        </div>

                        {/* ── Extras (conditional on project config) ── */}
                        {TIPO_EXTRAS.some(e => (project as any)[e.projectFlag]) && (
                          <div>
                            <Label>{t("tipologias.extras") || "Extras"}</Label>
                            <div className={cn("grid grid-cols-2 mt-1", gap.compact)}>
                              {TIPO_EXTRAS.filter(e => (project as any)[e.projectFlag]).map((extra) => {
                                const isOn = form[extra.field] as boolean;
                                const ExtraIcon = extra.icon;
                                return (
                                  <button
                                    key={extra.field}
                                    type="button"
                                    onClick={() => updateForm(extra.field, !isOn)}
                                    className={cn(
                                      "flex items-center gap-3 p-3 rounded-xl border transition-all",
                                      isOn
                                        ? "bg-[rgba(var(--site-primary-rgb),0.08)] border-[rgba(var(--site-primary-rgb),0.3)]"
                                        : "bg-[var(--surface-1)] border-[var(--border-subtle)] hover:border-[var(--border-default)]"
                                    )}
                                  >
                                    <div className={cn(
                                      "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                                      isOn ? "bg-[rgba(var(--site-primary-rgb),0.12)]" : "bg-[var(--surface-2)]"
                                    )}>
                                      <ExtraIcon size={iconSize.md} className={isOn ? "text-[var(--site-primary)]" : "text-[var(--text-tertiary)]"} />
                                    </div>
                                    <span className={cn("flex-1 text-xs font-medium text-left", isOn ? "text-white" : "text-[var(--text-tertiary)]")}>
                                      {t(extra.labelKey)}
                                    </span>
                                    <div className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0", isOn ? "bg-[var(--site-primary)]" : "bg-[var(--surface-3)]")}>
                                      <span className={cn("inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform", isOn ? "translate-x-[18px]" : "translate-x-[3px]")} />
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                      </>
                    )}

                    {/* ── TAB: Multimedia ── */}
                    {activeTab === "multimedia" && (
                      <>
                        {/* ── Video vinculado ── */}
                        {(project.videos || []).length > 0 ? (
                          <div>
                            <Label className="flex items-center gap-1.5">
                              <Video size={iconSize.xs} className="text-[var(--site-primary)]" />
                              {t("tipologias.linkedVideo")}
                            </Label>
                            <select
                              value={form.video_id || ""}
                              onChange={(e) => {
                                const newVideoId = e.target.value || null;
                                updateForm("video_id", newVideoId);
                                if (selectedId && !isCreating) {
                                  saveTipologia({
                                    tipologiaId: selectedId,
                                    payload: { video_id: newVideoId },
                                    optimisticUpdate: (prev) => ({
                                      ...prev,
                                      tipologias: prev.tipologias.map((t) =>
                                        t.id === selectedId
                                          ? { ...t, video_id: newVideoId }
                                          : t
                                      ),
                                    }),
                                  });
                                }
                              }}
                              className={inputClass}
                            >
                              <option value="">{t("tipologias.noVideoLinked")}</option>
                              {(project.videos || [])
                                .filter((v) => !v.stream_uid || v.stream_status === "ready")
                                .map((v) => (
                                  <option key={v.id} value={v.id}>
                                    {v.titulo || `Video ${(v.orden ?? 0) + 1}`}
                                  </option>
                                ))}
                            </select>
                            <p className={cn("text-[var(--text-muted)] mt-1.5", fontSize.label)}>
                              {t("tipologias.linkedVideoHint")}
                            </p>
                          </div>
                        ) : (
                          <div className="p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] text-center">
                            <Video size={iconSize.lg} className="text-[var(--text-muted)] mx-auto mb-2" />
                            <p className={cn("text-[var(--text-tertiary)]", fontSize.subtitle)}>
                              {t("tipologias.noVideoLinked")}
                            </p>
                            <p className={cn("text-[var(--text-muted)] mt-1", fontSize.label)}>
                              {t("tipologias.linkedVideoHint")}
                            </p>
                          </div>
                        )}

                        {/* ── Tour 360 vinculado ── */}
                        <div>
                          <Label className="flex items-center gap-1.5">
                            <View size={iconSize.xs} className="text-[var(--site-primary)]" />
                            {t("tipologias.linkedTour")}
                          </Label>
                          <input
                            type="text"
                            value={form.tour_360_url}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const extracted = extractTourUrl(raw);
                              updateForm("tour_360_url", extracted);
                              if (selectedId && !isCreating) {
                                saveTipologia({
                                  tipologiaId: selectedId,
                                  payload: { tour_360_url: extracted || null },
                                  optimisticUpdate: (prev) => ({
                                    ...prev,
                                    tipologias: prev.tipologias.map((t) =>
                                      t.id === selectedId
                                        ? { ...t, tour_360_url: extracted || null }
                                        : t
                                    ),
                                  }),
                                });
                              }
                            }}
                            placeholder={t("tipologias.linkedTourPlaceholder")}
                            className={inputClass}
                          />
                          <p className={cn("text-[var(--text-muted)] mt-1.5", fontSize.label)}>
                            {t("tipologias.linkedTourHint")}
                          </p>
                        </div>
                      </>
                    )}

                    {/* ── TAB: Plano ── */}
                    {activeTab === "plano" && (
                      <div className="space-y-6">
                        {/* Floor tabs */}
                        <div>
                          <Label>{t("tipologias.floors")}</Label>
                          <div className={cn("flex items-center flex-wrap mt-1", gap.compact)}>
                            {form.pisos.map((piso, i) => (
                              <button
                                key={piso.id}
                                onClick={() => setActivePisoIndex(i)}
                                className={cn(
                                  "px-3 py-1.5 font-medium transition-all",
                                  radius.md,
                                  fontSize.subtitle,
                                  activePisoIndex === i
                                    ? "bg-[var(--site-primary)] text-black"
                                    : "bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                                )}
                              >
                                {piso.nombre}
                              </button>
                            ))}
                            <button
                              onClick={addFloor}
                              className={cn(
                                "flex items-center px-3 py-1.5 text-[var(--text-muted)] hover:text-[var(--text-secondary)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-all border border-dashed border-[var(--border-subtle)]",
                                gap.compact,
                                radius.md,
                                fontSize.subtitle
                              )}
                            >
                              <Plus size={iconSize.xs} />
                              {t("tipologias.addFloor")}
                            </button>
                          </div>
                        </div>

                        {/* Active floor form */}
                        {form.pisos.length > 0 && form.pisos[activePisoIndex] && (
                          <>
                            {/* Floor name */}
                            <div>
                              <Label>{t("tipologias.floorName")}</Label>
                              <input
                                type="text"
                                value={form.pisos[activePisoIndex].nombre}
                                onChange={(e) => updatePiso(activePisoIndex, { nombre: e.target.value })}
                                placeholder="Plano 1"
                                className={inputClass + " max-w-[280px]"}
                              />
                            </div>

                            {/* Floor plan image */}
                            <div>
                              <Label>{t("tipologias.floorPlanImage")}</Label>
                              <div className="max-w-[280px]">
                                <FileUploader
                                  currentUrl={form.pisos[activePisoIndex].plano_url || null}
                                  onUpload={(url) => updatePiso(activePisoIndex, { plano_url: url })}
                                  folder={`proyectos/${projectId}/tipologias`}
                                  label={t("tipologias.uploadFloorPlan")}
                                  aspect="square"
                                />
                              </div>
                              {form.pisos[activePisoIndex].plano_url && (
                                <p className="text-[10px] text-[var(--text-muted)] mt-3">
                                  {t("tipologias.floorPlanHotspotsHint")}
                                </p>
                              )}
                            </div>

                            {/* Remove floor */}
                            {form.pisos.length > 1 && (
                              <button
                                onClick={() => removeFloor(activePisoIndex)}
                                className={cn(
                                  "flex items-center text-red-400 hover:text-red-300 transition-colors",
                                  gap.normal,
                                  fontSize.subtitle
                                )}
                              >
                                <Trash2 size={iconSize.xs} />
                                {t("tipologias.removeFloor")}
                              </button>
                            )}
                          </>
                        )}

                        {/* Empty state */}
                        {form.pisos.length === 0 && (
                          <div className="text-center py-10">
                            <p className={cn(
                              "text-[var(--text-tertiary)] mb-3",
                              fontSize.subtitle
                            )}>
                              {t("tipologias.noFloorsYet")}
                            </p>
                            <button onClick={addFloor} className={btnPrimary}>
                              <Plus size={iconSize.sm} />
                              {t("tipologias.addFirstFloor")}
                            </button>
                          </div>
                        )}

                        {/* Location image (global, not per-floor) */}
                        <div>
                          <Label>{t("tipologias.locationInProject")}</Label>
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
                      <div className="h-full flex flex-col">
                        {/* Floor selector (only if multiple floors) */}
                        {form.pisos.length > 1 && (
                          <div className={cn("flex items-center mb-2 shrink-0", gap.compact)}>
                            {form.pisos.map((piso, i) => (
                              <button
                                key={piso.id}
                                onClick={() => setActivePisoIndex(i)}
                                className={cn(
                                  "px-3 py-1.5 transition-all",
                                  radius.md,
                                  fontSize.subtitle,
                                  activePisoIndex === i
                                    ? "bg-[var(--site-primary)] text-black font-medium"
                                    : "bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                                )}
                              >
                                {piso.nombre}
                                {piso.hotspots.length > 0 && (
                                  <span className={cn("ml-1.5 opacity-60", fontSize.caption)}>
                                    ({piso.hotspots.length})
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Copy hotspots */}
                        {form.pisos[activePisoIndex]?.plano_url && (
                          <div className="flex items-center justify-end mb-2 shrink-0">
                            <CopyHotspotsDropdown
                              tipologias={tipologias}
                              currentId={selectedId}
                              currentHotspotCount={form.pisos[activePisoIndex]?.hotspots.length ?? 0}
                              onCopy={(hotspots) => updatePiso(activePisoIndex, { hotspots })}
                            />
                          </div>
                        )}

                        {form.pisos[activePisoIndex]?.plano_url ? (
                          <div className="flex-1 min-h-0">
                            <HotspotEditor
                              imageUrl={form.pisos[activePisoIndex].plano_url}
                              hotspots={form.pisos[activePisoIndex].hotspots}
                              onChange={(hotspots) => updatePiso(activePisoIndex, { hotspots })}
                              uploadFolder={`proyectos/${projectId}/tipologias`}
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-16 text-center">
                            <MousePointerClick size={iconSize.xl} className="text-[var(--text-muted)] mb-3" />
                            <p className={cn(
                              "text-[var(--text-tertiary)] mb-1",
                              fontSize.md
                            )}>
                              {form.pisos.length === 0 ? t("tipologias.noFloorsYet") : t("tipologias.noFloorPlan")}
                            </p>
                            <p className={cn(
                              "text-[var(--text-muted)]",
                              fontSize.subtitle
                            )}>
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

              {/* Validation error bar (if any) */}
              {validationError && (
                <div className="px-6 py-3 border-t border-[var(--border-subtle)] shrink-0">
                  <InlineError
                    message={validationError}
                    onRetry={() => setValidationError(null)}
                    variant="compact"
                  />
                </div>
              )}
            </>
          ) : (
            /* No selection placeholder */
            <div className={cn(
              "flex-1 flex items-center justify-center text-[var(--text-muted)]",
              fontSize.subtitle
            )}>
              {t("tipologias.selectOrCreate")}
            </div>
          )}
        </div>

      </div>

      {/* ═══ CONFIG MODAL (director+) ═══ */}
      {canConfigure && (
        <TipologiasConfigModal
          open={configModalOpen}
          onClose={() => setConfigModalOpen(false)}
        />
      )}
    </motion.div>
  );
}
