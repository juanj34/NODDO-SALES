"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSiteProject } from "@/hooks/useSiteProject";
import { Lightbox } from "@/components/site/Lightbox";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Maximize,
  BedDouble,
  Bath,
} from "lucide-react";
import type { GaleriaImagen } from "@/types";

export default function TipologiasPage() {
  const proyecto = useSiteProject();
  const tipologias = proyecto.tipologias;

  const [activeIndex, setActiveIndex] = useState(0);
  const [activeRenderIndex, setActiveRenderIndex] = useState(0);
  const [showSelector, setShowSelector] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<GaleriaImagen[] | null>(
    null
  );

  const active = tipologias[activeIndex];

  // Convert renders to GaleriaImagen format for the Lightbox
  const renderImages: GaleriaImagen[] = active.renders.map((url, i) => ({
    id: `render-${i}`,
    categoria_id: "",
    url,
    thumbnail_url: null,
    alt_text: `${active.nombre} render ${i + 1}`,
    orden: i,
  }));

  const currentRenderUrl =
    active.renders.length > 0 ? active.renders[activeRenderIndex] : null;

  // Navigate renders
  const goNextRender = useCallback(() => {
    if (active.renders.length === 0) return;
    setActiveRenderIndex((prev) =>
      prev < active.renders.length - 1 ? prev + 1 : 0
    );
  }, [active.renders.length]);

  const goPrevRender = useCallback(() => {
    if (active.renders.length === 0) return;
    setActiveRenderIndex((prev) =>
      prev > 0 ? prev - 1 : active.renders.length - 1
    );
  }, [active.renders.length]);

  // Switch tipologia => reset render index
  const selectTipologia = useCallback((idx: number) => {
    setActiveIndex(idx);
    setActiveRenderIndex(0);
    setShowSelector(false);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (lightboxImages) return; // don't interfere with lightbox
      if (e.key === "ArrowRight") goNextRender();
      else if (e.key === "ArrowLeft") goPrevRender();
      else if (e.key === "Escape" && showSelector) setShowSelector(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNextRender, goPrevRender, lightboxImages, showSelector]);

  // Format counter numbers
  const padNum = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="h-screen w-full overflow-hidden relative bg-black">
      {/* ====== FULLSCREEN BACKGROUND IMAGE ====== */}
      <AnimatePresence mode="wait">
        {currentRenderUrl && (
          <motion.div
            key={`${active.id}-${activeRenderIndex}`}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
            className="absolute inset-0 z-0"
          >
            <img
              src={currentRenderUrl}
              alt={`${active.nombre} render ${activeRenderIndex + 1}`}
              className="w-full h-full object-cover"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== WARM GRADIENT OVERLAYS ====== */}
      <div className="absolute inset-0 z-[1] pointer-events-none">
        {/* Top gradient */}
        <div className="absolute top-0 inset-x-0 h-72 bg-gradient-to-b from-black/70 via-black/30 to-transparent" />
        {/* Bottom gradient */}
        <div className="absolute bottom-0 inset-x-0 h-72 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        {/* Warm tint overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 via-transparent to-amber-800/10" />
      </div>

      {/* ====== MAIN CONTENT LAYER ====== */}
      <div className="absolute inset-0 z-[2] flex flex-col">
        {/* ---------- TOP: Title + Stats ---------- */}
        <div className="flex-shrink-0 pt-24 pb-8 flex flex-col items-center text-center px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center"
            >
              <h1 className="text-5xl md:text-7xl font-extralight tracking-[0.15em] text-white/95 uppercase">
                {active.nombre}
              </h1>

              {/* Stats row */}
              <div className="flex items-center gap-6 mt-4">
                {active.habitaciones && (
                  <div className="flex items-center gap-2 text-white/60">
                    <BedDouble size={16} />
                    <span className="text-sm tracking-[0.2em] uppercase">
                      Habitaciones {active.habitaciones}
                    </span>
                  </div>
                )}
                {active.habitaciones && active.banos && (
                  <span className="text-white/20">|</span>
                )}
                {active.banos && (
                  <div className="flex items-center gap-2 text-white/60">
                    <Bath size={16} />
                    <span className="text-sm tracking-[0.2em] uppercase">
                      Ba&ntilde;os {active.banos}
                    </span>
                  </div>
                )}
                {active.area_m2 && (
                  <>
                    <span className="text-white/20">|</span>
                    <div className="flex items-center gap-2 text-white/60">
                      <Maximize size={16} />
                      <span className="text-sm tracking-[0.2em] uppercase">
                        {active.area_m2} m&sup2;
                      </span>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ---------- CENTER: Navigation arrows + CTA ---------- */}
        <div className="flex-1 flex items-center justify-between px-4 md:px-8">
          {/* Left arrow */}
          <button
            onClick={goPrevRender}
            className={cn(
              "glass w-14 h-14 rounded-full flex items-center justify-center",
              "text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300",
              active.renders.length <= 1 && "opacity-0 pointer-events-none"
            )}
          >
            <ChevronLeft size={28} />
          </button>

          {/* Center CTA */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="btn-warm px-8 py-3 rounded-full text-sm font-semibold tracking-[0.15em] uppercase"
            onClick={() => setLightboxImages(renderImages)}
          >
            Ver Casa &rarr;
          </motion.button>

          {/* Right arrow */}
          <button
            onClick={goNextRender}
            className={cn(
              "glass w-14 h-14 rounded-full flex items-center justify-center",
              "text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300",
              active.renders.length <= 1 && "opacity-0 pointer-events-none"
            )}
          >
            <ChevronRight size={28} />
          </button>
        </div>

        {/* ---------- BOTTOM BAR ---------- */}
        <div className="flex-shrink-0 pb-6 px-4 md:px-8">
          <div className="flex items-end justify-between">
            {/* Bottom left: Selector trigger */}
            <button
              onClick={() => setShowSelector(true)}
              className="glass rounded-full px-6 py-3 text-xs tracking-[0.2em] uppercase text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300"
            >
              Selecciona una Casa
            </button>

            {/* Bottom center: Thumbnail strip */}
            {active.renders.length > 1 && (
              <div className="hidden md:flex items-center gap-2">
                {active.renders.map((url, idx) => (
                  <button
                    key={`thumb-${idx}`}
                    onClick={() => setActiveRenderIndex(idx)}
                    className={cn(
                      "flex-shrink-0 w-16 h-11 rounded-lg overflow-hidden border-2 transition-all duration-300",
                      idx === activeRenderIndex
                        ? "border-[var(--site-primary)] opacity-100 scale-105"
                        : "border-transparent opacity-40 hover:opacity-70"
                    )}
                  >
                    <img
                      src={url}
                      alt={`${active.nombre} thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Bottom right: Counter */}
            {active.renders.length > 0 && (
              <span className="text-white/40 text-sm tracking-[0.2em] font-light">
                {padNum(activeRenderIndex + 1)} &mdash;{" "}
                {padNum(active.renders.length)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ====== TIPOLOGIA SELECTOR PANEL (slide-in from left) ====== */}
      <AnimatePresence>
        {showSelector && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[10] bg-black/50"
              onClick={() => setShowSelector(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 z-[11] w-80 md:w-96 glass-card rounded-none flex flex-col"
              style={{
                background: "rgba(10, 8, 5, 0.85)",
                backdropFilter: "blur(24px) saturate(180%)",
                borderRight: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 0,
              }}
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-6 pt-8 pb-6">
                <p className="text-xs tracking-[0.35em] text-[var(--site-primary)] uppercase">
                  Tipolog&iacute;as
                </p>
                <button
                  onClick={() => setShowSelector(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Tipologia list */}
              <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-1">
                {tipologias.map((tipo, idx) => (
                  <button
                    key={tipo.id}
                    onClick={() => selectTipologia(idx)}
                    className={cn(
                      "w-full text-left px-5 py-4 rounded-xl transition-all duration-300 relative",
                      idx === activeIndex
                        ? "bg-white/5 text-white"
                        : "text-white/40 hover:text-white/70 hover:bg-white/5"
                    )}
                  >
                    {/* Gold left border for active */}
                    {idx === activeIndex && (
                      <motion.div
                        layoutId="tipologia-indicator"
                        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-[var(--site-primary)]"
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 30,
                        }}
                      />
                    )}

                    <span className="text-sm tracking-[0.15em] font-medium uppercase block">
                      {tipo.nombre}
                    </span>

                    {/* Mini stats */}
                    <div className="flex items-center gap-4 mt-2">
                      {tipo.habitaciones && (
                        <div className="flex items-center gap-1 text-white/30">
                          <BedDouble size={12} />
                          <span className="text-[11px] tracking-wider">
                            {tipo.habitaciones}
                          </span>
                        </div>
                      )}
                      {tipo.banos && (
                        <div className="flex items-center gap-1 text-white/30">
                          <Bath size={12} />
                          <span className="text-[11px] tracking-wider">
                            {tipo.banos}
                          </span>
                        </div>
                      )}
                      {tipo.area_m2 && (
                        <div className="flex items-center gap-1 text-white/30">
                          <Maximize size={12} />
                          <span className="text-[11px] tracking-wider">
                            {tipo.area_m2} m&sup2;
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ====== LIGHTBOX ====== */}
      {lightboxImages && (
        <Lightbox
          images={lightboxImages}
          initialIndex={activeRenderIndex}
          onClose={() => setLightboxImages(null)}
        />
      )}
    </div>
  );
}
