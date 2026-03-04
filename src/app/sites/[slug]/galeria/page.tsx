"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSiteProject } from "@/hooks/useSiteProject";
import { Lightbox } from "@/components/site/Lightbox";
import { SectionTransition } from "@/components/site/SectionTransition";
import { cn } from "@/lib/utils";
import type { GaleriaImagen } from "@/types";

export default function GaleriaPage() {
  const proyecto = useSiteProject();
  const categorias = proyecto.galeria_categorias;

  const [activeCategory, setActiveCategory] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const currentImages: GaleriaImagen[] =
    categorias[activeCategory]?.imagenes ?? [];

  return (
    <SectionTransition className="h-screen flex flex-col pt-8 lg:pt-12">
      {/* Title */}
      <div className="px-8 lg:px-16 mb-6">
        <p className="text-xs tracking-[0.4em] text-[var(--site-primary)] uppercase mb-2">
          Galería
        </p>
        <h2 className="text-2xl lg:text-4xl font-light tracking-wider">
          Explora el Proyecto
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 px-8 lg:px-16 mb-8">
        {categorias.map((cat, idx) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(idx)}
            className={cn(
              "relative pb-2 text-xs tracking-[0.3em] uppercase transition-colors whitespace-nowrap",
              idx === activeCategory
                ? "text-[var(--site-primary)]"
                : "text-white/40 hover:text-white/70"
            )}
          >
            {cat.nombre}
            {idx === activeCategory && (
              <motion.div
                layoutId="gallery-tab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--site-primary)] rounded-full"
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Image slider */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-8 lg:px-16 pb-4 scrollbar-hide h-full items-center">
              {currentImages.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setLightboxIndex(idx)}
                  className="snap-center flex-shrink-0 w-[70vw] lg:w-[45vw] aspect-video rounded-2xl overflow-hidden group"
                >
                  <img
                    src={img.url}
                    alt={img.alt_text ?? ""}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Counter */}
      <div className="px-8 lg:px-16 pb-8 text-right text-white/40 text-sm tracking-wider">
        {currentImages.length} imágenes
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          images={currentImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </SectionTransition>
  );
}
