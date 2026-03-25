"use client";

import { useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { CotizadorTool } from "@/components/dashboard/cotizador/CotizadorTool";
import { ToastProvider } from "@/components/dashboard/Toast";
import { AuthContextProvider } from "@/hooks/useAuthContext";
import { useSiteProject } from "@/hooks/useSiteProject";
import type { ProjectForCotizador } from "@/types";

/* ── Modal Props ────────────────────────────────────────────────── */

interface AgentCotizadorModalProps {
  open: boolean;
  onClose: () => void;
}

export function AgentCotizadorModal({ open, onClose }: AgentCotizadorModalProps) {
  const proyecto = useSiteProject();

  // Map ProyectoCompleto → ProjectForCotizador
  const projectForCotizador: ProjectForCotizador = useMemo(
    () => ({
      id: proyecto.id,
      nombre: proyecto.nombre,
      cotizador_enabled: true, // Agent mode always enables
      cotizador_config: proyecto.cotizador_config,
      color_primario: proyecto.color_primario,
      parqueaderos_mode: proyecto.parqueaderos_mode ?? "sin_inventario",
      depositos_mode: proyecto.depositos_mode ?? "sin_inventario",
      parqueaderos_precio_base: proyecto.parqueaderos_precio_base,
      depositos_precio_base: proyecto.depositos_precio_base,
      precio_source: proyecto.precio_source ?? "unidad",
      tipologia_mode: proyecto.tipologia_mode ?? "fija",
      tipologia_fields: proyecto.tipologia_fields,
      habilitar_extra_jacuzzi: proyecto.habilitar_extra_jacuzzi,
      habilitar_extra_piscina: proyecto.habilitar_extra_piscina,
      habilitar_extra_bbq: proyecto.habilitar_extra_bbq,
      habilitar_extra_terraza: proyecto.habilitar_extra_terraza,
      habilitar_extra_jardin: proyecto.habilitar_extra_jardin,
      habilitar_extra_cuarto_servicio: proyecto.habilitar_extra_cuarto_servicio,
      habilitar_extra_estudio: proyecto.habilitar_extra_estudio,
      habilitar_extra_chimenea: proyecto.habilitar_extra_chimenea,
      habilitar_extra_doble_altura: proyecto.habilitar_extra_doble_altura,
      habilitar_extra_rooftop: proyecto.habilitar_extra_rooftop,
    }),
    [proyecto]
  );

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[180] flex items-center justify-center"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Fullscreen-ish modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-[96vw] h-[92vh] max-w-7xl bg-[var(--surface-0)] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
              <div>
                <h2 className="text-base font-heading text-white/90">
                  Cotizador — {proyecto.nombre}
                </h2>
                <p className="text-xs font-mono text-white/40 mt-0.5">
                  Modo Agente
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content — scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <ToastProvider>
                <AuthContextProvider>
                  <CotizadorTool
                    project={projectForCotizador}
                    tipologias={proyecto.tipologias}
                    unidadTipologias={proyecto.unidad_tipologias}
                  />
                </AuthContextProvider>
              </ToastProvider>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
