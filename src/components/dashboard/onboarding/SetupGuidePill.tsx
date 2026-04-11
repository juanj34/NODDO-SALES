"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Rocket,
  Check,
  Building2,
  Layers,
  Package,
  Image as ImageIcon,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SetupStep {
  id: string;
  label: string;
  labelEn: string;
  icon: React.ReactNode;
  href: string;
  isComplete: boolean;
}

interface SetupGuidePillProps {
  projectId: string;
  basePath: string;
  locale: string;
  badges: {
    torres: number;
    tipologias: number;
    inventario: number;
    galeria: number;
  };
  hasUbicacion: boolean;
}

const CIRCUMFERENCE = 2 * Math.PI * 6;

function ProgressRing({ progress }: { progress: number }) {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" className="shrink-0 -rotate-90">
      <circle
        cx={8}
        cy={8}
        r={6}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={2}
      />
      <motion.circle
        cx={8}
        cy={8}
        r={6}
        fill="none"
        stroke="var(--noddo-primary)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        initial={{ strokeDashoffset: CIRCUMFERENCE }}
        animate={{ strokeDashoffset: CIRCUMFERENCE * (1 - progress) }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </svg>
  );
}

export function SetupGuidePill({
  projectId,
  basePath,
  locale,
  badges,
  hasUbicacion,
}: SetupGuidePillProps) {
  const storageKey = `noddo_setup_guide_${projectId}`;
  const pillRef = useRef<HTMLDivElement>(null);

  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(storageKey) === "dismissed";
  });

  const [open, setOpen] = useState(false);

  const steps = useMemo<SetupStep[]>(
    () => [
      {
        id: "torres",
        label: "Crear torre o urbanismo",
        labelEn: "Create tower or development",
        icon: <Building2 size={14} />,
        href: `${basePath}/torres`,
        isComplete: badges.torres > 0,
      },
      {
        id: "tipologias",
        label: "Crear tipologías",
        labelEn: "Create unit types",
        icon: <Layers size={14} />,
        href: `${basePath}/tipologias`,
        isComplete: badges.tipologias > 0,
      },
      {
        id: "inventario",
        label: "Agregar inventario",
        labelEn: "Add inventory",
        icon: <Package size={14} />,
        href: `${basePath}/inventario`,
        isComplete: badges.inventario > 0,
      },
      {
        id: "galeria",
        label: "Subir galería de imágenes",
        labelEn: "Upload image gallery",
        icon: <ImageIcon size={14} />,
        href: `${basePath}/galeria`,
        isComplete: badges.galeria > 0,
      },
      {
        id: "ubicacion",
        label: "Configurar ubicación",
        labelEn: "Configure location",
        icon: <MapPin size={14} />,
        href: `${basePath}/ubicacion`,
        isComplete: hasUbicacion,
      },
    ],
    [basePath, badges, hasUbicacion]
  );

  const completedCount = steps.filter((s) => s.isComplete).length;
  const allComplete = completedCount === steps.length;
  const currentStep = steps.find((s) => !s.isComplete);
  const progress = completedCount / steps.length;
  const isEs = locale !== "en";

  // Auto-dismiss when all steps complete
  useEffect(() => {
    if (allComplete && !dismissed) {
      localStorage.setItem(storageKey, "dismissed");
      setDismissed(true);
    }
  }, [allComplete, dismissed, storageKey]);

  // Outside-click handler
  useEffect(() => {
    if (!open) return;
    function handleMouseDown(e: MouseEvent) {
      if (pillRef.current && !pillRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(storageKey, "dismissed");
    setDismissed(true);
    setOpen(false);
  }, [storageKey]);

  if (dismissed || allComplete) return null;

  return (
    <div ref={pillRef} className="relative">
      {/* Pill button */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all",
          "bg-[var(--surface-2)] border-[var(--border-default)]",
          "hover:border-[rgba(var(--noddo-primary-rgb),0.4)] hover:bg-[var(--surface-3)]",
          open && "border-[rgba(var(--noddo-primary-rgb),0.4)] bg-[var(--surface-3)]"
        )}
      >
        <Rocket size={12} className="text-[var(--noddo-primary)] shrink-0" />
        <span className="font-ui text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-secondary)] hidden sm:inline">
          Setup
        </span>
        <ProgressRing progress={progress} />
        <span className="font-mono text-[10px] text-[var(--text-muted)]">
          {completedCount}/{steps.length}
        </span>
      </button>

      {/* Popover dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-72 z-50 rounded-xl border border-[var(--border-default)] bg-[rgba(26,26,29,0.95)] backdrop-blur-xl shadow-2xl"
          >
            {/* Header */}
            <div className="px-4 pt-3.5 pb-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-md bg-[rgba(var(--noddo-primary-rgb),0.12)] flex items-center justify-center">
                  <Rocket size={10} className="text-[var(--noddo-primary)]" />
                </div>
                <p className="font-ui text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
                  {isEs ? "Configura tu proyecto" : "Set up your project"}
                </p>
              </div>
              {/* Linear progress bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-[var(--noddo-primary)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </div>
                <span className="font-mono text-[9px] text-[var(--text-muted)] shrink-0">
                  {completedCount}/{steps.length}
                </span>
              </div>
            </div>

            {/* Steps list */}
            <div className="px-3 pb-2 space-y-0.5">
              {steps.map((step, i) => {
                const isCurrent = currentStep?.id === step.id;
                return (
                  <Link
                    key={step.id}
                    href={step.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-left",
                      step.isComplete
                        ? "opacity-50"
                        : isCurrent
                          ? "bg-[rgba(var(--noddo-primary-rgb),0.08)]"
                          : "hover:bg-white/[0.03]"
                    )}
                  >
                    {/* Step indicator */}
                    <div
                      className={cn(
                        "w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-[10px] font-bold",
                        step.isComplete
                          ? "bg-[var(--noddo-primary)] text-[#141414]"
                          : isCurrent
                            ? "border border-[var(--noddo-primary)] text-[var(--noddo-primary)]"
                            : "border border-[var(--border-default)] text-[var(--text-muted)]"
                      )}
                    >
                      {step.isComplete ? (
                        <Check size={10} strokeWidth={3} />
                      ) : (
                        <span className="font-mono">{i + 1}</span>
                      )}
                    </div>
                    {/* Label */}
                    <span
                      className={cn(
                        "font-mono text-[11px] leading-tight",
                        step.isComplete
                          ? "text-[var(--text-muted)] line-through"
                          : isCurrent
                            ? "text-[var(--text-primary)]"
                            : "text-[var(--text-tertiary)]"
                      )}
                    >
                      {isEs ? step.label : step.labelEn}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Dismiss */}
            <div className="px-3 pb-3 pt-1 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={handleDismiss}
                className="w-full text-center font-mono text-[9px] text-[var(--text-muted)] hover:text-[var(--text-tertiary)] transition-colors py-1.5"
              >
                {isEs ? "Ocultar guía" : "Hide guide"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
