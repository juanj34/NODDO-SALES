"use client";

import { motion, AnimatePresence } from "framer-motion";
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
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

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
        <img
          src={vista.imagen_url}
          alt={vista.nombre}
          className="block max-w-[90vw] max-h-[85vh] object-contain"
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/70 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Bottom overlay with info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-5 pb-4 pt-12">
          <h3
            className="text-lg text-white/95 font-light"
            style={{ fontFamily: "var(--font-heading, 'Cormorant Garamond', serif)" }}
          >
            {vista.nombre}
          </h3>
          <div className="flex items-center gap-3 mt-1.5">
            {vista.orientacion && (
              <span className="inline-flex items-center gap-1 text-xs text-white/70">
                <Compass size={11} />
                {vista.orientacion}
              </span>
            )}
            {floorLabel && (
              <span className="inline-flex items-center gap-1 text-xs text-white/70">
                <Building2 size={11} />
                {floorLabel}
              </span>
            )}
          </div>
          {vista.descripcion && (
            <p className="text-xs text-white/50 mt-1.5 max-w-lg">{vista.descripcion}</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
