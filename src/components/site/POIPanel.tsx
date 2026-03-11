"use client";

import { useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Car, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import type { PuntoInteres } from "@/types";
import { useTranslation } from "@/i18n";

interface POIPanelProps {
  pois: PuntoInteres[];
  selectedPOI: PuntoInteres | null;
  onSelectPOI: (poi: PuntoInteres) => void;
  onClose: () => void;
}

export function POIPanel({ pois, selectedPOI, onSelectPOI, onClose }: POIPanelProps) {
  const { t } = useTranslation("common");
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
          className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-20 glass-dark rounded-3xl p-6 w-[calc(100vw-2rem)] sm:w-[380px] max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-hide"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            aria-label={t("accessibility.closePOIPanel")}
          >
            <X className="w-4 h-4 text-[var(--text-secondary)]" />
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
          <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-[rgba(var(--site-primary-rgb),0.15)] text-[var(--site-primary)] mb-2">
            {selectedPOI.categoria}
          </span>

          {/* POI name */}
          <h3 className="text-xl font-semibold text-white mb-1">
            {selectedPOI.nombre}
          </h3>

          {/* City */}
          {selectedPOI.ciudad && (
            <p className="text-sm text-[var(--text-tertiary)] mb-3">
              {selectedPOI.ciudad}
            </p>
          )}

          {/* Distance info row */}
          {(selectedPOI.distancia_km !== null || selectedPOI.tiempo_minutos !== null) && (
            <div className="flex items-center gap-4 mb-4">
              {selectedPOI.distancia_km !== null && (
                <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                  <Car className="w-4 h-4" />
                  <span>{selectedPOI.distancia_km} km</span>
                </div>
              )}
              {selectedPOI.tiempo_minutos !== null && (
                <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                  <Clock className="w-4 h-4" />
                  <span>{selectedPOI.tiempo_minutos} min</span>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {selectedPOI.descripcion && (
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
              {selectedPOI.descripcion}
            </p>
          )}

          {/* Divider */}
          <div className="border-t border-white/10 my-4" />

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={isFirst}
              className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              aria-label={t("accessibility.previousPOI")}
            >
              <ChevronLeft className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>

            <span className="text-sm text-[var(--text-tertiary)] font-medium">
              {currentIndex + 1} / {pois.length}
            </span>

            <button
              onClick={handleNext}
              disabled={isLast}
              className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              aria-label={t("accessibility.nextPOI")}
            >
              <ChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
