"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, AlertCircle, Cloud } from "lucide-react";
import type { AutoSaveStatus } from "@/hooks/useAutoSave";
import { cn } from "@/lib/utils";

interface AutoSaveIndicatorProps {
  status: AutoSaveStatus;
  className?: string;
}

/**
 * Discrete auto-save status indicator.
 * Shows in the top-right of the editor.
 */
export function AutoSaveIndicator({ status, className }: AutoSaveIndicatorProps) {
  const config = {
    idle: {
      icon: null,
      text: "",
      show: false,
    },
    saving: {
      icon: Loader2,
      text: "Guardando...",
      show: true,
      iconClassName: "animate-spin text-[var(--text-muted)]",
      textClassName: "text-[var(--text-muted)]",
    },
    saved: {
      icon: Check,
      text: "Guardado",
      show: true,
      iconClassName: "text-[var(--site-primary)]",
      textClassName: "text-[var(--site-primary)]",
    },
    error: {
      icon: AlertCircle,
      text: "Error al guardar",
      show: true,
      iconClassName: "text-red-400",
      textClassName: "text-red-400",
    },
  };

  const current = config[status];
  const Icon = current.icon;

  return (
    <AnimatePresence mode="wait">
      {current.show && Icon && (
        <motion.div
          key={status}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]",
            className
          )}
        >
          <Icon size={12} className={current.iconClassName} />
          <span className={cn("text-[10px] font-medium", current.textClassName)}>
            {current.text}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Floating auto-save indicator that sticks to the top-right.
 * Use this for full-screen editors.
 */
export function FloatingAutoSaveIndicator({ status }: { status: AutoSaveStatus }) {
  return (
    <div className="fixed top-4 right-4 z-50">
      <AutoSaveIndicator status={status} />
    </div>
  );
}
