"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSiteProject } from "@/hooks/useSiteProject";
import { usePersistedState } from "@/hooks/usePersistedState";
import { useTranslation, getEstadoConfig } from "@/i18n";
import { CotizadorModal } from "@/components/site/CotizadorModal";
import { Lightbox } from "@/components/site/Lightbox";
import { PlanoZoomLightbox } from "@/components/site/PlanoZoomLightbox";
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
  ChevronDown,
  Building2,
  Home,
  Images,
  Archive,
  Play,
  View,
  Waves,
  UtensilsCrossed, Sun, TreePine, DoorClosed, BookOpen,
  Flame, MoveVertical, CloudSun,
} from "lucide-react";
import { getVideoSrc, getVideoThumb } from "@/lib/video-utils";
import { SiteEmptyState } from "@/components/site/SiteEmptyState";
import VistaModal from "@/components/site/VistaModal";
import { getInventoryColumns, getHybridInventoryColumns, resolveColumnsForTipologia, getPrimaryArea } from "@/lib/inventory-columns";
import { getTipologiaFields } from "@/lib/tipologia-fields";
import { resolveHotspotImages } from "@/lib/hotspot-utils";
import { resolvePisos } from "@/lib/piso-utils";
import { formatCurrency } from "@/lib/currency";
import { getUnitDisplayName } from "@/lib/unit-display";
import type { Unidad, UnidadTipologia, LightboxImage, VistaPiso } from "@/types";
import { useSectionVisibility } from "@/hooks/useSectionVisibility";
import { TowerCompositionDiagram } from "@/components/site/TowerCompositionDiagram";

export default function TipologiasPage() {
  const sectionVisible = useSectionVisibility("tipologias");
  const proyecto = useSiteProject();
  if (!sectionVisible) return null;
  const searchParams = useSearchParams();
  const { t: tSite } = useTranslation("site");
  const unitPrefix = proyecto.unidad_display_prefix;
  const { t: tCommon } = useTranslation("common");

  // ALL HOOKS MUST BE BEFORE ANY EARLY RETURNS
  // Extract data first (wrapped in useMemo to prevent dep warnings)
  const tipologias = useMemo(() => proyecto.tipologias ?? [], [proyecto.tipologias]);
  const unidades = useMemo(() => proyecto.unidades ?? [], [proyecto.unidades]);
  const torres = useMemo(() => proyecto.torres ?? [], [proyecto.torres]);
  const isMultiTorre = torres.length > 1;

  // Multi-tipología mode (lot-based projects where a unit can have multiple tipología options)
  const tipologiaMode = proyecto.tipologia_mode ?? "fija";
  const isMultiTipo = tipologiaMode === "multiple";
  const isCasas = proyecto.tipo_proyecto === "casas";
  const isLotes = proyecto.tipo_proyecto === "lotes";
  const isHibrido = proyecto.tipo_proyecto === "hibrido";
  const isTipologiaPricing = proyecto.precio_source === "tipologia";
  const ocultarVendidas = (proyecto as any).ocultar_vendidas ?? false;
  const ocultarPrecioVendidas = (proyecto as any).ocultar_precio_vendidas ?? false;
  const unidadTipologias = useMemo(() => proyecto.unidad_tipologias ?? [], [proyecto.unidad_tipologias]);

  // i18n-driven estado config and filters
  const estadoConfigDynamic = useMemo(() => getEstadoConfig(tCommon), [tCommon]);
  const estadoFiltersDynamic = useMemo(() => {
    const all = [
      { value: "todas", label: tCommon("labels.all") },
      { value: "disponible", label: tCommon("estados.disponible") },
      { value: "proximamente", label: tCommon("estados.proximamente") },
      { value: "separado", label: tCommon("estados.separado") },
      { value: "reservada", label: tCommon("estados.reservada") },
      { value: "vendida", label: tCommon("estados.vendida") },
    ];
    return ocultarVendidas ? all.filter(f => f.value !== "vendida") : all;
  }, [tCommon, ocultarVendidas]);

  // Torre selector state
  const [activeTorreId, setActiveTorreId] = usePersistedState<string | null>(
    "tipologias-torre",
    isMultiTorre ? torres[0]?.id ?? null : null,
    proyecto.slug,
  );

  const activeTorre = useMemo(() => activeTorreId ? torres.find(t => t.id === activeTorreId) ?? null : null, [activeTorreId, torres]);

  // Filter tipologías by active torre
  const visibleTipologias = useMemo(() => {
    let filtered = tipologias;

    // Filter by torre
    if (isMultiTorre && activeTorreId) {
      filtered = filtered.filter((t) => t.torre_ids?.includes(activeTorreId));
    }

    return filtered;
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
  const [estadoFilter, setEstadoFilter] = useState("disponible");
  const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null);
  const [activeHotspot, setActiveHotspot] = useState<{ label: string; images: string[] } | null>(null);
  const [showUbicacion, setShowUbicacion] = useState(false);
  const [showRenderGallery, setShowRenderGallery] = useState(false);
  const [showPlanoZoom, setShowPlanoZoom] = useState(false);
  const [showVistaModal, setShowVistaModal] = useState<VistaPiso | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showTourModal, setShowTourModal] = useState(false);
  const [activePisoIdx, setActivePisoIdx] = useState(0);

  // Image ref for hotspot container
  const planoImgRef = useRef<HTMLImageElement>(null);

  // Unit context panel state
  const [selectedUnit, setSelectedUnit] = useState<Unidad | null>(null);
  const [cotizarUnidad, setCotizarUnidad] = useState<Unidad | null>(null);
  const [infoExpanded, setInfoExpanded] = useState(false);
  // Which tipología is selected in the unit detail banner (for multi-tipo lotes comparison)
  const [bannerTipoId, setBannerTipoId] = useState<string | null>(null);

  // Handle query params on mount
  useEffect(() => {
    requestAnimationFrame(() => {
      if (tipoParam) {
        const idx = visibleTipologias.findIndex((t) => t.id === tipoParam);
        if (idx >= 0) setActiveIndex(idx);
      }
      if (unidadParam) {
        const unit = unidades.find((u) => u.id === unidadParam);
        if (unit) {
          setSelectedUnit(unit);
          // Also switch to the correct tipología tab (only if no explicit tipo param)
          if (!tipoParam && unit.tipologia_id) {
            const idx = visibleTipologias.findIndex((t) => t.id === unit.tipologia_id);
            if (idx >= 0) setActiveIndex(idx);
          }
          // Pre-select the tipología for comparison banner
          if (tipoParam) setBannerTipoId(tipoParam);
        }
      }
    });
  }, [tipoParam, unidadParam, visibleTipologias, unidades, setActiveIndex]);

  // Reset activeIndex when torre changes — try to restore persisted tipo
  useEffect(() => {
    requestAnimationFrame(() => {
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
    });
  }, [activeTorreId, visibleTipologias, persistedTipoId]);

  // Keyboard navigation
  const closeHotspot = useCallback(() => setActiveHotspot(null), []);
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case "Escape":
          // Lightbox and VistaModal handle their own ESC
          if (showRenderGallery || showPlanoZoom || showVistaModal) return;
          if (showTourModal) {
            setShowTourModal(false);
            return;
          }
          if (showVideoModal) {
            setShowVideoModal(false);
            return;
          }
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
            setEstadoFilter("disponible");
            setSelectedUnit(null);
          }
          break;
        case "ArrowRight":
          if (!activeHotspot && !showRenderGallery) {
            e.preventDefault();
            setActiveIndex((prev) => Math.min(prev + 1, visibleTipologias.length - 1));
            setEstadoFilter("disponible");
            setSelectedUnit(null);
          }
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setActiveIndex is a state setter, stable
  }, [activeHotspot, closeHotspot, selectedUnit, showRenderGallery, showPlanoZoom, showVistaModal, showVideoModal, showTourModal, showUbicacion, visibleTipologias.length]);

  const active = visibleTipologias[activeIndex] ?? visibleTipologias[0];

  // Multi-floor support
  const pisos = useMemo(() => (active ? resolvePisos(active) : []), [active]);
  // Reset floor index and video modal when tipología changes
  useEffect(() => { setActivePisoIdx(0); setShowVideoModal(false); setShowTourModal(false); }, [active?.id]);
  const activePiso = pisos[activePisoIdx] ?? pisos[0] ?? null;

  // Compute columns & isLoteBased dynamically based on active tipología's tipo_tipologia for hybrid
  const isLoteBased = isHibrido
    ? (active?.tipo_tipologia === "casa" || active?.tipo_tipologia === "lote")
    : (isCasas || isLotes);

  const columns = useMemo(() => {
    return resolveColumnsForTipologia(
      active?.tipo_tipologia ?? null,
      proyecto.tipo_proyecto ?? "hibrido",
      (proyecto as any).inventory_columns_microsite ?? proyecto.inventory_columns,
      (proyecto as any).inventory_columns_microsite_by_type ?? proyecto.inventory_columns_by_type,
    );
  }, [active?.tipo_tipologia, proyecto.tipo_proyecto, proyecto.inventory_columns, proyecto.inventory_columns_by_type]);

  const tipFields = useMemo(() =>
    getTipologiaFields(proyecto.tipo_proyecto ?? "hibrido", (proyecto as any).tipologia_fields),
    [proyecto.tipo_proyecto, (proyecto as any).tipologia_fields]
  );

  // Tipologías available for the selected unit (for multi-tipo banner comparison)
  const unitAvailableTipos = useMemo(() => {
    if (!selectedUnit || !isMultiTipo) return [];
    const tipoIds = unidadTipologias
      .filter(ut => ut.unidad_id === selectedUnit.id)
      .map(ut => ut.tipologia_id);
    return tipologias.filter(t => tipoIds.includes(t.id));
  }, [selectedUnit, isMultiTipo, unidadTipologias, tipologias]);

  // The tipología currently selected in the banner (defaults to active tab)
  const bannerTipo = useMemo(() => {
    if (unitAvailableTipos.length === 0) return active;
    if (bannerTipoId) {
      const found = unitAvailableTipos.find(t => t.id === bannerTipoId);
      if (found) return found;
    }
    return active;
  }, [unitAvailableTipos, bannerTipoId, active]);

  // Reset bannerTipoId when selectedUnit changes
  useEffect(() => {
    setBannerTipoId(null);
  }, [selectedUnit?.id]);

  // Filter units for current tipología (must be above early return to preserve hook order)
  const filteredUnidades = useMemo(() => {
    if (!active) return [];
    let filtered: Unidad[];
    if (isMultiTipo) {
      // Multi-tipología: show units that have this tipología as an option
      const compatibleIds = new Set(
        unidadTipologias.filter(ut => ut.tipologia_id === active.id).map(ut => ut.unidad_id)
      );
      filtered = unidades.filter((u) => compatibleIds.has(u.id));
    } else {
      filtered = unidades.filter((u) => u.tipologia_id === active.id);
    }
    if (ocultarVendidas) {
      filtered = filtered.filter((u) => u.estado !== "vendida");
    }
    if (estadoFilter !== "todas") {
      filtered = filtered.filter((u) => u.estado === estadoFilter);
    }
    return filtered;
  }, [unidades, active, estadoFilter, isMultiTipo, unidadTipologias, ocultarVendidas]);

  // Count units by estado for current tipología
  const estadoCounts = useMemo(() => {
    if (!active) return { todas: 0, disponible: 0, proximamente: 0, separado: 0, reservada: 0, vendida: 0 };
    let tipoUnidades = isMultiTipo
      ? unidades.filter(u => unidadTipologias.some(ut => ut.unidad_id === u.id && ut.tipologia_id === active.id))
      : unidades.filter((u) => u.tipologia_id === active.id);
    if (ocultarVendidas) {
      tipoUnidades = tipoUnidades.filter((u) => u.estado !== "vendida");
    }
    return {
      todas: tipoUnidades.length,
      disponible: tipoUnidades.filter((u) => u.estado === "disponible").length,
      proximamente: tipoUnidades.filter((u) => u.estado === "proximamente").length,
      separado: tipoUnidades.filter((u) => u.estado === "separado").length,
      reservada: tipoUnidades.filter((u) => u.estado === "reservada").length,
      vendida: ocultarVendidas ? 0 : tipoUnidades.filter((u) => u.estado === "vendida").length,
    };
  }, [unidades, active, isMultiTipo, unidadTipologias, ocultarVendidas]);

  // Dynamic "desde" price from cheapest available unit
  // When tipología pricing: price comes directly from tipología.precio_desde
  // When unit pricing + lot-based: terreno (unit.precio) + construcción (tipología.precio_desde)
  const precioDesde = useMemo(() => {
    if (!active) return null;
    if (isTipologiaPricing) return active.precio_desde;
    let tipoUnits = isMultiTipo
      ? unidades.filter(u =>
          u.estado === "disponible" && u.precio != null &&
          unidadTipologias.some(ut => ut.unidad_id === u.id && ut.tipologia_id === active.id)
        )
      : unidades.filter(u =>
          u.tipologia_id === active.id && u.estado === "disponible" && u.precio != null
        );
    const construccion = isLoteBased && active.precio_desde ? active.precio_desde : 0;
    if (tipoUnits.length === 0) {
      return active.precio_desde;
    }
    return Math.min(...tipoUnits.map((u) => u.precio! + construccion));
  }, [active, unidades, isMultiTipo, unidadTipologias, isLoteBased, isTipologiaPricing]);

  // Render images from hotspots across ALL floors for gallery lightbox
  const renderImages: LightboxImage[] = useMemo(() => {
    if (!active) return [];
    const result: LightboxImage[] = [];
    const multiFloor = pisos.length > 1;
    for (const piso of pisos) {
      for (const h of piso.hotspots) {
        const imgs = resolveHotspotImages(h);
        imgs.forEach((url, i) => {
          const baseLabel = imgs.length > 1 ? `${h.label} (${i + 1})` : h.label;
          result.push({
            id: `${piso.id}-${h.id}-${i}`,
            url,
            thumbnail_url: url,
            alt_text: multiFloor ? `${piso.nombre} — ${baseLabel}` : baseLabel,
            label: i === 0 ? (multiFloor ? `${piso.nombre} — ${h.label}` : h.label) : undefined,
          });
        });
      }
    }
    return result;
  }, [active, pisos]);

  // Resolve linked video for active tipología
  const linkedVideo = useMemo(() => {
    if (!active?.video_id) return null;
    return (proyecto.videos ?? []).find(
      (v) => v.id === active.video_id && (!v.stream_uid || v.stream_status === "ready")
    ) ?? null;
  }, [active?.video_id, proyecto.videos]);

  // Resolve linked tour 360 for active tipología
  const linkedTour = active?.tour_360_url || null;

  // Per-unit floor plan override: when a unit is selected and has its own plano_url
  const unitPlanoUrl = selectedUnit?.plano_url ?? null;
  const effectivePlanoUrl = unitPlanoUrl || activePiso?.plano_url || null;

  // Floor plan images for Lightbox zoom (all floors, starting from activePisoIdx)
  const planoImages: LightboxImage[] = useMemo(() => {
    // If unit has its own floor plan, show just that
    if (unitPlanoUrl) {
      return [{
        id: `unit-plano-${selectedUnit?.id}`,
        url: unitPlanoUrl,
        thumbnail_url: unitPlanoUrl,
        alt_text: `Plano — ${selectedUnit?.identificador ?? ""}`,
      }];
    }
    const withPlano = pisos.filter((p) => p.plano_url);
    if (!withPlano.length) return [];
    // Reorder so activePisoIdx is first
    const activeIdx = withPlano.findIndex((p) => p === activePiso);
    const ordered = activeIdx > 0
      ? [...withPlano.slice(activeIdx), ...withPlano.slice(0, activeIdx)]
      : withPlano;
    return ordered.map((p) => ({
      id: `plano-${p.id}`,
      url: p.plano_url!,
      thumbnail_url: p.plano_url!,
      alt_text: pisos.length > 1 ? `Plano — ${p.nombre}` : `Plano — ${active?.nombre ?? ""}`,
      label: pisos.length > 1 ? p.nombre : undefined,
    }));
  }, [pisos, activePiso, active?.nombre, unitPlanoUrl, selectedUnit?.id, selectedUnit?.identificador]);

  // Group units by floor
  const unitsByFloor = useMemo(() => {
    const grouped: Record<number, typeof filteredUnidades> = {};
    filteredUnidades.forEach((u) => {
      const floor = u.piso ?? 0;
      if (!grouped[floor]) grouped[floor] = [];
      grouped[floor].push(u);
    });
    // Sort units within each floor numerically by identificador
    Object.values(grouped).forEach(units => {
      units.sort((a, b) => a.identificador.localeCompare(b.identificador, "es", { numeric: true }));
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
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--glass-bg)]"
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
    <SectionTransition className="min-h-screen lg:h-screen flex flex-col overflow-y-auto lg:overflow-hidden bg-[var(--site-bg)]">
      {/* ====== TOP: Torre Selector (multi-torre only) ====== */}
      {isMultiTorre && (
        <div className="flex-shrink-0 px-6 lg:px-12 pt-6 pb-5">
          <div className="flex items-center gap-2.5">
            {torres.map((torre) => (
              <button
                key={torre.id}
                onClick={() => setActiveTorreId(torre.id)}
                className={cn(
                  "font-ui flex items-center gap-2.5 px-5 py-2.5 rounded-full text-[11px] font-semibold tracking-[0.15em] uppercase transition-all cursor-pointer",
                  activeTorreId === torre.id
                    ? "bg-[rgba(var(--site-primary-rgb),0.15)] text-[var(--site-primary)] ring-1 ring-[rgba(var(--site-primary-rgb),0.4)] shadow-[0_0_12px_rgba(var(--site-primary-rgb),0.15)]"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/[0.07] hover:ring-1 hover:ring-white/10"
                )}
              >
                <Building2 size={14} strokeWidth={2.5} />
                {torre.nombre}
              </button>
            ))}

            {/* Tower composition diagram — inline beside torre buttons */}
            {activeTorre && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTorre.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.3 }}
                  className="ml-auto pl-4 border-l border-[var(--border-subtle)]"
                >
                  <TowerCompositionDiagram torre={activeTorre} />
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      )}

      {/* ====== TOP: Tipología Tab Bar ====== */}
      <div className={cn("flex-shrink-0 px-6 lg:px-12 pb-5", isMultiTorre ? "pt-3" : "pt-6")}>
        <div className="flex items-end gap-8 mb-4">
          {visibleTipologias.map((tipo, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={tipo.id}
                onClick={() => { setActiveIndex(idx); setEstadoFilter("disponible"); setSelectedUnit(null); setActiveHotspot(null); }}
                className={cn(
                  "relative pb-4 cursor-pointer transition-all duration-200 group",
                  isActive ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                )}
              >
                <span className="text-base font-medium tracking-wide">{tipo.nombre}</span>
                {tipo.tipo_tipologia === "local_comercial" && (
                  <span className="ml-2 px-1.5 py-px rounded-full text-[8px] font-ui font-bold uppercase tracking-[0.15em] bg-[rgba(var(--site-primary-rgb),0.12)] text-[var(--site-primary)]">
                    {tSite("tipologias.comercial")}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="tipo-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[var(--site-primary)] to-[rgba(var(--site-primary-rgb),0.6)] rounded-full shadow-[0_0_8px_rgba(var(--site-primary-rgb),0.4)]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </button>
            );
          })}
        </div>
        <div className="h-px bg-[var(--border-default)]" />
      </div>

      {/* ====== MAIN CONTENT ====== */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 px-6 lg:px-12 pb-6 min-h-0">
        {/* ====== LEFT: Floor Plan + Stats ====== */}
        <div className="flex-1 flex flex-col min-h-[50vh] lg:min-h-0">
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
                {/* Floor toggle — only if multiple floors and no per-unit plan override */}
                {pisos.length > 1 && !unitPlanoUrl && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 glass-dark rounded-xl p-1 shadow-lg border border-[var(--border-subtle)]">
                    {pisos.map((piso, i) => (
                      <button
                        key={piso.id}
                        onClick={() => setActivePisoIdx(i)}
                        className={cn(
                          "font-ui px-4 py-2 rounded-lg text-[11px] font-bold tracking-[0.12em] uppercase transition-all cursor-pointer",
                          activePisoIdx === i
                            ? "bg-gradient-to-br from-[var(--site-primary)] to-[rgba(var(--site-primary-rgb),0.8)] text-[#0A0A0B] shadow-[0_0_16px_rgba(var(--site-primary-rgb),0.4)]"
                            : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-white/[0.05]"
                        )}
                      >
                        {piso.nombre}
                      </button>
                    ))}
                  </div>
                )}

                {effectivePlanoUrl && (
                  <div className="relative inline-block max-w-full max-h-full leading-[0]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      ref={planoImgRef}
                      src={effectivePlanoUrl}
                      alt={unitPlanoUrl ? `Plano — ${selectedUnit?.identificador}` : `Plano ${activePiso?.nombre} - ${active.nombre}`}
                      className="block max-w-full max-h-[calc(100vh-200px)] w-auto h-auto rounded-xl"
                      draggable={false}
                    />

                    {/* Zoom / expand button — top-right */}
                    {(!selectedUnit || unitPlanoUrl) && (
                      <button
                        onClick={() => setShowPlanoZoom(true)}
                        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-lg glass-dark border border-[var(--border-subtle)] flex items-center justify-center cursor-pointer transition-all hover:border-[rgba(var(--site-primary-rgb),0.4)] hover:shadow-[var(--glow-sm)]"
                        aria-label={tSite("tipologias.zoomPlano")}
                      >
                        <Maximize size={14} className="text-[var(--text-secondary)]" />
                      </button>
                    )}

                    {/* Hotspot dots — CSS % positioned relative to the inline-block wrapper (hidden when showing per-unit plan) */}
                    {!unitPlanoUrl && activePiso?.hotspots.map((hotspot) => (
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
                        onClick={() => {
                          const imgs = resolveHotspotImages(hotspot);
                          if (imgs.length > 0) setActiveHotspot({ label: hotspot.label, images: imgs });
                        }}
                        onMouseEnter={() => setHoveredHotspot(hotspot.id)}
                        onMouseLeave={() => setHoveredHotspot(null)}
                      >
                        {/* Wrapper — sized by the dot, centered by button flexbox */}
                        <span className="relative inline-flex items-center justify-center">
                          {/* Pulse ring — inset-0 matches wrapper size, scales from center */}
                          <span className="absolute inset-0 rounded-full border-2 border-[rgba(var(--site-primary-rgb),0.40)] animate-ping origin-center" />
                          {/* Dot */}
                          <span className={cn(
                            "block w-5 h-5 rounded-full bg-[var(--site-primary)] border-2 border-[var(--text-primary)] shadow-lg shadow-[rgba(var(--site-primary-rgb),0.30)] transition-transform duration-150",
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
                              className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-[var(--surface-2)] border border-[var(--border-default)] px-3 py-1.5 rounded-lg whitespace-nowrap z-30 pointer-events-none max-w-[calc(100vw-2rem)]"
                            >
                              <span className="text-[11px] font-medium text-[var(--text-primary)] tracking-wider">
                                {hotspot.label}
                              </span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </button>
                    ))}
                  </div>
                )}

                {/* Render gallery + Video + Tour buttons — bottom left */}
                {(renderImages.length > 0 || linkedVideo || linkedTour) && !selectedUnit && (
                  <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
                    {/* Renders button */}
                    {renderImages.length > 0 && (
                      <button
                        onClick={() => setShowRenderGallery(true)}
                        className="bg-[var(--surface-2)] rounded-xl overflow-hidden border border-[var(--border-default)] shadow-lg cursor-pointer group transition-all hover:border-[rgba(var(--site-primary-rgb),0.4)] hover:shadow-[var(--glow-sm)] flex items-center gap-2.5 px-3 py-2.5"
                      >
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
                            {tSite("tipologias.renders")}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {renderImages.length} {renderImages.length === 1 ? tSite("tipologias.image") : tSite("tipologias.images")}
                          </span>
                        </div>
                      </button>
                    )}

                    {/* Video button */}
                    {linkedVideo && (
                      <button
                        onClick={() => setShowVideoModal(true)}
                        className="bg-[var(--surface-2)] rounded-xl overflow-hidden border border-[var(--border-default)] shadow-lg cursor-pointer group transition-all hover:border-[rgba(var(--site-primary-rgb),0.4)] hover:shadow-[var(--glow-sm)] flex items-center gap-2.5 px-3 py-2.5"
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-black/50 flex items-center justify-center">
                          {(() => {
                            const thumb = getVideoThumb(linkedVideo);
                            return thumb ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={thumb} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Play size={16} className="text-[var(--site-primary)]" fill="currentColor" />
                            );
                          })()}
                        </div>
                        <div className="text-left">
                          <span className="text-[11px] text-[var(--text-secondary)] font-medium tracking-wide flex items-center gap-1.5">
                            <Play size={12} className="text-[var(--site-primary)]" fill="currentColor" />
                            {tSite("tipologias.watchVideo")}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[120px] block">
                            {linkedVideo.titulo || "Video"}
                          </span>
                        </div>
                      </button>
                    )}

                    {/* Tour 360 button */}
                    {linkedTour && (
                      <button
                        onClick={() => setShowTourModal(true)}
                        className="bg-[var(--surface-2)] rounded-xl overflow-hidden border border-[var(--border-default)] shadow-lg cursor-pointer group transition-all hover:border-[rgba(var(--site-primary-rgb),0.4)] hover:shadow-[var(--glow-sm)] flex items-center gap-2.5 px-3 py-2.5"
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[var(--surface-3)] flex items-center justify-center">
                          <View size={16} className="text-[var(--site-primary)]" />
                        </div>
                        <div className="text-left">
                          <span className="text-[11px] text-[var(--text-secondary)] font-medium tracking-wide flex items-center gap-1.5">
                            <View size={12} className="text-[var(--site-primary)]" />
                            {tSite("tipologias.viewTour360")}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            Tour 360
                          </span>
                        </div>
                      </button>
                    )}
                  </div>
                )}

                {/* Location thumbnail overlay */}
                {active.ubicacion_plano_url && !selectedUnit && (
                  <button
                    onClick={() => setShowUbicacion(true)}
                    className="absolute bottom-4 right-4 w-[120px] h-[120px] bg-[var(--surface-2)] rounded-xl overflow-hidden border border-[var(--border-default)] shadow-lg z-10 cursor-pointer group transition-all hover:border-[rgba(var(--site-primary-rgb),0.4)] hover:shadow-[var(--glow-sm)]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={active.ubicacion_plano_url}
                      alt={tSite("tipologias.location")}
                      className="w-full h-full object-contain p-2"
                    />
                    <div className="absolute inset-0 group-hover:bg-[var(--glass-bg-hover)] transition-colors flex items-center justify-center">
                      <Maximize size={16} className="text-[var(--text-primary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                )}

                {/* Unit Context Banner — overlaid on floor plan */}
                <AnimatePresence>
                  {selectedUnit && (
                    <motion.div
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 24 }}
                      transition={{ type: "spring", damping: 28, stiffness: 300 }}
                      className="absolute bottom-4 left-4 right-4 z-20 rounded-[1.25rem] overflow-hidden"
                      style={{
                        background: "#0A0A0B",
                        boxShadow: "0 -4px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
                      }}
                    >
                      {/* Top accent line */}
                      <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, rgba(var(--site-primary-rgb), 0.4), transparent)` }} />

                      <div className="p-4 flex gap-4">
                        {/* Render thumbnail */}
                        {active?.renders?.[0] && (
                          <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-white/8 relative">
                            <img
                              src={active.renders[0]}
                              alt={active.nombre}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                          </div>
                        )}

                        {/* Info section */}
                        <div className="flex-1 min-w-0">
                          {/* Header: unit name + status + tipología name */}
                          <div className="flex items-center gap-2 mb-1.5">
                            <h3 className="text-base font-medium text-[var(--text-primary)] truncate">
                              {getUnitDisplayName(selectedUnit, unitPrefix)}
                            </h3>
                            {(() => {
                              const cfg = estadoConfigDynamic[selectedUnit.estado];
                              return (
                                <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0", cfg.bg, cfg.color)}>
                                  <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                                  {cfg.label}
                                </span>
                              );
                            })()}
                            {active && (
                              <span className="text-[11px] font-mono text-[var(--text-tertiary)] truncate flex-shrink-0">
                                {active.nombre}
                              </span>
                            )}
                          </div>

                          {/* Specs as pill-style items — gated by columns config */}
                          <div className="flex flex-wrap gap-1.5 mb-2.5">
                            {columns.area_m2 && (selectedUnit.area_m2 ?? bannerTipo?.area_m2) != null && !columns.area_construida && !columns.area_privada && !columns.area_lote && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-mono text-[var(--text-secondary)] bg-white/5 border border-white/6">
                                <Maximize size={10} className="text-[var(--site-primary)] opacity-70" /> {selectedUnit.area_m2 ?? bannerTipo?.area_m2} m²
                              </span>
                            )}
                            {columns.area_construida && (selectedUnit.area_construida ?? bannerTipo?.area_construida) != null && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-mono text-[var(--text-secondary)] bg-white/5 border border-white/6">
                                <Maximize size={10} className="text-[var(--site-primary)] opacity-70" /> {selectedUnit.area_construida ?? bannerTipo?.area_construida} m² {tSite("tipologias.areaConstruida").toLowerCase()}
                              </span>
                            )}
                            {columns.area_privada && (selectedUnit.area_privada ?? bannerTipo?.area_privada) != null && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-mono text-[var(--text-secondary)] bg-white/5 border border-white/6">
                                <Maximize size={10} className="text-[var(--site-primary)] opacity-70" /> {selectedUnit.area_privada ?? bannerTipo?.area_privada} m² {tSite("tipologias.areaPrivada").toLowerCase()}
                              </span>
                            )}
                            {columns.area_lote && (selectedUnit.area_lote ?? bannerTipo?.area_lote) != null && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-mono text-[var(--text-secondary)] bg-white/5 border border-white/6">
                                <Maximize size={10} className="text-[var(--site-primary)] opacity-70" /> {selectedUnit.area_lote ?? bannerTipo?.area_lote} m² {tSite("tipologias.areaLote").toLowerCase()}
                              </span>
                            )}
                            {columns.piso && selectedUnit.piso && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-mono text-[var(--text-secondary)] bg-white/5 border border-white/6">
                                <Building2 size={10} className="text-[var(--site-primary)] opacity-70" /> {tSite("tipologias.floor")} {selectedUnit.piso}
                              </span>
                            )}
                            {columns.habitaciones && (selectedUnit.habitaciones ?? bannerTipo?.habitaciones) != null && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-mono text-[var(--text-secondary)] bg-white/5 border border-white/6">
                                <BedDouble size={10} className="text-[var(--site-primary)] opacity-70" /> {selectedUnit.habitaciones ?? bannerTipo?.habitaciones} {tSite("cotizador.hab")}
                              </span>
                            )}
                            {columns.banos && (selectedUnit.banos ?? bannerTipo?.banos) != null && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-mono text-[var(--text-secondary)] bg-white/5 border border-white/6">
                                <Bath size={10} className="text-[var(--site-primary)] opacity-70" /> {selectedUnit.banos ?? bannerTipo?.banos} {tSite("cotizador.banos")}
                              </span>
                            )}
                            {columns.parqueaderos && (() => { const p = selectedUnit.parqueaderos ?? bannerTipo?.parqueaderos; return p != null && p > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-mono text-[var(--text-secondary)] bg-white/5 border border-white/6">
                                <Car size={10} className="text-[var(--site-primary)] opacity-70" /> {p} Parq.
                              </span>
                            ) : null; })()}
                            {columns.orientacion && selectedUnit.orientacion && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-mono text-[var(--text-secondary)] bg-white/5 border border-white/6">
                                <Compass size={10} className="text-[var(--site-primary)] opacity-70" /> {selectedUnit.orientacion}
                              </span>
                            )}
                            {columns.vista && (() => {
                              const unitVista = selectedUnit.vista_piso_id
                                ? (proyecto.vistas_piso ?? []).find(v => v.id === selectedUnit.vista_piso_id)
                                : null;
                              return unitVista ? (
                                <button
                                  onClick={() => setShowVistaModal(unitVista)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-mono bg-white/5 border border-white/6 text-[var(--site-primary)] hover:bg-white/8 transition-colors cursor-pointer"
                                >
                                  <Eye size={10} />
                                  {tSite("tipologias.verVista")}
                                </button>
                              ) : selectedUnit.vista ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-mono text-[var(--text-secondary)] bg-white/5 border border-white/6">
                                  <Eye size={10} className="text-[var(--site-primary)] opacity-70" /> {selectedUnit.vista}
                                </span>
                              ) : null;
                            })()}
                          </div>

                          {/* Características tags */}
                          {active?.caracteristicas && active.caracteristicas.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {active.caracteristicas.slice(0, 4).map((c) => (
                                <span key={c} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] border border-white/5">
                                  <CheckCircle2 size={8} className="text-[var(--site-primary)] opacity-60" />
                                  {c}
                                </span>
                              ))}
                              {active.caracteristicas.length > 4 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-mono text-[var(--text-muted)]">
                                  +{active.caracteristicas.length - 4}
                                </span>
                              )}
                            </div>
                          )}

                        </div>

                        {/* Price + CTA column */}
                        <div className="flex-shrink-0 flex flex-col items-end justify-between gap-2">
                          {/* Close button */}
                          <button
                            onClick={() => setSelectedUnit(null)}
                            aria-label={tSite("tipologias.closeDetail")}
                            className="p-1.5 rounded-full bg-white/6 hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            <X size={12} className="text-[var(--text-secondary)]" />
                          </button>

                          {/* Price */}
                          <div className="text-right">
                            {columns.precio && selectedUnit.estado !== "proximamente" && !(selectedUnit.estado === "vendida" && ocultarPrecioVendidas) && (isTipologiaPricing ? active?.precio_desde : (selectedUnit.precio || (isLoteBased && bannerTipo?.precio_desde))) && (() => {
                              if (isTipologiaPricing && active?.precio_desde) {
                                return (
                                  <p className="font-mono text-lg text-[var(--site-primary)] tabular-nums font-medium">
                                    {formatCurrency(active.precio_desde, proyecto.moneda_base ?? "COP")}
                                  </p>
                                );
                              }
                              const terreno = selectedUnit.precio;
                              const unitComplementos = (proyecto.parqueaderos_mode !== "sin_inventario" || proyecto.depositos_mode !== "sin_inventario")
                                ? (proyecto.complementos ?? []).filter(c => c.unidad_id === selectedUnit.id)
                                : [];
                              const complementosTotal = unitComplementos.reduce((s, c) => s + (c.precio ?? 0), 0);

                              if (isLoteBased && isMultiTipo && unitAvailableTipos.length > 0) {
                                return (
                                  <div className="flex gap-3">
                                    {unitAvailableTipos.map((t) => {
                                      const construccion = t.precio_desde ?? 0;
                                      const total = (terreno ?? 0) + construccion;
                                      return (
                                        <div key={t.id} className="text-right">
                                          <p className="text-[9px] text-[var(--text-secondary)] mb-0.5 truncate">{t.nombre}</p>
                                          <p className="font-mono text-sm text-[var(--site-primary)] tabular-nums">
                                            {terreno && construccion
                                              ? formatCurrency(total, proyecto.moneda_base ?? "COP")
                                              : construccion
                                                ? formatCurrency(construccion, proyecto.moneda_base ?? "COP")
                                                : "—"}
                                          </p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              }

                              if (isLoteBased && active?.precio_desde) {
                                const construccion = active.precio_desde;
                                const total = (terreno ?? 0) + construccion + complementosTotal;
                                return (
                                  <div>
                                    <p className="font-mono text-lg text-[var(--site-primary)] tabular-nums font-medium">
                                      {terreno
                                        ? formatCurrency(total, proyecto.moneda_base ?? "COP")
                                        : formatCurrency(construccion, proyecto.moneda_base ?? "COP")}
                                    </p>
                                    <p className="font-mono text-[9px] text-[var(--text-tertiary)]">
                                      {terreno
                                        ? `${tSite("tipologias.terrain")} + ${tSite("tipologias.construction")}`
                                        : tSite("tipologias.construction")}
                                    </p>
                                  </div>
                                );
                              }

                              if (!terreno) return null;
                              const totalPrecio = terreno + complementosTotal;
                              return unitComplementos.length > 0 ? (
                                <div>
                                  <p className="font-mono text-lg text-[var(--site-primary)] tabular-nums font-medium">
                                    {formatCurrency(totalPrecio, proyecto.moneda_base ?? "COP")}
                                  </p>
                                  <p className="font-mono text-[9px] text-[var(--text-tertiary)]">
                                    + {unitComplementos.length} complemento(s)
                                  </p>
                                </div>
                              ) : (
                                <p className="font-mono text-lg text-[var(--site-primary)] tabular-nums font-medium">
                                  {formatCurrency(terreno, proyecto.moneda_base ?? "COP")}
                                </p>
                              );
                            })()}
                          </div>

                          {/* Cotizar button */}
                          <button
                            onClick={() => setCotizarUnidad(selectedUnit)}
                            className="flex-shrink-0 btn-warm px-5 py-2.5 flex items-center gap-2 text-xs tracking-wider cursor-pointer"
                          >
                            <Sparkles size={14} />
                            {tSite("tipologias.enquire")}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </motion.div>
          </AnimatePresence>
        </div>

        {/* ====== RIGHT SIDEBAR ====== */}
        <div className="w-full lg:w-[340px] flex-shrink-0 flex flex-col min-h-[60vh] lg:min-h-0 glass-card rounded-3xl overflow-hidden">
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
                    <h2 className="font-site-heading text-2xl text-[var(--text-primary)]">
                      {active.nombre}
                    </h2>
                  </div>
                  {(active.descripcion || active.caracteristicas.length > 0) && (
                    <button
                      onClick={() => setInfoExpanded((prev) => !prev)}
                      className="mt-1 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-hover)] transition-colors cursor-pointer text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] flex-shrink-0"
                    >
                      <span className="text-[10px] tracking-wider uppercase">
                        {infoExpanded ? tSite("tipologias.lessInfo") : tSite("tipologias.moreInfo")}
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
                          <p className="font-mono text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                            {active.descripcion}
                          </p>
                        )}

                        {/* Key Features */}
                        {active.caracteristicas.length > 0 && (
                          <div className="space-y-2 mb-2">
                            <p className="text-[10px] tracking-[0.25em] text-[var(--text-tertiary)] uppercase">
                              {tSite("tipologias.features")}
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

              {/* Specs — areas, quick stats, price */}
              <div className="px-6 pt-4 pb-3 flex-shrink-0 space-y-3">
                {/* Area rows */}
                {(() => {
                  const areaFields: Array<{ label: string; value: number }> = [];
                  if (tipFields.area_m2 && active.area_m2 != null) areaFields.push({ label: tSite("tipologias.internalArea"), value: active.area_m2 });
                  if (tipFields.area_balcon && active.area_balcon != null && active.area_balcon > 0) areaFields.push({ label: tSite("tipologias.balcony"), value: active.area_balcon });
                  if (tipFields.area_construida && active.area_construida != null) areaFields.push({ label: tSite("tipologias.areaConstruida"), value: active.area_construida });
                  if (tipFields.area_privada && active.area_privada != null) areaFields.push({ label: tSite("tipologias.areaPrivada"), value: active.area_privada });
                  if (tipFields.area_lote && active.area_lote != null) areaFields.push({ label: tSite("tipologias.areaLote"), value: active.area_lote });
                  const showTotal = tipFields.area_m2 && active.area_m2 != null && tipFields.area_balcon && active.area_balcon != null && active.area_balcon > 0
                    && !tipFields.area_construida && !tipFields.area_privada && !tipFields.area_lote;
                  const totalArea = showTotal ? (active.area_m2 || 0) + (active.area_balcon || 0) : null;

                  if (areaFields.length === 0) return null;
                  return (
                    <div className="space-y-1.5">
                      {areaFields.map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between gap-4">
                          <span className="font-mono text-[10px] text-[var(--text-muted)]">{label}</span>
                          <span className="font-mono text-xs text-[var(--text-primary)] tabular-nums">
                            {value} m²
                          </span>
                        </div>
                      ))}
                      {totalArea != null && (
                        <>
                          <div className="h-px bg-gradient-to-r from-transparent via-[var(--border-default)] to-transparent" />
                          <div className="flex items-center justify-between gap-4">
                            <span className="font-ui text-[9px] text-[var(--text-secondary)] font-bold tracking-wider uppercase">
                              {tSite("tipologias.total")}
                            </span>
                            <span className="font-mono text-xs text-[var(--site-primary)] tabular-nums">
                              {totalArea} m²
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()}

                {/* Quick stats row */}
                {((tipFields.habitaciones && active.habitaciones != null) || (tipFields.banos && active.banos != null) || (tipFields.parqueaderos && active.parqueaderos != null) || (tipFields.depositos && (active.depositos ?? 0) > 0)) && (
                  <div className="flex items-center gap-3 flex-wrap">
                    {tipFields.habitaciones && active.habitaciones != null && (
                      <div className="flex items-center gap-1.5">
                        <BedDouble size={13} className="text-[var(--site-primary)]" strokeWidth={2.5} />
                        <span className="font-mono text-xs text-[var(--text-primary)] tabular-nums">
                          {active.habitaciones === 0 ? tSite("tipologias.studio") : active.habitaciones}
                        </span>
                      </div>
                    )}
                    {tipFields.banos && active.banos != null && (
                      <div className="flex items-center gap-1.5">
                        <Bath size={13} className="text-[var(--site-primary)]" strokeWidth={2.5} />
                        <span className="font-mono text-xs text-[var(--text-primary)] tabular-nums">
                          {active.banos}
                        </span>
                      </div>
                    )}
                    {tipFields.parqueaderos && active.parqueaderos != null && (
                      <div className="flex items-center gap-1.5">
                        <Car size={13} className="text-[var(--site-primary)]" strokeWidth={2.5} />
                        <span className="font-mono text-xs text-[var(--text-primary)] tabular-nums">
                          {active.parqueaderos}
                        </span>
                      </div>
                    )}
                    {tipFields.depositos && (active.depositos ?? 0) > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Archive size={13} className="text-[var(--site-primary)]" strokeWidth={2.5} />
                        <span className="font-mono text-xs text-[var(--text-primary)] tabular-nums">
                          {active.depositos}
                        </span>
                      </div>
                    )}
                    {([
                      { field: "tiene_jacuzzi" as const, projectFlag: "habilitar_extra_jacuzzi" as const, icon: Bath, labelKey: "tipologias.jacuzzi" },
                      { field: "tiene_piscina" as const, projectFlag: "habilitar_extra_piscina" as const, icon: Waves, labelKey: "tipologias.piscina" },
                      { field: "tiene_bbq" as const, projectFlag: "habilitar_extra_bbq" as const, icon: UtensilsCrossed, labelKey: "tipologias.bbq" },
                      { field: "tiene_terraza" as const, projectFlag: "habilitar_extra_terraza" as const, icon: Sun, labelKey: "tipologias.terraza" },
                      { field: "tiene_jardin" as const, projectFlag: "habilitar_extra_jardin" as const, icon: TreePine, labelKey: "tipologias.jardin" },
                      { field: "tiene_cuarto_servicio" as const, projectFlag: "habilitar_extra_cuarto_servicio" as const, icon: DoorClosed, labelKey: "tipologias.cuartoServicio" },
                      { field: "tiene_estudio" as const, projectFlag: "habilitar_extra_estudio" as const, icon: BookOpen, labelKey: "tipologias.estudio" },
                      { field: "tiene_chimenea" as const, projectFlag: "habilitar_extra_chimenea" as const, icon: Flame, labelKey: "tipologias.chimenea" },
                      { field: "tiene_doble_altura" as const, projectFlag: "habilitar_extra_doble_altura" as const, icon: MoveVertical, labelKey: "tipologias.dobleAltura" },
                      { field: "tiene_rooftop" as const, projectFlag: "habilitar_extra_rooftop" as const, icon: CloudSun, labelKey: "tipologias.rooftop" },
                    ] as const).map(({ field, projectFlag, icon: Icon, labelKey }) => (
                      proyecto[projectFlag] && active[field] && (
                        <div key={field} className="flex items-center gap-1.5">
                          <Icon size={13} className="text-[var(--site-primary)]" strokeWidth={2.5} />
                          <span className="font-mono text-xs text-[var(--text-primary)]">
                            {tSite(labelKey)}
                          </span>
                        </div>
                      )
                    ))}
                  </div>
                )}

                {/* Price */}
                {tipFields.precio && precioDesde && (
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-ui text-[9px] font-bold tracking-[0.15em] text-[var(--site-primary)] uppercase">
                      {tSite("tipologias.from")}
                    </span>
                    <span className="font-mono text-base text-[var(--site-primary)] tabular-nums leading-none">
                      {formatCurrency(precioDesde, proyecto.moneda_base ?? "COP")}
                    </span>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-[var(--border-subtle)] mx-6" />

              {/* Units Section */}
              <div className="flex-1 flex flex-col min-h-0 p-6 pt-4">
                {/* Header + Count */}
                <div className="flex items-center justify-between mb-3 flex-shrink-0">
                  <p className="text-[10px] tracking-[0.25em] text-[var(--text-tertiary)] uppercase">
                    {tSite("tipologias.units")}
                  </p>
                  <span className="font-mono text-xs text-[var(--site-primary)]">
                    {estadoCounts.disponible} {tSite("tipologias.available")}
                  </span>
                </div>

                {/* Estado Filter Tabs */}
                <div className="flex flex-wrap gap-1 mb-3 flex-shrink-0">
                  {estadoFiltersDynamic.map((filter) => {
                    const count = estadoCounts[filter.value as keyof typeof estadoCounts] ?? 0;
                    if (filter.value !== "todas" && count === 0) return null;
                    return (
                      <button
                        key={filter.value}
                        onClick={() => setEstadoFilter(filter.value)}
                        className={cn(
                          "px-2 py-1 rounded-md text-[9px] tracking-wider uppercase whitespace-nowrap transition-all cursor-pointer",
                          estadoFilter === filter.value
                            ? "bg-[rgba(var(--site-primary-rgb),0.15)] text-[var(--site-primary)]"
                            : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--glass-bg)]"
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
                            {tSite("tipologias.floor")} {floor}
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
                                  : "hover:bg-[var(--glass-bg)]"
                              )}
                            >
                              {/* Estado dot */}
                              <span className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", config.dot)} />

                              {/* Unit info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-[var(--text-primary)] font-medium truncate">
                                  {getUnitDisplayName(unit, unitPrefix)}
                                </p>
                                <p className="font-mono text-[10px] text-[var(--text-tertiary)] tracking-wider">
                                  {[
                                    columns.piso && unit.piso ? `${tSite("tipologias.floor")} ${unit.piso}` : null,
                                    (() => { const a = getPrimaryArea(unit, columns); return a != null ? `${a} m²` : null; })(),
                                    columns.orientacion && unit.orientacion ? unit.orientacion : null,
                                  ].filter(Boolean).join(" · ")}
                                </p>
                              </div>

                              {/* Price & Status */}
                              <div className="text-right flex-shrink-0">
                                {columns.precio && (() => {
                                  if (unit.estado === "proximamente") return <p className="font-mono text-sm text-[var(--text-secondary)] tabular-nums">—</p>;
                                  if (unit.estado === "vendida" && ocultarPrecioVendidas) return <p className="font-mono text-sm text-[var(--text-secondary)] tabular-nums">—</p>;
                                  const t = unit.precio;
                                  // Multi-tipo: compute price range from assigned tipologías
                                  if (isMultiTipo) {
                                    const unitTipoIds = unidadTipologias
                                      .filter(ut => ut.unidad_id === unit.id)
                                      .map(ut => ut.tipologia_id);
                                    const unitTipos = tipologias.filter(tp => unitTipoIds.includes(tp.id));
                                    const prices = unitTipos
                                      .map(tp => {
                                        const c = tp.precio_desde ?? 0;
                                        return isLoteBased && !isTipologiaPricing ? (t ?? 0) + c : c;
                                      })
                                      .filter(p => p > 0)
                                      .sort((a, b) => a - b);
                                    if (prices.length === 0) return <p className="font-mono text-sm text-[var(--text-secondary)] tabular-nums">—</p>;
                                    const min = prices[0];
                                    const allSame = prices.every(p => p === min);
                                    return (
                                      <p className="font-mono text-sm text-[var(--text-secondary)] tabular-nums">
                                        {!allSame && <span className="text-[10px] text-[var(--text-tertiary)]">{tSite("tipologias.from")} </span>}
                                        {formatCurrency(min, proyecto.moneda_base ?? "COP")}
                                      </p>
                                    );
                                  }
                                  // Single-tipo: for tipología pricing just show tipología price;
                                  // for unit pricing + lot-based, add terreno + construcción
                                  const c = isLoteBased && !isTipologiaPricing && active?.precio_desde ? active.precio_desde : 0;
                                  const displayPrice = isTipologiaPricing
                                    ? (active?.precio_desde || null)
                                    : (t ? t + c : c || null);
                                  return (
                                    <p className="font-mono text-sm text-[var(--text-secondary)] tabular-nums">
                                      {displayPrice ? formatCurrency(displayPrice, proyecto.moneda_base ?? "COP") : "—"}
                                    </p>
                                  );
                                })()}
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

      {/* ====== HOTSPOT RENDER MODAL / SLIDESHOW ====== */}
      <AnimatePresence>
        {activeHotspot && activeHotspot.images.length === 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-8"
            onClick={() => setActiveHotspot(null)}
          >
            {/* Blur backdrop */}
            <div className="absolute inset-0 backdrop-blur-md" style={{ backgroundColor: "rgba(var(--overlay-rgb), 0.6)" }} />

            {/* Modal content — single image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="relative max-w-[85vw] max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeHotspot.images[0]}
                alt={activeHotspot.label}
                className="max-w-[85vw] max-h-[80vh] object-contain"
              />
              {/* Label overlay bottom-left */}
              <div className="absolute bottom-0 left-0 right-0 p-6" style={{ background: "linear-gradient(to top, rgba(var(--overlay-rgb), 0.7), transparent)" }}>
                <span className="font-ui text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-[0.15em] uppercase">
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

      {/* Lightbox slideshow — multi-image hotspot */}
      <AnimatePresence>
        {activeHotspot && activeHotspot.images.length > 1 && (
          <Lightbox
            images={activeHotspot.images.map((url, i) => ({
              id: `hotspot-${i}`,
              url,
              thumbnail_url: url,
              alt_text: activeHotspot.images.length > 1 ? `${activeHotspot.label} (${i + 1})` : activeHotspot.label,
              label: i === 0 ? activeHotspot.label : undefined,
            }))}
            initialIndex={0}
            onClose={() => setActiveHotspot(null)}
          />
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
            <div className="absolute inset-0 backdrop-blur-md" style={{ backgroundColor: "rgba(var(--overlay-rgb), 0.6)" }} />
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
                alt={tSite("tipologias.locationInProject")}
                className="max-w-[85vw] max-h-[80vh] object-contain"
              />
              <div className="absolute bottom-0 left-0 right-0 p-6" style={{ background: "linear-gradient(to top, rgba(var(--overlay-rgb), 0.7), transparent)" }}>
                <span className="font-ui text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-[0.15em] uppercase">
                  {tSite("tipologias.locationInProject")}
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

      {/* ====== PLANO ZOOM LIGHTBOX ====== */}
      <AnimatePresence>
        {showPlanoZoom && planoImages.length > 0 && (
          <PlanoZoomLightbox
            images={planoImages}
            initialIndex={0}
            onClose={() => setShowPlanoZoom(false)}
          />
        )}
      </AnimatePresence>

      {/* ====== VISTA MODAL ====== */}
      <AnimatePresence>
        {showVistaModal && (
          <VistaModal vista={showVistaModal} onClose={() => setShowVistaModal(null)} />
        )}
      </AnimatePresence>

      {/* ====== VIDEO MODAL ====== */}
      <AnimatePresence>
        {showVideoModal && linkedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-8"
            onClick={() => setShowVideoModal(false)}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black"
              onClick={(e) => e.stopPropagation()}
            >
              <iframe
                src={getVideoSrc(linkedVideo)}
                className="w-full h-full border-0"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                title={linkedVideo.titulo || "Video"}
              />
              <CloseButton
                onClick={() => setShowVideoModal(false)}
                variant="dark"
                size={16}
                className="absolute top-3 right-3"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== TOUR 360 MODAL ====== */}
      <AnimatePresence>
        {showTourModal && linkedTour && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-8"
            onClick={() => setShowTourModal(false)}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black"
              onClick={(e) => e.stopPropagation()}
            >
              <iframe
                src={linkedTour}
                className="w-full h-full border-0"
                allowFullScreen
                title="Tour 360"
              />
              <CloseButton
                onClick={() => setShowTourModal(false)}
                variant="dark"
                size={16}
                className="absolute top-3 right-3"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== COTIZADOR MODAL ====== */}
      {cotizarUnidad && (
        <CotizadorModal
          isOpen={!!cotizarUnidad}
          onClose={() => setCotizarUnidad(null)}
          unidad={isTipologiaPricing
            ? { ...cotizarUnidad, precio: tipologias.find(t => t.id === cotizarUnidad.tipologia_id)?.precio_desde ?? cotizarUnidad.precio }
            : cotizarUnidad
          }
          tipologia={tipologias.find((t) => t.id === cotizarUnidad.tipologia_id) || undefined}
          availableTipologias={isMultiTipo ? tipologias.filter(t =>
            unidadTipologias.some(ut => ut.unidad_id === cotizarUnidad.id && ut.tipologia_id === t.id)
          ) : undefined}
          proyectoId={proyecto.id}
          cotizadorEnabled={proyecto.cotizador_enabled}
          cotizadorConfig={proyecto.cotizador_config}
          tipoProyecto={proyecto.tipo_proyecto}
        />
      )}
    </SectionTransition>
  );
}

