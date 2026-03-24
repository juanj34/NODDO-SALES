"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useEditorProject } from "@/hooks/useEditorProject";
import { useToast } from "@/components/dashboard/Toast";
import { useConfirm } from "@/components/dashboard/ConfirmModal";
import {
  inputClass, labelClass, fieldHint,
  sectionCard, sectionTitle, sectionDescription,
  badgeGold,
} from "@/components/dashboard/editor-styles";
import { PageHeader } from "@/components/dashboard/base/PageHeader";
import {
  Settings, MessageCircle, Tags, Eye, EyeOff, Car, Package,
  Link2, Building2, Home, MapPin, Layers,
  Maximize, DollarSign, BedDouble, Bath, Compass,
  RotateCcw, TableProperties, Ruler, LandPlot,
  Waves, Sparkles,
  UtensilsCrossed, Sun, TreePine, DoorClosed, BookOpen,
  Flame, MoveVertical, CloudSun, Store,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation, useLanguage } from "@/i18n";
import { CurrencyInput } from "@/components/dashboard/CurrencyInput";
import { cn } from "@/lib/utils";
import { getInventoryColumns, getDefaultColumns, getHybridInventoryColumns, getDefaultColumnsForTipo, INVENTORY_COLUMN_KEYS } from "@/lib/inventory-columns";
import type { InventoryColumnConfig, InventoryColumnsByType, ComplementoMode, TipoTipologia } from "@/types";

/* ── Column icon map ────────────────────────────────────────────── */

const COLUMN_ICON_MAP: Record<string, LucideIcon> = {
  Maximize, DollarSign, BedDouble, Bath, Car, Package,
  Compass, Eye, Building2, MapPin, Layers, Ruler, Home, LandPlot,
};

/* ── Column category groups ─────────────────────────────────────── */

interface ColumnCategory {
  id: string;
  labelKey: string;
  icon: LucideIcon;
  columns: (keyof InventoryColumnConfig)[];
}

const COLUMN_CATEGORIES: ColumnCategory[] = [
  { id: "financial", labelKey: "config.columns.categories.financial", icon: DollarSign, columns: ["precio"] },
  { id: "dimensions", labelKey: "config.columns.categories.dimensions", icon: Maximize, columns: ["area_m2", "area_construida", "area_privada", "area_lote"] },
  { id: "spaces", labelKey: "config.columns.categories.spaces", icon: BedDouble, columns: ["habitaciones", "banos", "parqueaderos", "depositos"] },
  { id: "location", labelKey: "config.columns.categories.location", icon: MapPin, columns: ["orientacion", "vista", "piso", "lote", "etapa"] },
];

/* ── Extras config array ────────────────────────────────────────── */

interface ExtraConfig {
  key: string;
  icon: LucideIcon;
  projectField: string;
  labelKey: string;
  hintKey: string;
}

const EXTRAS_CONFIG: ExtraConfig[] = [
  { key: "jacuzzi", icon: Bath, projectField: "habilitar_extra_jacuzzi", labelKey: "config.extras.jacuzzi", hintKey: "config.extras.jacuzziHint" },
  { key: "piscina", icon: Waves, projectField: "habilitar_extra_piscina", labelKey: "config.extras.piscina", hintKey: "config.extras.piscinaHint" },
  { key: "bbq", icon: UtensilsCrossed, projectField: "habilitar_extra_bbq", labelKey: "config.extras.bbq", hintKey: "config.extras.bbqHint" },
  { key: "terraza", icon: Sun, projectField: "habilitar_extra_terraza", labelKey: "config.extras.terraza", hintKey: "config.extras.terrazaHint" },
  { key: "jardin", icon: TreePine, projectField: "habilitar_extra_jardin", labelKey: "config.extras.jardin", hintKey: "config.extras.jardinHint" },
  { key: "cuarto_servicio", icon: DoorClosed, projectField: "habilitar_extra_cuarto_servicio", labelKey: "config.extras.cuartoServicio", hintKey: "config.extras.cuartoServicioHint" },
  { key: "estudio", icon: BookOpen, projectField: "habilitar_extra_estudio", labelKey: "config.extras.estudio", hintKey: "config.extras.estudioHint" },
  { key: "chimenea", icon: Flame, projectField: "habilitar_extra_chimenea", labelKey: "config.extras.chimenea", hintKey: "config.extras.chimeneaHint" },
  { key: "doble_altura", icon: MoveVertical, projectField: "habilitar_extra_doble_altura", labelKey: "config.extras.dobleAltura", hintKey: "config.extras.dobleAlturaHint" },
  { key: "rooftop", icon: CloudSun, projectField: "habilitar_extra_rooftop", labelKey: "config.extras.rooftop", hintKey: "config.extras.rooftopHint" },
];

/* ── Component ──────────────────────────────────────────────────── */

export default function ConfigPage() {
  const { project, save, projectId } = useEditorProject();
  const { t } = useTranslation("editor");
  const toast = useToast();
  const { confirm } = useConfirm();
  const { dictionary } = useLanguage();
  const groupingOptions = ((dictionary.editor as Record<string, Record<string, Record<string, unknown>>>).config.grouping.options) as readonly string[];

  /* ── Existing state ── */
  const initialWhatsapp = useMemo(() => project?.whatsapp_numero || "", [project?.whatsapp_numero]);
  const initialEtapa = useMemo(() => project?.etapa_label || "Grid", [project?.etapa_label]);
  const initialUnitPrefix = useMemo(() => project?.unidad_display_prefix || "", [project?.unidad_display_prefix]);
  const initialBadge = useMemo(() => project?.hide_noddo_badge ?? false, [project?.hide_noddo_badge]);
  const initialParqMode = useMemo(() => (project?.parqueaderos_mode ?? "sin_inventario") as ComplementoMode, [project?.parqueaderos_mode]);
  const initialDepoMode = useMemo(() => (project?.depositos_mode ?? "sin_inventario") as ComplementoMode, [project?.depositos_mode]);
  const initialParqPrecioBase = useMemo(() => project?.parqueaderos_precio_base ?? null, [project?.parqueaderos_precio_base]);
  const initialDepoPrecioBase = useMemo(() => project?.depositos_precio_base ?? null, [project?.depositos_precio_base]);

  const [whatsappNumero, setWhatsappNumero] = useState(initialWhatsapp);
  const [etapaLabel, setEtapaLabel] = useState(initialEtapa);
  const [unitPrefix, setUnitPrefix] = useState(initialUnitPrefix);
  const [hideNoddoBadge, setHideNoddoBadge] = useState(initialBadge);
  const [ocultarVendidas, setOcultarVendidas] = useState(false);
  const [ocultarPrecioVendidas, setOcultarPrecioVendidas] = useState(false);
  const [extrasEnabled, setExtrasEnabled] = useState<Record<string, boolean>>({});
  const [parqueaderosMode, setParqueaderosMode] = useState<ComplementoMode>(initialParqMode);
  const [depositosMode, setDepositosMode] = useState<ComplementoMode>(initialDepoMode);
  const [parqueaderosPrecioBase, setParqueaderosPrecioBase] = useState<number | null>(initialParqPrecioBase);
  const [depositosPrecioBase, setDepositosPrecioBase] = useState<number | null>(initialDepoPrecioBase);

  /* ── New state (moved from General) ── */
  const [slug, setSlug] = useState("");
  const [tipoProyecto, setTipoProyecto] = useState<"apartamentos" | "casas" | "hibrido" | "lotes">("hibrido");
  const [tipologiaMode, setTipologiaMode] = useState<"fija" | "multiple">("fija");
  const [precioSource, setPrecioSource] = useState<"unidad" | "tipologia">("unidad");
  const [inventoryColumns, setInventoryColumns] = useState<InventoryColumnConfig | null>(null);
  const [inventoryColumnsByType, setInventoryColumnsByType] = useState<InventoryColumnsByType | null>(null);
  const [inventoryColumnsMicrosite, setInventoryColumnsMicrosite] = useState<InventoryColumnConfig | null>(null);
  const [inventoryColumnsMicrositeByType, setInventoryColumnsMicrositeByType] = useState<InventoryColumnsByType | null>(null);
  const [columnsViewTab, setColumnsViewTab] = useState<"editor" | "microsite">("editor");

  /* ── Sync state from project ── */
  useEffect(() => {
    if (!project) return;
    setSlug(project.slug || "");
    setTipoProyecto(project.tipo_proyecto || "hibrido");
    setTipologiaMode(project.tipologia_mode || "fija");
    setPrecioSource((project.precio_source ?? "unidad") as "unidad" | "tipologia");
    setInventoryColumns(project.inventory_columns ?? null);
    setInventoryColumnsByType(project.inventory_columns_by_type ?? null);
    setInventoryColumnsMicrosite((project as any).inventory_columns_microsite ?? null);
    setInventoryColumnsMicrositeByType((project as any).inventory_columns_microsite_by_type ?? null);
    setWhatsappNumero(project.whatsapp_numero || "");
    setEtapaLabel(project.etapa_label || "Grid");
    setUnitPrefix(project.unidad_display_prefix || "");
    setHideNoddoBadge(project.hide_noddo_badge ?? false);
    setOcultarVendidas((project as any).ocultar_vendidas ?? false);
    setOcultarPrecioVendidas((project as any).ocultar_precio_vendidas ?? false);
    const extrasState: Record<string, boolean> = {};
    for (const extra of EXTRAS_CONFIG) {
      extrasState[extra.key] = (project as any)[extra.projectField] ?? false;
    }
    setExtrasEnabled(extrasState);
    setParqueaderosMode((project.parqueaderos_mode ?? "sin_inventario") as ComplementoMode);
    setDepositosMode((project.depositos_mode ?? "sin_inventario") as ComplementoMode);
    setParqueaderosPrecioBase(project.parqueaderos_precio_base ?? null);
    setDepositosPrecioBase(project.depositos_precio_base ?? null);
  }, [project]);

  /* ── Computed inventory columns ── */
  const isHibrido = tipoProyecto === "hibrido";
  const effectiveColumns = useMemo(
    () => getInventoryColumns(tipoProyecto, inventoryColumns),
    [tipoProyecto, inventoryColumns]
  );
  const effectiveColumnsMicrosite = useMemo(
    () => getInventoryColumns(tipoProyecto, inventoryColumnsMicrosite),
    [tipoProyecto, inventoryColumnsMicrosite]
  );
  const isCustomColumns = inventoryColumns !== null;
  const isCustomColumnsMicrosite = inventoryColumnsMicrosite !== null;
  const activeColumnCount = useMemo(
    () => Object.values(effectiveColumns).filter(Boolean).length,
    [effectiveColumns]
  );
  const activeColumnCountMicrosite = useMemo(
    () => Object.values(effectiveColumnsMicrosite).filter(Boolean).length,
    [effectiveColumnsMicrosite]
  );

  /* ── Per-type column helpers (hybrid + commercial) ── */
  const hasCommercialTipos = useMemo(() =>
    (project.tipologias || []).some(t => t.tipo_tipologia === "local_comercial"),
    [project.tipologias]
  );
  const showPerTypeColumns = isHibrido || hasCommercialTipos;

  const TIPO_TAB_LABELS: { id: TipoTipologia; labelKey: string; icon: LucideIcon }[] = [
    { id: "apartamento", labelKey: "inventario.tabApartamentos", icon: Building2 },
    { id: "casa", labelKey: "inventario.tabCasas", icon: Home },
    { id: "lote", labelKey: "inventario.tabLotes", icon: MapPin },
    { id: "local_comercial", labelKey: "inventario.tabLocales", icon: Store },
  ];

  // Filter to only tipos that have tipologías in this project
  const activeTipoTabs = useMemo(() => {
    const types = new Set((project.tipologias || []).map(t => t.tipo_tipologia).filter(Boolean));
    return TIPO_TAB_LABELS.filter(tab => types.has(tab.id));
  }, [project.tipologias]);

  const getEffectiveColumnsForTipo = useCallback((tipo: TipoTipologia) =>
    getHybridInventoryColumns(tipo, inventoryColumnsByType),
    [inventoryColumnsByType]
  );

  const getEffectiveColumnsForTipoMicrosite = useCallback((tipo: TipoTipologia) =>
    getHybridInventoryColumns(tipo, inventoryColumnsMicrositeByType),
    [inventoryColumnsMicrositeByType]
  );

  const isCustomColumnsByType = inventoryColumnsByType !== null;
  const isCustomColumnsByTypeMicrosite = inventoryColumnsMicrositeByType !== null;

  /* ── Save handler ── */
  const handleSave = useCallback(async () => {
    const ok = await save({
      slug,
      tipo_proyecto: tipoProyecto,
      tipologia_mode: tipologiaMode,
      precio_source: precioSource,
      inventory_columns: inventoryColumns,
      inventory_columns_by_type: inventoryColumnsByType,
      inventory_columns_microsite: inventoryColumnsMicrosite,
      inventory_columns_microsite_by_type: inventoryColumnsMicrositeByType,
      whatsapp_numero: whatsappNumero || null,
      etapa_label: etapaLabel || "Grid",
      unidad_display_prefix: unitPrefix || null,
      hide_noddo_badge: hideNoddoBadge,
      ocultar_vendidas: ocultarVendidas,
      ocultar_precio_vendidas: ocultarPrecioVendidas,
      ...Object.fromEntries(EXTRAS_CONFIG.map(e => [e.projectField, extrasEnabled[e.key] ?? false])),
      parqueaderos_mode: parqueaderosMode,
      depositos_mode: depositosMode,
      parqueaderos_precio_base: parqueaderosMode === "precio_base" ? parqueaderosPrecioBase : null,
      depositos_precio_base: depositosMode === "precio_base" ? depositosPrecioBase : null,
    } as any);
    if (!ok) toast.error(t("general.saveError"));
  }, [save, slug, tipoProyecto, tipologiaMode, precioSource, inventoryColumns, inventoryColumnsByType, inventoryColumnsMicrosite, inventoryColumnsMicrositeByType, whatsappNumero, etapaLabel, unitPrefix, hideNoddoBadge, ocultarVendidas, ocultarPrecioVendidas, extrasEnabled, parqueaderosMode, depositosMode, parqueaderosPrecioBase, depositosPrecioBase, toast, t]);

  /* ── Auto-save ── */
  const handleSaveRef = useRef(handleSave);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);

  const scheduleAutoSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => handleSaveRef.current(), 1500);
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        handleSaveRef.current();
      }
    };
  }, []);

  /* ── Tipo de proyecto change with confirmation ── */
  const handleTipoProyectoChange = useCallback(async (newTipo: typeof tipoProyecto) => {
    if (newTipo === tipoProyecto) return;

    const hasData = (project?.unidades?.length ?? 0) > 0 || (project?.torres?.length ?? 0) > 0;

    if (hasData) {
      const ok = await confirm({
        title: t("config.projectType.changeTitle"),
        message: t("config.projectType.changeMessage"),
        confirmLabel: t("config.projectType.changeConfirm"),
        cancelLabel: t("config.projectType.changeCancel"),
        variant: "warning",
      });
      if (!ok) return;
    }

    setTipoProyecto(newTipo);
    setInventoryColumns(null); // reset to new type defaults
    setInventoryColumnsByType(null); // reset hybrid configs too
    setInventoryColumnsMicrosite(null); // reset microsite columns too
    setInventoryColumnsMicrositeByType(null); // reset microsite hybrid configs too
    scheduleAutoSave();
  }, [tipoProyecto, project?.unidades?.length, project?.torres?.length, confirm, t, scheduleAutoSave]);

  /* ── Column toggle handler ── */
  const handleColumnToggle = useCallback((key: keyof InventoryColumnConfig) => {
    const current = getInventoryColumns(tipoProyecto, inventoryColumns);
    const updated = { ...current, [key]: !current[key] };
    setInventoryColumns(updated);
    scheduleAutoSave();
  }, [tipoProyecto, inventoryColumns, scheduleAutoSave]);

  const handleResetColumns = useCallback(() => {
    setInventoryColumns(null);
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  /* ── Hybrid: per-type column toggle ── */
  const handleHybridColumnToggle = useCallback((tipo: TipoTipologia, key: keyof InventoryColumnConfig) => {
    setInventoryColumnsByType(prev => {
      const current = prev ?? {};
      const currentConfig = getHybridInventoryColumns(tipo, prev);
      return { ...current, [tipo]: { ...currentConfig, [key]: !currentConfig[key] } };
    });
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  const handleResetHybridColumns = useCallback((tipo: TipoTipologia) => {
    setInventoryColumnsByType(prev => {
      if (!prev) return null;
      const updated = { ...prev };
      delete updated[tipo];
      return Object.keys(updated).length === 0 ? null : updated;
    });
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  const handleResetAllHybridColumns = useCallback(() => {
    setInventoryColumnsByType(null);
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  /* ── Microsite column handlers ── */
  const handleColumnToggleMicrosite = useCallback((key: keyof InventoryColumnConfig) => {
    const current = getInventoryColumns(tipoProyecto, inventoryColumnsMicrosite);
    const updated = { ...current, [key]: !current[key] };
    setInventoryColumnsMicrosite(updated);
    scheduleAutoSave();
  }, [tipoProyecto, inventoryColumnsMicrosite, scheduleAutoSave]);

  const handleResetColumnsMicrosite = useCallback(() => {
    setInventoryColumnsMicrosite(null);
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  const handleHybridColumnToggleMicrosite = useCallback((tipo: TipoTipologia, key: keyof InventoryColumnConfig) => {
    setInventoryColumnsMicrositeByType(prev => {
      const current = prev ?? {};
      const currentConfig = getHybridInventoryColumns(tipo, prev);
      return { ...current, [tipo]: { ...currentConfig, [key]: !currentConfig[key] } };
    });
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  const handleResetHybridColumnsMicrosite = useCallback((tipo: TipoTipologia) => {
    setInventoryColumnsMicrositeByType(prev => {
      if (!prev) return null;
      const updated = { ...prev };
      delete updated[tipo];
      return Object.keys(updated).length === 0 ? null : updated;
    });
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  const handleResetAllHybridColumnsMicrosite = useCallback(() => {
    setInventoryColumnsMicrositeByType(null);
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      {/* Page Header */}
      <PageHeader
        icon={Settings}
        title={t("config.title")}
        description={t("config.description")}
      />

      {/* ── General Configuration ── */}
      <>

      {/* ═══════════════════════════════════════════════════════════
          URL del Micrositio (Slug)
          ═══════════════════════════════════════════════════════════ */}
      <div className={sectionCard}>
        <div className={sectionTitle}>
          <Link2 size={15} className="text-[var(--site-primary)]" />
          {t("config.slug.title")}
        </div>
        <p className={sectionDescription}>{t("config.slug.description")}</p>

        <div>
          <label className={labelClass}>{t("config.slug.label")}</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => { setSlug(e.target.value); scheduleAutoSave(); }}
            placeholder={t("config.slug.placeholder")}
            className={inputClass}
          />
          <p className={fieldHint}>
            {t("config.slug.hint", { slug: slug || "tu-proyecto" })}
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          Tipo de Proyecto
          ═══════════════════════════════════════════════════════════ */}
      <div className={sectionCard}>
        <div className={sectionTitle}>
          <Building2 size={15} className="text-[var(--site-primary)]" />
          {t("config.projectType.title")}
        </div>
        <p className={sectionDescription}>{t("config.projectType.description")}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {([
            { id: "apartamentos" as const, icon: Building2, labelKey: "config.projectType.apartamentos", descKey: "config.projectType.apartamentosDesc" },
            { id: "casas" as const, icon: Home, labelKey: "config.projectType.casas", descKey: "config.projectType.casasDesc" },
            { id: "lotes" as const, icon: MapPin, labelKey: "config.projectType.lotes", descKey: "config.projectType.lotesDesc" },
            { id: "hibrido" as const, icon: Layers, labelKey: "config.projectType.hibrido", descKey: "config.projectType.hibridoDesc" },
          ]).map((tipo) => {
            const isActive = tipoProyecto === tipo.id;
            const Icon = tipo.icon;
            return (
              <button
                key={tipo.id}
                type="button"
                onClick={() => handleTipoProyectoChange(tipo.id)}
                className={cn(
                  "flex flex-col gap-2 p-3 rounded-xl border transition-all text-left",
                  isActive
                    ? "bg-[rgba(var(--site-primary-rgb),0.08)] border-[rgba(var(--site-primary-rgb),0.3)]"
                    : "bg-[var(--surface-1)] border-[var(--border-subtle)] hover:border-[var(--border-default)]"
                )}
              >
                <Icon size={18} className={cn("shrink-0", isActive ? "text-[var(--site-primary)]" : "text-[var(--text-tertiary)]")} />
                <div>
                  <p className={cn("text-xs font-medium", isActive ? "text-white" : "text-[var(--text-secondary)]")}>
                    {t(tipo.labelKey)}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                    {t(tipo.descKey)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        <p className={fieldHint}>{t("config.projectType.hint")}</p>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          Modo de Tipología (conditional)
          ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {(tipoProyecto === "casas" || tipoProyecto === "hibrido" || tipoProyecto === "lotes") && (
          <motion.div
            key="tipologia-mode"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className={sectionCard}>
              <div className={sectionTitle}>
                <Layers size={15} className="text-[var(--site-primary)]" />
                {t("config.tipologiaMode.title")}
              </div>
              <p className={sectionDescription}>{t("config.tipologiaMode.description")}</p>

              <div className="grid grid-cols-2 gap-2">
                {([
                  { id: "fija" as const, labelKey: "config.tipologiaMode.fija", descKey: "config.tipologiaMode.fijaDesc" },
                  { id: "multiple" as const, labelKey: "config.tipologiaMode.multiple", descKey: "config.tipologiaMode.multipleDesc" },
                ]).map((mode) => {
                  const isActive = tipologiaMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => { setTipologiaMode(mode.id); scheduleAutoSave(); }}
                      className={cn(
                        "flex flex-col gap-1.5 p-3 rounded-xl border transition-all text-left",
                        isActive
                          ? "bg-[rgba(var(--site-primary-rgb),0.08)] border-[rgba(var(--site-primary-rgb),0.3)]"
                          : "bg-[var(--surface-1)] border-[var(--border-subtle)] hover:border-[var(--border-default)]"
                      )}
                    >
                      <p className={cn("text-xs font-medium", isActive ? "text-white" : "text-[var(--text-secondary)]")}>
                        {t(mode.labelKey)}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                        {t(mode.descKey)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════
          Fuente de Precios
          ═══════════════════════════════════════════════════════════ */}
      <div className={sectionCard}>
        <div className={sectionTitle}>
          <DollarSign size={15} className="text-[var(--site-primary)]" />
          {t("config.precioSource.title")}
        </div>
        <p className={sectionDescription}>{t("config.precioSource.description")}</p>

        <div className="grid grid-cols-2 gap-2">
          {([
            { id: "unidad" as const, labelKey: "config.precioSource.unidad", descKey: "config.precioSource.unidadDesc" },
            { id: "tipologia" as const, labelKey: "config.precioSource.tipologia", descKey: "config.precioSource.tipologiaDesc" },
          ]).map((mode) => {
            const isActive = precioSource === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => { setPrecioSource(mode.id); scheduleAutoSave(); }}
                className={cn(
                  "flex flex-col gap-1.5 p-3 rounded-xl border transition-all text-left",
                  isActive
                    ? "bg-[rgba(var(--site-primary-rgb),0.08)] border-[rgba(var(--site-primary-rgb),0.3)]"
                    : "bg-[var(--surface-1)] border-[var(--border-subtle)] hover:border-[var(--border-default)]"
                )}
              >
                <p className={cn("text-xs font-medium", isActive ? "text-white" : "text-[var(--text-secondary)]")}>
                  {t(mode.labelKey)}
                </p>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                  {t(mode.descKey)}
                </p>
              </button>
            );
          })}
        </div>
        <p className={fieldHint}>{t("config.precioSource.hint")}</p>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          Columnas del Inventario — Premium Design with Editor/Microsite Tabs
          ═══════════════════════════════════════════════════════════ */}
      <div className={sectionCard}>
        {/* Header row: title only */}
        <div>
          <div className={sectionTitle}>
            <TableProperties size={15} className="text-[var(--site-primary)]" />
            {isHibrido ? t("config.columns.byTypeTitle") : t("config.columns.title")}
          </div>
          <p className={sectionDescription}>
            {isHibrido ? t("config.columns.byTypeDescription") : t("config.columns.description")}
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 mt-5 mb-6 p-1 bg-[var(--surface-2)] rounded-xl w-fit">
          {([
            { id: "editor" as const, label: t("config.columns.tabs.editor"), desc: t("config.columns.tabs.editorDesc") },
            { id: "microsite" as const, label: t("config.columns.tabs.microsite"), desc: t("config.columns.tabs.micrositeDesc") },
          ]).map((tab) => {
            const isActive = columnsViewTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setColumnsViewTab(tab.id)}
                className={cn(
                  "relative px-4 py-2.5 rounded-lg transition-all font-ui text-xs font-bold uppercase tracking-[0.08em]",
                  isActive
                    ? "bg-[var(--site-primary)] text-[var(--surface-0)] shadow-[0_2px_8px_rgba(var(--site-primary-rgb),0.3)]"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-white/5"
                )}
                title={tab.desc}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Badge + Reset button row */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <p className="text-xs text-[var(--text-tertiary)]">
            {columnsViewTab === "editor"
              ? t("config.columns.tabs.editorDesc")
              : t("config.columns.tabs.micrositeDesc")
            }
          </p>
          <div className="flex items-center gap-2.5 shrink-0">
            {!isHibrido && columnsViewTab === "editor" && (
              <>
                <span className={badgeGold}>
                  {activeColumnCount}/{INVENTORY_COLUMN_KEYS.length}
                </span>
                {isCustomColumns && (
                  <button
                    type="button"
                    onClick={handleResetColumns}
                    className="flex items-center gap-1.5 text-[10px] font-ui font-bold uppercase tracking-[0.08em] text-[var(--text-tertiary)] hover:text-[var(--site-primary)] transition-colors"
                  >
                    <RotateCcw size={11} />
                    {t("config.columns.reset")}
                  </button>
                )}
              </>
            )}
            {!isHibrido && columnsViewTab === "microsite" && (
              <>
                <span className={badgeGold}>
                  {activeColumnCountMicrosite}/{INVENTORY_COLUMN_KEYS.length}
                </span>
                {isCustomColumnsMicrosite && (
                  <button
                    type="button"
                    onClick={handleResetColumnsMicrosite}
                    className="flex items-center gap-1.5 text-[10px] font-ui font-bold uppercase tracking-[0.08em] text-[var(--text-tertiary)] hover:text-[var(--site-primary)] transition-colors"
                  >
                    <RotateCcw size={11} />
                    {t("config.columns.reset")}
                  </button>
                )}
              </>
            )}
            {isHibrido && columnsViewTab === "editor" && isCustomColumnsByType && (
              <button
                type="button"
                onClick={handleResetAllHybridColumns}
                className="flex items-center gap-1.5 text-[10px] font-ui font-bold uppercase tracking-[0.08em] text-[var(--text-tertiary)] hover:text-[var(--site-primary)] transition-colors"
              >
                <RotateCcw size={11} />
                {t("config.columns.reset")}
              </button>
            )}
            {isHibrido && columnsViewTab === "microsite" && isCustomColumnsByTypeMicrosite && (
              <button
                type="button"
                onClick={handleResetAllHybridColumnsMicrosite}
                className="flex items-center gap-1.5 text-[10px] font-ui font-bold uppercase tracking-[0.08em] text-[var(--text-tertiary)] hover:text-[var(--site-primary)] transition-colors"
              >
                <RotateCcw size={11} />
                {t("config.columns.reset")}
              </button>
            )}
          </div>
        </div>

        {/* ── Tab Content: Editor Columns ── */}
        {columnsViewTab === "editor" && !isHibrido && (
          <div className="space-y-5">
            {COLUMN_CATEGORIES.map((category) => {
              const CategoryIcon = category.icon;
              return (
                <div key={category.id}>
                  <div className="flex items-center gap-2.5 mb-3">
                    <CategoryIcon size={13} className="text-[var(--text-tertiary)] shrink-0" />
                    <span className="font-ui text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-tertiary)] whitespace-nowrap">
                      {t(category.labelKey)}
                    </span>
                    <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {category.columns.map((colKey) => {
                      const colDef = INVENTORY_COLUMN_KEYS.find(c => c.key === colKey);
                      if (!colDef) return null;
                      const ColIcon = COLUMN_ICON_MAP[colDef.icon];
                      const isOn = effectiveColumns[colKey];
                      return (
                        <button
                          key={colKey}
                          type="button"
                          onClick={() => handleColumnToggle(colKey)}
                          className={cn(
                            "flex items-center gap-3 px-3.5 py-2.5 rounded-[0.75rem] transition-all cursor-pointer group",
                            isOn
                              ? "bg-[var(--surface-2)] border-l-[3px] border-l-[var(--site-primary)] border-t border-r border-b border-t-[var(--border-subtle)] border-r-[var(--border-subtle)] border-b-[var(--border-subtle)]"
                              : "bg-[var(--surface-1)] border-l-[3px] border-l-transparent border-t border-r border-b border-t-[var(--border-subtle)] border-r-[var(--border-subtle)] border-b-[var(--border-subtle)] hover:border-t-[var(--border-default)] hover:border-r-[var(--border-default)] hover:border-b-[var(--border-default)]"
                          )}
                        >
                          <div className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                            isOn ? "bg-[rgba(var(--site-primary-rgb),0.12)]" : "bg-[var(--surface-3)]"
                          )}>
                            {ColIcon && <ColIcon size={14} className={cn("transition-colors", isOn ? "text-[var(--site-primary)]" : "text-[var(--text-muted)]")} />}
                          </div>
                          <span className={cn("flex-1 text-xs font-medium text-left transition-colors", isOn ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]")}>
                            {t(colDef.labelKey)}
                          </span>
                          <div className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0", isOn ? "bg-[var(--site-primary)]" : "bg-[var(--surface-3)]")}>
                            <span className={cn("inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform", isOn ? "translate-x-[18px]" : "translate-x-[3px]")} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Tab Content: Microsite Columns ── */}
        {columnsViewTab === "microsite" && !isHibrido && (
          <div className="space-y-5">
            {COLUMN_CATEGORIES.map((category) => {
              const CategoryIcon = category.icon;
              return (
                <div key={category.id}>
                  <div className="flex items-center gap-2.5 mb-3">
                    <CategoryIcon size={13} className="text-[var(--text-tertiary)] shrink-0" />
                    <span className="font-ui text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-tertiary)] whitespace-nowrap">
                      {t(category.labelKey)}
                    </span>
                    <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {category.columns.map((colKey) => {
                      const colDef = INVENTORY_COLUMN_KEYS.find(c => c.key === colKey);
                      if (!colDef) return null;
                      const ColIcon = COLUMN_ICON_MAP[colDef.icon];
                      const isOn = effectiveColumnsMicrosite[colKey];
                      return (
                        <button
                          key={colKey}
                          type="button"
                          onClick={() => handleColumnToggleMicrosite(colKey)}
                          className={cn(
                            "flex items-center gap-3 px-3.5 py-2.5 rounded-[0.75rem] transition-all cursor-pointer group",
                            isOn
                              ? "bg-[var(--surface-2)] border-l-[3px] border-l-[var(--site-primary)] border-t border-r border-b border-t-[var(--border-subtle)] border-r-[var(--border-subtle)] border-b-[var(--border-subtle)]"
                              : "bg-[var(--surface-1)] border-l-[3px] border-l-transparent border-t border-r border-b border-t-[var(--border-subtle)] border-r-[var(--border-subtle)] border-b-[var(--border-subtle)] hover:border-t-[var(--border-default)] hover:border-r-[var(--border-default)] hover:border-b-[var(--border-default)]"
                          )}
                        >
                          <div className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                            isOn ? "bg-[rgba(var(--site-primary-rgb),0.12)]" : "bg-[var(--surface-3)]"
                          )}>
                            {ColIcon && <ColIcon size={14} className={cn("transition-colors", isOn ? "text-[var(--site-primary)]" : "text-[var(--text-muted)]")} />}
                          </div>
                          <span className={cn("flex-1 text-xs font-medium text-left transition-colors", isOn ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]")}>
                            {t(colDef.labelKey)}
                          </span>
                          <div className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0", isOn ? "bg-[var(--site-primary)]" : "bg-[var(--surface-3)]")}>
                            <span className={cn("inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform", isOn ? "translate-x-[18px]" : "translate-x-[3px]")} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Tab Content: Editor Columns (Per-type) ── */}
        {columnsViewTab === "editor" && showPerTypeColumns && (
          <div className="space-y-6">
            {activeTipoTabs.map(({ id: tipo, labelKey, icon: TipoIcon }) => {
              const tipoColumns = getEffectiveColumnsForTipo(tipo);
              const tipoActive = Object.values(tipoColumns).filter(Boolean).length;
              const hasCustom = inventoryColumnsByType?.[tipo] !== undefined;

              return (
                <div key={tipo} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] overflow-hidden">
                  {/* Type header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-[var(--surface-2)] border-b border-[var(--border-subtle)]">
                    <div className="flex items-center gap-2.5">
                      <TipoIcon size={14} className="text-[var(--site-primary)]" />
                      <span className="font-ui text-xs font-bold uppercase tracking-[0.08em] text-[var(--text-primary)]">
                        {t(labelKey)}
                      </span>
                      <span className={badgeGold}>{tipoActive}/{INVENTORY_COLUMN_KEYS.length}</span>
                    </div>
                    {hasCustom && (
                      <button
                        type="button"
                        onClick={() => handleResetHybridColumns(tipo)}
                        className="flex items-center gap-1.5 text-[10px] font-ui font-bold uppercase tracking-[0.08em] text-[var(--text-tertiary)] hover:text-[var(--site-primary)] transition-colors"
                      >
                        <RotateCcw size={10} />
                        {t("config.columns.reset")}
                      </button>
                    )}
                  </div>

                  {/* Column toggles */}
                  <div className="p-4 space-y-4">
                    {COLUMN_CATEGORIES.map((category) => {
                      const CategoryIcon = category.icon;
                      return (
                        <div key={category.id}>
                          <div className="flex items-center gap-2.5 mb-2">
                            <CategoryIcon size={11} className="text-[var(--text-muted)] shrink-0" />
                            <span className="font-ui text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)] whitespace-nowrap">
                              {t(category.labelKey)}
                            </span>
                            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {category.columns.map((colKey) => {
                              const colDef = INVENTORY_COLUMN_KEYS.find(c => c.key === colKey);
                              if (!colDef) return null;
                              const ColIcon = COLUMN_ICON_MAP[colDef.icon];
                              const isOn = tipoColumns[colKey];
                              return (
                                <button
                                  key={colKey}
                                  type="button"
                                  onClick={() => handleHybridColumnToggle(tipo, colKey)}
                                  className={cn(
                                    "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all cursor-pointer",
                                    isOn
                                      ? "bg-[rgba(var(--site-primary-rgb),0.06)] border border-[rgba(var(--site-primary-rgb),0.2)]"
                                      : "bg-[var(--surface-0)] border border-[var(--border-subtle)] hover:border-[var(--border-default)]"
                                  )}
                                >
                                  {ColIcon && <ColIcon size={12} className={cn("shrink-0 transition-colors", isOn ? "text-[var(--site-primary)]" : "text-[var(--text-muted)]")} />}
                                  <span className={cn("flex-1 text-[11px] text-left transition-colors", isOn ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]")}>
                                    {t(colDef.labelKey)}
                                  </span>
                                  <div className={cn("relative inline-flex h-4 w-7 items-center rounded-full transition-colors shrink-0", isOn ? "bg-[var(--site-primary)]" : "bg-[var(--surface-3)]")}>
                                    <span className={cn("inline-block h-3 w-3 rounded-full bg-white shadow-sm transition-transform", isOn ? "translate-x-[14px]" : "translate-x-[2px]")} />
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
              );
            })}
          </div>
        )}

        {/* ── Tab Content: Microsite Columns (Per-type) ── */}
        {columnsViewTab === "microsite" && showPerTypeColumns && (
          <div className="space-y-6">
            {activeTipoTabs.map(({ id: tipo, labelKey, icon: TipoIcon }) => {
              const tipoColumns = getEffectiveColumnsForTipoMicrosite(tipo);
              const tipoActive = Object.values(tipoColumns).filter(Boolean).length;
              const hasCustom = inventoryColumnsMicrositeByType?.[tipo] !== undefined;

              return (
                <div key={tipo} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] overflow-hidden">
                  {/* Type header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-[var(--surface-2)] border-b border-[var(--border-subtle)]">
                    <div className="flex items-center gap-2.5">
                      <TipoIcon size={14} className="text-[var(--site-primary)]" />
                      <span className="font-ui text-xs font-bold uppercase tracking-[0.08em] text-[var(--text-primary)]">
                        {t(labelKey)}
                      </span>
                      <span className={badgeGold}>{tipoActive}/{INVENTORY_COLUMN_KEYS.length}</span>
                    </div>
                    {hasCustom && (
                      <button
                        type="button"
                        onClick={() => handleResetHybridColumnsMicrosite(tipo)}
                        className="flex items-center gap-1.5 text-[10px] font-ui font-bold uppercase tracking-[0.08em] text-[var(--text-tertiary)] hover:text-[var(--site-primary)] transition-colors"
                      >
                        <RotateCcw size={10} />
                        {t("config.columns.reset")}
                      </button>
                    )}
                  </div>

                  {/* Column toggles */}
                  <div className="p-4 space-y-4">
                    {COLUMN_CATEGORIES.map((category) => {
                      const CategoryIcon = category.icon;
                      return (
                        <div key={category.id}>
                          <div className="flex items-center gap-2.5 mb-2">
                            <CategoryIcon size={11} className="text-[var(--text-muted)] shrink-0" />
                            <span className="font-ui text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)] whitespace-nowrap">
                              {t(category.labelKey)}
                            </span>
                            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {category.columns.map((colKey) => {
                              const colDef = INVENTORY_COLUMN_KEYS.find(c => c.key === colKey);
                              if (!colDef) return null;
                              const ColIcon = COLUMN_ICON_MAP[colDef.icon];
                              const isOn = tipoColumns[colKey];
                              return (
                                <button
                                  key={colKey}
                                  type="button"
                                  onClick={() => handleHybridColumnToggleMicrosite(tipo, colKey)}
                                  className={cn(
                                    "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all cursor-pointer",
                                    isOn
                                      ? "bg-[rgba(var(--site-primary-rgb),0.06)] border border-[rgba(var(--site-primary-rgb),0.2)]"
                                      : "bg-[var(--surface-0)] border border-[var(--border-subtle)] hover:border-[var(--border-default)]"
                                  )}
                                >
                                  {ColIcon && <ColIcon size={12} className={cn("shrink-0 transition-colors", isOn ? "text-[var(--site-primary)]" : "text-[var(--text-muted)]")} />}
                                  <span className={cn("flex-1 text-[11px] text-left transition-colors", isOn ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]")}>
                                    {t(colDef.labelKey)}
                                  </span>
                                  <div className={cn("relative inline-flex h-4 w-7 items-center rounded-full transition-colors shrink-0", isOn ? "bg-[var(--site-primary)]" : "bg-[var(--surface-3)]")}>
                                    <span className={cn("inline-block h-3 w-3 rounded-full bg-white shadow-sm transition-transform", isOn ? "translate-x-[14px]" : "translate-x-[2px]")} />
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
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          Etiqueta de agrupación
          ═══════════════════════════════════════════════════════════ */}
      <div className={sectionCard}>
        <div className={sectionTitle}>
          <Tags size={15} className="text-[var(--site-primary)]" />
          {t("config.grouping.title")}
        </div>
        <p className={sectionDescription}>{t("config.grouping.description")}</p>

        <div>
          <label className={labelClass}>{t("config.grouping.label")}</label>
          <input
            type="text"
            list="etapa-label-options"
            value={etapaLabel}
            onChange={(e) => { setEtapaLabel(e.target.value); scheduleAutoSave(); }}
            placeholder={groupingOptions[0]}
            className={inputClass}
          />
          <datalist id="etapa-label-options">
            {groupingOptions.map((opt) => (
              <option key={opt} value={opt} />
            ))}
          </datalist>
          <p className={fieldHint}>
            {t("config.grouping.hint")}
          </p>
        </div>

        <div>
          <label className={labelClass}>Prefijo de unidades</label>
          <input
            type="text"
            list="unit-prefix-options"
            value={unitPrefix}
            onChange={(e) => { setUnitPrefix(e.target.value); scheduleAutoSave(); }}
            placeholder="Ej: Casa, Apto, Lote"
            className={inputClass}
          />
          <datalist id="unit-prefix-options">
            {["Casa", "Villa", "Apartamento", "Lote", "Unidad", "Local", "Oficina", "Bodega"].map((opt) => (
              <option key={opt} value={opt} />
            ))}
          </datalist>
          <p className={fieldHint}>
            Se muestra antes del identificador en el micrositio. Ej: &quot;Casa 19&quot;
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          Contacto
          ═══════════════════════════════════════════════════════════ */}
      <div className={sectionCard}>
        <div className={sectionTitle}>
          <MessageCircle size={15} className="text-[var(--site-primary)]" />
          {t("config.contact.title")}
        </div>
        <p className={sectionDescription}>{t("config.contact.description")}</p>

        <div>
          <label className={labelClass}>{t("config.contact.whatsapp")}</label>
          <input
            type="text"
            value={whatsappNumero}
            onChange={(e) => { setWhatsappNumero(e.target.value); scheduleAutoSave(); }}
            placeholder={t("config.contact.whatsappPlaceholder")}
            className={inputClass}
          />
          <p className={fieldHint}>
            {t("config.contact.whatsappHint")}
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          Badge Powered by Noddo
          ═══════════════════════════════════════════════════════════ */}
      <div className={sectionCard}>
        <div className={sectionTitle}>
          <Eye size={15} className="text-[var(--site-primary)]" />
          {t("config.badge.title")}
        </div>
        <p className={sectionDescription}>{t("config.badge.description")}</p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={hideNoddoBadge}
            onClick={() => { setHideNoddoBadge(!hideNoddoBadge); scheduleAutoSave(); }}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
              hideNoddoBadge ? "bg-[var(--site-primary)]" : "bg-[var(--surface-3)]"
            }`}
          >
            <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
              hideNoddoBadge ? "translate-x-[18px]" : "translate-x-[3px]"
            }`} />
          </button>
          <span className="text-sm text-[var(--text-secondary)]">{t("config.badge.hide")}</span>
        </div>
        <p className={fieldHint}>{t("config.badge.hideHint")}</p>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          Ocultar vendidas
          ═══════════════════════════════════════════════════════════ */}
      <div className={sectionCard}>
        <div className={sectionTitle}>
          <EyeOff size={15} className="text-[var(--site-primary)]" />
          {t("config.ocultarVendidas.title")}
        </div>
        <p className={sectionDescription}>{t("config.ocultarVendidas.description")}</p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={ocultarVendidas}
            onClick={() => { setOcultarVendidas(!ocultarVendidas); scheduleAutoSave(); }}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
              ocultarVendidas ? "bg-[var(--site-primary)]" : "bg-[var(--surface-3)]"
            }`}
          >
            <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
              ocultarVendidas ? "translate-x-[18px]" : "translate-x-[3px]"
            }`} />
          </button>
          <span className="text-sm text-[var(--text-secondary)]">{t("config.ocultarVendidas.hide")}</span>
        </div>
        <p className={fieldHint}>{t("config.ocultarVendidas.hideHint")}</p>

        <div className="flex items-center gap-3 mt-4">
          <button
            type="button"
            role="switch"
            aria-checked={ocultarPrecioVendidas}
            onClick={() => { setOcultarPrecioVendidas(!ocultarPrecioVendidas); scheduleAutoSave(); }}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
              ocultarPrecioVendidas ? "bg-[var(--site-primary)]" : "bg-[var(--surface-3)]"
            }`}
          >
            <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
              ocultarPrecioVendidas ? "translate-x-[18px]" : "translate-x-[3px]"
            }`} />
          </button>
          <span className="text-sm text-[var(--text-secondary)]">{t("config.ocultarVendidas.hidePrice")}</span>
        </div>
        <p className={fieldHint}>{t("config.ocultarVendidas.hidePriceHint")}</p>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          Extras de Tipología
          ═══════════════════════════════════════════════════════════ */}
      <div className={sectionCard}>
        <div className={sectionTitle}>
          <Sparkles size={15} className="text-[var(--site-primary)]" />
          {t("config.extras.title")}
        </div>
        <p className={sectionDescription}>{t("config.extras.description")}</p>

        <div className="space-y-4">
          {EXTRAS_CONFIG.map((extra) => {
            const isOn = extrasEnabled[extra.key] ?? false;
            const ExtraIcon = extra.icon;
            return (
              <div key={extra.key}>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isOn}
                    onClick={() => { setExtrasEnabled(prev => ({ ...prev, [extra.key]: !prev[extra.key] })); scheduleAutoSave(); }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                      isOn ? "bg-[var(--site-primary)]" : "bg-[var(--surface-3)]"
                    }`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
                      isOn ? "translate-x-[18px]" : "translate-x-[3px]"
                    }`} />
                  </button>
                  <ExtraIcon size={15} className={isOn ? "text-[var(--site-primary)]" : "text-[var(--text-muted)]"} />
                  <span className="text-sm text-[var(--text-secondary)]">{t(extra.labelKey)}</span>
                </div>
                <p className={cn(fieldHint, "ml-12")}>{t(extra.hintKey)}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          Parqueaderos
          ═══════════════════════════════════════════════════════════ */}
      <div className={sectionCard}>
        <div className={sectionTitle}>
          <Car size={15} className="text-[var(--site-primary)]" />
          Parqueaderos
        </div>
        <p className={sectionDescription}>
          Define cómo se manejan los parqueaderos en este proyecto.
        </p>
        <div className="grid gap-3">
          {([
            { value: "sin_inventario" as ComplementoMode, label: "Sin inventario", desc: "Cantidad por unidad, incluido en el precio" },
            { value: "precio_base" as ComplementoMode, label: "Precio base", desc: "Precio fijo por item sin inventario individual — cantidad × precio base" },
            { value: "inventario_incluido" as ComplementoMode, label: "Inventario incluido", desc: "Items individuales asignables, precio incluido en la unidad" },
            { value: "inventario_separado" as ComplementoMode, label: "Inventario separado", desc: "Items individuales con precio propio que suma al total" },
          ]).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { setParqueaderosMode(opt.value); scheduleAutoSave(); }}
              className={`text-left p-3 rounded-[0.75rem] border transition-all cursor-pointer ${
                parqueaderosMode === opt.value
                  ? "border-[var(--site-primary)] bg-[rgba(var(--site-primary-rgb),0.08)]"
                  : "border-[var(--border-subtle)] bg-[var(--surface-1)] hover:border-[var(--border-default)]"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                  parqueaderosMode === opt.value
                    ? "border-[var(--site-primary)]"
                    : "border-[var(--border-default)]"
                }`}>
                  {parqueaderosMode === opt.value && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--site-primary)]" />
                  )}
                </div>
                <span className={`text-sm font-medium ${
                  parqueaderosMode === opt.value ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
                }`}>{opt.label}</span>
              </div>
              <p className="mt-1 ml-5.5 text-xs text-[var(--text-tertiary)]">{opt.desc}</p>
            </button>
          ))}
        </div>
        {parqueaderosMode === "precio_base" && (
          <div className="mt-4">
            <label className={labelClass}>Precio base por parqueadero</label>
            <CurrencyInput
              value={parqueaderosPrecioBase ?? ""}
              onChange={(v) => { setParqueaderosPrecioBase(v ? Number(v) : null); scheduleAutoSave(); }}
              currency={project.moneda_base || "COP"}
              placeholder="50,000,000"
              inputClassName={inputClass}
            />
            <p className={fieldHint}>Este valor se multiplica por la cantidad de parqueaderos de cada unidad/tipología</p>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          Depósitos
          ═══════════════════════════════════════════════════════════ */}
      <div className={sectionCard}>
        <div className={sectionTitle}>
          <Package size={15} className="text-[var(--site-primary)]" />
          Depósitos
        </div>
        <p className={sectionDescription}>
          Define cómo se manejan los depósitos / útiles en este proyecto.
        </p>
        <div className="grid gap-3">
          {([
            { value: "sin_inventario" as ComplementoMode, label: "Sin inventario", desc: "Cantidad por unidad, incluido en el precio" },
            { value: "precio_base" as ComplementoMode, label: "Precio base", desc: "Precio fijo por item sin inventario individual — cantidad × precio base" },
            { value: "inventario_incluido" as ComplementoMode, label: "Inventario incluido", desc: "Items individuales asignables, precio incluido en la unidad" },
            { value: "inventario_separado" as ComplementoMode, label: "Inventario separado", desc: "Items individuales con precio propio que suma al total" },
          ]).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { setDepositosMode(opt.value); scheduleAutoSave(); }}
              className={`text-left p-3 rounded-[0.75rem] border transition-all cursor-pointer ${
                depositosMode === opt.value
                  ? "border-[var(--site-primary)] bg-[rgba(var(--site-primary-rgb),0.08)]"
                  : "border-[var(--border-subtle)] bg-[var(--surface-1)] hover:border-[var(--border-default)]"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                  depositosMode === opt.value
                    ? "border-[var(--site-primary)]"
                    : "border-[var(--border-default)]"
                }`}>
                  {depositosMode === opt.value && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--site-primary)]" />
                  )}
                </div>
                <span className={`text-sm font-medium ${
                  depositosMode === opt.value ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
                }`}>{opt.label}</span>
              </div>
              <p className="mt-1 ml-5.5 text-xs text-[var(--text-tertiary)]">{opt.desc}</p>
            </button>
          ))}
        </div>
        {depositosMode === "precio_base" && (
          <div className="mt-4">
            <label className={labelClass}>Precio base por depósito</label>
            <CurrencyInput
              value={depositosPrecioBase ?? ""}
              onChange={(v) => { setDepositosPrecioBase(v ? Number(v) : null); scheduleAutoSave(); }}
              currency={project.moneda_base || "COP"}
              placeholder="25,000,000"
              inputClassName={inputClass}
            />
            <p className={fieldHint}>Este valor se multiplica por la cantidad de depósitos de cada unidad/tipología</p>
          </div>
        )}
      </div>

      </>
    </motion.div>
  );
}
