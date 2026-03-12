"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

import {
  Search,
  Maximize,
  BedDouble,
  Bath,
  Compass,
  Eye,
  ArrowUpDown,
  Building2,
  Home,
  Sparkles,
  LayoutGrid,
  LayoutList,
} from "lucide-react";
import { useSiteProject, useSiteBasePath } from "@/hooks/useSiteProject";
import { usePersistedState } from "@/hooks/usePersistedState";
import { useTranslation, getEstadoConfig } from "@/i18n";
import { CotizadorModal } from "@/components/site/CotizadorModal";
import { SectionTransition } from "@/components/site/SectionTransition";
import { cn } from "@/lib/utils";
import type { Unidad } from "@/types";

type SortKey = "precio_asc" | "precio_desc" | "area_asc" | "area_desc" | "piso_asc" | "piso_desc";

function formatPrecio(precio: number, locale: string): string {
  return new Intl.NumberFormat(locale === "es" ? "es-CO" : "en-US", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(precio);
}

function formatPrecioShort(precio: number): string {
  if (precio >= 1000000000) return `$${(precio / 1000000000).toFixed(1)}B`;
  return `$${(precio / 1000000).toFixed(0)}M`;
}

export default function InventarioPage() {
  const proyecto = useSiteProject();
  const basePath = useSiteBasePath();
  const { t: tSite, locale } = useTranslation("site");
  const { t: tCommon } = useTranslation("common");
  const { unidades, tipologias } = proyecto;

  // Empty state — no units configured
  if (!unidades || unidades.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 text-center px-8 bg-[var(--site-bg)]">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
          <Building2 size={28} className="text-[var(--text-muted)]" />
        </div>
        <div>
          <h2 className="text-lg font-site-heading text-[var(--text-secondary)] mb-1">
            {tSite("inventario.notAvailable")}
          </h2>
          <p className="text-sm text-[var(--text-tertiary)]">
            {tSite("inventario.notConfigured")}
          </p>
        </div>
      </div>
    );
  }

  const estadoConfig = useMemo(() => getEstadoConfig(tCommon), [tCommon]);

  const sortOptions: Array<{ value: SortKey; label: string }> = useMemo(() => [
    { value: "piso_asc", label: tSite("inventario.sortFloorAsc") },
    { value: "piso_desc", label: tSite("inventario.sortFloorDesc") },
    { value: "precio_asc", label: tSite("inventario.sortPriceAsc") },
    { value: "precio_desc", label: tSite("inventario.sortPriceDesc") },
    { value: "area_asc", label: tSite("inventario.sortAreaAsc") },
    { value: "area_desc", label: tSite("inventario.sortAreaDesc") },
  ], [tSite]);

  const torres = proyecto.torres ?? [];
  const isMultiTorre = torres.length > 1;

  // Filter state
  const [torreFilter, setTorreFilter] = useState<string>("todas");
  const [tipologiaFilter, setTipologiaFilter] = useState<string>("todas");
  const [estadoFilter, setEstadoFilter] = useState<string>("todas");
  const [habFilter, setHabFilter] = useState<string>("todas");
  const [banosFilter, setBanosFilter] = useState<string>("todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("piso_asc");

  // View mode (persisted) + Cotizador modal state
  const [viewMode, setViewMode] = usePersistedState<"grid" | "list">(
    "inventario-view",
    "grid",
    proyecto.slug,
  );
  const [cotizarUnidad, setCotizarUnidad] = useState<Unidad | null>(null);

  // Estado counts (scoped to active torre when filtered)
  const estadoCounts = useMemo(() => {
    const base = torreFilter !== "todas"
      ? unidades.filter((u) => u.torre_id === torreFilter)
      : unidades;
    return {
      todas: base.length,
      disponible: base.filter((u) => u.estado === "disponible").length,
      separado: base.filter((u) => u.estado === "separado").length,
      reservada: base.filter((u) => u.estado === "reservada").length,
      vendida: base.filter((u) => u.estado === "vendida").length,
    };
  }, [unidades, torreFilter]);

  // Tipologías filtered by torre for the dropdown
  const tipologiasForFilter = useMemo(() => {
    if (!isMultiTorre || torreFilter === "todas") return tipologias;
    return tipologias.filter(t => t.torre_ids?.includes(torreFilter) || !t.torre_ids?.length);
  }, [tipologias, isMultiTorre, torreFilter]);

  // Unique bedroom counts for filter
  const habOptions = useMemo(() => {
    const set = new Set(unidades.map((u) => u.habitaciones).filter((h): h is number => h !== null));
    return [...set].sort((a, b) => a - b);
  }, [unidades]);

  // Unique bathroom counts for filter
  const banosOptions = useMemo(() => {
    const set = new Set(unidades.map((u) => u.banos).filter((b): b is number => b !== null));
    return [...set].sort((a, b) => a - b);
  }, [unidades]);

  // Filtered + sorted units
  const filteredUnidades = useMemo(() => {
    let result = [...unidades];

    // Torre filter
    if (torreFilter !== "todas") {
      result = result.filter((u) => u.torre_id === torreFilter);
    }

    // Tipología filter
    if (tipologiaFilter !== "todas") {
      result = result.filter((u) => u.tipologia_id === tipologiaFilter);
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

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((u) =>
        u.identificador.toLowerCase().includes(q) ||
        u.vista?.toLowerCase().includes(q) ||
        u.orientacion?.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "precio_asc": return (a.precio ?? 0) - (b.precio ?? 0);
        case "precio_desc": return (b.precio ?? 0) - (a.precio ?? 0);
        case "area_asc": return (a.area_m2 ?? 0) - (b.area_m2 ?? 0);
        case "area_desc": return (b.area_m2 ?? 0) - (a.area_m2 ?? 0);
        case "piso_asc": return (a.piso ?? 0) - (b.piso ?? 0);
        case "piso_desc": return (b.piso ?? 0) - (a.piso ?? 0);
        default: return 0;
      }
    });

    return result;
  }, [unidades, torreFilter, tipologiaFilter, estadoFilter, habFilter, banosFilter, searchQuery, sortBy]);

  const getTipologiaName = (tipologiaId: string | null) => {
    if (!tipologiaId) return null;
    return tipologias.find((t) => t.id === tipologiaId);
  };

  return (
    <SectionTransition className="min-h-screen bg-[var(--site-bg)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-4">
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
            {(["disponible", "separado", "reservada", "vendida"] as const).map((estado) => {
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
          <select
            value={tipologiaFilter}
            onChange={(e) => setTipologiaFilter(e.target.value)}
            className="bg-white/5 border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[11px] text-white/70 cursor-pointer focus:outline-none shrink-0"
          >
            <option value="todas">{tSite("inventario.typeAll")}</option>
            {tipologiasForFilter.map((t) => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>

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

          <div className="w-px h-5 bg-white/[0.06] shrink-0" />

          {/* Estado pills */}
          <div className="flex items-center gap-0.5 shrink-0">
            {(["todas", "disponible", "separado", "reservada", "vendida"] as const).map((estado) => {
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
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="bg-white/5 border border-white/[0.08] rounded-lg px-2 py-1.5 text-[11px] text-white/70 cursor-pointer focus:outline-none shrink-0"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
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

        {/* ====== GRID VIEW ====== */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
            <AnimatePresence mode="popLayout">
              {filteredUnidades.map((unit, index) => {
                const config = estadoConfig[unit.estado];
                const tipo = getTipologiaName(unit.tipologia_id);

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
                    {/* Top: status dot + identifier + tipo + floor */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dot)} title={config.label} />
                      <h3 className="text-sm font-semibold text-white">{unit.identificador}</h3>
                      {tipo && (
                        <span className="text-[10px] text-[var(--site-primary)] opacity-60 truncate">
                          {tipo.nombre}
                        </span>
                      )}
                      {unit.piso && (
                        <span className="text-[10px] text-[var(--text-muted)] ml-auto shrink-0">
                          P{unit.piso}
                        </span>
                      )}
                    </div>

                    {/* Stats: area | beds | baths | orientation | view — single compact line */}
                    <div className="flex items-center gap-2.5 mb-2 text-[11px] text-[var(--text-tertiary)]">
                      {unit.area_m2 && (
                        <span className="flex items-center gap-0.5">
                          <Maximize size={10} className="text-[var(--text-muted)]" />
                          {unit.area_m2}m²
                        </span>
                      )}
                      {unit.habitaciones !== null && (
                        <span className="flex items-center gap-0.5">
                          <BedDouble size={10} className="text-[var(--text-muted)]" />
                          {unit.habitaciones === 0 ? tSite("inventario.studioShort") : unit.habitaciones}
                        </span>
                      )}
                      {unit.banos !== null && (
                        <span className="flex items-center gap-0.5">
                          <Bath size={10} className="text-[var(--text-muted)]" />
                          {unit.banos}
                        </span>
                      )}
                      {unit.orientacion && (
                        <span className="flex items-center gap-0.5">
                          <Compass size={10} className="text-[var(--text-muted)]" />
                          {unit.orientacion}
                        </span>
                      )}
                      {unit.vista && (
                        <span className="flex items-center gap-0.5">
                          <Eye size={10} className="text-[var(--text-muted)]" />
                          {unit.vista}
                        </span>
                      )}
                    </div>

                    {/* Price + actions — single row */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      {unit.precio ? (
                        <p className="text-sm font-semibold text-white">
                          {formatPrecioShort(unit.precio)}
                        </p>
                      ) : (
                        <span />
                      )}
                      <div className="flex items-center gap-1">
                        <Link
                          href={`${basePath}/tipologias?tipo=${unit.tipologia_id}&unidad=${unit.id}`}
                          className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-white bg-white/5 hover:bg-white/10 transition-all"
                          aria-label={tSite("inventario.viewUnit", { unit: unit.identificador })}
                        >
                          <Eye size={13} />
                        </Link>
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
          <div className="glass rounded-xl overflow-hidden">
            {/* Table header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] text-[10px] text-[var(--text-muted)] tracking-wider uppercase">
              <span className="w-4 shrink-0" />
              <span className="w-24 shrink-0">{tSite("inventario.unit")}</span>
              <span className="w-28 shrink-0 hidden md:block">{tSite("inventario.type")}</span>
              <span className="w-16 shrink-0 text-right">{tSite("inventario.area")}</span>
              <span className="w-10 shrink-0 text-center hidden lg:block">{tSite("inventario.bedrooms")}</span>
              <span className="w-10 shrink-0 text-center hidden lg:block">{tSite("inventario.bathrooms")}</span>
              <span className="w-20 shrink-0 hidden xl:block">{tSite("inventario.orientation")}</span>
              <span className="w-20 shrink-0 hidden xl:block">{tSite("inventario.view")}</span>
              <span className="w-12 shrink-0 text-center">{tSite("inventario.floor")}</span>
              <span className="flex-1 text-right">{tSite("inventario.price")}</span>
              <span className="w-16 shrink-0" />
            </div>

            {/* Rows */}
            <AnimatePresence mode="popLayout">
              {filteredUnidades.map((unit, index) => {
                const config = estadoConfig[unit.estado];
                const tipo = getTipologiaName(unit.tipologia_id);

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
                    <span className="w-24 shrink-0 text-xs font-medium text-white truncate">{unit.identificador}</span>
                    <span className="w-28 shrink-0 text-[11px] text-[var(--text-tertiary)] truncate hidden md:block">{tipo?.nombre ?? "—"}</span>
                    <span className="w-16 shrink-0 text-[11px] text-[var(--text-secondary)] text-right tabular-nums">{unit.area_m2 ? `${unit.area_m2} m²` : "—"}</span>
                    <span className="w-10 shrink-0 text-[11px] text-[var(--text-tertiary)] text-center hidden lg:block">{unit.habitaciones !== null ? (unit.habitaciones === 0 ? tSite("inventario.studioShort") : unit.habitaciones) : "—"}</span>
                    <span className="w-10 shrink-0 text-[11px] text-[var(--text-tertiary)] text-center hidden lg:block">{unit.banos ?? "—"}</span>
                    <span className="w-20 shrink-0 text-[11px] text-[var(--text-tertiary)] truncate hidden xl:block">{unit.orientacion ?? "—"}</span>
                    <span className="w-20 shrink-0 text-[11px] text-[var(--text-tertiary)] truncate hidden xl:block">{unit.vista ?? "—"}</span>
                    <span className="w-12 shrink-0 text-[11px] text-[var(--text-tertiary)] text-center tabular-nums">{unit.piso ?? "—"}</span>
                    <span className="flex-1 text-xs font-semibold text-white text-right tabular-nums">{unit.precio ? formatPrecioShort(unit.precio) : "—"}</span>
                    <div className="w-16 shrink-0 flex items-center justify-end gap-0.5">
                      <Link
                        href={`${basePath}/tipologias?tipo=${unit.tipologia_id}&unidad=${unit.id}`}
                        className="p-1 rounded-md text-[var(--text-secondary)] hover:text-white bg-white/5 hover:bg-white/10 transition-all"
                        aria-label={tSite("inventario.viewUnit", { unit: unit.identificador })}
                      >
                        <Eye size={12} />
                      </Link>
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
                setEstadoFilter("todas");
                setHabFilter("todas");
                setBanosFilter("todas");
                setSearchQuery("");
              }}
              className="mt-4 btn-outline-warm px-5 py-2 text-xs tracking-wider cursor-pointer"
            >
              {tSite("inventario.clearFilters")}
            </button>
          </motion.div>
        )}
      </div>

      {/* Cotizador Modal */}
      {cotizarUnidad && (
        <CotizadorModal
          isOpen={!!cotizarUnidad}
          onClose={() => setCotizarUnidad(null)}
          unidad={cotizarUnidad}
          tipologia={getTipologiaName(cotizarUnidad.tipologia_id) || undefined}
          proyectoId={proyecto.id}
        />
      )}
    </SectionTransition>
  );
}
