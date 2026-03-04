"use client";

import { useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Car, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import type { PuntoInteres } from "@/types";

interface POIPanelProps {
  pois: PuntoInteres[];
  selectedPOI: PuntoInteres | null;
  onSelectPOI: (poi: PuntoInteres) => void;
  onClose: () => void;
}

export function POIPanel({ pois, selectedPOI, onSelectPOI, onClose }: POIPanelProps) {
  const currentIndex = useMemo(() => {
    if (!selectedPOI) return -1;
    return pois.findIndex((poi) => poi.id === selectedPOI.id);
  }, [pois, selectedPOI]);

  const isFirst = currentIndex <= 0;
  const isLast = currentIndex >= pois.length - 1;

  const handlePrev = () => {
    if (!isFirst) {
      onSelectPOI(pois[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (!isLast) {
      onSelectPOI(pois[currentIndex + 1]);
    }
  };

  return (
    <AnimatePresence>
      {selectedPOI && (
        <motion.div
          key="poi-panel"
          className="absolute right-6 top-1/2 -translate-y-1/2 z-20 glass-panel rounded-3xl p-6 w-[380px] max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-hide"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-warm-100/80 hover:bg-warm-200 transition-colors"
            aria-label="Cerrar panel"
          >
            <X className="w-4 h-4 text-warm-700" />
          </button>

          {/* POI Image */}
          {selectedPOI.imagen_url && (
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-4">
              <Image
                src={selectedPOI.imagen_url}
                alt={selectedPOI.nombre}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          )}

          {/* Category badge */}
          <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-[var(--site-primary)]/10 text-[var(--site-primary)] mb-2">
            {selectedPOI.categoria}
          </span>

          {/* POI name */}
          <h3 className="text-xl font-semibold text-warm-900 mb-1">
            {selectedPOI.nombre}
          </h3>

          {/* City */}
          {selectedPOI.ciudad && (
            <p className="text-sm text-warm-500 mb-3">
              {selectedPOI.ciudad}
            </p>
          )}

          {/* Distance info row */}
          {(selectedPOI.distancia_km !== null || selectedPOI.tiempo_minutos !== null) && (
            <div className="flex items-center gap-4 mb-4">
              {selectedPOI.distancia_km !== null && (
                <div className="flex items-center gap-1.5 text-sm text-warm-600">
                  <Car className="w-4 h-4" />
                  <span>{selectedPOI.distancia_km} km</span>
                </div>
              )}
              {selectedPOI.tiempo_minutos !== null && (
                <div className="flex items-center gap-1.5 text-sm text-warm-600">
                  <Clock className="w-4 h-4" />
                  <span>{selectedPOI.tiempo_minutos} min</span>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {selectedPOI.descripcion && (
            <p className="text-sm text-warm-600 leading-relaxed mb-4">
              {selectedPOI.descripcion}
            </p>
          )}

          {/* Divider */}
          <div className="border-t border-warm-200 my-4" />

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={isFirst}
              className="p-2 rounded-full hover:bg-warm-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Anterior punto de interés"
            >
              <ChevronLeft className="w-5 h-5 text-warm-700" />
            </button>

            <span className="text-sm text-warm-500 font-medium">
              {currentIndex + 1} / {pois.length}
            </span>

            <button
              onClick={handleNext}
              disabled={isLast}
              className="p-2 rounded-full hover:bg-warm-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Siguiente punto de interés"
            >
              <ChevronRight className="w-5 h-5 text-warm-700" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
