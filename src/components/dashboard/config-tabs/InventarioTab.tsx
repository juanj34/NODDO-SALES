"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useEditorProject } from "@/hooks/useEditorProject";
import { useToast } from "@/components/dashboard/Toast";
import {
  inputClass, labelClass, fieldHint,
  sectionCard, sectionTitle, sectionDescription,
  badgeGold,
} from "@/components/dashboard/editor-styles";
import {
  Eye, EyeOff, Car, Package,
  Building2, Home, MapPin, Layers,
  Maximize, DollarSign, BedDouble, Bath, Compass,
  RotateCcw, TableProperties, Ruler, LandPlot,
  Waves, Sparkles, Store,
  UtensilsCrossed, Sun, TreePine, DoorClosed, BookOpen,
  Flame, MoveVertical, CloudSun,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "@/i18n";
import { CurrencyInput } from "@/components/dashboard/CurrencyInput";
import { cn } from "@/lib/utils";
import { getInventoryColumns, getDefaultColumns, getHybridInventoryColumns, getDefaultColumnsForTipo, INVENTORY_COLUMN_KEYS } from "@/lib/inventory-columns";
import type { InventoryColumnConfig, InventoryColumnsByType, ComplementoMode, TipoTipologia, Orientacion, Vista } from "@/types";
import { X, Plus } from "lucide-react";

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

interface InventarioTabProps {
  orientaciones?: Orientacion[];
  vistas?: Vista[];
  onRefresh?: () => void;
}

export default function InventarioTab({ orientaciones = [], vistas = [], onRefresh }: InventarioTabProps = {}) {
  const { project, save, refresh } = useEditorProject();
  const { t } = useTranslation("editor");
  const toast = useToast();
  const refreshData = onRefresh || refresh;

  /* ── State ── */
  const [inventoryColumns, setInventoryColumns] = useState<InventoryColumnConfig | null>(null);
  const [inventoryColumnsByType, setInventoryColumnsByType] = useState<InventoryColumnsByType | null>(null);
  const [inventoryColumnsMicrosite, setInventoryColumnsMicrosite] = useState<InventoryColumnConfig | null>(null);
  const [inventoryColumnsMicrositeByType, setInventoryColumnsMicrositeByType] = useState<InventoryColumnsByType | null>(null);
  const [columnsViewTab, setColumnsViewTab] = useState<"editor" | "microsite">("editor");
  const [ocultarVendidas, setOcultarVendidas] = useState(false);
  const [ocultarPrecioVendidas, setOcultarPrecioVendidas] = useState(false);
  const [extrasEnabled, setExtrasEnabled] = useState<Record<string, boolean>>({});

  const [parqueaderosMode, setParqueaderosMode] = useState<ComplementoMode>("sin_inventario");
  const [depositosMode, setDepositosMode] = useState<ComplementoMode>("sin_inventario");
  const [parqueaderosPrecioBase, setParqueaderosPrecioBase] = useState<number | null>(null);
  const [depositosPrecioBase, setDepositosPrecioBase] = useState<number | null>(null);

  const [newOrientacion, setNewOrientacion] = useState("");
  const [savingOrientacion, setSavingOrientacion] = useState(false);
  const [newVista, setNewVista] = useState("");
  const [savingVista, setSavingVista] = useState(false);

  const hasPendingSave = useRef(false);

  /* ── Sync from project (skip if local edits are pending) ── */
  useEffect(() => {
    if (!project) return;
    if (hasPendingSave.current) return;
    setInventoryColumns(project.inventory_columns ?? null);
    setInventoryColumnsByType(project.inventory_columns_by_type ?? null);
    setInventoryColumnsMicrosite((project as any).inventory_columns_microsite ?? null);
    setInventoryColumnsMicrositeByType((project as any).inventory_columns_microsite_by_type ?? null);
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

  /* ── Computed ── */
  const tipoProyecto = project?.tipo_proyecto || "hibrido";
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

  /* ── Per-type column helpers ── */
  const showPerTypeColumns = isHibrido;

  const TIPO_TAB_LABELS: { id: TipoTipologia; labelKey: string; icon: LucideIcon }[] = [
    { id: "apartamento", labelKey: "inventario.tabApartamentos", icon: Building2 },
    { id: "casa", labelKey: "inventario.tabCasas", icon: Home },
    { id: "lote", labelKey: "inventario.tabLotes", icon: MapPin },
    { id: "local_comercial", labelKey: "inventario.tabLocales", icon: Store },
  ];

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
      inventory_columns: inventoryColumns,
      inventory_columns_by_type: inventoryColumnsByType,
      inventory_columns_microsite: inventoryColumnsMicrosite,
      inventory_columns_microsite_by_type: inventoryColumnsMicrositeByType,
      ocultar_vendidas: ocultarVendidas,
      ocultar_precio_vendidas: ocultarPrecioVendidas,
      ...Object.fromEntries(EXTRAS_CONFIG.map(e => [e.projectField, extrasEnabled[e.key] ?? false])),

      parqueaderos_mode: parqueaderosMode,
      depositos_mode: depositosMode,
      parqueaderos_precio_base: parqueaderosMode === "precio_base" ? parqueaderosPrecioBase : null,
      depositos_precio_base: depositosMode === "precio_base" ? depositosPrecioBase : null,
    } as any);
    hasPendingSave.current = false;
    if (!ok) toast.error(t("general.saveError"));
  }, [save, inventoryColumns, inventoryColumnsByType, inventoryColumnsMicrosite, inventoryColumnsMicrositeByType, ocultarVendidas, ocultarPrecioVendidas, extrasEnabled, parqueaderosMode, depositosMode, parqueaderosPrecioBase, depositosPrecioBase, toast, t]);

  /* ── Auto-save ── */
  const handleSaveRef = useRef(handleSave);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);

  const scheduleAutoSave = useCallback(() => {
    hasPendingSave.current = true;
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

  /* ── Column toggle handlers ── */
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

  /* ── Orientaciones & Vistas handlers ── */
  const handleAddOrientacion = useCallback(async () => {
    if (!newOrientacion.trim() || !project?.id) return;
    setSavingOrientacion(true);
    try {
      const response = await fetch("/api/orientaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proyecto_id: project.id, nombre: newOrientacion.trim() }),
      });
      if (!response.ok) throw new Error("Failed to create orientacion");
      setNewOrientacion("");
      toast.success(t("config.orientacionCreated") || "Orientación creada");
      refreshData();
    } catch (error) {
      toast.error(t("config.orientacionError") || "Error al crear orientación");
      console.error(error);
    } finally {
      setSavingOrientacion(false);
    }
  }, [newOrientacion, project?.id, refreshData, t, toast]);

  const handleDeleteOrientacion = useCallback(async (id: string) => {
    setSavingOrientacion(true);
    try {
      const response = await fetch(`/api/orientaciones/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete orientacion");
      toast.success(t("config.orientacionDeleted") || "Orientación eliminada");
      refreshData();
    } catch (error) {
      toast.error(t("config.orientacionError") || "Error al eliminar orientación");
      console.error(error);
    } finally {
      setSavingOrientacion(false);
    }
  }, [refreshData, t, toast]);

  const handleAddVista = useCallback(async () => {
    if (!newVista.trim() || !project?.id) return;
    setSavingVista(true);
    try {
      const response = await fetch("/api/vistas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proyecto_id: project.id, nombre: newVista.trim() }),
      });
      if (!response.ok) throw new Error("Failed to create vista");
      setNewVista("");
      toast.success(t("config.vistaCreated") || "Vista creada");
      refreshData();
    } catch (error) {
      toast.error(t("config.vistaError") || "Error al crear vista");
      console.error(error);
    } finally {
      setSavingVista(false);
    }
  }, [newVista, project?.id, refreshData, t, toast]);

  const handleDeleteVista = useCallback(async (id: string) => {
    setSavingVista(true);
    try {
      const response = await fetch(`/api/vistas/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete vista");
      toast.success(t("config.vistaDeleted") || "Vista eliminada");
      refreshData();
    } catch (error) {
      toast.error(t("config.vistaError") || "Error al eliminar vista");
      console.error(error);
    } finally {
      setSavingVista(false);
    }
  }, [refreshData, t, toast]);

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

  /* ── Reusable column grid renderer ── */
  const renderColumnGrid = useCallback((
    columns: InventoryColumnConfig,
    onToggle: (key: keyof InventoryColumnConfig) => void,
    size: "normal" | "compact" = "normal"
  ) => (
    <div className={size === "compact" ? "space-y-4" : "space-y-5"}>
      {COLUMN_CATEGORIES.map((category) => {
        const CategoryIcon = category.icon;
        return (
          <div key={category.id}>
            <div className="flex items-center gap-2.5 mb-2">
              <CategoryIcon size={size === "compact" ? 11 : 13} className={cn("shrink-0", size === "compact" ? "text-[var(--text-muted)]" : "text-[var(--text-tertiary)]")} />
              <span className={cn("font-ui font-bold uppercase whitespace-nowrap", size === "compact" ? "text-[9px] tracking-[0.12em] text-[var(--text-muted)]" : "text-[10px] tracking-[0.12em] text-[var(--text-tertiary)]")}>
                {t(category.labelKey)}
              </span>
              <div className="flex-1 h-px bg-[var(--border-subtle)]" />
            </div>
            <div className={cn("grid grid-cols-1 sm:grid-cols-2", size === "compact" ? "gap-1.5" : "gap-2")}>
              {category.columns.map((colKey) => {
                const colDef = INVENTORY_COLUMN_KEYS.find(c => c.key === colKey);
                if (!colDef) return null;
                const ColIcon = COLUMN_ICON_MAP[colDef.icon];
                const isOn = columns[colKey];
                return (
                  <button
                    key={colKey}
                    type="button"
                    onClick={() => onToggle(colKey)}
                    className={cn(
                      "flex items-center gap-3 transition-all cursor-pointer group",
                      size === "compact"
                        ? cn("gap-2.5 px-3 py-2 rounded-lg", isOn ? "bg-[rgba(var(--site-primary-rgb),0.06)] border border-[rgba(var(--site-primary-rgb),0.2)]" : "bg-[var(--surface-0)] border border-[var(--border-subtle)] hover:border-[var(--border-default)]")
                        : cn("px-3.5 py-2.5 rounded-[0.75rem]", isOn ? "bg-[var(--surface-2)] border-l-[3px] border-l-[var(--site-primary)] border-t border-r border-b border-t-[var(--border-subtle)] border-r-[var(--border-subtle)] border-b-[var(--border-subtle)]" : "bg-[var(--surface-1)] border-l-[3px] border-l-transparent border-t border-r border-b border-t-[var(--border-subtle)] border-r-[var(--border-subtle)] border-b-[var(--border-subtle)] hover:border-t-[var(--border-default)] hover:border-r-[var(--border-default)] hover:border-b-[var(--border-default)]")
                    )}
                  >
                    {size === "normal" && (
                      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors", isOn ? "bg-[rgba(var(--site-primary-rgb),0.12)]" : "bg-[var(--surface-3)]")}>
                        {ColIcon && <ColIcon size={14} className={cn("transition-colors", isOn ? "text-[var(--site-primary)]" : "text-[var(--text-muted)]")} />}
                      </div>
                    )}
                    {size === "compact" && ColIcon && (
                      <ColIcon size={12} className={cn("shrink-0 transition-colors", isOn ? "text-[var(--site-primary)]" : "text-[var(--text-muted)]")} />
                    )}
                    <span className={cn("flex-1 text-left transition-colors", size === "compact" ? "text-[11px]" : "text-xs font-medium", isOn ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]")}>
                      {t(colDef.labelKey)}
                    </span>
                    <div className={cn("relative inline-flex items-center rounded-full transition-colors shrink-0", size === "compact" ? "h-4 w-7" : "h-5 w-9", isOn ? "bg-[var(--site-primary)]" : "bg-[var(--surface-3)]")}>
                      <span className={cn("inline-block rounded-full bg-white shadow-sm transition-transform", size === "compact" ? "h-3 w-3" : "h-3.5 w-3.5", isOn ? (size === "compact" ? "translate-x-[14px]" : "translate-x-[18px]") : (size === "compact" ? "translate-x-[2px]" : "translate-x-[3px]"))} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  ), [t]);

  /* ── Reusable per-type column renderer ── */
  const renderPerTypeColumns = useCallback((
    getColumns: (tipo: TipoTipologia) => InventoryColumnConfig,
    getCustom: (tipo: TipoTipologia) => boolean,
    onToggle: (tipo: TipoTipologia, key: keyof InventoryColumnConfig) => void,
    onResetTipo: (tipo: TipoTipologia) => void,
  ) => (
    <div className="space-y-6">
      {activeTipoTabs.map(({ id: tipo, labelKey, icon: TipoIcon }) => {
        const tipoColumns = getColumns(tipo);
        const tipoActive = Object.values(tipoColumns).filter(Boolean).length;
        const hasCustom = getCustom(tipo);

        return (
          <div key={tipo} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] overflow-hidden">
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
                  onClick={() => onResetTipo(tipo)}
                  className="flex items-center gap-1.5 text-[10px] font-ui font-bold uppercase tracking-[0.08em] text-[var(--text-tertiary)] hover:text-[var(--site-primary)] transition-colors"
                >
                  <RotateCcw size={10} />
                  {t("config.columns.reset")}
                </button>
              )}
            </div>
            <div className="p-4">
              {renderColumnGrid(tipoColumns, (key) => onToggle(tipo, key), "compact")}
            </div>
          </div>
        );
      })}
    </div>
  ), [activeTipoTabs, t, renderColumnGrid]);

  return (
    <div className="space-y-8">
      {/* ═══ Columnas del Inventario ═══ */}
      <div className={sectionCard}>
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

        {/* Badge + Reset row */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <p className="text-xs text-[var(--text-tertiary)]">
            {columnsViewTab === "editor"
              ? t("config.columns.tabs.editorDesc")
              : t("config.columns.tabs.micrositeDesc")
            }
          </p>
          <div className="flex items-center gap-2.5 shrink-0">
            {!showPerTypeColumns && columnsViewTab === "editor" && (
              <>
                <span className={badgeGold}>{activeColumnCount}/{INVENTORY_COLUMN_KEYS.length}</span>
                {isCustomColumns && (
                  <button type="button" onClick={handleResetColumns} className="flex items-center gap-1.5 text-[10px] font-ui font-bold uppercase tracking-[0.08em] text-[var(--text-tertiary)] hover:text-[var(--site-primary)] transition-colors">
                    <RotateCcw size={11} /> {t("config.columns.reset")}
                  </button>
                )}
              </>
            )}
            {!showPerTypeColumns && columnsViewTab === "microsite" && (
              <>
                <span className={badgeGold}>{activeColumnCountMicrosite}/{INVENTORY_COLUMN_KEYS.length}</span>
                {isCustomColumnsMicrosite && (
                  <button type="button" onClick={handleResetColumnsMicrosite} className="flex items-center gap-1.5 text-[10px] font-ui font-bold uppercase tracking-[0.08em] text-[var(--text-tertiary)] hover:text-[var(--site-primary)] transition-colors">
                    <RotateCcw size={11} /> {t("config.columns.reset")}
                  </button>
                )}
              </>
            )}
            {showPerTypeColumns && columnsViewTab === "editor" && isCustomColumnsByType && (
              <button type="button" onClick={handleResetAllHybridColumns} className="flex items-center gap-1.5 text-[10px] font-ui font-bold uppercase tracking-[0.08em] text-[var(--text-tertiary)] hover:text-[var(--site-primary)] transition-colors">
                <RotateCcw size={11} /> {t("config.columns.reset")}
              </button>
            )}
            {showPerTypeColumns && columnsViewTab === "microsite" && isCustomColumnsByTypeMicrosite && (
              <button type="button" onClick={handleResetAllHybridColumnsMicrosite} className="flex items-center gap-1.5 text-[10px] font-ui font-bold uppercase tracking-[0.08em] text-[var(--text-tertiary)] hover:text-[var(--site-primary)] transition-colors">
                <RotateCcw size={11} /> {t("config.columns.reset")}
              </button>
            )}
          </div>
        </div>

        {/* Column content */}
        {columnsViewTab === "editor" && !showPerTypeColumns && renderColumnGrid(effectiveColumns, handleColumnToggle)}
        {columnsViewTab === "microsite" && !showPerTypeColumns && renderColumnGrid(effectiveColumnsMicrosite, handleColumnToggleMicrosite)}
        {columnsViewTab === "editor" && showPerTypeColumns && renderPerTypeColumns(getEffectiveColumnsForTipo, (tipo) => inventoryColumnsByType?.[tipo] !== undefined, handleHybridColumnToggle, handleResetHybridColumns)}
        {columnsViewTab === "microsite" && showPerTypeColumns && renderPerTypeColumns(getEffectiveColumnsForTipoMicrosite, (tipo) => inventoryColumnsMicrositeByType?.[tipo] !== undefined, handleHybridColumnToggleMicrosite, handleResetHybridColumnsMicrosite)}
      </div>

      {/* ═══ Ocultar vendidas ═══ */}
      <div className={sectionCard}>
        <div className={sectionTitle}>
          <EyeOff size={15} className="text-[var(--site-primary)]" />
          {t("config.ocultarVendidas.title")}
        </div>
        <p className={sectionDescription}>{t("config.ocultarVendidas.description")}</p>

        <div className="flex items-center gap-3">
          <button type="button" role="switch" aria-checked={ocultarVendidas} onClick={() => { setOcultarVendidas(!ocultarVendidas); scheduleAutoSave(); }}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${ocultarVendidas ? "bg-[var(--site-primary)]" : "bg-[var(--surface-3)]"}`}>
            <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${ocultarVendidas ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
          </button>
          <span className="text-sm text-[var(--text-secondary)]">{t("config.ocultarVendidas.hide")}</span>
        </div>
        <p className={fieldHint}>{t("config.ocultarVendidas.hideHint")}</p>

        <div className="flex items-center gap-3 mt-4">
          <button type="button" role="switch" aria-checked={ocultarPrecioVendidas} onClick={() => { setOcultarPrecioVendidas(!ocultarPrecioVendidas); scheduleAutoSave(); }}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${ocultarPrecioVendidas ? "bg-[var(--site-primary)]" : "bg-[var(--surface-3)]"}`}>
            <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${ocultarPrecioVendidas ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
          </button>
          <span className="text-sm text-[var(--text-secondary)]">{t("config.ocultarVendidas.hidePrice")}</span>
        </div>
        <p className={fieldHint}>{t("config.ocultarVendidas.hidePriceHint")}</p>
      </div>

      {/* ═══ Extras de Tipología ═══ */}
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
                  <button type="button" role="switch" aria-checked={isOn}
                    onClick={() => { setExtrasEnabled(prev => ({ ...prev, [extra.key]: !prev[extra.key] })); scheduleAutoSave(); }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${isOn ? "bg-[var(--site-primary)]" : "bg-[var(--surface-3)]"}`}>
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${isOn ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
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

      {/* ═══ Parqueaderos ═══ */}
      <div className={sectionCard}>
        <div className={sectionTitle}>
          <Car size={15} className="text-[var(--site-primary)]" />
          Parqueaderos
        </div>
        <p className={sectionDescription}>Define cómo se manejan los parqueaderos en este proyecto.</p>
        <div className="grid gap-3">
          {([
            { value: "sin_inventario" as ComplementoMode, label: "Sin inventario", desc: "Cantidad por unidad, incluido en el precio" },
            { value: "precio_base" as ComplementoMode, label: "Precio base", desc: "Precio fijo por item sin inventario individual — cantidad × precio base" },
            { value: "inventario_incluido" as ComplementoMode, label: "Inventario incluido", desc: "Items individuales asignables, precio incluido en la unidad" },
            { value: "inventario_separado" as ComplementoMode, label: "Inventario separado", desc: "Items individuales con precio propio que suma al total" },
          ]).map((opt) => (
            <button key={opt.value} type="button" onClick={() => { setParqueaderosMode(opt.value); scheduleAutoSave(); }}
              className={`text-left p-3 rounded-[0.75rem] border transition-all cursor-pointer ${parqueaderosMode === opt.value ? "border-[var(--site-primary)] bg-[rgba(var(--site-primary-rgb),0.08)]" : "border-[var(--border-subtle)] bg-[var(--surface-1)] hover:border-[var(--border-default)]"}`}>
              <div className="flex items-center gap-2">
                <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${parqueaderosMode === opt.value ? "border-[var(--site-primary)]" : "border-[var(--border-default)]"}`}>
                  {parqueaderosMode === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-[var(--site-primary)]" />}
                </div>
                <span className={`text-sm font-medium ${parqueaderosMode === opt.value ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>{opt.label}</span>
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

      {/* ═══ Depósitos ═══ */}
      <div className={sectionCard}>
        <div className={sectionTitle}>
          <Package size={15} className="text-[var(--site-primary)]" />
          Depósitos
        </div>
        <p className={sectionDescription}>Define cómo se manejan los depósitos / útiles en este proyecto.</p>
        <div className="grid gap-3">
          {([
            { value: "sin_inventario" as ComplementoMode, label: "Sin inventario", desc: "Cantidad por unidad, incluido en el precio" },
            { value: "precio_base" as ComplementoMode, label: "Precio base", desc: "Precio fijo por item sin inventario individual — cantidad × precio base" },
            { value: "inventario_incluido" as ComplementoMode, label: "Inventario incluido", desc: "Items individuales asignables, precio incluido en la unidad" },
            { value: "inventario_separado" as ComplementoMode, label: "Inventario separado", desc: "Items individuales con precio propio que suma al total" },
          ]).map((opt) => (
            <button key={opt.value} type="button" onClick={() => { setDepositosMode(opt.value); scheduleAutoSave(); }}
              className={`text-left p-3 rounded-[0.75rem] border transition-all cursor-pointer ${depositosMode === opt.value ? "border-[var(--site-primary)] bg-[rgba(var(--site-primary-rgb),0.08)]" : "border-[var(--border-subtle)] bg-[var(--surface-1)] hover:border-[var(--border-default)]"}`}>
              <div className="flex items-center gap-2">
                <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${depositosMode === opt.value ? "border-[var(--site-primary)]" : "border-[var(--border-default)]"}`}>
                  {depositosMode === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-[var(--site-primary)]" />}
                </div>
                <span className={`text-sm font-medium ${depositosMode === opt.value ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>{opt.label}</span>
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

      {/* ═══ Orientaciones ═══ */}
      {inventoryColumns?.orientacion && (
        <div className={sectionCard}>
          <div className={sectionTitle}>
            <Compass size={15} className="text-[var(--site-primary)]" />
            {t("config.orientations")}
          </div>
          <p className={sectionDescription}>{t("config.orientationsDesc")}</p>
          <div className="space-y-2">
            {orientaciones.map((o) => (
              <div key={o.id} className="flex items-center justify-between p-2.5 rounded-[0.625rem] bg-[var(--surface-1)] border border-[var(--border-subtle)]">
                <span className="text-sm text-[var(--text-secondary)]">{o.nombre}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteOrientacion(o.id)}
                  disabled={savingOrientacion}
                  className="flex items-center justify-center w-5 h-5 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)] rounded transition-colors disabled:opacity-50"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <div className="flex gap-2 mt-3 pt-3 border-t border-[var(--border-subtle)]">
              <input
                type="text"
                value={newOrientacion}
                onChange={(e) => setNewOrientacion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddOrientacion();
                  if (e.key === "Escape") setNewOrientacion("");
                }}
                placeholder={t("config.addOrientationPlaceholder")}
                disabled={savingOrientacion}
                className={`${inputClass} flex-1`}
              />
              <button
                type="button"
                onClick={handleAddOrientacion}
                disabled={!newOrientacion.trim() || savingOrientacion}
                className="flex items-center justify-center px-3 rounded-[0.625rem] bg-[var(--site-primary)] text-[var(--text-primary)] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-ui font-bold text-[11px] uppercase"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Vistas ═══ */}
      {inventoryColumns?.vista && (
        <div className={sectionCard}>
          <div className={sectionTitle}>
            <CloudSun size={15} className="text-[var(--site-primary)]" />
            {t("config.views")}
          </div>
          <p className={sectionDescription}>{t("config.viewsDesc")}</p>
          <div className="space-y-2">
            {vistas.map((v) => (
              <div key={v.id} className="flex items-center justify-between p-2.5 rounded-[0.625rem] bg-[var(--surface-1)] border border-[var(--border-subtle)]">
                <span className="text-sm text-[var(--text-secondary)]">{v.nombre}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteVista(v.id)}
                  disabled={savingVista}
                  className="flex items-center justify-center w-5 h-5 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)] rounded transition-colors disabled:opacity-50"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <div className="flex gap-2 mt-3 pt-3 border-t border-[var(--border-subtle)]">
              <input
                type="text"
                value={newVista}
                onChange={(e) => setNewVista(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddVista();
                  if (e.key === "Escape") setNewVista("");
                }}
                placeholder={t("config.addViewPlaceholder")}
                disabled={savingVista}
                className={`${inputClass} flex-1`}
              />
              <button
                type="button"
                onClick={handleAddVista}
                disabled={!newVista.trim() || savingVista}
                className="flex items-center justify-center px-3 rounded-[0.625rem] bg-[var(--site-primary)] text-[var(--text-primary)] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-ui font-bold text-[11px] uppercase"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
