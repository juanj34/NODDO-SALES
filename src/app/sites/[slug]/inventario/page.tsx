"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { NodDoDropdown } from "@/components/ui/NodDoDropdown";

import {
  Search,
  Maximize,
  BedDouble,
  Bath,
  Car,
  Archive,
  Compass,
  Eye,
  ArrowUpDown,
  Building2,
  Home,
  Sparkles,
  LayoutGrid,
  LayoutList,
  MapPin,
  X,
  ChevronRight,
  Hash,
  Calendar,
  List,
  Type,
  Store,
  FileText,
} from "lucide-react";
import { Lightbox } from "@/components/site/Lightbox";
import { useSiteProject, useSiteBasePath } from "@/hooks/useSiteProject";
import { usePersistedState } from "@/hooks/usePersistedState";
import { useTranslation, getEstadoConfig } from "@/i18n";
import { CotizadorModal } from "@/components/site/CotizadorModal";
import { SectionTransition } from "@/components/site/SectionTransition";
import { SiteEmptyState } from "@/components/site/SiteEmptyState";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";
import { getUnitDisplayName } from "@/lib/unit-display";
import { getInventoryColumns, getHybridInventoryColumns, resolveColumnsForTipologia, getPrimaryArea, getVisibleCustomColumns } from "@/lib/inventory-columns";
import type { Unidad, UnidadTipologia, TipoTipologia, CustomColumnDef } from "@/types";
import { useSectionVisibility } from "@/hooks/useSectionVisibility";

type SortKey = "identificador_asc" | "identificador_desc" | "precio_asc" | "precio_desc" | "area_asc" | "area_desc" | "piso_asc" | "piso_desc" | `custom_${string}_asc` | `custom_${string}_desc`;

const CUSTOM_COL_ICON = { text: Type, number: Hash, date: Calendar, select: List } as const;

export default function InventarioPage() {
  const sectionVisible = useSectionVisibility("inventario");
  const proyecto = useSiteProject();
  if (!sectionVisible) return null;
  const basePath = useSiteBasePath();
  const { t: tSite } = useTranslation("site");
  const unitPrefix = proyecto.unidad_display_prefix;
  const { t: tCommon } = useTranslation("common");

  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  const estadoConfig = useMemo(() => getEstadoConfig(tCommon), [tCommon]);

  // Custom columns visible in microsite (before sortOptions which depends on it)
  const micrositeCustomCols = useMemo(
    () => getVisibleCustomColumns(proyecto.custom_columns as CustomColumnDef[] | undefined, "microsite"),
    [proyecto.custom_columns]
  );

  const sortOptions: Array<{ value: SortKey; label: string }> = useMemo(() => {
    const base: Array<{ value: SortKey; label: string }> = [
      { value: "identificador_asc", label: "Unidad ↑" },
      { value: "identificador_desc", label: "Unidad ↓" },
      { value: "piso_asc", label: tSite("inventario.sortFloorAsc") },
      { value: "piso_desc", label: tSite("inventario.sortFloorDesc") },
      { value: "precio_asc", label: tSite("inventario.sortPriceAsc") },
      { value: "precio_desc", label: tSite("inventario.sortPriceDesc") },
      { value: "area_asc", label: tSite("inventario.sortAreaAsc") },
      { value: "area_desc", label: tSite("inventario.sortAreaDesc") },
    ];
    for (const cc of micrositeCustomCols) {
      if (cc.type === "number" || cc.type === "date") {
        base.push(
          { value: `custom_${cc.key}_asc`, label: `${cc.label} ↑` },
          { value: `custom_${cc.key}_desc`, label: `${cc.label} ↓` },
        );
      }
    }
    return base;
  }, [tSite, micrositeCustomCols]);

  // Filter state
  const [torreFilter, setTorreFilter] = useState<string>("todas");
  const [tipologiaFilter, setTipologiaFilter] = useState<string>("todas");
  const [estadoFilter, setEstadoFilter] = useState<string>("disponible");
  const [habFilter, setHabFilter] = useState<string>("todas");
  const [banosFilter, setBanosFilter] = useState<string>("todas");
  const [etapaFilter, setEtapaFilter] = useState<string>("todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("identificador_asc");

  // View mode (persisted) + Cotizador modal state
  const [viewMode, setViewMode] = usePersistedState<"grid" | "list">(
    "inventario-view",
    "grid",
    proyecto.slug,
  );
  const [cotizarUnidad, setCotizarUnidad] = useState<Unidad | null>(null);
  const [tipoSelectorUnit, setTipoSelectorUnit] = useState<Unidad | null>(null);
  const [planoLightboxUrl, setPlanoLightboxUrl] = useState<string | null>(null);

  const { unidades, tipologias } = proyecto;
  const torres = proyecto.torres ?? [];
  const isMultiTorre = torres.length > 1;

  // Multi-tipología and house mode context
  const tipologiaMode = proyecto.tipologia_mode ?? "fija";
  const isMultiTipo = tipologiaMode === "multiple";
  const isCasas = proyecto.tipo_proyecto === "casas";
  const isLotes = proyecto.tipo_proyecto === "lotes";
  const isHibrido = proyecto.tipo_proyecto === "hibrido";
  const isTipologiaPricing = proyecto.precio_source === "tipologia";
  const ocultarVendidas = (proyecto as any).ocultar_vendidas ?? false;
  const ocultarPrecioVendidas = (proyecto as any).ocultar_precio_vendidas ?? false;

  const unidadTipologias = useMemo<UnidadTipologia[]>(() => proyecto.unidad_tipologias ?? [], [proyecto.unidad_tipologias]);

  // Helper: resolve unit price based on pricing source (use precio_venta for sold units)
  const getUnitPrice = useCallback((unit: Unidad): number | null => {
    if (unit.estado === "vendida" && ocultarPrecioVendidas) return null;
    if (unit.estado === "vendida" && unit.precio_venta != null) return unit.precio_venta;
    if (!isTipologiaPricing) return unit.precio;
    if (unit.tipologia_id) {
      const tipo = (tipologias || []).find(t => t.id === unit.tipologia_id);
      return tipo?.precio_desde ?? null;
    }
    // Multi-tipo: return lowest price from linked tipologías
    if (isMultiTipo) {
      const tipoIds = unidadTipologias
        .filter(ut => ut.unidad_id === unit.id)
        .map(ut => ut.tipologia_id);
      const prices = (tipologias || [])
        .filter(t => tipoIds.includes(t.id) && t.precio_desde != null)
        .map(t => t.precio_desde!);
      return prices.length > 0 ? Math.min(...prices) : null;
    }
    return null;
  }, [isTipologiaPricing, tipologias, ocultarPrecioVendidas, isMultiTipo, unidadTipologias]);

  // Tipo tabs (hybrid + commercial)
  const [activeTipoTab, setActiveTipoTab] = useState<TipoTipologia | null>(null);
  const hasCommercialTipos = useMemo(() =>
    (tipologias || []).some(t => t.tipo_tipologia === "local_comercial"),
    [tipologias]
  );
  const showTipoTabs = isHibrido || hasCommercialTipos;

  const availableTipoTabs = useMemo(() => {
    if (!showTipoTabs) return [] as TipoTipologia[];
    const types = new Set((tipologias || []).map(t => t.tipo_tipologia).filter((v): v is TipoTipologia => !!v));
    return (["apartamento", "casa", "lote", "local_comercial"] as TipoTipologia[]).filter(tipo => types.has(tipo));
  }, [showTipoTabs, tipologias]);

  useEffect(() => {
    if (showTipoTabs && availableTipoTabs.length > 0 && !activeTipoTab) {
      setActiveTipoTab(availableTipoTabs[0]);
    }
  }, [showTipoTabs, availableTipoTabs, activeTipoTab]);

  const tipoTabTipologiaIds = useMemo(() => {
    if (!showTipoTabs || !activeTipoTab) return null;
    return new Set((tipologias || []).filter(t => t.tipo_tipologia === activeTipoTab).map(t => t.id));
  }, [showTipoTabs, activeTipoTab, tipologias]);

  const isLoteBased = isHibrido
    ? (activeTipoTab === "casa" || activeTipoTab === "lote")
    : (isCasas || isLotes);

  const columns = useMemo(() => {
    if (showTipoTabs && activeTipoTab) {
      return resolveColumnsForTipologia(
        activeTipoTab,
        proyecto.tipo_proyecto ?? "hibrido",
        (proyecto as any).inventory_columns_microsite ?? proyecto.inventory_columns,
        (proyecto as any).inventory_columns_microsite_by_type ?? proyecto.inventory_columns_by_type,
      );
    }
    return getInventoryColumns(proyecto.tipo_proyecto ?? "hibrido", (proyecto as any).inventory_columns_microsite ?? proyecto.inventory_columns);
  }, [showTipoTabs, activeTipoTab, proyecto.tipo_proyecto, proyecto.inventory_columns, proyecto.inventory_columns_by_type]);

  // Filter state for select-type custom columns: key → selected value ("todas" = all)
  const [customFilters, setCustomFilters] = useState<Record<string, string>>({});

  // Options for select-type custom columns
  const customSelectOptions = useMemo(() => {
    const result: Record<string, string[]> = {};
    for (const cc of micrositeCustomCols) {
      if (cc.type === "select" && cc.options?.length) {
        result[cc.key] = cc.options;
      }
    }
    return result;
  }, [micrositeCustomCols]);

  // Estado counts (scoped to active torre when filtered, exclude vendida if hidden)
  const estadoCounts = useMemo(() => {
    let base = torreFilter !== "todas"
      ? (unidades || []).filter((u) => u.torre_id === torreFilter)
      : (unidades || []);
    if (ocultarVendidas) {
      base = base.filter((u) => u.estado !== "vendida");
    }
    return {
      todas: base.length,
      disponible: base.filter((u) => u.estado === "disponible").length,
      proximamente: base.filter((u) => u.estado === "proximamente").length,
      separado: base.filter((u) => u.estado === "separado").length,
      reservada: base.filter((u) => u.estado === "reservada").length,
      vendida: ocultarVendidas ? 0 : base.filter((u) => u.estado === "vendida").length,
    };
  }, [unidades, torreFilter, ocultarVendidas]);

  // Tipologías filtered by torre and tipo tab for the dropdown
  const tipologiasForFilter = useMemo(() => {
    let list = tipologias || [];
    if (tipoTabTipologiaIds) {
      list = list.filter(t => tipoTabTipologiaIds.has(t.id));
    }
    if (isMultiTorre && torreFilter !== "todas") {
      list = list.filter(t => t.torre_ids?.includes(torreFilter) || !t.torre_ids?.length);
    }
    return list;
  }, [tipologias, isMultiTorre, torreFilter, tipoTabTipologiaIds]);

  // Unique bedroom counts for filter
  const habOptions = useMemo(() => {
    const set = new Set((unidades || []).map((u) => u.habitaciones).filter((h): h is number => h !== null));
    return [...set].sort((a, b) => a - b);
  }, [unidades]);

  // Unique bathroom counts for filter
  const banosOptions = useMemo(() => {
    const set = new Set((unidades || []).map((u) => u.banos).filter((b): b is number => b !== null));
    return [...set].sort((a, b) => a - b);
  }, [unidades]);

  // Unique etapa values for filter
  const etapaOptions = useMemo(() => {
    if (!columns.etapa) return [];
    const set = new Set(
      (unidades || []).map((u) => u.etapa_nombre).filter((e): e is string => !!e)
    );
    return [...set].sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
  }, [unidades, columns.etapa]);

  // Filtered + sorted units
  const filteredUnidades = useMemo(() => {
    const units = unidades || [];
    let result = [...units];

    // Hide vendida units if project setting is enabled
    if (ocultarVendidas) {
      result = result.filter((u) => u.estado !== "vendida");
    }

    // Hybrid tipo tab filter
    if (tipoTabTipologiaIds) {
      if (isMultiTipo) {
        result = result.filter(u => {
          if (u.tipologia_id && tipoTabTipologiaIds.has(u.tipologia_id)) return true;
          return unidadTipologias.some(
            ut => ut.unidad_id === u.id && tipoTabTipologiaIds.has(ut.tipologia_id)
          );
        });
      } else {
        result = result.filter(u => u.tipologia_id && tipoTabTipologiaIds.has(u.tipologia_id));
      }
    }

    // Torre filter
    if (torreFilter !== "todas") {
      result = result.filter((u) => u.torre_id === torreFilter);
    }

    // Tipología filter
    if (tipologiaFilter !== "todas") {
      if (isMultiTipo) {
        const compatibleIds = new Set(
          unidadTipologias.filter(ut => ut.tipologia_id === tipologiaFilter).map(ut => ut.unidad_id)
        );
        result = result.filter(u => compatibleIds.has(u.id));
      } else {
        result = result.filter((u) => u.tipologia_id === tipologiaFilter);
      }
    }

    // Estado filter
    if (estadoFilter !== "todas") {
      result = result.filter((u) => u.estado === estadoFilter);
    }

    // Habitaciones filter
    if (habFilter !== "todas") {
      const habNum = parseInt(habFilter);
      result = result.filter((u) => u.habitaciones === habNum);
    }

    // Baños filter
    if (banosFilter !== "todas") {
      const banosNum = parseInt(banosFilter);
      result = result.filter((u) => u.banos === banosNum);
    }

    // Etapa filter
    if (etapaFilter !== "todas") {
      result = result.filter((u) => u.etapa_nombre === etapaFilter);
    }

    // Custom column select filters
    for (const [key, val] of Object.entries(customFilters)) {
      if (val && val !== "todas") {
        result = result.filter((u) => {
          const cf = u.custom_fields as Record<string, unknown> | undefined;
          return cf?.[key] === val;
        });
      }
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((u) =>
        u.identificador.toLowerCase().includes(q) ||
        u.vista?.toLowerCase().includes(q) ||
        u.orientacion?.toLowerCase().includes(q) ||
        u.etapa_nombre?.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy.startsWith("custom_")) {
        // custom_<key>_asc or custom_<key>_desc
        const withoutPrefix = sortBy.slice(7); // remove "custom_"
        const isDesc = withoutPrefix.endsWith("_desc");
        const cfKey = isDesc ? withoutPrefix.slice(0, -5) : withoutPrefix.slice(0, -4);
        const cfa = (a.custom_fields as Record<string, unknown> | undefined)?.[cfKey];
        const cfb = (b.custom_fields as Record<string, unknown> | undefined)?.[cfKey];
        const va = (typeof cfa === "number" ? cfa : typeof cfa === "string" ? cfa : null) ?? null;
        const vb = (typeof cfb === "number" ? cfb : typeof cfb === "string" ? cfb : null) ?? null;
        if (va === null && vb === null) return 0;
        if (va === null) return 1;
        if (vb === null) return -1;
        const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
        return isDesc ? -cmp : cmp;
      }
      switch (sortBy) {
        case "identificador_asc": return a.identificador.localeCompare(b.identificador, "es", { numeric: true });
        case "identificador_desc": return b.identificador.localeCompare(a.identificador, "es", { numeric: true });
        case "precio_asc": return (getUnitPrice(a) ?? 0) - (getUnitPrice(b) ?? 0);
        case "precio_desc": return (getUnitPrice(b) ?? 0) - (getUnitPrice(a) ?? 0);
        case "area_asc": return (getPrimaryArea(a, columns) ?? 0) - (getPrimaryArea(b, columns) ?? 0);
        case "area_desc": return (getPrimaryArea(b, columns) ?? 0) - (getPrimaryArea(a, columns) ?? 0);
        case "piso_asc": return (a.piso ?? 0) - (b.piso ?? 0);
        case "piso_desc": return (b.piso ?? 0) - (a.piso ?? 0);
        default: return 0;
      }
    });

    return result;
  }, [unidades, torreFilter, tipologiaFilter, estadoFilter, habFilter, banosFilter, etapaFilter, customFilters, searchQuery, sortBy, isMultiTipo, unidadTipologias, tipoTabTipologiaIds, getUnitPrice, ocultarVendidas]);

  // Multi-tipo helpers (must be before early return — hooks rule)
  const getUnitTipoCount = useCallback((unitId: string) => {
    return unidadTipologias.filter(ut => ut.unidad_id === unitId).length;
  }, [unidadTipologias]);

  const getUnitSpecRanges = useCallback((unitId: string) => {
    const tipoIds = unidadTipologias.filter(ut => ut.unidad_id === unitId).map(ut => ut.tipologia_id);
    const tipos = (tipologias || []).filter(t => tipoIds.includes(t.id));
    if (tipos.length === 0) return null;
    const collect = (fn: (t: typeof tipos[0]) => number | null | undefined) =>
      tipos.map(fn).filter((v): v is number => v != null && v > 0);
    const range = (vals: number[]) => vals.length ? { min: Math.min(...vals), max: Math.max(...vals) } : null;
    return {
      area: range(collect(t => t.area_m2)),
      areaConstruida: range(collect(t => t.area_construida)),
      areaPrivada: range(collect(t => t.area_privada)),
      areaLote: range(collect(t => t.area_lote)),
      precio: range(collect(t => t.precio_desde)),
      hab: range(collect(t => t.habitaciones)),
      banos: range(collect(t => t.banos)),
    };
  }, [unidadTipologias, tipologias]);

  const getUnitAvailableTipologias = useCallback((unitId: string) => {
    const tipoIds = unidadTipologias.filter(ut => ut.unidad_id === unitId).map(ut => ut.tipologia_id);
    return (tipologias || []).filter(t => tipoIds.includes(t.id));
  }, [unidadTipologias, tipologias]);

  // Escape key to close tipo selector
  useEffect(() => {
    if (!tipoSelectorUnit) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTipoSelectorUnit(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [tipoSelectorUnit]);

  // Empty state — no units configured (AFTER all hooks)
  if (!unidades || unidades.length === 0) {
    return (
      <SiteEmptyState
        variant="inventario"
        title={tSite("inventario.notAvailable")}
        description={tSite("inventario.notConfigured")}
      />
    );
  }

  const getTipologiaName = (tipologiaId: string | null) => {
    if (!tipologiaId) return null;
    return tipologias.find((t) => t.id === tipologiaId);
  };

  const formatRange = (range: { min: number; max: number } | null, suffix?: string) => {
    if (!range) return null;
    const s = suffix ?? "";
    return range.min === range.max ? `${range.min}${s}` : `${range.min}–${range.max}${s}`;
  };

  return (
    <SectionTransition className="h-full flex flex-col bg-[var(--site-bg)]">
      <div className="flex-1 flex flex-col min-h-0 max-w-7xl mx-auto px-6 lg:px-10 w-full">
        {/* ====== FROZEN HEADER AREA ====== */}
        <div className="shrink-0 pt-4">
        {/* ====== COMPACT HEADER ====== */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-[rgba(var(--site-primary-rgb),0.15)] flex items-center justify-center shrink-0">
            <Building2 size={16} className="text-[var(--site-primary)]" />
          </div>
          <h1 className="text-lg font-site-heading text-white">{tSite("inventario.heading")}</h1>
          <span className="text-[11px] text-[var(--text-tertiary)]">
            {estadoCounts.disponible}/{estadoCounts.todas} {tSite("inventario.available")}
          </span>
          <div className="flex items-center gap-1.5 ml-auto">
            {(["disponible", "proximamente", "separado", "reservada", "vendida"] as const).map((estado) => {
              const config = estadoConfig[estado];
              const count = estadoCounts[estado];
              if (count === 0) return null;
              return (
                <span
                  key={estado}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                    config.bg, config.color
                  )}
                >
                  <span className={cn("w-1 h-1 rounded-full", config.dot)} />
                  {count}
                </span>
              );
            })}
          </div>
        </div>

        {/* ====== TIPO TABS (hybrid + commercial) ====== */}
        {showTipoTabs && availableTipoTabs.length > 1 && (
          <div className="flex items-center gap-1.5 mb-3">
            {availableTipoTabs.map((tipo) => {
              const Icon = tipo === "apartamento" ? Building2 : tipo === "casa" ? Home : tipo === "local_comercial" ? Store : MapPin;
              const label = tipo === "apartamento" ? tSite("inventario.tabApartamentos") : tipo === "casa" ? tSite("inventario.tabCasas") : tipo === "local_comercial" ? tSite("inventario.tabLocales") : tSite("inventario.tabLotes");
              const isActive = activeTipoTab === tipo;
              return (
                <button
                  key={tipo}
                  onClick={() => setActiveTipoTab(tipo)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all",
                    isActive
                      ? "bg-[rgba(var(--site-primary-rgb),0.15)] text-[var(--site-primary)] border border-[rgba(var(--site-primary-rgb),0.3)]"
                      : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] border border-transparent hover:border-[var(--border-subtle)]"
                  )}
                >
                  <Icon size={14} />
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* ====== TORRE FILTER ====== */}
        {isMultiTorre && (
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setTorreFilter("todas")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium tracking-wider transition-all cursor-pointer",
                torreFilter === "todas"
                  ? "bg-[rgba(var(--site-primary-rgb),0.15)] text-[var(--site-primary)] ring-1 ring-[rgba(var(--site-primary-rgb),0.3)]"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/5"
              )}
            >
              {tCommon("labels.allTowers")}
            </button>
            {torres.map(torre => (
              <button
                key={torre.id}
                onClick={() => setTorreFilter(torre.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium tracking-wider transition-all cursor-pointer",
                  torreFilter === torre.id
                    ? "bg-[rgba(var(--site-primary-rgb),0.15)] text-[var(--site-primary)] ring-1 ring-[rgba(var(--site-primary-rgb),0.3)]"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/5"
                )}
              >
                {torre.tipo === "urbanismo" ? <Home size={13} /> : <Building2 size={13} />}
                {torre.nombre}
              </button>
            ))}
          </div>
        )}

        {/* ====== SINGLE-ROW FILTER BAR ====== */}
        <div className="glass rounded-xl px-3 py-2 mb-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {/* Search */}
          <div className="relative shrink-0">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none" />
            <input
              type="text"
              placeholder={tSite("inventario.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-36 bg-white/5 border border-white/[0.08] rounded-lg pl-7 pr-3 py-1.5 text-[11px] text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.30)] transition-colors"
            />
          </div>

          {/* Tipología dropdown */}
          <NodDoDropdown
            variant="site"
            size="sm"
            value={tipologiaFilter}
            onChange={setTipologiaFilter}
            options={[
              { value: "todas", label: tSite("inventario.typeAll") },
              ...tipologiasForFilter.map((t) => ({ value: t.id, label: t.nombre })),
            ]}
          />

          {columns.etapa && etapaOptions.length > 1 && (
            <>
              <div className="w-px h-5 bg-white/[0.06] shrink-0" />
              <NodDoDropdown
                variant="site"
                size="sm"
                value={etapaFilter}
                onChange={setEtapaFilter}
                options={[
                  { value: "todas", label: tSite("inventario.etapaAll") },
                  ...etapaOptions.map((e) => ({ value: e, label: e })),
                ]}
              />
            </>
          )}

          {columns.habitaciones && (
            <>
              <div className="w-px h-5 bg-white/[0.06] shrink-0" />

              {/* Habitaciones pills */}
              <div className="flex items-center gap-0.5 shrink-0">
                <BedDouble size={11} className="text-[var(--text-muted)] mr-1" />
                {[{ value: "todas", label: tSite("inventario.allBedrooms") }, ...habOptions.map((h) => ({ value: String(h), label: h === 0 ? tSite("inventario.studioShort") : String(h) }))].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setHabFilter(opt.value)}
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] transition-all cursor-pointer",
                      habFilter === opt.value
                        ? "bg-[rgba(var(--site-primary-rgb),0.15)] text-[var(--site-primary)] font-medium"
                        : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/5"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {columns.banos && (
            <>
              <div className="w-px h-5 bg-white/[0.06] shrink-0" />

              {/* Baños pills */}
              <div className="flex items-center gap-0.5 shrink-0">
                <Bath size={11} className="text-[var(--text-muted)] mr-1" />
                {[{ value: "todas", label: tSite("inventario.allBedrooms") }, ...banosOptions.map((b) => ({ value: String(b), label: String(b) }))].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setBanosFilter(opt.value)}
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] transition-all cursor-pointer",
                      banosFilter === opt.value
                        ? "bg-[rgba(var(--site-primary-rgb),0.15)] text-[var(--site-primary)] font-medium"
                        : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/5"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Custom select-type column pills */}
          {Object.entries(customSelectOptions).map(([key, options]) => {
            const cc = micrositeCustomCols.find(c => c.key === key);
            if (!cc) return null;
            const currentVal = customFilters[key] ?? "todas";
            return (
              <div key={key} className="contents">
                <div className="w-px h-5 bg-white/[0.06] shrink-0" />
                <div className="flex items-center gap-0.5 shrink-0">
                  <span className="text-[9px] text-[var(--text-muted)] mr-1 truncate max-w-16">{cc.label}</span>
                  {[{ value: "todas", label: tSite("inventario.allBedrooms") }, ...options.map(o => ({ value: o, label: o }))].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setCustomFilters(prev => ({ ...prev, [key]: opt.value }))}
                      className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] transition-all cursor-pointer",
                        currentVal === opt.value
                          ? "bg-[rgba(var(--site-primary-rgb),0.15)] text-[var(--site-primary)] font-medium"
                          : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/5"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="w-px h-5 bg-white/[0.06] shrink-0" />

          {/* Estado pills */}
          <div className="flex items-center gap-0.5 shrink-0">
            {(["todas", "disponible", "proximamente", "separado", "reservada", "vendida"] as const)
              .filter((estado) => !(ocultarVendidas && estado === "vendida"))
              .map((estado) => {
              const isAll = estado === "todas";
              const config = isAll ? null : estadoConfig[estado];
              return (
                <button
                  key={estado}
                  onClick={() => setEstadoFilter(estado)}
                  className={cn(
                    "px-2 py-0.5 rounded-md text-[10px] transition-all cursor-pointer",
                    estadoFilter === estado
                      ? isAll
                        ? "bg-[rgba(var(--site-primary-rgb),0.15)] text-[var(--site-primary)] font-medium"
                        : cn(config?.bg, config?.color, "font-medium")
                      : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/5"
                  )}
                >
                  {isAll ? tSite("inventario.allBedrooms") : config?.label?.slice(0, 3)}
                </button>
              );
            })}
          </div>

          {/* Spacer */}
          <div className="flex-1 min-w-2" />

          {/* Sort */}
          <div className="flex items-center gap-1 shrink-0">
            <ArrowUpDown size={11} className="text-[var(--text-muted)]" />
            <NodDoDropdown
              variant="site"
              size="sm"
              value={sortBy}
              onChange={(val) => setSortBy(val as SortKey)}
              options={sortOptions.map((opt) => ({ value: opt.value, label: opt.label }))}
              icon={<ArrowUpDown size={11} />}
            />
          </div>

          <div className="w-px h-5 bg-white/[0.06] shrink-0" />

          {/* View toggle */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              aria-label={tSite("inventario.gridView")}
              className={cn(
                "p-1.5 rounded-md transition-all cursor-pointer",
                viewMode === "grid"
                  ? "bg-[rgba(var(--site-primary-rgb),0.15)] text-[var(--site-primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              )}
            >
              <LayoutGrid size={13} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              aria-label={tSite("inventario.listView")}
              className={cn(
                "p-1.5 rounded-md transition-all cursor-pointer",
                viewMode === "list"
                  ? "bg-[rgba(var(--site-primary-rgb),0.15)] text-[var(--site-primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              )}
            >
              <LayoutList size={13} />
            </button>
          </div>
        </div>

        {/* Results count */}
        <p className="text-[10px] text-[var(--text-tertiary)] tracking-wider mb-2 pl-1">
          {filteredUnidades.length} {filteredUnidades.length !== 1 ? tSite("inventario.results") : tSite("inventario.result")}
        </p>
        </div>{/* end frozen header */}

        {/* ====== SCROLLABLE CONTENT AREA ====== */}
        <div className="flex-1 overflow-y-auto min-h-0 pb-4" data-lenis-prevent>

        {/* ====== GRID VIEW ====== */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
            <AnimatePresence mode="popLayout">
              {filteredUnidades.map((unit, index) => {
                const config = estadoConfig[unit.estado];
                const tipo = getTipologiaName(unit.tipologia_id);
                const tipoCount = isMultiTipo ? getUnitTipoCount(unit.id) : 0;
                const hasMultiTipos = tipoCount > 1;
                const useRanges = hasMultiTipos && !unit.tipologia_id;
                const specRanges = useRanges ? getUnitSpecRanges(unit.id) : null;

                return (
                  <motion.div
                    key={unit.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: Math.min(index * 0.02, 0.2), duration: 0.25 }}
                    className="glass-card rounded-xl p-3 group hover:ring-1 hover:ring-[rgba(var(--site-primary-rgb),0.20)] transition-all duration-300"
                  >
                    {/* Top: status dot + identifier + tipo + floor/lote */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dot)} title={config.label} />
                      <h3 className="text-sm font-semibold text-white">{getUnitDisplayName(unit, unitPrefix)}</h3>
                      {hasMultiTipos ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[rgba(var(--site-primary-rgb),0.12)] text-[var(--site-primary)] font-medium">
                          {tipoCount} tipos
                        </span>
                      ) : tipo ? (
                        <span className="text-[10px] text-[var(--site-primary)] opacity-60 truncate">
                          {tipo.nombre}
                        </span>
                      ) : null}
                      {columns.lote && unit.lote && (
                        <span className="text-[10px] text-[var(--text-muted)] ml-auto shrink-0">
                          Lote: {unit.lote}
                        </span>
                      )}
                      {columns.piso && !columns.lote && unit.piso != null && (
                        <span className="text-[10px] text-[var(--text-muted)] ml-auto shrink-0">
                          P{unit.piso}
                        </span>
                      )}
                    </div>

                    {/* Etapa badge */}
                    {columns.etapa && unit.etapa_nombre && (
                      <div className="mb-1.5">
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-[var(--text-tertiary)]">
                          {unit.etapa_nombre}
                        </span>
                      </div>
                    )}

                    {/* Stats: area | beds | baths | orientation | view — single compact line */}
                    <div className="flex items-center gap-2.5 mb-2 text-[11px] text-[var(--text-tertiary)]">
                      {useRanges && specRanges ? (
                        <>
                          {columns.area_construida && specRanges.areaConstruida && (
                            <span className="flex items-center gap-0.5">
                              <Maximize size={10} className="text-[var(--text-muted)]" />
                              {specRanges.areaConstruida.min}m²
                            </span>
                          )}
                          {columns.area_privada && specRanges.areaPrivada && (
                            <span className="flex items-center gap-0.5">
                              <Maximize size={10} className="text-[var(--text-muted)]" />
                              {specRanges.areaPrivada.min}m²
                            </span>
                          )}
                          {columns.area_lote && specRanges.areaLote && (
                            <span className="flex items-center gap-0.5">
                              <Maximize size={10} className="text-[var(--text-muted)]" />
                              {specRanges.areaLote.min}m²
                            </span>
                          )}
                          {!columns.area_construida && !columns.area_privada && !columns.area_lote && specRanges.area && (
                            <span className="flex items-center gap-0.5">
                              <Maximize size={10} className="text-[var(--text-muted)]" />
                              {specRanges.area.min}m²
                            </span>
                          )}
                          {columns.habitaciones && specRanges.hab && (
                            <span className="flex items-center gap-0.5">
                              <BedDouble size={10} className="text-[var(--text-muted)]" />
                              {specRanges.hab.min}
                            </span>
                          )}
                          {columns.banos && specRanges.banos && (
                            <span className="flex items-center gap-0.5">
                              <Bath size={10} className="text-[var(--text-muted)]" />
                              {specRanges.banos.min}
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          {(getPrimaryArea(unit, columns) ?? tipo?.area_m2) != null && (
                            <span className="flex items-center gap-0.5">
                              <Maximize size={10} className="text-[var(--text-muted)]" />
                              {getPrimaryArea(unit, columns) ?? tipo?.area_m2}m²
                            </span>
                          )}
                          {columns.habitaciones && (unit.habitaciones ?? tipo?.habitaciones) !== null && (
                            <span className="flex items-center gap-0.5">
                              <BedDouble size={10} className="text-[var(--text-muted)]" />
                              {(() => { const h = unit.habitaciones ?? tipo?.habitaciones; return h === 0 ? tSite("inventario.studioShort") : h; })()}
                            </span>
                          )}
                          {columns.banos && (unit.banos ?? tipo?.banos) !== null && (
                            <span className="flex items-center gap-0.5">
                              <Bath size={10} className="text-[var(--text-muted)]" />
                              {unit.banos ?? tipo?.banos}
                            </span>
                          )}
                        </>
                      )}
                      {columns.parqueaderos && (unit.parqueaderos ?? tipo?.parqueaderos) != null && (unit.parqueaderos ?? tipo?.parqueaderos)! > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Car size={10} className="text-[var(--text-muted)]" />
                          {unit.parqueaderos ?? tipo?.parqueaderos}
                        </span>
                      )}
                      {columns.depositos && unit.depositos !== null && unit.depositos > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Archive size={10} className="text-[var(--text-muted)]" />
                          {unit.depositos}
                        </span>
                      )}
                      {columns.orientacion && unit.orientacion && (
                        <span className="flex items-center gap-0.5">
                          <Compass size={10} className="text-[var(--text-muted)]" />
                          {unit.orientacion}
                        </span>
                      )}
                      {columns.vista && unit.vista && (
                        <span className="flex items-center gap-0.5">
                          <Eye size={10} className="text-[var(--text-muted)]" />
                          {unit.vista}
                        </span>
                      )}
                      {micrositeCustomCols.map((cc) => {
                        const cf = unit.custom_fields as Record<string, unknown> | undefined;
                        const val = cf?.[cc.key];
                        if (val == null || val === "") return null;
                        const Icon = CUSTOM_COL_ICON[cc.type] ?? Hash;
                        const display = cc.type === "date" && typeof val === "string"
                          ? new Date(val + "T00:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "short" })
                          : String(val);
                        return (
                          <span key={cc.key} className="flex items-center gap-0.5">
                            <Icon size={10} className="text-[var(--text-muted)]" />
                            {display}
                          </span>
                        );
                      })}
                    </div>

                    {/* Price + actions — single row */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      {(() => {
                        const price = getUnitPrice(unit);
                        if (price) {
                          const showDesde = useRanges || (isTipologiaPricing && !unit.tipologia_id && isMultiTipo);
                          return (
                            <p className="text-sm font-semibold text-white">
                              {showDesde && <span className="text-[10px] text-[var(--text-tertiary)] mr-1">{tSite("tipologias.from")}</span>}
                              {formatCurrency(price, proyecto.moneda_base ?? "COP")}
                            </p>
                          );
                        }
                        if (!isTipologiaPricing && useRanges && specRanges?.precio) return (
                          <p className="text-sm font-semibold text-white">
                            <span className="text-[10px] text-[var(--text-tertiary)] mr-1">{tSite("tipologias.from")}</span>
                            {formatCurrency(specRanges.precio.min, proyecto.moneda_base ?? "COP")}
                          </p>
                        );
                        return <span />;
                      })()}
                      <div className="flex items-center gap-1">
                        {unit.plano_url && (
                          <button
                            onClick={() => setPlanoLightboxUrl(unit.plano_url)}
                            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                            aria-label={tSite("inventario.viewFloorPlan")}
                            title={tSite("inventario.viewFloorPlan")}
                          >
                            <FileText size={13} />
                          </button>
                        )}
                        {hasMultiTipos ? (
                          <button
                            onClick={() => setTipoSelectorUnit(unit)}
                            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                            aria-label={tSite("inventario.viewUnit", { unit: unit.identificador })}
                          >
                            <Eye size={13} />
                          </button>
                        ) : (
                          <Link
                            href={`${basePath}/tipologias${
                              unit.tipologia_id
                                ? `?tipo=${unit.tipologia_id}&unidad=${unit.id}`
                                : isMultiTipo && tipoCount === 1
                                  ? `?tipo=${unidadTipologias.find(ut => ut.unidad_id === unit.id)?.tipologia_id}&unidad=${unit.id}`
                                  : `?unidad=${unit.id}`
                            }`}
                            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-white bg-white/5 hover:bg-white/10 transition-all"
                            aria-label={tSite("inventario.viewUnit", { unit: unit.identificador })}
                          >
                            <Eye size={13} />
                          </Link>
                        )}
                        <button
                          onClick={() => setCotizarUnidad(unit)}
                          className="p-1.5 rounded-lg text-[var(--site-primary)] hover:text-white bg-[rgba(var(--site-primary-rgb),0.15)] hover:bg-[rgba(var(--site-primary-rgb),0.30)] transition-all cursor-pointer"
                          aria-label={tSite("inventario.enquireUnit", { unit: unit.identificador })}
                        >
                          <Sparkles size={13} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* ====== LIST VIEW ====== */}
        {viewMode === "list" && (
          <div className="glass rounded-xl" style={{ overflowX: "clip" }}>
            {/* Table header — sticky within scroll parent */}
            <div
              className="sticky top-0 z-10 flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] text-[10px] text-[var(--text-muted)] tracking-wider uppercase backdrop-blur-xl"
              style={{ backgroundColor: "rgba(17, 17, 19, 0.92)" }}
            >
              <span className="w-4 shrink-0" />
              <span className="w-24 shrink-0">{tSite("inventario.unit")}</span>
              <span className="w-28 shrink-0 hidden md:block">{tSite("inventario.type")}</span>
              {columns.area_m2 && <span className="w-16 shrink-0 text-right">{tSite("inventario.area")}</span>}
              {columns.area_construida && <span className="w-16 shrink-0 text-right">{tSite("tipologias.areaConstruida")}</span>}
              {columns.area_privada && <span className="w-16 shrink-0 text-right">{tSite("tipologias.areaPrivada")}</span>}
              {columns.area_lote && <span className="w-16 shrink-0 text-right">{tSite("tipologias.areaLote")}</span>}
              {columns.habitaciones && <span className="w-10 shrink-0 text-center hidden lg:block">{tSite("inventario.bedrooms")}</span>}
              {columns.banos && <span className="w-10 shrink-0 text-center hidden lg:block">{tSite("inventario.bathrooms")}</span>}
              {columns.parqueaderos && <span className="w-10 shrink-0 text-center hidden lg:block">{tSite("inventario.parking")}</span>}
              {columns.depositos && <span className="w-10 shrink-0 text-center hidden lg:block">{tSite("inventario.storage")}</span>}
              {columns.orientacion && <span className="w-20 shrink-0 hidden xl:block">{tSite("inventario.orientation")}</span>}
              {columns.vista && <span className="w-20 shrink-0 hidden xl:block">{tSite("inventario.view")}</span>}
              {columns.lote && <span className="w-12 shrink-0 text-center">Lote</span>}
              {columns.etapa && <span className="w-16 shrink-0 text-center hidden lg:block">{tSite("inventario.etapa")}</span>}
              {micrositeCustomCols.map((cc) => (
                <span key={cc.key} className="w-20 shrink-0 text-center hidden xl:block truncate">{cc.label}</span>
              ))}
              {columns.piso && <span className="w-12 shrink-0 text-center">{tSite("inventario.floor")}</span>}
              <span className="flex-1 text-right">{tSite("inventario.price")}</span>
              <span className="w-16 shrink-0" />
            </div>

            {/* Rows */}
            <AnimatePresence mode="popLayout">
              {filteredUnidades.map((unit, index) => {
                const config = estadoConfig[unit.estado];
                const tipo = getTipologiaName(unit.tipologia_id);
                const listTipoCount = isMultiTipo ? getUnitTipoCount(unit.id) : 0;
                const listHasMultiTipos = listTipoCount > 1;
                const listUseRanges = listHasMultiTipos && !unit.tipologia_id;
                const listSpecRanges = listUseRanges ? getUnitSpecRanges(unit.id) : null;

                return (
                  <motion.div
                    key={unit.id}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ delay: Math.min(index * 0.01, 0.15), duration: 0.2 }}
                    className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors group"
                  >
                    <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dot)} title={config.label} />
                    <span className="w-24 shrink-0 text-xs font-medium text-white truncate">{getUnitDisplayName(unit, unitPrefix)}</span>
                    <span className="w-28 shrink-0 text-[11px] text-[var(--text-tertiary)] truncate hidden md:block">
                      {listHasMultiTipos ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[rgba(var(--site-primary-rgb),0.12)] text-[var(--site-primary)] font-medium">
                          {listTipoCount} tipos
                        </span>
                      ) : (
                        tipo?.nombre ?? "—"
                      )}
                    </span>
                    {columns.area_m2 && (
                      <span className="w-16 shrink-0 text-[11px] text-[var(--text-secondary)] text-right tabular-nums">
                        {listUseRanges && listSpecRanges?.area
                          ? formatRange(listSpecRanges.area, " m²")
                          : (unit.area_m2 ?? tipo?.area_m2) ? `${unit.area_m2 ?? tipo?.area_m2} m²` : "—"}
                      </span>
                    )}
                    {columns.area_construida && (
                      <span className="w-16 shrink-0 text-[11px] text-[var(--text-secondary)] text-right tabular-nums">
                        {unit.area_construida ? `${unit.area_construida} m²`
                          : listUseRanges && listSpecRanges?.areaConstruida ? `${listSpecRanges.areaConstruida.min} m²`
                          : (tipo?.area_construida ? `${tipo.area_construida} m²` : "—")}
                      </span>
                    )}
                    {columns.area_privada && (
                      <span className="w-16 shrink-0 text-[11px] text-[var(--text-secondary)] text-right tabular-nums">
                        {unit.area_privada ? `${unit.area_privada} m²`
                          : listUseRanges && listSpecRanges?.areaPrivada ? `${listSpecRanges.areaPrivada.min} m²`
                          : (tipo?.area_privada ? `${tipo.area_privada} m²` : "—")}
                      </span>
                    )}
                    {columns.area_lote && (
                      <span className="w-16 shrink-0 text-[11px] text-[var(--text-secondary)] text-right tabular-nums">
                        {unit.area_lote ? `${unit.area_lote} m²`
                          : listUseRanges && listSpecRanges?.areaLote ? `${listSpecRanges.areaLote.min} m²`
                          : (tipo?.area_lote ? `${tipo.area_lote} m²` : "—")}
                      </span>
                    )}
                    {columns.habitaciones && (
                      <span className="w-10 shrink-0 text-[11px] text-[var(--text-tertiary)] text-center hidden lg:block">
                        {listUseRanges && listSpecRanges?.hab
                          ? formatRange(listSpecRanges.hab)
                          : (() => { const h = unit.habitaciones ?? tipo?.habitaciones; return h != null ? (h === 0 ? tSite("inventario.studioShort") : h) : "—"; })()}
                      </span>
                    )}
                    {columns.banos && (
                      <span className="w-10 shrink-0 text-[11px] text-[var(--text-tertiary)] text-center hidden lg:block">
                        {listUseRanges && listSpecRanges?.banos
                          ? formatRange(listSpecRanges.banos)
                          : (unit.banos ?? tipo?.banos) ?? "—"}
                      </span>
                    )}
                    {columns.parqueaderos && <span className="w-10 shrink-0 text-[11px] text-[var(--text-tertiary)] text-center hidden lg:block">{(unit.parqueaderos ?? tipo?.parqueaderos) ?? "—"}</span>}
                    {columns.depositos && <span className="w-10 shrink-0 text-[11px] text-[var(--text-tertiary)] text-center hidden lg:block">{unit.depositos ?? "—"}</span>}
                    {columns.orientacion && <span className="w-20 shrink-0 text-[11px] text-[var(--text-tertiary)] truncate hidden xl:block">{unit.orientacion ?? "—"}</span>}
                    {columns.vista && <span className="w-20 shrink-0 text-[11px] text-[var(--text-tertiary)] truncate hidden xl:block">{unit.vista ?? "—"}</span>}
                    {columns.lote && (
                      <span className="w-12 shrink-0 text-[11px] text-[var(--text-tertiary)] text-center tabular-nums">
                        {unit.lote ?? "—"}
                      </span>
                    )}
                    {columns.etapa && (
                      <span className="w-16 shrink-0 text-[11px] text-[var(--text-tertiary)] text-center truncate hidden lg:block">
                        {unit.etapa_nombre ?? "—"}
                      </span>
                    )}
                    {micrositeCustomCols.map((cc) => {
                      const cf = unit.custom_fields as Record<string, unknown> | undefined;
                      const val = cf?.[cc.key];
                      let display = "—";
                      if (val != null && val !== "") {
                        if (cc.type === "date" && typeof val === "string") {
                          display = new Date(val + "T00:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "short" });
                        } else {
                          display = String(val);
                        }
                      }
                      return (
                        <span key={cc.key} className="w-20 shrink-0 text-[11px] text-[var(--text-tertiary)] text-center truncate hidden xl:block">
                          {display}
                        </span>
                      );
                    })}
                    {columns.piso && (
                      <span className="w-12 shrink-0 text-[11px] text-[var(--text-tertiary)] text-center tabular-nums">
                        {unit.piso ?? "—"}
                      </span>
                    )}
                    <span className="flex-1 text-xs font-semibold text-white text-right tabular-nums">
                      {(() => {
                        const price = getUnitPrice(unit);
                        if (price) {
                          const showDesde = listUseRanges || (isTipologiaPricing && !unit.tipologia_id && isMultiTipo);
                          return showDesde
                            ? `${tSite("tipologias.from")} ${formatCurrency(price, proyecto.moneda_base ?? "COP")}`
                            : formatCurrency(price, proyecto.moneda_base ?? "COP");
                        }
                        if (!isTipologiaPricing && listUseRanges && listSpecRanges?.precio)
                          return `${tSite("tipologias.from")} ${formatCurrency(listSpecRanges.precio.min, proyecto.moneda_base ?? "COP")}`;
                        return "—";
                      })()}
                    </span>
                    <div className="w-20 shrink-0 flex items-center justify-end gap-0.5">
                      {unit.plano_url && (
                        <button
                          onClick={() => setPlanoLightboxUrl(unit.plano_url)}
                          className="p-1 rounded-md text-[var(--text-secondary)] hover:text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                          aria-label={tSite("inventario.viewFloorPlan")}
                          title={tSite("inventario.viewFloorPlan")}
                        >
                          <FileText size={12} />
                        </button>
                      )}
                      {listHasMultiTipos ? (
                        <button
                          onClick={() => setTipoSelectorUnit(unit)}
                          className="p-1 rounded-md text-[var(--text-secondary)] hover:text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                          aria-label={tSite("inventario.viewUnit", { unit: unit.identificador })}
                        >
                          <Eye size={12} />
                        </button>
                      ) : (
                        <Link
                          href={`${basePath}/tipologias${
                            unit.tipologia_id
                              ? `?tipo=${unit.tipologia_id}&unidad=${unit.id}`
                              : isMultiTipo && listTipoCount === 1
                                ? `?tipo=${unidadTipologias.find(ut => ut.unidad_id === unit.id)?.tipologia_id}&unidad=${unit.id}`
                                : `?unidad=${unit.id}`
                          }`}
                          className="p-1 rounded-md text-[var(--text-secondary)] hover:text-white bg-white/5 hover:bg-white/10 transition-all"
                          aria-label={tSite("inventario.viewUnit", { unit: unit.identificador })}
                        >
                          <Eye size={12} />
                        </Link>
                      )}
                      <button
                        onClick={() => setCotizarUnidad(unit)}
                        className="p-1 rounded-md text-[var(--site-primary)] hover:text-white bg-[rgba(var(--site-primary-rgb),0.15)] hover:bg-[rgba(var(--site-primary-rgb),0.30)] transition-all cursor-pointer"
                        aria-label={tSite("inventario.enquireUnit", { unit: unit.identificador })}
                      >
                        <Sparkles size={12} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Empty state */}
        {filteredUnidades.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <Building2 size={40} className="text-white/10 mb-4" />
            <h3 className="text-[var(--text-tertiary)] text-lg mb-2">{tSite("inventario.noResults")}</h3>
            <p className="text-[var(--text-muted)] text-sm max-w-xs">
              {tSite("inventario.noResultsDescription")}
            </p>
            <button
              onClick={() => {
                setTorreFilter("todas");
                setTipologiaFilter("todas");
                setEstadoFilter("disponible");
                setHabFilter("todas");
                setBanosFilter("todas");
                setCustomFilters({});
                setSearchQuery("");
              }}
              className="mt-4 btn-outline-warm px-5 py-2 text-xs tracking-wider cursor-pointer"
            >
              {tSite("inventario.clearFilters")}
            </button>
          </motion.div>
        )}
        </div>{/* end scrollable content */}
      </div>

      {/* Tipología Selector Modal — multi-tipo units */}
      <AnimatePresence>
        {tipoSelectorUnit && (() => {
          const availTipos = getUnitAvailableTipologias(tipoSelectorUnit.id);
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
              onClick={() => setTipoSelectorUnit(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                transition={{ type: "spring", duration: 0.3, bounce: 0.15 }}
                onClick={(e) => e.stopPropagation()}
                className="glass-card rounded-2xl p-5 max-w-sm w-full mx-4 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      {getUnitDisplayName(tipoSelectorUnit, unitPrefix)}
                    </h3>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mt-0.5">
                      {tSite("inventario.chooseTipologia")}
                    </p>
                  </div>
                  <button
                    onClick={() => setTipoSelectorUnit(null)}
                    className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="space-y-2">
                  {availTipos.map((tipo) => (
                    <Link
                      key={tipo.id}
                      href={`${basePath}/tipologias?tipo=${tipo.id}&unidad=${tipoSelectorUnit.id}`}
                      onClick={() => setTipoSelectorUnit(null)}
                      className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-white/5 border border-[var(--border-subtle)] hover:border-[rgba(var(--site-primary-rgb),0.3)] hover:bg-white/[0.08] transition-all group"
                    >
                      <div>
                        <p className="text-xs font-medium text-white group-hover:text-[var(--site-primary)] transition-colors">
                          {tipo.nombre}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-[var(--text-tertiary)]">
                          {columns.area_construida && tipo.area_construida != null && (
                            <span className="flex items-center gap-0.5">
                              <Maximize size={9} className="text-[var(--text-muted)]" />
                              {tipo.area_construida} m²
                            </span>
                          )}
                          {columns.area_m2 && tipo.area_m2 != null && !columns.area_construida && (
                            <span className="flex items-center gap-0.5">
                              <Maximize size={9} className="text-[var(--text-muted)]" />
                              {tipo.area_m2} m²
                            </span>
                          )}
                          {columns.area_privada && tipo.area_privada != null && (
                            <span className="flex items-center gap-0.5">
                              <Maximize size={9} className="text-[var(--text-muted)]" />
                              {tipo.area_privada} m²
                            </span>
                          )}
                          {columns.area_lote && tipo.area_lote != null && (
                            <span className="flex items-center gap-0.5">
                              <Maximize size={9} className="text-[var(--text-muted)]" />
                              {tipo.area_lote} m²
                            </span>
                          )}
                          {tipo.habitaciones != null && (
                            <span className="flex items-center gap-0.5">
                              <BedDouble size={9} className="text-[var(--text-muted)]" />
                              {tipo.habitaciones}
                            </span>
                          )}
                          {tipo.banos != null && (
                            <span className="flex items-center gap-0.5">
                              <Bath size={9} className="text-[var(--text-muted)]" />
                              {tipo.banos}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {tipo.precio_desde != null && (
                          <p className="text-xs font-medium text-[var(--site-primary)]">
                            {formatCurrency(tipo.precio_desde, proyecto.moneda_base ?? "COP")}
                          </p>
                        )}
                        <ChevronRight size={14} className="text-[var(--text-muted)] group-hover:text-[var(--site-primary)] transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Cotizador Modal */}
      {cotizarUnidad && (
        <CotizadorModal
          isOpen={!!cotizarUnidad}
          onClose={() => setCotizarUnidad(null)}
          unidad={isTipologiaPricing
            ? { ...cotizarUnidad, precio: getUnitPrice(cotizarUnidad) }
            : cotizarUnidad
          }
          tipologia={getTipologiaName(cotizarUnidad.tipologia_id) || undefined}
          proyectoId={proyecto.id}
          cotizadorEnabled={proyecto.cotizador_enabled}
          cotizadorConfig={proyecto.cotizador_config}
          tipoProyecto={proyecto.tipo_proyecto}
        />
      )}

      {/* Floor plan lightbox */}
      {planoLightboxUrl && (
        <Lightbox
          images={[{ id: "unit-plano", url: planoLightboxUrl, thumbnail_url: planoLightboxUrl, alt_text: tSite("inventario.viewFloorPlan") }]}
          onClose={() => setPlanoLightboxUrl(null)}
        />
      )}
    </SectionTransition>
  );
}
