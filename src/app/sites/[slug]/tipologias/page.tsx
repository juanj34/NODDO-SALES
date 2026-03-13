"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSiteProject } from "@/hooks/useSiteProject";
import { usePersistedState } from "@/hooks/usePersistedState";
import { useTranslation, getEstadoConfig } from "@/i18n";
import { CotizadorModal } from "@/components/site/CotizadorModal";
import { Lightbox } from "@/components/site/Lightbox";
import { SectionTransition } from "@/components/site/SectionTransition";
import { CloseButton } from "@/components/ui/CloseButton";
import { cn } from "@/lib/utils";
import {
  Maximize,
  BedDouble,
  Bath,
  Car,
  CheckCircle2,
  Compass,
  Eye,
  X,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Building2,
  Home,
  Images,
  Archive,
} from "lucide-react";
import { SiteEmptyState } from "@/components/site/SiteEmptyState";
import type { Unidad, LightboxImage } from "@/types";

function formatPrecio(precio: number): string {
  if (precio >= 1000000000) {
    return `$${(precio / 1000000000).toFixed(1)}B`;
  }
  return `$${(precio / 1000000).toFixed(0)}M`;
}

function formatPrecioFull(precio: number, locale: string): string {
  return new Intl.NumberFormat(locale === "es" ? "es-CO" : "en-US", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(precio);
}

export default function TipologiasPage() {
  const proyecto = useSiteProject();
  const searchParams = useSearchParams();
  const { t: tSite, locale } = useTranslation("site");
  const { t: tCommon } = useTranslation("common");
  const tipologias = proyecto.tipologias;
  const unidades = proyecto.unidades;

  // Empty state — no tipologías configured
  if (!tipologias || tipologias.length === 0) {
    return (
      <SiteEmptyState
        variant="tipologias"
        title={tSite("tipologias.notAvailable")}
        description={tSite("tipologias.notConfigured")}
      />
    );
  }

  // i18n-driven estado config and filters
  const estadoConfigDynamic = useMemo(() => getEstadoConfig(tCommon), [tCommon]);
  const estadoFiltersDynamic = useMemo(() => [
    { value: "todas", label: tCommon("labels.all") },
    { value: "disponible", label: tCommon("estados.disponible") },
    { value: "separado", label: tCommon("estados.separado") },
    { value: "reservada", label: tCommon("estados.reservada") },
    { value: "vendida", label: tCommon("estados.vendida") },
  ], [tCommon]);

  // Torre selector state
  const torres = proyecto.torres ?? [];
  const isMultiTorre = torres.length > 1;
  const [activeTorreId, setActiveTorreId] = usePersistedState<string | null>(
    "tipologias-torre",
    isMultiTorre ? torres[0]?.id ?? null : null,
    proyecto.slug,
  );

  // Filter tipologías by active torre
  const visibleTipologias = useMemo(() => {
    if (!isMultiTorre || !activeTorreId) return tipologias;
    return tipologias.filter((t) => t.torre_ids?.includes(activeTorreId));
  }, [tipologias, isMultiTorre, activeTorreId]);

  // Read query params for deep linking
  const tipoParam = searchParams.get("tipo");
  const unidadParam = searchParams.get("unidad");

  // Persist the tipologia ID rather than the index (index changes when torre changes)
  const [persistedTipoId, setPersistedTipoId] = usePersistedState<string | null>(
    "tipologias-tipo",
    null,
    proyecto.slug,
  );
  const [activeIndex, setActiveIndexRaw] = useState(() => {
    if (persistedTipoId) {
      const idx = visibleTipologias.findIndex((t) => t.id === persistedTipoId);
      if (idx >= 0) return idx;
    }
    return 0;
  });
  // Wrap setActiveIndex to also persist the tipologia ID
  const setActiveIndex = useCallback((v: number | ((prev: number) => number)) => {
    setActiveIndexRaw((prev) => {
      const next = typeof v === "function" ? v(prev) : v;
      const tipo = visibleTipologias[next];
      if (tipo) setPersistedTipoId(tipo.id);
      return next;
    });
  }, [visibleTipologias, setPersistedTipoId]);
  const [estadoFilter, setEstadoFilter] = useState("todas");
  const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null);
  const [activeHotspot, setActiveHotspot] = useState<{ label: string; render_url: string } | null>(null);
  const [showUbicacion, setShowUbicacion] = useState(false);
  const [showRenderGallery, setShowRenderGallery] = useState(false);

  // Image ref for hotspot container
  const planoImgRef = useRef<HTMLImageElement>(null);

  // Unit context panel state
  const [selectedUnit, setSelectedUnit] = useState<Unidad | null>(null);
  const [cotizarUnidad, setCotizarUnidad] = useState<Unidad | null>(null);
  const [infoExpanded, setInfoExpanded] = useState(false);

  // Handle query params on mount
  useEffect(() => {
    if (tipoParam) {
      const idx = visibleTipologias.findIndex((t) => t.id === tipoParam);
      if (idx >= 0) setActiveIndex(idx);
    }
    if (unidadParam) {
      const unit = unidades.find((u) => u.id === unidadParam);
      if (unit) {
        setSelectedUnit(unit);
        // Also switch to the correct tipología tab
        if (unit.tipologia_id) {
          const idx = visibleTipologias.findIndex((t) => t.id === unit.tipologia_id);
          if (idx >= 0) setActiveIndex(idx);
        }
      }
    }
  }, [tipoParam, unidadParam, visibleTipologias, unidades]);

  // Reset activeIndex when torre changes — try to restore persisted tipo
  useEffect(() => {
    if (persistedTipoId) {
      const idx = visibleTipologias.findIndex((t) => t.id === persistedTipoId);
      if (idx >= 0) {
        setActiveIndexRaw(idx);
        setSelectedUnit(null);
        return;
      }
    }
    setActiveIndexRaw(0);
    setSelectedUnit(null);
  }, [activeTorreId, visibleTipologias, persistedTipoId]);

  // Keyboard navigation
  const closeHotspot = useCallback(() => setActiveHotspot(null), []);
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case "Escape":
          // Lightbox handles its own ESC
          if (showRenderGallery) return;
          if (showUbicacion) {
            setShowUbicacion(false);
          } else if (activeHotspot) {
            closeHotspot();
          } else if (selectedUnit) {
            setSelectedUnit(null);
          }
          break;
        case "ArrowLeft":
          if (!activeHotspot && !showRenderGallery) {
            e.preventDefault();
            setActiveIndex((prev) => Math.max(prev - 1, 0));
            setEstadoFilter("todas");
            setSelectedUnit(null);
          }
          break;
        case "ArrowRight":
          if (!activeHotspot && !showRenderGallery) {
            e.preventDefault();
            setActiveIndex((prev) => Math.min(prev + 1, visibleTipologias.length - 1));
            setEstadoFilter("todas");
            setSelectedUnit(null);
          }
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeHotspot, closeHotspot, selectedUnit, showRenderGallery, showUbicacion, visibleTipologias.length]);

  const active = visibleTipologias[activeIndex] ?? visibleTipologias[0];

  // Filter units for current tipología (must be above early return to preserve hook order)
  const filteredUnidades = useMemo(() => {
    if (!active) return [];
    let filtered = unidades.filter((u) => u.tipologia_id === active.id);
    if (estadoFilter !== "todas") {
      filtered = filtered.filter((u) => u.estado === estadoFilter);
    }
    return filtered;
  }, [unidades, active, estadoFilter]);

  // Count units by estado for current tipología
  const estadoCounts = useMemo(() => {
    if (!active) return { todas: 0, disponible: 0, separado: 0, reservada: 0, vendida: 0 };
    const tipoUnidades = unidades.filter((u) => u.tipologia_id === active.id);
    return {
      todas: tipoUnidades.length,
      disponible: tipoUnidades.filter((u) => u.estado === "disponible").length,
      separado: tipoUnidades.filter((u) => u.estado === "separado").length,
      reservada: tipoUnidades.filter((u) => u.estado === "reservada").length,
      vendida: tipoUnidades.filter((u) => u.estado === "vendida").length,
    };
  }, [unidades, active]);

  // Dynamic "desde" price from cheapest available unit
  const precioDesde = useMemo(() => {
    if (!active) return null;
    const tipoUnits = unidades.filter(
      (u) => u.tipologia_id === active.id && u.estado === "disponible" && u.precio != null
    );
    if (tipoUnits.length === 0) return active.precio_desde;
    return Math.min(...tipoUnits.map((u) => u.precio!));
  }, [active, unidades]);

  // Render images from hotspots for gallery lightbox
  const renderImages: LightboxImage[] = useMemo(() => {
    if (!active) return [];
    return active.hotspots
      .filter((h) => h.render_url)
      .map((h) => ({
        id: h.id,
        url: h.render_url,
        thumbnail_url: h.render_url,
        alt_text: h.label,
        label: h.label,
      }));
  }, [active]);

  // Group units by floor
  const unitsByFloor = useMemo(() => {
    const grouped: Record<number, typeof filteredUnidades> = {};
    filteredUnidades.forEach((u) => {
      const floor = u.piso ?? 0;
      if (!grouped[floor]) grouped[floor] = [];
      grouped[floor].push(u);
    });
    return Object.entries(grouped).sort(
      ([a], [b]) => Number(a) - Number(b)
    );
  }, [filteredUnidades]);

  const showFloorHeaders = unitsByFloor.length > 1;

  // No tipologías available for this torre — show empty state
  if (!active) {
    return (
      <SectionTransition className="h-screen flex flex-col overflow-hidden bg-[var(--site-bg)]">
        {isMultiTorre && (
          <div className="flex-shrink-0 flex items-center gap-2 px-6 lg:px-12 pt-4 pb-1">
            {torres.map((torre) => (
              <button
                key={torre.id}
                onClick={() => setActiveTorreId(torre.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium tracking-wider uppercase transition-all cursor-pointer",
                  activeTorreId === torre.id
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
        <div className="flex-1 flex items-center justify-center">
          <SiteEmptyState
            variant="tipologias"
            title={tSite("tipologias.noTorreTipologias")}
            description={tSite("tipologias.noTorreTipologiasDesc")}
            compact
          />
        </div>
      </SectionTransition>
    );
  }

  return (
    <SectionTransition className="h-screen flex flex-col overflow-hidden bg-[var(--site-bg)]">
      {/* ====== TOP: Torre Selector (multi-torre only) ====== */}
      {isMultiTorre && (
        <div className="flex-shrink-0 flex items-center gap-2 px-6 lg:px-12 pt-4 pb-1">
          {torres.map((torre) => (
            <button
              key={torre.id}
              onClick={() => setActiveTorreId(torre.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium tracking-wider uppercase transition-all cursor-pointer",
                activeTorreId === torre.id
                  ? "bg-[rgba(var(--site-primary-rgb),0.15)] text-[var(--site-primary)] ring-1 ring-[rgba(var(--site-primary-rgb),0.3)]"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/5"
              )}
            >
              <Building2 size={13} />
              {torre.nombre}
            </button>
          ))}
        </div>
      )}

      {/* ====== TOP: Tipología Tab Bar ====== */}
      <div className={cn("flex-shrink-0 px-6 lg:px-12 pb-3", isMultiTorre ? "pt-2" : "pt-5")}>
        <div className="flex items-end gap-6">
          {visibleTipologias.map((tipo, idx) => {
            const isActive = idx === activeIndex;
            const tipoUnits = unidades.filter((u) => u.tipologia_id === tipo.id);
            const disponibles = tipoUnits.filter((u) => u.estado === "disponible").length;
            return (
              <button
                key={tipo.id}
                onClick={() => { setActiveIndex(idx); setEstadoFilter("todas"); setSelectedUnit(null); setActiveHotspot(null); }}
                className={cn(
                  "relative pb-3 cursor-pointer transition-colors duration-200 group",
                  isActive ? "text-white" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                )}
              >
                <span className="text-sm font-medium tracking-wide">{tipo.nombre}</span>
                {disponibles > 0 && (
                  <span className={cn(
                    "ml-2 text-[10px] tabular-nums transition-colors duration-200",
                    isActive ? "text-[var(--site-primary)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-tertiary)]"
                  )}>
                    {disponibles}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="tipo-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--site-primary)] rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </button>
            );
          })}
        </div>
        <div className="h-px bg-white/[0.06]" />
      </div>

      {/* ====== MAIN CONTENT ====== */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 px-6 lg:px-12 pb-6 min-h-0">
        {/* ====== LEFT: Floor Plan + Stats ====== */}
        <div className="flex-1 flex flex-col min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col min-h-0"
            >
              {/* Floor Plan with Hotspots — inline-block wrapper shrink-wraps to image */}
              <div className="flex-1 relative glass-card p-4 min-h-0 flex items-center justify-center overflow-hidden">
                {active.plano_url && (
                  <div className="relative inline-block max-w-full max-h-full leading-[0]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      ref={planoImgRef}
                      src={active.plano_url}
                      alt={`Plano ${active.nombre}`}
                      className="block max-w-full max-h-[calc(100vh-320px)] w-auto h-auto rounded-xl"
                      draggable={false}
                    />

                    {/* Hotspot dots — CSS % positioned relative to the inline-block wrapper */}
                    {active.hotspots.map((hotspot) => (
                      <button
                        key={hotspot.id}
                        aria-label={`Ver ${hotspot.label}`}
                        className="absolute cursor-pointer group z-10 flex items-center justify-center"
                        style={{
                          left: `${hotspot.x}%`,
                          top: `${hotspot.y}%`,
                          transform: "translate(-50%, -50%)",
                          minWidth: "44px",
                          minHeight: "44px",
                        }}
                        onClick={() => setActiveHotspot({ label: hotspot.label, render_url: hotspot.render_url })}
                        onMouseEnter={() => setHoveredHotspot(hotspot.id)}
                        onMouseLeave={() => setHoveredHotspot(null)}
                      >
                        {/* Wrapper — sized by the dot, centered by button flexbox */}
                        <span className="relative inline-flex items-center justify-center">
                          {/* Pulse ring — inset-0 matches wrapper size, scales from center */}
                          <span className="absolute inset-0 rounded-full border-2 border-[rgba(var(--site-primary-rgb),0.40)] animate-ping origin-center" />
                          {/* Dot */}
                          <span className={cn(
                            "block w-5 h-5 rounded-full bg-[var(--site-primary)] border-2 border-white shadow-lg shadow-[rgba(var(--site-primary-rgb),0.30)] transition-transform duration-150",
                            hoveredHotspot === hotspot.id && "scale-130"
                          )} />
                        </span>

                        {/* Tooltip */}
                        <AnimatePresence>
                          {hoveredHotspot === hotspot.id && (
                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 8 }}
                              className="absolute top-full mt-2 left-1/2 -translate-x-1/2 glass-dark px-3 py-1.5 rounded-lg whitespace-nowrap z-30 pointer-events-none"
                            >
                              <span className="text-[11px] font-medium text-white tracking-wider">
                                {hotspot.label}
                              </span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </button>
                    ))}
                  </div>
                )}

                {/* Render gallery button — bottom left */}
                {renderImages.length > 0 && !selectedUnit && (
                  <button
                    onClick={() => setShowRenderGallery(true)}
                    className="absolute bottom-4 left-4 glass-card rounded-xl overflow-hidden border border-[var(--border-default)] shadow-lg z-10 cursor-pointer group transition-all hover:border-[rgba(var(--site-primary-rgb),0.4)] hover:shadow-[var(--glow-sm)] flex items-center gap-2.5 px-3 py-2.5"
                  >
                    {/* Thumbnail of first render */}
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={renderImages[0].url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-left">
                      <span className="text-[11px] text-[var(--text-secondary)] font-medium tracking-wide flex items-center gap-1.5">
                        <Images size={12} className="text-[var(--site-primary)]" />
                        Renders
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {renderImages.length} {renderImages.length === 1 ? "imagen" : "imágenes"}
                      </span>
                    </div>
                  </button>
                )}

                {/* Location thumbnail overlay */}
                {active.ubicacion_plano_url && !selectedUnit && (
                  <button
                    onClick={() => setShowUbicacion(true)}
                    className="absolute bottom-4 right-4 w-[120px] h-[120px] glass-card rounded-xl overflow-hidden border border-[var(--border-default)] shadow-lg z-10 cursor-pointer group transition-all hover:border-[rgba(var(--site-primary-rgb),0.4)] hover:shadow-[var(--glow-sm)]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={active.ubicacion_plano_url}
                      alt="Ubicación"
                      className="w-full h-full object-contain p-2"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <Maximize size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                )}

                {/* Unit Context Banner — overlaid on floor plan */}
                <AnimatePresence>
                  {selectedUnit && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ type: "spring", damping: 25 }}
                      className="absolute bottom-4 left-4 right-4 z-20 glass-dark rounded-2xl p-4"
                    >
                      <button
                        onClick={() => setSelectedUnit(null)}
                        aria-label="Cerrar detalle"
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                      >
                        <X size={12} className="text-[var(--text-secondary)]" />
                      </button>

                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-semibold text-white">
                              {selectedUnit.identificador}
                            </h3>
                            {(() => {
                              const cfg = estadoConfigDynamic[selectedUnit.estado];
                              return (
                                <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium", cfg.bg, cfg.color)}>
                                  <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                                  {cfg.label}
                                </span>
                              );
                            })()}
                          </div>

                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)] mb-2">
                            {selectedUnit.area_m2 && (
                              <span className="flex items-center gap-1">
                                <Maximize size={11} /> {selectedUnit.area_m2} m²
                              </span>
                            )}
                            {selectedUnit.piso && (
                              <span>Piso {selectedUnit.piso}</span>
                            )}
                            {selectedUnit.habitaciones !== null && (
                              <span className="flex items-center gap-1">
                                <BedDouble size={11} /> {selectedUnit.habitaciones} hab
                              </span>
                            )}
                            {selectedUnit.banos !== null && (
                              <span className="flex items-center gap-1">
                                <Bath size={11} /> {selectedUnit.banos} baños
                              </span>
                            )}
                            {selectedUnit.orientacion && (
                              <span className="flex items-center gap-1">
                                <Compass size={11} /> {selectedUnit.orientacion}
                              </span>
                            )}
                            {selectedUnit.vista && (
                              <span className="flex items-center gap-1">
                                <Eye size={11} /> {selectedUnit.vista}
                              </span>
                            )}
                          </div>

                          {selectedUnit.precio && (
                            <p className="text-lg font-semibold text-[var(--site-primary)]">
                              {formatPrecioFull(selectedUnit.precio, locale)}
                            </p>
                          )}
                        </div>

                        {/* Cotizar button */}
                        <button
                          onClick={() => setCotizarUnidad(selectedUnit)}
                          className="flex-shrink-0 btn-warm px-5 py-2.5 flex items-center gap-2 text-xs tracking-wider cursor-pointer"
                        >
                          <Sparkles size={14} />
                          COTIZAR
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Stats Row */}
              <div className="flex-shrink-0 grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
                {/* Combined Area Card */}
                <div className="glass-card rounded-2xl p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Maximize size={14} className="text-[var(--site-primary)]" />
                    <span className="text-[10px] tracking-wider text-[var(--text-tertiary)] uppercase">
                      Áreas
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[var(--text-muted)]">Interna</span>
                      <span className="text-xs font-medium text-white">
                        {active.area_m2 != null ? `${active.area_m2} m²` : "—"}
                      </span>
                    </div>
                    {active.area_balcon != null && active.area_balcon > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[var(--text-muted)]">Balcón</span>
                        <span className="text-xs font-medium text-white">
                          {active.area_balcon} m²
                        </span>
                      </div>
                    )}
                    <div className="h-px bg-white/[0.06] my-1" />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[var(--text-tertiary)] font-medium">Total</span>
                      <span className="text-sm font-semibold text-[var(--site-primary)]">
                        {active.area_m2 != null || active.area_balcon != null
                          ? `${((active.area_m2 || 0) + (active.area_balcon || 0))} m²`
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>
                <StatCard
                  icon={<BedDouble size={16} />}
                  label="Habitaciones"
                  value={active.habitaciones === 0 ? "Studio" : String(active.habitaciones)}
                />
                <StatCard
                  icon={<Bath size={16} />}
                  label="Baños"
                  value={String(active.banos)}
                />
                <StatCard
                  icon={<Car size={16} />}
                  label="Parqueaderos"
                  value={String(active.parqueaderos ?? 0)}
                />
                {(active.depositos ?? 0) > 0 && (
                  <StatCard
                    icon={<Archive size={16} />}
                    label="Depósitos"
                    value={String(active.depositos)}
                  />
                )}
                <div className="glass-card rounded-2xl p-3 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] tracking-wider text-[var(--text-tertiary)] uppercase mb-1">Desde</span>
                  <span className="text-sm font-semibold text-[var(--site-primary)]">
                    {precioDesde ? formatPrecio(precioDesde) : "—"}
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ====== RIGHT SIDEBAR ====== */}
        <div className="w-full lg:w-[340px] flex-shrink-0 flex flex-col min-h-0 glass-card rounded-3xl overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full"
            >
              {/* Tipología Info */}
              <div className="p-6 pb-2 flex-shrink-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] tracking-[0.35em] text-[var(--site-primary)] uppercase mb-1">
                      {proyecto.nombre}
                    </p>
                    <h2 className="font-site-heading text-2xl text-white">
                      {active.nombre}
                    </h2>
                  </div>
                  {(active.descripcion || active.caracteristicas.length > 0) && (
                    <button
                      onClick={() => setInfoExpanded((prev) => !prev)}
                      className="mt-1 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] flex-shrink-0"
                    >
                      <span className="text-[10px] tracking-wider uppercase">
                        {infoExpanded ? "Menos" : "Info"}
                      </span>
                      <motion.div
                        animate={{ rotate: infoExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown size={12} />
                      </motion.div>
                    </button>
                  )}
                </div>

                <AnimatePresence initial={false}>
                  {infoExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3">
                        {active.descripcion && (
                          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                            {active.descripcion}
                          </p>
                        )}

                        {/* Key Features */}
                        {active.caracteristicas.length > 0 && (
                          <div className="space-y-2 mb-2">
                            <p className="text-[10px] tracking-[0.25em] text-[var(--text-tertiary)] uppercase">
                              Características
                            </p>
                            {active.caracteristicas.map((feat, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <CheckCircle2 size={14} className="text-[var(--site-primary)] mt-0.5 flex-shrink-0" />
                                <span className="text-xs text-[var(--text-secondary)]">{feat}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Divider */}
              <div className="border-t border-white/5 mx-6" />

              {/* Units Section */}
              <div className="flex-1 flex flex-col min-h-0 p-6 pt-4">
                {/* Header + Count */}
                <div className="flex items-center justify-between mb-3 flex-shrink-0">
                  <p className="text-[10px] tracking-[0.25em] text-[var(--text-tertiary)] uppercase">
                    Unidades
                  </p>
                  <span className="text-xs text-[var(--site-primary)]">
                    {estadoCounts.disponible} disponibles
                  </span>
                </div>

                {/* Estado Filter Tabs */}
                <div className="flex gap-1 mb-3 flex-shrink-0 overflow-x-auto scrollbar-hide">
                  {estadoFiltersDynamic.map((filter) => {
                    const count = estadoCounts[filter.value as keyof typeof estadoCounts] ?? 0;
                    return (
                      <button
                        key={filter.value}
                        onClick={() => setEstadoFilter(filter.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-[10px] tracking-wider uppercase whitespace-nowrap transition-all cursor-pointer",
                          estadoFilter === filter.value
                            ? "bg-[rgba(var(--site-primary-rgb),0.15)] text-[var(--site-primary)]"
                            : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/5"
                        )}
                      >
                        {filter.label} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Units List */}
                <div className="flex-1 overflow-y-auto space-y-1 min-h-0" data-lenis-prevent>
                  {filteredUnidades.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                      <SiteEmptyState variant="inventario" title={tSite("tipologias.noUnits")} description="" compact />
                    </div>
                  ) : (
                    unitsByFloor.map(([floor, units]) => (
                      <div key={floor}>
                        {showFloorHeaders && (
                          <div className="px-3 py-1.5 text-[10px] tracking-wider uppercase text-[var(--text-muted)] font-medium">
                            Piso {floor}
                          </div>
                        )}
                        {units.map((unit) => {
                          const config = estadoConfigDynamic[unit.estado];
                          const isSelected = selectedUnit?.id === unit.id;
                          return (
                            <motion.button
                              key={unit.id}
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              onClick={() => setSelectedUnit(isSelected ? null : unit)}
                              className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer text-left",
                                isSelected
                                  ? "bg-[rgba(var(--site-primary-rgb),0.10)] ring-1 ring-[rgba(var(--site-primary-rgb),0.25)]"
                                  : "hover:bg-white/5"
                              )}
                            >
                              {/* Estado dot */}
                              <span className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", config.dot)} />

                              {/* Unit info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white/80 font-medium truncate">
                                  {unit.identificador}
                                </p>
                                <p className="text-[10px] text-[var(--text-tertiary)] tracking-wider">
                                  Piso {unit.piso} · {unit.area_m2} m² · {unit.orientacion}
                                </p>
                              </div>

                              {/* Price */}
                              <div className="text-right flex-shrink-0">
                                <p className="text-sm text-white/70 font-medium">
                                  {unit.precio ? formatPrecio(unit.precio) : "—"}
                                </p>
                                <p className={cn("text-[10px] tracking-wider", config.color)}>
                                  {config.label}
                                </p>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ====== HOTSPOT RENDER MODAL ====== */}
      <AnimatePresence>
        {activeHotspot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-8"
            onClick={() => setActiveHotspot(null)}
          >
            {/* Blur backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

            {/* Modal content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="relative max-w-[85vw] max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={activeHotspot.render_url}
                alt={activeHotspot.label}
                className="max-w-[85vw] max-h-[80vh] object-contain"
              />
              {/* Label overlay bottom-left */}
              <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/70 to-transparent">
                <span className="text-sm font-medium text-white tracking-wide">
                  {activeHotspot.label}
                </span>
              </div>
              {/* Close button */}
              <CloseButton
                onClick={() => setActiveHotspot(null)}
                variant="dark"
                size={16}
                className="absolute top-3 right-3"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== UBICACIÓN MODAL ====== */}
      <AnimatePresence>
        {showUbicacion && active?.ubicacion_plano_url && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-8"
            onClick={() => setShowUbicacion(false)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="relative max-w-[85vw] max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl bg-[var(--surface-1)]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={active.ubicacion_plano_url}
                alt="Ubicación en el proyecto"
                className="max-w-[85vw] max-h-[80vh] object-contain"
              />
              <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/70 to-transparent">
                <span className="text-sm font-medium text-white tracking-wide">
                  Ubicación en el proyecto
                </span>
              </div>
              <CloseButton
                onClick={() => setShowUbicacion(false)}
                variant="dark"
                size={16}
                className="absolute top-3 right-3"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== RENDER GALLERY LIGHTBOX ====== */}
      <AnimatePresence>
        {showRenderGallery && renderImages.length > 0 && (
          <Lightbox
            images={renderImages}
            initialIndex={0}
            onClose={() => setShowRenderGallery(false)}
          />
        )}
      </AnimatePresence>

      {/* ====== COTIZADOR MODAL ====== */}
      {cotizarUnidad && (
        <CotizadorModal
          isOpen={!!cotizarUnidad}
          onClose={() => setCotizarUnidad(null)}
          unidad={cotizarUnidad}
          tipologia={tipologias.find((t) => t.id === cotizarUnidad.tipologia_id) || undefined}
          proyectoId={proyecto.id}
          cotizadorEnabled={proyecto.cotizador_enabled}
          cotizadorConfig={proyecto.cotizador_config}
        />
      )}
    </SectionTransition>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass-card rounded-2xl p-3 flex flex-col items-center justify-center text-center">
      <div className="text-[var(--site-primary)] mb-1">{icon}</div>
      <span className="text-[10px] tracking-wider text-[var(--text-tertiary)] uppercase mb-0.5">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}
