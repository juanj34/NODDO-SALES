"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  Maximize,
  Maximize2,
  BedDouble,
  Bath,
  Car,
  Archive,
  Compass,
  Eye,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Sparkles,
  Building2,
  Layers,
  X,
} from "lucide-react";
import { useSiteProject, useSiteBasePath } from "@/hooks/useSiteProject";
import { getInventoryColumns, getPrimaryArea } from "@/lib/inventory-columns";
import { DynamicIcon } from "@/data/amenidades-catalog";
import { usePersistedState } from "@/hooks/usePersistedState";
import { resolvePisos } from "@/lib/piso-utils";
import { useTranslation, getEstadoConfig } from "@/i18n";
import { CotizadorModal } from "@/components/site/CotizadorModal";
import { SectionTransition } from "@/components/site/SectionTransition";
import { SiteEmptyState } from "@/components/site/SiteEmptyState";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { MobileBottomSheet } from "@/components/site/MobileBottomSheet";
import VistaModal from "@/components/site/VistaModal";
import { cn } from "@/lib/utils";
import type { Unidad, Fachada, Torre, PlanoInteractivo, PlanoPunto, VistaPiso, UnidadTipologia } from "@/types";

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

export default function ExplorarPage() {
  const proyecto = useSiteProject();
  const basePath = useSiteBasePath();
  const searchParams = useSearchParams();
  const { t: tSite, locale } = useTranslation("site");
  const { t: tCommon } = useTranslation("common");
  const estadoConfig = useMemo(() => getEstadoConfig(tCommon), [tCommon]);
  const { unidades, tipologias, fachadas } = proyecto;

  // Multi-tipología mode
  const tipologiaMode = proyecto.tipologia_mode ?? "fija";
  const isMultiTipo = tipologiaMode === "multiple";
  const isCasas = proyecto.tipo_proyecto === "casas";
  const isLotes = proyecto.tipo_proyecto === "lotes";
  const isLoteBased = isCasas || isLotes;
  const columns = useMemo(
    () => getInventoryColumns(proyecto.tipo_proyecto ?? "hibrido", (proyecto as any).inventory_columns_microsite ?? proyecto.inventory_columns),
    [proyecto.tipo_proyecto, proyecto.inventory_columns]
  );
  const unidadTipologias = useMemo<UnidadTipologia[]>(
    () => proyecto.unidad_tipologias ?? [],
    [proyecto.unidad_tipologias]
  );

  const getUnitAvailableTipologias = useCallback((unitId: string) => {
    const tipoIds = unidadTipologias
      .filter((ut: UnidadTipologia) => ut.unidad_id === unitId)
      .map((ut: UnidadTipologia) => ut.tipologia_id);
    return tipologias.filter((t) => tipoIds.includes(t.id));
  }, [unidadTipologias, tipologias]);

  // Fachada filter from query param
  const fachadaIdParam = searchParams.get("fachada");
  const torreIdParam = searchParams.get("torre");

  // Tower selection state (persisted)
  const [selectedTorreId, setSelectedTorreId] = usePersistedState<string | null>(
    "explorar-torre", null, proyecto.slug
  );

  const torres = useMemo(() => proyecto.torres ?? [], [proyecto.torres]);
  const isMultiTorre = torres.length > 1;

  // Implantacion modal
  const [showImplantacionModal, setShowImplantacionModal] = useState(false);

  // Auto-select first torre when multi-torre and no URL param
  useEffect(() => {
    if (isMultiTorre && !torreIdParam && !selectedTorreId && torres.length > 0) {
      setSelectedTorreId(torres[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setSelectedTorreId is a state setter, stable
  }, [isMultiTorre, torreIdParam, selectedTorreId, torres]);

  const activeTorre = useMemo<Torre | null>(() => {
    if (torreIdParam) return torres.find((t) => t.id === torreIdParam) ?? null;
    if (selectedTorreId) return torres.find((t) => t.id === selectedTorreId) ?? null;
    return null;
  }, [torreIdParam, selectedTorreId, torres]);

  // Auto-detect view mode: fachada vs planta
  const hasFachadas = useMemo(() => (fachadas ?? []).some((f) => (f.tipo || "fachada") === "fachada"), [fachadas]);
  const hasPlantas = useMemo(() => (fachadas ?? []).some((f) => f.tipo === "planta"), [fachadas]);
  const [explorarView, setExplorarView] = usePersistedState<"fachada" | "planta">(
    "explorar-view", !hasFachadas && hasPlantas ? "planta" : "fachada", proyecto.slug
  );
  const showViewToggle = hasFachadas && hasPlantas;

  // All fachadas sorted by order (or piso_numero for plantas), filtered by torre and tipo
  const sortedFachadas = useMemo<Fachada[]>(() => {
    let list = fachadas ?? [];
    if (activeTorre) list = list.filter((f) => f.torre_id === activeTorre.id);
    list = list.filter((f) => (f.tipo || "fachada") === explorarView);
    if (explorarView === "planta") return list.sort((a, b) => (a.piso_numero ?? 0) - (b.piso_numero ?? 0));
    return list.sort((a, b) => a.orden - b.orden);
  }, [fachadas, activeTorre, explorarView]);

  // Auto-select fachada from URL param, or default to first
  const initialFachadaIndex = useMemo(() => {
    if (!fachadaIdParam) return 0;
    const idx = sortedFachadas.findIndex((f) => f.id === fachadaIdParam);
    return idx >= 0 ? idx : 0;
  }, [fachadaIdParam, sortedFachadas]);

  const [activeFachadaIndex, setActiveFachadaIndex] = useState(initialFachadaIndex);
  const activeFachada = sortedFachadas[activeFachadaIndex] as Fachada | undefined;

  // State declarations - before effects that use them
  const [selectedUnit, setSelectedUnit] = useState<Unidad | null>(null);
  const [hoveredUnit, setHoveredUnit] = useState<string | null>(null);
  const [cotizarUnidad, setCotizarUnidad] = useState<Unidad | null>(null);
  const [showVistaModal, setShowVistaModal] = useState<VistaPiso | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const prevFachadaIdRef = useRef<string | null>(null);

  // Sync with URL param on mount / change - use ref to avoid setState in effect
  useEffect(() => {
    if (fachadaIdParam && fachadaIdParam !== prevFachadaIdRef.current) {
      prevFachadaIdRef.current = fachadaIdParam;
      const idx = sortedFachadas.findIndex((f) => f.id === fachadaIdParam);
      if (idx >= 0) {
        // Schedule state updates for after render to avoid cascading renders
        queueMicrotask(() => {
          setActiveFachadaIndex(idx);
          setImageLoaded(false);
        });
      }
    }
  }, [fachadaIdParam, sortedFachadas]);
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const [sheetOpen, setSheetOpen] = useState(false);

  // Units with coordinates, filtered by active fachada/planta
  const isPlantaView = explorarView === "planta";
  const positionedUnits = useMemo(() => {
    if (isPlantaView) {
      let filtered = unidades.filter((u) => u.planta_x !== null && u.planta_y !== null);
      if (activeFachada) filtered = filtered.filter((u) => u.planta_id === activeFachada.id);
      return filtered;
    }
    let filtered = unidades.filter((u) => u.fachada_x !== null && u.fachada_y !== null);
    if (activeFachada) filtered = filtered.filter((u) => u.fachada_id === activeFachada.id);
    return filtered;
  }, [unidades, activeFachada, isPlantaView]);

  const selectedTipologia = useMemo(() => {
    if (!selectedUnit?.tipologia_id) return undefined;
    return tipologias.find((t) => t.id === selectedUnit.tipologia_id);
  }, [selectedUnit, tipologias]);

  const selectedTipPlanoUrl = useMemo(() => {
    if (!selectedTipologia) return null;
    return resolvePisos(selectedTipologia)[0]?.plano_url ?? null;
  }, [selectedTipologia]);

  // Fachada image URL: from active fachada or fallback
  const fachadaUrl = activeFachada?.imagen_url
    || proyecto.fachada_url
    || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80";

  // Reset imageLoaded only when the actual image URL changes - use ref to track
  const prevFachadaUrlRef = useRef<string | null>(null);
  useEffect(() => {
    if (fachadaUrl !== prevFachadaUrlRef.current) {
      prevFachadaUrlRef.current = fachadaUrl;
      // Schedule state update for after render to avoid cascading renders
      queueMicrotask(() => {
        setImageLoaded(false);
      });
    }
  }, [fachadaUrl]);

  // Whether we have implantaciones to go back to
  const hasImplantaciones = (proyecto.planos_interactivos ?? []).some(
    (p) => p.tipo === "urbanismo" && p.visible
  );

  // Implantacion plano with tower hotspots (for mini-plano in panel)
  const implantacionPlano = useMemo<PlanoInteractivo | undefined>(() => {
    return (proyecto.planos_interactivos ?? [])
      .find((p) => p.tipo === "implantacion" && p.visible);
  }, [proyecto.planos_interactivos]);

  const implantacionPuntos = useMemo<PlanoPunto[]>(() => {
    if (!implantacionPlano) return [];
    return (proyecto.plano_puntos ?? [])
      .filter((pt) => pt.plano_id === implantacionPlano.id && pt.torre_id)
      .sort((a, b) => a.orden - b.orden);
  }, [proyecto.plano_puntos, implantacionPlano]);

  // Scroll to unit in list
  const unitListRef = useRef<HTMLDivElement>(null);
  const scrollToUnit = useCallback((unitId: string) => {
    const el = unitListRef.current?.querySelector(`[data-unit-id="${unitId}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  // Helper to select fachada + reset state
  const selectFachada = useCallback((idx: number) => {
    setActiveFachadaIndex(idx);
    setSelectedUnit(null);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "Escape") {
        if (cotizarUnidad) return; // Modal handles its own Escape
        if (showImplantacionModal) { setShowImplantacionModal(false); return; }
        if (selectedUnit) setSelectedUnit(null);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedUnit, cotizarUnidad, showImplantacionModal]);

  // Empty state — no fachadas configured (after all hooks)
  if (!fachadas || fachadas.length === 0) {
    return (
      <SiteEmptyState
        variant="explorar"
        title={tSite("explorar.notAvailable")}
        description={tSite("explorar.notConfigured")}
      />
    );
  }

  /* ── Sidebar content (shared between desktop sidebar + mobile sheet) ── */
  const sidebarContent = (
    <>
      {/* ── Torre selector (multi-torre) ── */}
      {isMultiTorre && (
        <div className="flex-shrink-0 px-4 pt-4 pb-0">
          <p className="text-[9px] tracking-[0.25em] text-[var(--text-tertiary)] uppercase mb-2">
            {tSite("explorar.towers")}
          </p>
          <div className="space-y-1.5">
            {torres.map((torre) => {
              const isActive = activeTorre?.id === torre.id;
              return (
                <button
                  key={torre.id}
                  onClick={() => {
                    setSelectedTorreId(torre.id);
                    selectFachada(0);
                  }}
                  className={cn(
                    "w-full text-left p-2 rounded-xl border transition-all duration-200 cursor-pointer group",
                    isActive
                      ? "border-[var(--site-primary)] bg-[rgba(var(--site-primary-rgb),0.08)]"
                      : "border-[var(--border-subtle)] hover:border-[var(--border-default)] bg-[var(--glass-bg)]"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    {torre.imagen_portada ? (
                      <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-[var(--border-default)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={torre.imagen_portada} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-[var(--glass-bg)] flex items-center justify-center shrink-0">
                        <Building2 size={14} className={isActive ? "text-[var(--site-primary)]" : "text-[var(--text-muted)]"} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className={cn(
                        "text-xs font-medium truncate",
                        isActive ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"
                      )}>
                        {torre.nombre}
                      </p>
                      {(torre.pisos_residenciales || torre.num_pisos) !== null && (
                        <p className="text-[9px] text-[var(--text-tertiary)]">
                          {torre.pisos_residenciales || torre.num_pisos} {tCommon("labels.floors").toLowerCase()}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Torre info: name, description, amenidades ── */}
      {activeTorre && (
        <div className="flex-shrink-0 px-4 pt-3">
          <p className="text-[10px] tracking-[0.3em] text-[var(--site-primary)] uppercase mb-0.5">
            {activeTorre.nombre}
          </p>
          {activeTorre.tipo !== "urbanismo" && (activeTorre.pisos_residenciales || activeTorre.num_pisos) != null && (
            <p className="text-[10px] text-[var(--text-tertiary)] mb-1">
              {activeTorre.pisos_residenciales || activeTorre.num_pisos} {tCommon("labels.floors").toLowerCase()}
            </p>
          )}
          {activeTorre.descripcion && (
            <p className="text-[10px] text-[var(--text-tertiary)] leading-relaxed line-clamp-2 mb-2">
              {activeTorre.descripcion}
            </p>
          )}
          {activeTorre.amenidades_data && activeTorre.amenidades_data.length > 0 && (
            <div className="grid grid-cols-2 gap-1 mb-1">
              {activeTorre.amenidades_data.slice(0, 6).map((amenidad) => (
                <div
                  key={amenidad.id}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--glass-bg)] border border-[var(--border-subtle)]"
                >
                  {amenidad.icon_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={amenidad.icon_url} alt="" className="w-3 h-3 object-contain flex-shrink-0" />
                  ) : (
                    <DynamicIcon name={amenidad.icono} size={10} className="text-[var(--site-primary)] flex-shrink-0" />
                  )}
                  <span className="text-[8px] text-[var(--text-tertiary)] truncate">{amenidad.nombre}</span>
                </div>
              ))}
              {activeTorre.amenidades_data.length > 6 && (
                <div className="flex items-center justify-center px-2 py-1 rounded-lg bg-[var(--glass-bg)] border border-[var(--border-subtle)]">
                  <span className="text-[8px] text-[var(--text-muted)]">
                    +{activeTorre.amenidades_data.length - 6} más
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Fachada / Floor selector ── */}
      {sortedFachadas.length > 1 && (
        <div className="flex-shrink-0 px-4 pt-3">
          <p className="text-[9px] tracking-[0.25em] text-[var(--text-tertiary)] uppercase mb-2">
            {explorarView === "planta" ? tSite("explorar.pisos") : tSite("explorar.fachadasLabel")}
          </p>

          {explorarView === "fachada" ? (
            /* Horizontal thumbnail strip for fachadas */
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {sortedFachadas.map((fachada, idx) => (
                <button
                  key={fachada.id}
                  onClick={() => selectFachada(idx)}
                  className={cn(
                    "relative flex-shrink-0 w-20 rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-pointer group",
                    idx === activeFachadaIndex
                      ? "border-[var(--site-primary)] shadow-[0_0_12px_rgba(var(--site-primary-rgb),0.30)]"
                      : "border-[var(--border-subtle)] hover:border-[var(--border-default)]"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={fachada.imagen_url} alt={fachada.nombre} className="w-full h-14 object-cover" />
                  <div className="absolute inset-0 flex items-end p-1.5" style={{ background: "linear-gradient(to top, rgba(var(--overlay-rgb), 0.7), transparent)" }}>
                    <span className={cn(
                      "text-[8px] font-medium tracking-wider truncate",
                      idx === activeFachadaIndex ? "text-[var(--site-primary)]" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"
                    )}>
                      {fachada.nombre}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* Horizontal floor buttons for plantas */
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
              {sortedFachadas.map((fachada, idx) => (
                <button
                  key={fachada.id}
                  onClick={() => selectFachada(idx)}
                  className={cn(
                    "flex-shrink-0 px-3 py-2 rounded-xl border-2 transition-all duration-200 cursor-pointer",
                    idx === activeFachadaIndex
                      ? "border-[var(--site-primary)] bg-[rgba(var(--site-primary-rgb),0.12)]"
                      : "border-transparent hover:bg-[var(--glass-bg-hover)]"
                  )}
                >
                  <span className={cn(
                    "text-xs font-mono font-semibold",
                    idx === activeFachadaIndex ? "text-[var(--site-primary)]" : "text-[var(--text-secondary)]"
                  )}>
                    P{fachada.piso_numero}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Single fachada label */}
      {sortedFachadas.length === 1 && activeFachada && (
        <div className="flex-shrink-0 px-4 pt-3">
          <p className="text-[9px] tracking-[0.25em] text-[var(--text-tertiary)] uppercase">
            {activeFachada.nombre}
          </p>
        </div>
      )}

      {/* ── Divider ── */}
      <div className="border-t border-[var(--border-subtle)] mx-4 mt-3" />

      {/* ── Content: Unit list or detail (master-detail) ── */}
      <AnimatePresence mode="wait">
        {selectedUnit ? (
          /* ── Unit Detail View ── */
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.15 }}
            className="flex-1 flex flex-col overflow-y-auto scrollbar-hide"
          >
            {/* Back + title */}
            <div className="flex-shrink-0 flex items-center gap-2 px-4 pt-3 pb-2">
              <button
                onClick={() => setSelectedUnit(null)}
                className="p-1.5 rounded-lg bg-[var(--glass-bg-hover)] hover:bg-[var(--border-default)] transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} className="text-[var(--text-secondary)]" />
              </button>
              <p className="text-[10px] tracking-[0.3em] text-[var(--site-primary)] uppercase">
                {tSite("explorar.detailTitle")}
              </p>
            </div>

            {/* Unit header */}
            <div className="px-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">{selectedUnit.identificador}</h2>
                {(() => {
                  const cfg = estadoConfig[selectedUnit.estado];
                  return (
                    <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium", cfg.bg, cfg.color)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                      {cfg.label}
                    </span>
                  );
                })()}
              </div>
              {isMultiTipo && !selectedUnit.tipologia_id ? (
                <p className="text-sm text-[var(--text-muted)] italic">
                  {getUnitAvailableTipologias(selectedUnit.id).length} tipologías disponibles
                </p>
              ) : selectedTipologia ? (
                <p className="text-sm text-[var(--text-secondary)]">{selectedTipologia.nombre}</p>
              ) : null}
              {/* Lote & Etapa for casas/lotes */}
              {((columns.lote && selectedUnit.lote) || (columns.etapa && selectedUnit.etapa_nombre)) && (
                <div className="flex items-center gap-2 mt-1 text-[10px] text-[var(--text-tertiary)]">
                  {columns.lote && selectedUnit.lote && <span>Lote {selectedUnit.lote}</span>}
                  {columns.lote && selectedUnit.lote && columns.etapa && selectedUnit.etapa_nombre && <span>·</span>}
                  {columns.etapa && selectedUnit.etapa_nombre && <span>{selectedUnit.etapa_nombre}</span>}
                </div>
              )}
            </div>

            {/* Multi-tipo: available tipología cards (when no confirmed tipología) */}
            {isMultiTipo && selectedUnit && !selectedUnit.tipologia_id && (() => {
              const availTipos = getUnitAvailableTipologias(selectedUnit.id);
              if (availTipos.length === 0) return null;
              return (
                <div className="px-4 mb-3">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-2">
                    Tipologías disponibles
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {availTipos.map(tipo => (
                      <button
                        key={tipo.id}
                        onClick={() => setCotizarUnidad(selectedUnit)}
                        className="flex-shrink-0 bg-[var(--glass-bg)] border border-[var(--border-subtle)] rounded-xl p-3 text-left hover:border-[rgba(var(--site-primary-rgb),0.3)] transition-colors min-w-[140px] cursor-pointer"
                      >
                        <p className="text-xs font-medium text-[var(--text-primary)] mb-1.5">{tipo.nombre}</p>
                        <div className="space-y-1 text-[10px] text-[var(--text-secondary)]">
                          {(tipo.area_construida ?? tipo.area_m2) && <p>{tipo.area_construida ?? tipo.area_m2} m²</p>}
                          {tipo.habitaciones != null && <p>{tipo.habitaciones} hab</p>}
                          {tipo.banos != null && <p>{tipo.banos} baños</p>}
                          {tipo.precio_desde != null && (
                            <p className="text-[var(--site-primary)] font-medium">
                              {formatPrecioShort(tipo.precio_desde)}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Floor plan */}
            {selectedTipPlanoUrl && (
              <div className="mx-4 mb-3 relative aspect-[4/3] rounded-2xl overflow-hidden bg-[var(--glass-bg)]">
                <Image
                  src={selectedTipPlanoUrl}
                  alt={selectedTipologia?.nombre ?? ""}
                  fill
                  unoptimized
                  className="object-contain p-3"
                />
              </div>
            )}

            {/* Specs grid */}
            <div className="px-4 space-y-3 mb-3">
              <div className="grid grid-cols-2 gap-2">
                {columns.area_construida && selectedUnit.area_construida != null && (
                  <div className="bg-[var(--glass-bg)] rounded-xl px-3 py-2 flex items-center gap-2">
                    <Maximize size={14} className="text-[var(--site-primary)]" />
                    <div>
                      <p className="text-[8px] text-[var(--text-tertiary)] tracking-wider uppercase">{tSite("tipologias.areaConstruida")}</p>
                      <p className="text-sm text-[var(--text-primary)] font-medium">{selectedUnit.area_construida} m²</p>
                    </div>
                  </div>
                )}
                {columns.area_privada && selectedUnit.area_privada != null && (
                  <div className="bg-[var(--glass-bg)] rounded-xl px-3 py-2 flex items-center gap-2">
                    <Maximize size={14} className="text-[var(--site-primary)]" />
                    <div>
                      <p className="text-[8px] text-[var(--text-tertiary)] tracking-wider uppercase">{tSite("tipologias.areaPrivada")}</p>
                      <p className="text-sm text-[var(--text-primary)] font-medium">{selectedUnit.area_privada} m²</p>
                    </div>
                  </div>
                )}
                {columns.area_lote && selectedUnit.area_lote != null && (
                  <div className="bg-[var(--glass-bg)] rounded-xl px-3 py-2 flex items-center gap-2">
                    <Maximize size={14} className="text-[var(--site-primary)]" />
                    <div>
                      <p className="text-[8px] text-[var(--text-tertiary)] tracking-wider uppercase">{tSite("tipologias.areaLote")}</p>
                      <p className="text-sm text-[var(--text-primary)] font-medium">{selectedUnit.area_lote} m²</p>
                    </div>
                  </div>
                )}
                {columns.area_m2 && selectedUnit.area_m2 != null && !columns.area_construida && !columns.area_privada && !columns.area_lote && (
                  <div className="bg-[var(--glass-bg)] rounded-xl px-3 py-2 flex items-center gap-2">
                    <Maximize size={14} className="text-[var(--site-primary)]" />
                    <div>
                      <p className="text-[8px] text-[var(--text-tertiary)] tracking-wider uppercase">{tSite("explorar.area")}</p>
                      <p className="text-sm text-[var(--text-primary)] font-medium">{selectedUnit.area_m2} m²</p>
                    </div>
                  </div>
                )}
                {columns.lote && selectedUnit.lote ? (
                  <div className="bg-[var(--glass-bg)] rounded-xl px-3 py-2 flex items-center gap-2">
                    <Building2 size={14} className="text-[var(--site-primary)]" />
                    <div>
                      <p className="text-[8px] text-[var(--text-tertiary)] tracking-wider uppercase">Lote</p>
                      <p className="text-sm text-[var(--text-primary)] font-medium">{selectedUnit.lote}</p>
                    </div>
                  </div>
                ) : columns.piso && selectedUnit.piso ? (
                  <div className="bg-[var(--glass-bg)] rounded-xl px-3 py-2 flex items-center gap-2">
                    <Building2 size={14} className="text-[var(--site-primary)]" />
                    <div>
                      <p className="text-[8px] text-[var(--text-tertiary)] tracking-wider uppercase">{tSite("explorar.floor")}</p>
                      <p className="text-sm text-[var(--text-primary)] font-medium">{selectedUnit.piso}</p>
                    </div>
                  </div>
                ) : null}
                {columns.habitaciones && selectedUnit.habitaciones !== null && (
                  <div className="bg-[var(--glass-bg)] rounded-xl px-3 py-2 flex items-center gap-2">
                    <BedDouble size={14} className="text-[var(--site-primary)]" />
                    <div>
                      <p className="text-[8px] text-[var(--text-tertiary)] tracking-wider uppercase">{tSite("explorar.bedrooms")}</p>
                      <p className="text-sm text-[var(--text-primary)] font-medium">
                        {selectedUnit.habitaciones === 0 ? tSite("explorar.studio") : selectedUnit.habitaciones}
                      </p>
                    </div>
                  </div>
                )}
                {columns.banos && selectedUnit.banos !== null && (
                  <div className="bg-[var(--glass-bg)] rounded-xl px-3 py-2 flex items-center gap-2">
                    <Bath size={14} className="text-[var(--site-primary)]" />
                    <div>
                      <p className="text-[8px] text-[var(--text-tertiary)] tracking-wider uppercase">{tSite("explorar.bathrooms")}</p>
                      <p className="text-sm text-[var(--text-primary)] font-medium">{selectedUnit.banos}</p>
                    </div>
                  </div>
                )}
                {columns.parqueaderos && selectedUnit.parqueaderos !== null && selectedUnit.parqueaderos > 0 && (
                  <div className="bg-[var(--glass-bg)] rounded-xl px-3 py-2 flex items-center gap-2">
                    <Car size={14} className="text-[var(--site-primary)]" />
                    <div>
                      <p className="text-[8px] text-[var(--text-tertiary)] tracking-wider uppercase">{tSite("explorar.parking")}</p>
                      <p className="text-sm text-[var(--text-primary)] font-medium">{selectedUnit.parqueaderos}</p>
                    </div>
                  </div>
                )}
                {columns.depositos && selectedUnit.depositos !== null && selectedUnit.depositos > 0 && (
                  <div className="bg-[var(--glass-bg)] rounded-xl px-3 py-2 flex items-center gap-2">
                    <Archive size={14} className="text-[var(--site-primary)]" />
                    <div>
                      <p className="text-[8px] text-[var(--text-tertiary)] tracking-wider uppercase">{tSite("explorar.storage")}</p>
                      <p className="text-sm text-[var(--text-primary)] font-medium">{selectedUnit.depositos}</p>
                    </div>
                  </div>
                )}
                {columns.etapa && selectedUnit.etapa_nombre && (
                  <div className="bg-[var(--glass-bg)] rounded-xl px-3 py-2 flex items-center gap-2">
                    <Layers size={14} className="text-[var(--site-primary)]" />
                    <div>
                      <p className="text-[8px] text-[var(--text-tertiary)] tracking-wider uppercase">Etapa</p>
                      <p className="text-sm text-[var(--text-primary)] font-medium">{selectedUnit.etapa_nombre}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Orientation + View */}
              {((columns.orientacion && selectedUnit.orientacion) || (columns.vista && (selectedUnit.vista || selectedUnit.vista_piso_id))) && (
                <div className="flex flex-wrap gap-2">
                  {columns.orientacion && selectedUnit.orientacion && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--glass-bg)] rounded-full text-xs text-[var(--text-secondary)]">
                      <Compass size={12} className="text-[var(--text-tertiary)]" />
                      {selectedUnit.orientacion}
                    </span>
                  )}
                  {columns.vista && (() => {
                    const unitVista = selectedUnit.vista_piso_id
                      ? (proyecto.vistas_piso ?? []).find(v => v.id === selectedUnit.vista_piso_id)
                      : null;
                    return unitVista ? (
                      <button
                        onClick={() => setShowVistaModal(unitVista)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[rgba(var(--site-primary-rgb),0.12)] rounded-full text-xs text-[var(--site-primary)] hover:bg-[rgba(var(--site-primary-rgb),0.2)] transition-colors cursor-pointer"
                      >
                        <Eye size={12} />
                        {tSite("explorar.verVista")}
                      </button>
                    ) : selectedUnit.vista ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--glass-bg)] rounded-full text-xs text-[var(--text-secondary)]">
                        <Eye size={12} className="text-[var(--text-tertiary)]" />
                        {tSite("explorar.view")} {selectedUnit.vista}
                      </span>
                    ) : null;
                  })()}
                </div>
              )}

              {/* Notes */}
              {selectedUnit.notas && (
                <p className="text-xs text-[var(--text-tertiary)] leading-relaxed italic">{selectedUnit.notas}</p>
              )}
            </div>

            {/* Price */}
            {columns.precio && selectedUnit.precio && (() => {
              const unitComplementos = (proyecto.parqueaderos_mode !== "sin_inventario" || proyecto.depositos_mode !== "sin_inventario")
                ? (proyecto.complementos ?? []).filter(c => c.unidad_id === selectedUnit.id)
                : [];
              const complementosTotal = unitComplementos.reduce((s, c) => s + (c.precio ?? 0), 0);
              const totalPrecio = selectedUnit.precio + complementosTotal;
              return (
                <div className="mx-4 mb-3 p-3 bg-[rgba(var(--site-primary-rgb),0.08)] rounded-2xl border border-[rgba(var(--site-primary-rgb),0.15)]">
                  <p className="text-[8px] text-[var(--site-primary)] opacity-60 tracking-wider uppercase mb-1">{tSite("explorar.price")}</p>
                  <p className="text-lg font-semibold text-[var(--site-primary)]">
                    {formatPrecio(unitComplementos.length > 0 ? totalPrecio : selectedUnit.precio, locale)}
                  </p>
                  {unitComplementos.length > 0 && (
                    <p className="text-[9px] text-[var(--text-tertiary)] mt-1">
                      Inmueble {formatPrecio(selectedUnit.precio, locale)} + {unitComplementos.length} complemento(s)
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Actions */}
            <div className="px-4 pb-5 mt-auto space-y-2">
              <button
                onClick={() => setCotizarUnidad(selectedUnit)}
                className="w-full btn-warm py-2.5 flex items-center justify-center gap-2 text-sm tracking-wider cursor-pointer"
              >
                <Sparkles size={14} />
                {tSite("explorar.enquireUnit")}
              </button>
              {selectedUnit.tipologia_id && (
                <Link
                  href={`${basePath}/tipologias?tipo=${selectedUnit.tipologia_id}&unidad=${selectedUnit.id}`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-[var(--border-default)] text-xs tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all duration-300"
                >
                  {tSite("explorar.moreInfo")}
                  <ChevronRight size={14} />
                </Link>
              )}
            </div>
          </motion.div>
        ) : (
          /* ── Unit List View ── */
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-1 flex flex-col min-h-0"
          >
            {/* Header + status legend */}
            <div className="flex-shrink-0 px-4 pt-3 pb-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] tracking-[0.25em] text-[var(--text-tertiary)] uppercase">
                  {tCommon("labels.units")}
                </p>
                <span className="text-[9px] text-[var(--text-muted)]">
                  {positionedUnits.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {(["disponible", "separado", "reservada", "vendida"] as const).map((estado) => (
                  <div key={estado} className="flex items-center gap-1">
                    <span className={cn("w-2 h-2 rounded-full", estadoConfig[estado].dot)} />
                    <span className="text-[8px] text-[var(--text-tertiary)] tracking-wider">
                      {estadoConfig[estado].label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scrollable unit list */}
            <div ref={unitListRef} className="flex-1 overflow-y-auto scrollbar-hide px-3 pb-4">
              {positionedUnits.length > 0 ? (
                <div className="space-y-1">
                  {positionedUnits.map((unit) => {
                    const config = estadoConfig[unit.estado];
                    const tipologia = tipologias.find((t) => t.id === unit.tipologia_id);
                    const isHovered = hoveredUnit === unit.id;

                    return (
                      <button
                        key={unit.id}
                        data-unit-id={unit.id}
                        onClick={() => setSelectedUnit(unit)}
                        onMouseEnter={() => setHoveredUnit(unit.id)}
                        onMouseLeave={() => setHoveredUnit(null)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 cursor-pointer group",
                          isHovered ? "bg-[var(--glass-bg-hover)]" : "hover:bg-[var(--glass-bg)]"
                        )}
                      >
                        {/* Status dot */}
                        <span className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", config.dot)} />

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-[var(--text-primary)] font-medium truncate">
                            {unit.identificador}
                          </p>
                          <div className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
                            {isMultiTipo && !unit.tipologia_id ? (
                              <span className="text-[var(--text-muted)]">
                                {unidadTipologias.filter((ut: UnidadTipologia) => ut.unidad_id === unit.id).length} tipos
                              </span>
                            ) : (
                              tipologia && <span className="truncate">{tipologia.nombre}</span>
                            )}
                            {getPrimaryArea(unit, columns) != null && <span className="flex-shrink-0">· {getPrimaryArea(unit, columns)} m²</span>}
                            {columns.lote && unit.lote
                              ? <span className="flex-shrink-0">· Lote {unit.lote}</span>
                              : columns.piso && unit.piso ? <span className="flex-shrink-0">· P{unit.piso}</span> : null
                            }
                          </div>
                        </div>

                        {/* Price */}
                        {columns.precio && unit.precio && (
                          <span className="text-[10px] text-[var(--site-primary)] font-medium flex-shrink-0">
                            {formatPrecio(unit.precio, locale)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32">
                  <p className="text-xs text-[var(--text-muted)]">
                    {tSite("explorar.noUnits")}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  return (
    <SectionTransition className="h-screen flex overflow-hidden bg-[var(--site-bg)]">
      {/* ====== LEFT: Facade image with hotspots ====== */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-[var(--surface-0)]" />

        {/* Header overlay — top left */}
        <motion.div
          className="absolute top-6 z-20"
          style={{ left: isMobile ? "5rem" : "1.5rem" }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3">
            {hasImplantaciones && (
              <Link
                href={`${basePath}/implantaciones`}
                className="w-9 h-9 rounded-xl bg-[var(--glass-bg-hover)] hover:bg-[var(--border-default)] flex items-center justify-center transition-colors"
                aria-label={tSite("explorar.backToImplantaciones")}
              >
                <ChevronLeft size={18} className="text-[var(--text-secondary)]" />
              </Link>
            )}
            <div className="w-9 h-9 rounded-xl bg-[rgba(var(--site-primary-rgb),0.15)] flex items-center justify-center">
              <Building2 size={18} className="text-[var(--site-primary)]" />
            </div>
            <div>
              <h1 className="text-lg font-site-heading text-[var(--text-primary)]">
                {activeTorre
                  ? tSite("explorar.exploreTower", { name: activeTorre.nombre })
                  : explorarView === "planta"
                    ? tSite("explorar.explorePlantas")
                    : activeFachada
                      ? tSite("explorar.exploreFachada", { name: activeFachada.nombre })
                      : tSite("explorar.exploreFachadas")}
              </h1>
              <p className="text-[10px] text-[var(--text-tertiary)] tracking-wider">
                {tSite("explorar.selectUnit")}
              </p>
            </div>
          </div>
        </motion.div>

        {/* View toggle (fachada / planta) — only if project has both */}
        {showViewToggle && (
          <motion.div
            className="absolute top-6 right-6 z-20 glass rounded-xl p-1 flex items-center gap-0.5"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <button
              onClick={() => { setExplorarView("fachada"); selectFachada(0); }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer",
                explorarView === "fachada" ? "bg-[var(--border-default)] text-[var(--text-primary)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              )}
            >
              <Building2 size={12} />
              {tSite("explorar.fachadaView")}
            </button>
            <button
              onClick={() => { setExplorarView("planta"); selectFachada(0); }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer",
                explorarView === "planta" ? "bg-[var(--border-default)] text-[var(--text-primary)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              )}
            >
              <Layers size={12} />
              {tSite("explorar.plantaView")}
            </button>
          </motion.div>
        )}

        {/* ====== FACADE IMAGE + HOTSPOTS ====== */}
        <motion.div
          className="relative z-10 flex items-center justify-center p-4 lg:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {/* Wrapper sized to exact image — CSS % hotspot positioning */}
          {/* Click on background (not on a hotspot) closes unit detail */}
          <div className="relative inline-block leading-[0]" onClick={() => selectedUnit && setSelectedUnit(null)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fachadaUrl}
              alt={tSite("explorar.fachadasLabel")}
              className={cn(
                "block max-h-[calc(100vh-120px)] max-w-full w-auto rounded-2xl shadow-2xl shadow-black/50 transition-opacity duration-500",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
              draggable={false}
              onLoad={() => setImageLoaded(true)}
            />

            {/* Dark overlay for better dot contrast */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(var(--overlay-rgb), 0.25), rgba(var(--overlay-rgb), 0.1), rgba(var(--overlay-rgb), 0.4))" }} />

            {/* Unit hotspot dots — CSS % positioned */}
            {imageLoaded && positionedUnits.map((unit) => {
              const config = estadoConfig[unit.estado];
              const isSelected = selectedUnit?.id === unit.id;
              const isHovered = hoveredUnit === unit.id;

              return (
                <button
                  key={unit.id}
                  aria-label={`${tCommon("labels.unit")} ${unit.identificador}`}
                  className="absolute z-10 cursor-pointer group"
                  style={{
                    left: `${isPlantaView ? unit.planta_x : unit.fachada_x}%`,
                    top: `${isPlantaView ? unit.planta_y : unit.fachada_y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedUnit(isSelected ? null : unit);
                    if (!isSelected) {
                      scrollToUnit(unit.id);
                      if (isMobile) setSheetOpen(true);
                    }
                  }}
                  onMouseEnter={() => setHoveredUnit(unit.id)}
                  onMouseLeave={() => setHoveredUnit(null)}
                >
                  {/* Hit area */}
                  <span className={cn(
                    "absolute -inset-4 rounded-lg transition-all duration-150",
                    isSelected ? "bg-[var(--border-default)]" : isHovered ? "bg-[var(--glass-bg-hover)]" : "bg-[var(--glass-bg)]"
                  )} />

                  {/* Pulse ring for available units */}
                  {unit.estado === "disponible" && !isSelected && (
                    <span className="absolute -inset-1 rounded-full border border-emerald-400/30 animate-ping origin-center" />
                  )}

                  {/* Selection ring */}
                  {isSelected && (
                    <span className={cn("absolute -inset-1.5 rounded-full border-2 animate-pulse", config.ring)} />
                  )}

                  {/* The dot */}
                  <span className={cn(
                    "relative block w-3 h-3 rounded-full border-[1.5px] border-white/80 shadow-md transition-transform duration-150",
                    config.dot,
                    isSelected && "scale-150 border-white",
                    isHovered && !isSelected && "scale-125"
                  )} />

                  {/* Tooltip on hover */}
                  <AnimatePresence>
                    {isHovered && !isSelected && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 glass-dark px-3 py-2 rounded-xl whitespace-nowrap z-40 pointer-events-none"
                      >
                        <p className="text-xs font-semibold text-white">{unit.identificador}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[var(--site-bg)] to-transparent z-5" />

        {/* Mini implantación floating overlay — bottom-left (desktop only) */}
        {!isMobile && isMultiTorre && implantacionPlano && implantacionPuntos.length > 0 && (
          <motion.div
            className="absolute bottom-6 left-6 z-20 w-[160px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div
              className="relative rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--surface-1)]/80 backdrop-blur-md cursor-pointer shadow-lg shadow-black/40 hover:border-[var(--border-default)] transition-all group"
              onClick={() => setShowImplantacionModal(true)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={implantacionPlano.imagen_url}
                alt={implantacionPlano.nombre}
                className="w-full h-auto object-contain"
                draggable={false}
              />
              {implantacionPuntos.map((punto, idx) => {
                const isActivePunto = activeTorre?.id === punto.torre_id;
                return (
                  <button
                    key={punto.id}
                    aria-label={punto.titulo}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (punto.torre_id) {
                        setSelectedTorreId(punto.torre_id);
                        selectFachada(0);
                      }
                    }}
                    style={{
                      left: `${punto.x}%`,
                      top: `${punto.y}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                    className="absolute z-10 cursor-pointer"
                  >
                    {isActivePunto && (
                      <span className="absolute -inset-0.5 rounded-full border border-[var(--site-primary)] animate-pulse" />
                    )}
                    <span
                      className={cn(
                        "relative flex items-center justify-center w-3.5 h-3.5 rounded-full border border-white text-[6px] font-bold shadow-sm",
                        isActivePunto
                          ? "bg-[var(--site-primary)] text-black"
                          : "bg-white/20 text-white backdrop-blur-sm"
                      )}
                    >
                      {idx + 1}
                    </span>
                  </button>
                );
              })}
              <div className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 size={10} className="text-white/70" />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ====== RIGHT: Sidebar (desktop) / Bottom Sheet (mobile) ====== */}
      {!isMobile && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="w-[340px] h-full flex-shrink-0 bg-[var(--surface-0)]/95 backdrop-blur-xl border-l border-[var(--border-default)] flex flex-col z-20"
        >
          {sidebarContent}
        </motion.div>
      )}
      {isMobile && (
        <MobileBottomSheet
          isOpen={sheetOpen}
          onToggle={() => setSheetOpen((o) => !o)}
          onClose={() => setSheetOpen(false)}
          fabIcon={<Building2 size={18} />}
          fabLabel={tSite("mobile.showUnits")}
          badgeCount={positionedUnits.length}
        >
          <div className="flex flex-col h-full">
            {sidebarContent}
          </div>
        </MobileBottomSheet>
      )}

      {/* Cotizador Modal */}
      {cotizarUnidad && (
        <CotizadorModal
          isOpen={!!cotizarUnidad}
          onClose={() => setCotizarUnidad(null)}
          unidad={cotizarUnidad}
          tipologia={tipologias.find((t) => t.id === cotizarUnidad.tipologia_id) || undefined}
          proyectoId={proyecto.id}
          cotizadorEnabled={proyecto.cotizador_enabled}
          cotizadorConfig={proyecto.cotizador_config}
          tipoProyecto={proyecto.tipo_proyecto}
        />
      )}

      {/* Implantación fullscreen modal */}
      <AnimatePresence>
        {showImplantacionModal && implantacionPlano && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
            onClick={() => setShowImplantacionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-[85vw] max-h-[85vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setShowImplantacionModal(false)}
                className="absolute -top-4 -right-4 z-10 p-2 rounded-full glass hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X size={18} className="text-white" />
              </button>

              {/* Plan image with hotspots */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={implantacionPlano.imagen_url}
                  alt={implantacionPlano.nombre}
                  className="max-w-[85vw] max-h-[75vh] object-contain"
                  draggable={false}
                />
                {/* Tower hotspots (full size in modal) */}
                {implantacionPuntos.map((punto, idx) => {
                  const isActive = activeTorre?.id === punto.torre_id;
                  return (
                    <button
                      key={punto.id}
                      aria-label={punto.titulo}
                      onClick={() => {
                        if (punto.torre_id) {
                          setSelectedTorreId(punto.torre_id);
                          selectFachada(0);
                          setShowImplantacionModal(false);
                        }
                      }}
                      style={{
                        left: `${punto.x}%`,
                        top: `${punto.y}%`,
                        transform: "translate(-50%, -50%)",
                        minWidth: "44px",
                        minHeight: "44px",
                      }}
                      className="absolute z-10 cursor-pointer group flex items-center justify-center"
                    >
                      {/* Pulse for non-active */}
                      {!isActive && (
                        <span className="absolute inset-0 rounded-full border-2 border-[rgba(var(--site-primary-rgb),0.40)] animate-ping origin-center" />
                      )}
                      {/* Active ring */}
                      {isActive && (
                        <span className="absolute -inset-1.5 rounded-full border-2 border-[var(--site-primary)] animate-pulse" />
                      )}
                      {/* Numbered dot */}
                      <span
                        className={cn(
                          "relative flex items-center justify-center w-7 h-7 rounded-full border-2 border-white text-[11px] font-bold shadow-lg transition-transform duration-150",
                          isActive
                            ? "bg-[var(--site-primary)] text-black scale-125"
                            : "bg-white/20 text-white backdrop-blur-sm group-hover:scale-110"
                        )}
                      >
                        {idx + 1}
                      </span>
                      {/* Tooltip */}
                      <AnimatePresence>
                        <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 glass-dark px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                          <span className="text-[11px] font-medium text-white tracking-wider">{punto.titulo}</span>
                        </span>
                      </AnimatePresence>
                    </button>
                  );
                })}
              </div>

              {/* Title below */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-4 text-center"
              >
                <h3 className="font-site-heading text-lg text-white">{implantacionPlano.nombre}</h3>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">{tSite("explorar.selectTower")}</p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ====== VISTA MODAL ====== */}
      <AnimatePresence>
        {showVistaModal && (
          <VistaModal vista={showVistaModal} onClose={() => setShowVistaModal(null)} />
        )}
      </AnimatePresence>
    </SectionTransition>
  );
}
