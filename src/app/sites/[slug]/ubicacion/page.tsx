"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation } from "lucide-react";
import { useSiteProject } from "@/hooks/useSiteProject";
import { MapboxMap } from "@/components/site/MapboxMap";
import { POIPanel } from "@/components/site/POIPanel";
import type { PuntoInteres } from "@/types";

export default function UbicacionPage() {
  const proyecto = useSiteProject();
  const {
    ubicacion_lat: lat,
    ubicacion_lng: lng,
    ubicacion_direccion,
    puntos_interes,
    nombre,
  } = proyecto;

  const [selectedPOI, setSelectedPOI] = useState<PuntoInteres | null>(null);

  const handleSelectPOI = useCallback((poi: PuntoInteres) => {
    setSelectedPOI(poi);
  }, []);

  const handleClosePOI = useCallback(() => {
    setSelectedPOI(null);
  }, []);

  if (!lat || !lng) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-white/20">Ubicación no disponible</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full relative overflow-hidden">
      {/* Mapbox fullscreen */}
      <MapboxMap
        center={[lng, lat]}
        pois={puntos_interes || []}
        onSelectPOI={handleSelectPOI}
        selectedPOI={selectedPOI}
        projectName={nombre}
      />

      {/* Project info overlay - bottom left */}
      <motion.div
        className="absolute bottom-8 left-8 z-10 glass rounded-2xl p-5 max-w-xs"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
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
              <p className="text-white/40 text-xs leading-relaxed">
                {ubicacion_direccion}
              </p>
            )}
          </div>
        </div>
        <a
          href={`https://www.google.com/maps?q=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center gap-2 text-xs tracking-wider text-[var(--site-primary)] hover:text-white transition-colors duration-300"
        >
          <Navigation size={12} />
          ABRIR EN GOOGLE MAPS
        </a>
      </motion.div>

      {/* POI counter overlay - top right */}
      <AnimatePresence>
        {puntos_interes && puntos_interes.length > 0 && !selectedPOI && (
          <motion.button
            className="absolute top-8 right-8 z-10 glass rounded-full px-5 py-3 flex items-center gap-2 text-xs tracking-wider text-white/70 hover:text-white transition-colors cursor-pointer"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.7 }}
            onClick={() => handleSelectPOI(puntos_interes[0])}
          >
            <MapPin size={14} className="text-[var(--site-primary)]" />
            {puntos_interes.length} PUNTOS DE INTERÉS
          </motion.button>
        )}
      </AnimatePresence>

      {/* POI Detail Panel */}
      <POIPanel
        pois={puntos_interes || []}
        selectedPOI={selectedPOI}
        onSelectPOI={handleSelectPOI}
        onClose={handleClosePOI}
      />
    </div>
  );
}
