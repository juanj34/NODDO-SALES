"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSiteProject } from "@/hooks/useSiteProject";
import { Lightbox } from "@/components/site/Lightbox";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { SiteEmptyState } from "@/components/site/SiteEmptyState";
import type { GaleriaCategoria, GaleriaImagen } from "@/types";
import { useTranslation } from "@/i18n";

interface GalleryScope {
  id: string;
  label: string;
  categories: GaleriaCategoria[];
}

export default function GaleriaPage() {
  const proyecto = useSiteProject();
  const categorias = proyecto.galeria_categorias || [];
  const torres = proyecto.torres || [];
  const { t } = useTranslation("site");

  // Compute scope structure
  const generalCats = categorias.filter((c) => !c.torre_id);
  const towerCatMap = new Map<string, GaleriaCategoria[]>();
  categorias.forEach((cat) => {
    if (cat.torre_id) {
      const existing = towerCatMap.get(cat.torre_id) || [];
      existing.push(cat);
      towerCatMap.set(cat.torre_id, existing);
    }
  });
  const towersWithGallery = torres.filter((t) => towerCatMap.has(t.id));

  const scopes: GalleryScope[] = [];
  if (generalCats.length > 0) {
    scopes.push({ id: "general", label: t("galeria.general"), categories: generalCats });
  }
  towersWithGallery.forEach((torre) => {
    scopes.push({ id: torre.id, label: torre.nombre, categories: towerCatMap.get(torre.id)! });
  });

  const hasMultipleScopes = scopes.length > 1;

  const [activeScope, setActiveScope] = useState(0);
  const [activeCategory, setActiveCategory] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Current categories based on scope
  const currentScopeCategories = hasMultipleScopes
    ? scopes[activeScope]?.categories ?? []
    : categorias;

  const currentImages: GaleriaImagen[] =
    currentScopeCategories[activeCategory]?.imagenes ?? [];

  const current = currentImages[activeSlide];

  const goNext = useCallback(() => {
    if (activeSlide < currentImages.length - 1) {
      setActiveSlide((prev) => prev + 1);
    }
  }, [activeSlide, currentImages.length]);

  const goPrev = useCallback(() => {
    if (activeSlide > 0) {
      setActiveSlide((prev) => prev - 1);
    }
  }, [activeSlide]);

  const handleScopeChange = (idx: number) => {
    setActiveScope(idx);
    setActiveCategory(0);
    setActiveSlide(0);
  };

  const handleCategoryChange = (idx: number) => {
    setActiveCategory(idx);
    setActiveSlide(0);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Skip when lightbox is open (it handles its own keys)
      if (lightboxIndex !== null) return;
      // Skip when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          goNext();
          break;
        case "ArrowLeft":
          e.preventDefault();
          goPrev();
          break;
        case "f":
          setLightboxIndex(activeSlide);
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIndex, goNext, goPrev, activeSlide]);

  // Empty state — no gallery categories configured (after all hooks)
  if (!categorias || categorias.length === 0) {
    return (
      <SiteEmptyState
        variant="galeria"
        title={t("galeria.notAvailable")}
        description={t("galeria.notConfigured")}
      />
    );
  }

  return (
    <div className="h-screen w-full relative overflow-hidden bg-black">
      {/* Fullscreen background image — crossfade + subtle scale + swipe */}
      <AnimatePresence mode="wait">
        {current && (
          <motion.div
            key={`${activeCategory}-${activeSlide}`}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={(_e, info) => {
              if (info.offset.x < -80) goNext();
              else if (info.offset.x > 80) goPrev();
            }}
          >
            <img
              src={current.url}
              alt={current.alt_text || proyecto.nombre}
              className="w-full h-full object-cover pointer-events-none"
            />
            {/* Dark gradient overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30 pointer-events-none" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scope tabs — only when multiple scopes exist */}
      {hasMultipleScopes && (
        <motion.div
          className="absolute top-20 left-4 lg:top-6 lg:left-10 z-20 flex items-center gap-4 lg:gap-5 overflow-x-auto scrollbar-hide max-w-[calc(100vw-2rem)] lg:max-w-none"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {scopes.map((scope, idx) => (
            <button
              key={scope.id}
              onClick={() => handleScopeChange(idx)}
              className={cn(
                "relative pb-2 text-[11px] tracking-[0.15em] uppercase font-bold transition-all duration-300 cursor-pointer",
                idx === activeScope
                  ? "text-white"
                  : "text-[var(--text-muted)] hover:text-white/60"
              )}
            >
              {scope.label}
              {idx === activeScope && (
                <motion.div
                  layoutId="gallery-scope-indicator"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--site-primary)]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
            </button>
          ))}
        </motion.div>
      )}

      {/* Category tabs — top-left underline style */}
      <motion.div
        className={cn(
          "absolute left-4 lg:left-10 z-20 flex items-center gap-4 lg:gap-6 overflow-x-auto scrollbar-hide max-w-[calc(100vw-2rem)] lg:max-w-none",
          hasMultipleScopes ? "top-32 lg:top-16" : "top-20 lg:top-8"
        )}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        {currentScopeCategories.map((cat, idx) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(idx)}
            className={cn(
              "relative pb-2 text-xs tracking-[0.2em] uppercase transition-all duration-300 cursor-pointer",
              idx === activeCategory
                ? "text-white font-medium"
                : "text-[var(--text-tertiary)] hover:text-white/70"
            )}
          >
            {cat.nombre}
            {idx === activeCategory && (
              <motion.div
                layoutId="gallery-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--site-primary)]"
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              />
            )}
          </button>
        ))}
      </motion.div>

      {/* Bottom section: Title + Arrows + Counter + Dots */}
      <motion.div
        className="absolute bottom-6 left-4 right-4 lg:bottom-10 lg:left-10 lg:right-10 z-20 flex items-end justify-between"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        {/* Left: Title + counter */}
        <div className="flex-1 max-w-lg">
          <AnimatePresence mode="wait">
            {current?.alt_text && (
              <motion.h2
                key={`title-${activeCategory}-${activeSlide}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="font-site-heading text-xl sm:text-3xl lg:text-5xl tracking-wider text-white mb-4"
                style={{ textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}
              >
                {current.alt_text}
              </motion.h2>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-5">
            {/* Navigation arrows */}
            <div className="flex items-center gap-2">
              <button
                onClick={goPrev}
                disabled={activeSlide === 0}
                aria-label={t("galeria.prevImage")}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white/70 hover:text-white disabled:opacity-20 disabled:hover:bg-white/10 transition-all cursor-pointer"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={goNext}
                disabled={activeSlide === currentImages.length - 1}
                aria-label={t("galeria.nextImage")}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white/70 hover:text-white disabled:opacity-20 disabled:hover:bg-white/10 transition-all cursor-pointer"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Counter */}
            <span className="text-[var(--text-tertiary)] text-sm tracking-wider font-mono">
              {String(activeSlide + 1).padStart(2, "0")} / {String(currentImages.length).padStart(2, "0")}
            </span>

            {/* Thumbnails Strip — hidden on small screens */}
            <div className="hidden sm:flex items-center gap-2 overflow-x-auto scrollbar-hide flex-shrink-0 max-w-[40vw] pl-2 py-2">
              <AnimatePresence mode="popLayout">
                {currentImages.map((img, idx) => (
                  <motion.button
                    key={`${activeCategory}-${img.id || idx}`}
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 10 }}
                    transition={{
                      duration: 0.3,
                      delay: idx * 0.05,
                      ease: "easeOut"
                    }}
                    onClick={() => setActiveSlide(idx)}
                    className={cn(
                      "relative w-16 h-10 md:w-20 md:h-12 rounded-lg overflow-hidden flex-shrink-0 border-[1.5px] transition-all duration-300 cursor-pointer",
                      idx === activeSlide
                        ? "border-[var(--site-primary)] opacity-100 scale-110 shadow-lg"
                        : "border-transparent opacity-40 hover:opacity-100 grayscale-[0.3]"
                    )}
                  >
                    <img
                      src={img.url}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right: Fullscreen button */}
        <button
          onClick={() => setLightboxIndex(activeSlide)}
          aria-label={t("galeria.fullscreen")}
          className="w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-[var(--text-secondary)] hover:text-white transition-all cursor-pointer"
        >
          <Maximize2 size={18} />
        </button>
      </motion.div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          images={currentImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
