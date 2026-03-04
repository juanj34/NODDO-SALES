"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Lightbox } from "@/components/site/Lightbox";
import { SectionTransition } from "@/components/site/SectionTransition";
import { ArrowLeft } from "lucide-react";
import { useSiteProject } from "@/hooks/useSiteProject";

export default function GaleriaCategoria() {
  const proyecto = useSiteProject();
  const pathname = usePathname();
  const slug = proyecto.slug;
  const categoriaSlug = pathname.split("/")[4];
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const categoria = proyecto.galeria_categorias.find(
    (c) => c.slug === categoriaSlug
  );

  if (!categoria || !categoria.imagenes) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-white/50">Categoría no encontrada</p>
      </div>
    );
  }

  const images = categoria.imagenes;

  return (
    <SectionTransition className="min-h-screen px-8 lg:px-16 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href={`/sites/${slug}/galeria`}
          className="w-10 h-10 flex items-center justify-center rounded-full border border-white/10 hover:border-[var(--site-primary)] text-white/40 hover:text-[var(--site-primary)] transition-all"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <p className="text-xs tracking-[0.4em] text-[var(--site-primary)] uppercase">
            Galería
          </p>
          <h2 className="text-xl font-light tracking-wider">
            {categoria.nombre}
          </h2>
        </div>
      </div>

      {/* Image grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {images.map((img, idx) => (
          <motion.button
            key={img.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            onClick={() => setLightboxIndex(idx)}
            className="group relative aspect-video overflow-hidden rounded-lg cursor-pointer"
          >
            <img
              src={img.thumbnail_url || img.url}
              alt={img.alt_text || ""}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
          </motion.button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </SectionTransition>
  );
}
