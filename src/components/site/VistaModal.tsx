"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { X, Compass, Building2 } from "lucide-react";
import { useEffect, useCallback } from "react";

interface VistaPiso {
  nombre: string;
  imagen_url: string;
  orientacion?: string | null;
  descripcion?: string | null;
  piso_min: number | null;
  piso_max: number | null;
}

interface VistaModalProps {
  vista: VistaPiso;
  onClose: () => void;
}

export default function VistaModal({ vista, onClose }: VistaModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const floorLabel =
    vista.piso_min !== null && vista.piso_max !== null
      ? vista.piso_min === vista.piso_max
        ? `Piso ${vista.piso_min}`
        : `Pisos ${vista.piso_min}–${vista.piso_max}`
      : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 backdrop-blur-md" style={{ background: "rgba(var(--overlay-rgb), 0.7)" }} />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="relative max-w-[90vw] max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <Image src={vista.imagen_url} alt="" width={400} height={300} className="block max-w-[90vw] max-h-[85vh] object-contain" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full backdrop-blur-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          style={{ background: "rgba(var(--overlay-rgb), 0.5)" }}
        >
          <X size={18} />
        </button>

        {/* Bottom overlay with info */}
        <div
          className="absolute bottom-0 left-0 right-0 px-5 pb-4 pt-12"
          style={{ background: "linear-gradient(to top, rgba(var(--overlay-rgb), 0.8), rgba(var(--overlay-rgb), 0.4) 50%, transparent)" }}
        >
          <h3
            className="text-lg text-[var(--text-primary)] font-heading font-light"
          >
            {vista.nombre}
          </h3>
          <div className="flex items-center gap-3 mt-1.5">
            {vista.orientacion && (
              <span className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                <Compass size={11} />
                {vista.orientacion}
              </span>
            )}
            {floorLabel && (
              <span className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                <Building2 size={11} />
                {floorLabel}
              </span>
            )}
          </div>
          {vista.descripcion && (
            <p className="text-xs text-[var(--text-tertiary)] mt-1.5 max-w-lg">{vista.descripcion}</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
