"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useSiteProject } from "@/hooks/useSiteProject";

export default function SiteLanding() {
  const proyecto = useSiteProject();
  const slug = proyecto.slug;

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Background image */}
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        <img
          src={proyecto.render_principal_url || ""}
          alt={proyecto.nombre}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-start justify-center px-12 lg:px-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          {proyecto.constructora_nombre && (
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-xs tracking-[0.4em] text-[var(--site-primary)] mb-4 uppercase"
            >
              {proyecto.constructora_nombre}
            </motion.p>
          )}

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="text-5xl lg:text-7xl font-extralight tracking-wider mb-6"
          >
            {proyecto.nombre.toUpperCase()}
          </motion.h1>

          {proyecto.descripcion && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="text-white/50 text-lg font-light max-w-xl mb-10 leading-relaxed"
            >
              {proyecto.descripcion}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
          >
            <Link
              href={`/sites/${slug}/galeria`}
              className="group inline-flex items-center gap-3 border border-[var(--site-primary)] text-[var(--site-primary)] px-8 py-4 text-sm tracking-[0.3em] hover:bg-[var(--site-primary)] hover:text-black transition-all duration-500"
            >
              EXPLORAR
              <ChevronRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom gradient for disclaimer space */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[var(--site-bg)] to-transparent" />
    </div>
  );
}
