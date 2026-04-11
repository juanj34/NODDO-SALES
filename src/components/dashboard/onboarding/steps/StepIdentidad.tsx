"use client";

import { Globe, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface StepIdentidadProps {
  nombre: string;
  onNombreChange: (v: string) => void;
  slug: string;
  onSlugChange: (v: string) => void;
  slugAvailable: boolean | null;
  checkingSlug: boolean;
}

export default function StepIdentidad({
  nombre,
  onNombreChange,
  slug,
  onSlugChange,
  slugAvailable,
  checkingSlug,
}: StepIdentidadProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Nombre del proyecto */}
      <div className="flex flex-col gap-2">
        <label className="font-ui text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
          Nombre del proyecto
        </label>
        <input
          autoFocus
          type="text"
          value={nombre}
          onChange={(e) => onNombreChange(e.target.value)}
          placeholder="Ciudadela Los Pinos"
          className="input-glass w-full"
        />
      </div>

      {/* Slug */}
      <div className="flex flex-col gap-2">
        <label className="font-ui text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
          URL del micrositio
        </label>
        <div className="relative">
          <Globe
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
          />
          <input
            type="text"
            value={slug}
            onChange={(e) => onSlugChange(e.target.value)}
            placeholder="mi-proyecto"
            className="input-glass w-full pl-10"
          />
        </div>

        {/* URL preview + availability */}
        <div
          className={cn(
            "flex items-center justify-between rounded-lg px-3.5 py-2.5",
            "bg-[var(--surface-1)] border border-[var(--border-subtle)]"
          )}
        >
          <span className="font-mono text-[11px] text-[var(--text-tertiary)]">
            {slug || "mi-proyecto"}
            <span className="text-[var(--text-muted)]">.noddo.io</span>
          </span>

          <AnimatePresence mode="wait">
            {checkingSlug ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="flex items-center gap-1.5"
              >
                <Loader2
                  size={13}
                  className="animate-spin text-[var(--text-muted)]"
                />
                <span className="font-mono text-[10px] text-[var(--text-muted)]">
                  Verificando...
                </span>
              </motion.div>
            ) : slugAvailable === true ? (
              <motion.div
                key="available"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="flex items-center gap-1.5"
              >
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span className="font-mono text-[10px] text-emerald-400">
                  Disponible
                </span>
              </motion.div>
            ) : slugAvailable === false ? (
              <motion.div
                key="unavailable"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="flex items-center gap-1.5"
              >
                <XCircle size={13} className="text-red-400" />
                <span className="font-mono text-[10px] text-red-400">
                  No disponible
                </span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
