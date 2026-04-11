"use client";

import { Layers, Package, Lock, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepConfigPreciosProps {
  precioSource: "unidad" | "tipologia";
  onPrecioSourceChange: (v: "unidad" | "tipologia") => void;
  moneda: string;
  onMonedaChange: (v: string) => void;
  unidadMedida: "m2" | "sqft";
  onUnidadMedidaChange: (v: "m2" | "sqft") => void;
  tipologiaMode: "fija" | "multiple";
  onTipologiaModeChange: (v: "fija" | "multiple") => void;
}

const PRECIO_OPTIONS: {
  key: StepConfigPreciosProps["precioSource"];
  label: string;
  desc: string;
  icon: typeof Layers;
}[] = [
  {
    key: "tipologia",
    label: "Por tipología",
    desc: "Todas las unidades de una tipología comparten el mismo precio",
    icon: Layers,
  },
  {
    key: "unidad",
    label: "Por unidad",
    desc: "Cada unidad tiene su propio precio individual",
    icon: Package,
  },
];

const MONEDAS = ["COP", "USD", "EUR", "MXN", "AED"];

const UNIDADES: { key: StepConfigPreciosProps["unidadMedida"]; label: string }[] = [
  { key: "m2", label: "m\u00B2" },
  { key: "sqft", label: "sqft" },
];

const TIPOLOGIA_MODE_OPTIONS: {
  key: "fija" | "multiple";
  label: string;
  desc: string;
  icon: typeof Lock;
}[] = [
  {
    key: "fija",
    label: "Fija",
    desc: "Cada unidad tiene una sola tipología asignada",
    icon: Lock,
  },
  {
    key: "multiple",
    label: "Múltiple",
    desc: "Una unidad puede tener varias tipologías compatibles",
    icon: Shuffle,
  },
];

export default function StepConfigPrecios({
  precioSource,
  onPrecioSourceChange,
  moneda,
  onMonedaChange,
  unidadMedida,
  onUnidadMedidaChange,
  tipologiaMode,
  onTipologiaModeChange,
}: StepConfigPreciosProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Precio source */}
      <div className="flex flex-col gap-2">
        <label className="font-ui text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
          Precio por
        </label>
        <div className="grid grid-cols-2 gap-3">
          {PRECIO_OPTIONS.map(({ key, label, desc, icon: Icon }) => {
            const active = precioSource === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onPrecioSourceChange(key)}
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
                  <Icon
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
                  <span className="text-sm font-medium text-white">
                    {label}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--text-muted)]">
                    {desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Moneda */}
      <div className="flex flex-col gap-2">
        <label className="font-ui text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
          Moneda
        </label>
        <div className="flex flex-wrap gap-2">
          {MONEDAS.map((code) => {
            const active = moneda === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => onMonedaChange(code)}
                className={cn(
                  "rounded-lg px-4 py-2 font-mono text-xs font-medium transition-colors",
                  active
                    ? "bg-[var(--noddo-primary)] text-[#141414]"
                    : "bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-default)]"
                )}
              >
                {code}
              </button>
            );
          })}
        </div>
      </div>

      {/* Unidad de medida */}
      <div className="flex flex-col gap-2">
        <label className="font-ui text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
          Unidad de medida
        </label>
        <div className="flex gap-2">
          {UNIDADES.map(({ key, label }) => {
            const active = unidadMedida === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onUnidadMedidaChange(key)}
                className={cn(
                  "rounded-lg px-4 py-2 font-mono text-xs font-medium transition-colors",
                  active
                    ? "bg-[var(--noddo-primary)] text-[#141414]"
                    : "bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-default)]"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modo de tipología */}
      <div className="flex flex-col gap-2">
        <label className="font-ui text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
          Modo de tipología
        </label>
        <div className="grid grid-cols-2 gap-3">
          {TIPOLOGIA_MODE_OPTIONS.map(({ key, label, desc, icon: Icon }) => {
            const active = tipologiaMode === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onTipologiaModeChange(key)}
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
                  <Icon
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
    </div>
  );
}
