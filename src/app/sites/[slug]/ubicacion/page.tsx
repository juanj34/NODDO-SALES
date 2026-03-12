"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  MapPin,
  Navigation,
  Satellite,
  Map as MapIcon,
  ShoppingBag,
  Trees,
  Heart,
  GraduationCap,
  Bus,
  UtensilsCrossed,
  Palette,
  Dumbbell,
  ChevronRight,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { useSiteProject } from "@/hooks/useSiteProject";
import { CloseButton } from "@/components/ui/CloseButton";
import { usePersistedState } from "@/hooks/usePersistedState";
import { useTranslation } from "@/i18n";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { MapboxMap } from "@/components/site/MapboxMap";
import { MobileBottomSheet } from "@/components/site/MobileBottomSheet";
import { cn } from "@/lib/utils";
import type { PuntoInteres } from "@/types";

type MapStyle = "satellite" | "streets";

interface CategoryConfig {
  icon: React.ElementType;
  color: string;
  bg: string;
}

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  Comercio: {
    icon: ShoppingBag,
    color: "text-amber-400",
    bg: "bg-amber-400/15",
  },
  Recreación: {
    icon: Trees,
    color: "text-emerald-400",
    bg: "bg-emerald-400/15",
  },
  Salud: {
    icon: Heart,
    color: "text-rose-400",
    bg: "bg-rose-400/15",
  },
  Educación: {
    icon: GraduationCap,
    color: "text-blue-400",
    bg: "bg-blue-400/15",
  },
  Transporte: {
    icon: Bus,
    color: "text-purple-400",
    bg: "bg-purple-400/15",
  },
  Gastronomía: {
    icon: UtensilsCrossed,
    color: "text-orange-400",
    bg: "bg-orange-400/15",
  },
  Cultura: {
    icon: Palette,
    color: "text-cyan-400",
    bg: "bg-cyan-400/15",
  },
  Deporte: {
    icon: Dumbbell,
    color: "text-lime-400",
    bg: "bg-lime-400/15",
  },
};

const DEFAULT_CATEGORY: CategoryConfig = {
  icon: MapPin,
  color: "text-[var(--site-primary)]",
  bg: "bg-[rgba(var(--site-primary-rgb),0.15)]",
};

function getCategoryConfig(categoria: string): CategoryConfig {
  return CATEGORY_CONFIG[categoria] || DEFAULT_CATEGORY;
}

export default function UbicacionPage() {
  const proyecto = useSiteProject();
  const {
    ubicacion_lat: lat,
    ubicacion_lng: lng,
    ubicacion_direccion,
    puntos_interes,
    mapa_ubicacion_url,
    nombre,
  } = proyecto;

  const { t } = useTranslation("site");
  const { t: tCommon } = useTranslation("common");

  const isMobile = useMediaQuery("(max-width: 1023px)");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedPOI, setSelectedPOI] = useState<PuntoInteres | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showMapaImagen, setShowMapaImagen] = useState(false);
  const [mapStyle, setMapStyle] = usePersistedState<MapStyle>(
    "map-style",
    "satellite",
    proyecto.slug,
  );

  // Extract unique categories from POIs
  const categories = useMemo(() => {
    if (!puntos_interes) return [];
    const cats = [...new Set(puntos_interes.map((p) => p.categoria))];
    return cats;
  }, [puntos_interes]);

  // Filter POIs by active category
  const filteredPOIs = useMemo(() => {
    if (!puntos_interes) return [];
    if (!activeCategory) return puntos_interes;
    return puntos_interes.filter((p) => p.categoria === activeCategory);
  }, [puntos_interes, activeCategory]);

  const handleSelectPOI = useCallback((poi: PuntoInteres) => {
    setSelectedPOI((prev) => (prev?.id === poi.id ? null : poi));
    if (isMobile) setSheetOpen(true);
  }, [isMobile]);

  const handleClosePOI = useCallback(() => {
    setSelectedPOI(null);
  }, []);

  // Keyboard navigation for POI list
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (filteredPOIs.length === 0) return;

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          const currentIdx = selectedPOI
            ? filteredPOIs.findIndex((p) => p.id === selectedPOI.id)
            : -1;
          const nextIdx = Math.min(currentIdx + 1, filteredPOIs.length - 1);
          setSelectedPOI(filteredPOIs[nextIdx]);
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          const currentIdx = selectedPOI
            ? filteredPOIs.findIndex((p) => p.id === selectedPOI.id)
            : filteredPOIs.length;
          const prevIdx = Math.max(currentIdx - 1, 0);
          setSelectedPOI(filteredPOIs[prevIdx]);
          break;
        }
        case "Escape":
          if (showMapaImagen) {
            setShowMapaImagen(false);
          } else if (selectedPOI) {
            setSelectedPOI(null);
          }
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedPOI, filteredPOIs, showMapaImagen]);

  if (!lat || !lng) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-[var(--text-muted)]">{t("ubicacion.notAvailable")}</p>
      </div>
    );
  }

  /* ── Sidebar content (shared between desktop sidebar + mobile sheet) ── */
  const sidebarContent = (
    <>
      {/* Panel header */}
      <div className="px-6 pt-5 pb-4 flex-shrink-0">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-[rgba(var(--site-primary-rgb),0.15)] flex items-center justify-center">
            <MapPin size={16} className="text-[var(--site-primary)]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white tracking-wide">
              {t("ubicacion.pointsOfInterest")}
            </h2>
            <p className="text-xs text-[var(--text-tertiary)]">
              {puntos_interes?.length || 0} {t("ubicacion.nearbyDestinations")}
            </p>
          </div>
        </div>
      </div>

      {/* Category tabs — horizontal scroll */}
      {categories.length > 1 && (
        <div className="pb-3 flex-shrink-0">
          <div className="flex gap-2 overflow-x-auto scroll-smooth px-6 pb-2 scrollbar-thin">
            <button
              onClick={() => setActiveCategory(null)}
              className={cn(
                "flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide whitespace-nowrap transition-all duration-300 cursor-pointer",
                activeCategory === null
                  ? "bg-[var(--site-primary)] text-black"
                  : "bg-white/8 text-[var(--text-secondary)] hover:text-white hover:bg-white/12"
              )}
            >
              {t("ubicacion.all")}
            </button>
            {categories.map((cat) => {
              const config = getCategoryConfig(cat);
              const Icon = config.icon;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide whitespace-nowrap transition-all duration-300 cursor-pointer",
                    activeCategory === cat
                      ? "bg-[var(--site-primary)] text-black"
                      : "bg-white/8 text-[var(--text-secondary)] hover:text-white hover:bg-white/12"
                  )}
                >
                  <Icon size={12} />
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="mx-6 border-t border-[var(--border-default)] flex-shrink-0" />

      {/* POI list */}
      <div className="relative flex-1 overflow-y-auto scrollbar-thin px-3 py-3">
        <div className="sticky bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[var(--surface-0)] to-transparent pointer-events-none z-10" />
        <AnimatePresence mode="popLayout">
          {filteredPOIs.map((poi, index) => {
            const config = getCategoryConfig(poi.categoria);
            const Icon = config.icon;
            const isSelected = selectedPOI?.id === poi.id;

            return (
              <motion.button
                key={poi.id}
                layout
                onClick={() => handleSelectPOI(poi)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.02, duration: 0.3 }}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-xl mb-1 transition-all duration-200 cursor-pointer group",
                  isSelected
                    ? "bg-white/10 ring-1 ring-[rgba(var(--site-primary-rgb),0.30)]"
                    : "hover:bg-white/[0.04]"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      config.bg
                    )}
                  >
                    <Icon size={15} className={config.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className={cn(
                        "text-[13px] font-medium leading-tight truncate transition-colors duration-200",
                        isSelected ? "text-white" : "text-white/75 group-hover:text-white"
                      )}
                    >
                      {poi.nombre}
                    </h3>
                    {poi.distancia_km !== null && (
                      <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                        {poi.distancia_km} km
                      </p>
                    )}
                  </div>
                  <ChevronRight
                    size={14}
                    className={cn(
                      "flex-shrink-0 transition-all duration-200",
                      isSelected
                        ? "text-[var(--site-primary)] rotate-90"
                        : "text-white/15 group-hover:text-[var(--text-tertiary)]"
                    )}
                  />
                </div>

                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      {poi.imagen_url && (
                        <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden mt-2.5">
                          <Image
                            src={poi.imagen_url}
                            alt={poi.nombre}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                      )}
                      {poi.descripcion && (
                        <p className="text-xs text-[var(--text-tertiary)] leading-relaxed mt-2">
                          {poi.descripcion}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </AnimatePresence>

        {filteredPOIs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MapPin size={24} className="text-white/15 mb-3" />
            <p className="text-[var(--text-tertiary)] text-sm">
              {t("ubicacion.noPoisCategory")}
            </p>
          </div>
        )}
      </div>

      {/* Footer: Get Directions */}
      <div className="px-6 py-4 border-t border-[var(--border-default)] flex-shrink-0">
        <a
          href={`https://www.google.com/maps?q=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-[var(--border-default)] text-xs tracking-widest text-[var(--text-secondary)] hover:text-white hover:border-white/30 transition-all duration-300 uppercase"
        >
          <Navigation size={14} className="text-[var(--site-primary)]" />
          {t("ubicacion.getDirections")}
        </a>
      </div>
    </>
  );

  return (
    <div className="h-screen w-full relative overflow-hidden flex">
      {/* Map section — full width on mobile, flex-1 on desktop */}
      <div className={cn("relative", isMobile ? "w-full" : "flex-1")}>
        <MapboxMap
          center={[lng, lat]}
          pois={puntos_interes || []}
          onSelectPOI={handleSelectPOI}
          selectedPOI={selectedPOI}
          projectName={nombre}
          mapStyle={mapStyle}
        />

        {/* Map style toggle — shifted right on mobile to avoid hamburger */}
        <motion.div
          className={cn(
            "absolute top-6 z-10 glass rounded-full p-1 flex items-center gap-1",
            isMobile ? "left-20" : "left-6"
          )}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <button
            onClick={() => setMapStyle("satellite")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-xs tracking-wider transition-all duration-300 cursor-pointer",
              mapStyle === "satellite"
                ? "bg-[var(--site-primary)] text-black"
                : "text-[var(--text-secondary)] hover:text-white hover:bg-white/10"
            )}
          >
            <Satellite size={14} />
            {!isMobile && t("ubicacion.satellite")}
          </button>
          <button
            onClick={() => setMapStyle("streets")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-xs tracking-wider transition-all duration-300 cursor-pointer",
              mapStyle === "streets"
                ? "bg-[var(--site-primary)] text-black"
                : "text-[var(--text-secondary)] hover:text-white hover:bg-white/10"
            )}
          >
            <MapIcon size={14} />
            {!isMobile && t("ubicacion.map")}
          </button>
          {mapa_ubicacion_url && (
            <button
              onClick={() => setShowMapaImagen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs tracking-wider transition-all duration-300 cursor-pointer text-[var(--text-secondary)] hover:text-white hover:bg-white/10"
            >
              <ImageIcon size={14} />
              {!isMobile && t("ubicacion.render")}
            </button>
          )}
        </motion.div>

        {/* Project info overlay — repositioned on mobile */}
        <motion.div
          className={cn(
            "absolute z-10 glass rounded-2xl p-4 max-w-xs",
            isMobile ? "bottom-20 left-4" : "bottom-6 left-6"
          )}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6, type: "spring", damping: 20 }}
        >
          <div className="flex items-start gap-3">
            <MapPin
              size={18}
              className="text-[var(--site-primary)] mt-0.5 flex-shrink-0"
            />
            <div>
              <h2 className="text-sm font-medium tracking-wider text-white mb-1">
                {nombre}
              </h2>
              {ubicacion_direccion && (
                <p className="text-[var(--text-tertiary)] text-xs leading-relaxed">
                  {ubicacion_direccion}
                </p>
              )}
            </div>
          </div>
          <a
            href={`https://www.google.com/maps?q=${lat},${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center gap-2 text-xs tracking-wider text-[var(--site-primary)] hover:text-white transition-colors duration-300"
          >
            <Navigation size={12} />
            {t("ubicacion.openGoogleMaps")}
          </a>
        </motion.div>
      </div>

      {/* Desktop: POI sidebar */}
      {!isMobile && (
        <motion.div
          className="w-[380px] h-full bg-[var(--surface-0)]/95 backdrop-blur-xl border-l border-[var(--border-default)] flex flex-col z-20 overflow-hidden"
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6, type: "spring", damping: 25 }}
        >
          {sidebarContent}
        </motion.div>
      )}

      {/* Mobile: Bottom sheet */}
      {isMobile && (
        <MobileBottomSheet
          isOpen={sheetOpen}
          onToggle={() => setSheetOpen((prev) => !prev)}
          onClose={() => setSheetOpen(false)}
          fabIcon={<MapPin size={18} />}
          fabLabel={t("mobile.showPois")}
          badgeCount={puntos_interes?.length || 0}
        >
          <div className="flex flex-col h-full">
            {sidebarContent}
          </div>
        </MobileBottomSheet>
      )}

      {/* Mapa de Ubicacion Image Modal */}
      <AnimatePresence>
        {showMapaImagen && mapa_ubicacion_url && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
            onClick={() => setShowMapaImagen(false)}
          >
            {/* Close button */}
            <CloseButton
              onClick={() => setShowMapaImagen(false)}
              variant="glass"
              size={20}
              className="absolute top-6 right-6 z-10"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="relative max-w-6xl w-full max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mapa_ubicacion_url}
                alt="Mapa de ubicacion"
                className="w-full h-full object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
