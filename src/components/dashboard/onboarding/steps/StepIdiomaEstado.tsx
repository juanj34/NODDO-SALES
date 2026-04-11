"use client";

import { Globe, HardHat, CheckCircle, Ruler } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIdiomaEstadoProps {
  idioma: "es" | "en";
  onIdiomaChange: (v: "es" | "en") => void;
  estadoConstruccion: "sobre_planos" | "en_construccion" | "entregado";
  onEstadoConstruccionChange: (v: "sobre_planos" | "en_construccion" | "entregado") => void;
}

const IDIOMA_OPTIONS: {
  key: "es" | "en";
  label: string;
  desc: string;
}[] = [
  { key: "es", label: "Español", desc: "El micrositio se mostrará en español" },
  { key: "en", label: "English", desc: "The microsite will be displayed in English" },
];

const ESTADO_OPTIONS: {
  key: "sobre_planos" | "en_construccion" | "entregado";
  label: string;
  desc: string;
  icon: typeof HardHat;
}[] = [
  {
    key: "sobre_planos",
    label: "Sobre planos",
    desc: "El proyecto aún no ha iniciado construcción",
    icon: Ruler,
  },
  {
    key: "en_construccion",
    label: "En construcción",
    desc: "El proyecto está activamente en obra",
    icon: HardHat,
  },
  {
    key: "entregado",
    label: "Entregado",
    desc: "Unidades listas para entrega inmediata",
    icon: CheckCircle,
  },
];

export default function StepIdiomaEstado({
  idioma,
  onIdiomaChange,
  estadoConstruccion,
  onEstadoConstruccionChange,
}: StepIdiomaEstadoProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Idioma */}
      <div className="flex flex-col gap-2">
        <label className="font-ui text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
          Idioma del micrositio
        </label>
        <div className="grid grid-cols-2 gap-3">
          {IDIOMA_OPTIONS.map(({ key, label, desc }) => {
            const active = idioma === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onIdiomaChange(key)}
                className={cn(
                  "flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                  active
                    ? "bg-[rgba(var(--noddo-primary-rgb),0.08)] border-[rgba(var(--noddo-primary-rgb),0.3)]"
                    : "bg-[var(--surface-1)] border-[var(--border-subtle)] hover:border-[var(--border-default)]"
                )}
              >
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-lg transition-colors",
                    active
                      ? "bg-[rgba(var(--noddo-primary-rgb),0.1)]"
                      : "bg-[var(--surface-3)]"
                  )}
                >
                  <Globe
                    size={22}
                    className={cn(
                      "transition-colors",
                      active
                        ? "text-[var(--noddo-primary)]"
                        : "text-[var(--text-tertiary)]"
                    )}
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-white">{label}</span>
                  <span className="font-mono text-[10px] text-[var(--text-muted)]">
                    {desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Estado de construcción */}
      <div className="flex flex-col gap-2">
        <label className="font-ui text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
          Estado de construcción
        </label>
        <div className="grid grid-cols-3 gap-3">
          {ESTADO_OPTIONS.map(({ key, label, desc, icon: Icon }) => {
            const active = estadoConstruccion === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onEstadoConstruccionChange(key)}
                className={cn(
                  "flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                  active
                    ? "bg-[rgba(var(--noddo-primary-rgb),0.08)] border-[rgba(var(--noddo-primary-rgb),0.3)]"
                    : "bg-[var(--surface-1)] border-[var(--border-subtle)] hover:border-[var(--border-default)]"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                    active
                      ? "bg-[rgba(var(--noddo-primary-rgb),0.1)]"
                      : "bg-[var(--surface-3)]"
                  )}
                >
                  <Icon
                    size={18}
                    className={cn(
                      "transition-colors",
                      active
                        ? "text-[var(--noddo-primary)]"
                        : "text-[var(--text-tertiary)]"
                    )}
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-white">{label}</span>
                  <span className="font-mono text-[10px] text-[var(--text-muted)]">
                    {desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
