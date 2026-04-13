"use client";

import Image from "next/image";
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSiteProject } from "@/hooks/useSiteProject";
import { Lightbox } from "@/components/site/Lightbox";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { SiteEmptyState } from "@/components/site/SiteEmptyState";
import type { GaleriaCategoria, GaleriaImagen } from "@/types";
import { useTranslation } from "@/i18n";
import { useSectionVisibility } from "@/hooks/useSectionVisibility";

interface GalleryScope {
  id: string;
  label: string;
  categories: GaleriaCategoria[];
}

export default function GaleriaPage() {
  const sectionVisible = useSectionVisibility("galeria");
  const proyecto = useSiteProject();
  if (!sectionVisible) return null;
  const categorias = proyecto.galeria_categorias || [];
  const grupos = proyecto.galeria_grupos || [];
  const { t } = useTranslation("site");

  // Compute scope structure from galeria_grupos
  const flatCats = categorias.filter((c) => !c.galeria_grupo_id);

  const grupoCatMap = new Map<string, GaleriaCategoria[]>();
  categorias.forEach((cat) => {
    if (cat.galeria_grupo_id) {
      const existing = grupoCatMap.get(cat.galeria_grupo_id) || [];
      existing.push(cat);
      grupoCatMap.set(cat.galeria_grupo_id, existing);
    }
  });

  const scopes: GalleryScope[] = [];
  const gruposWithCats = grupos.filter((g) => grupoCatMap.has(g.id));

  if (gruposWithCats.length > 0) {
    if (flatCats.length > 0) {
      scopes.push({ id: "general", label: t("galeria.general"), categories: flatCats });
    }
    gruposWithCats.forEach((grupo) => {
      scopes.push({ id: grupo.id, label: grupo.nombre, categories: grupoCatMap.get(grupo.id)! });
    });
  }

  const hasMultipleScopes = scopes.length > 1;

  const [activeScope, setActiveScope] = useState(0);
  const [activeCategory, setActiveCategory] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Current categories based on scope
  // No scopes = flat list of all categories; with scopes = filter by active scope
  const currentScopeCategories = scopes.length > 0
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
    <div className="h-screen w-full relative overflow-hidden" style={{ backgroundColor: "rgba(var(--overlay-rgb), 1)" }}>
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
            <Image src={current.url} alt="" fill sizes="100vw" priority className="w-full h-full object-cover pointer-events-none" />
            {/* Dark gradient overlay for readability — stronger at top and bottom */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(var(--overlay-rgb), 0.6) 0%, rgba(var(--overlay-rgb), 0.15) 35%, rgba(var(--overlay-rgb), 0.1) 50%, rgba(var(--overlay-rgb), 0.8) 100%)" }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top glass strip — frosted backdrop behind tabs for readability on light images */}
      <div
        className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
        style={{
          height: hasMultipleScopes ? "8rem" : "6.5rem",
          background: "linear-gradient(to bottom, rgba(var(--overlay-rgb), 0.5), transparent)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          maskImage: "linear-gradient(to bottom, black 40%, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent)",
        }}
      />

      {/* Scope tabs — glass pill style for top-level groups */}
      {hasMultipleScopes && (
        <motion.div
          className="absolute top-20 left-4 lg:top-6 lg:left-10 z-20 flex items-center gap-2 lg:gap-2.5 overflow-x-auto scrollbar-hide max-w-[calc(100vw-2rem)] lg:max-w-none"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {scopes.map((scope, idx) => (
            <button
              key={scope.id}
              onClick={() => handleScopeChange(idx)}
              className={cn(
                "px-4 py-1.5 rounded-full text-[10px] tracking-[0.2em] uppercase font-bold transition-all duration-300 cursor-pointer whitespace-nowrap font-ui",
                idx === activeScope
                  ? "bg-[rgba(var(--site-primary-rgb),0.15)] text-[var(--site-primary)] ring-1 ring-[rgba(var(--site-primary-rgb),0.35)] shadow-[0_0_12px_rgba(var(--site-primary-rgb),0.12)] backdrop-blur-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/5 backdrop-blur-sm"
              )}
            >
              {scope.label}
            </button>
          ))}
        </motion.div>
      )}

      {/* Category tabs — elegant serif underline */}
      <motion.div
        className={cn(
          "absolute left-4 lg:left-10 z-20 flex items-center gap-5 lg:gap-7 overflow-x-auto scrollbar-hide max-w-[calc(100vw-2rem)] lg:max-w-none",
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
            style={{ textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}
            className={cn(
              "relative pb-2.5 text-sm lg:text-base font-site-heading tracking-wide transition-all duration-300 cursor-pointer whitespace-nowrap",
              idx === activeCategory
                ? "text-[var(--text-primary)]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            )}
          >
            {cat.nombre}
            {idx === activeCategory && (
              <motion.div
                layoutId="gallery-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-gradient-to-r from-[var(--site-primary)] to-[rgba(var(--site-primary-rgb),0.4)] shadow-[0_0_6px_rgba(var(--site-primary-rgb),0.3)]"
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
                className="font-site-heading text-xl sm:text-3xl lg:text-5xl tracking-wider text-[var(--text-primary)] mb-4"
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
                className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--glass-bg-hover)] hover:bg-[var(--glass-bg-hover)] backdrop-blur-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-20 disabled:hover:bg-[var(--glass-bg-hover)] transition-all cursor-pointer"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={goNext}
                disabled={activeSlide === currentImages.length - 1}
                aria-label={t("galeria.nextImage")}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--glass-bg-hover)] hover:bg-[var(--glass-bg-hover)] backdrop-blur-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-20 disabled:hover:bg-[var(--glass-bg-hover)] transition-all cursor-pointer"
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
                    <Image src={img.thumbnail_url || img.url} alt="" fill sizes="80px" className="w-full h-full object-cover" />
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
          className="w-11 h-11 flex items-center justify-center rounded-full bg-[var(--glass-bg-hover)] hover:bg-[var(--glass-bg-hover)] backdrop-blur-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
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
