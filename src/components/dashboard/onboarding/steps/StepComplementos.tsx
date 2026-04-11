"use client";

import { Ban, Package, PackageOpen, DollarSign, Car, Archive } from "lucide-react";
import { cn } from "@/lib/utils";

type ComplementoMode = "sin_inventario" | "inventario_incluido" | "inventario_separado" | "precio_base";

interface StepComplementosProps {
  parqueaderosMode: ComplementoMode;
  onParqueaderosModeChange: (v: ComplementoMode) => void;
  depositosMode: ComplementoMode;
  onDepositosModeChange: (v: ComplementoMode) => void;
}

const MODE_OPTIONS: {
  key: ComplementoMode;
  label: string;
  desc: string;
  icon: typeof Ban;
}[] = [
  {
    key: "sin_inventario",
    label: "Sin inventario",
    desc: "No se gestionan en la plataforma",
    icon: Ban,
  },
  {
    key: "inventario_incluido",
    label: "Inventario incluido",
    desc: "Vienen con la unidad, se asignan individualmente",
    icon: Package,
  },
  {
    key: "inventario_separado",
    label: "Inventario separado",
    desc: "Items independientes con precio y estado propio",
    icon: PackageOpen,
  },
  {
    key: "precio_base",
    label: "Precio base",
    desc: "Cantidad fija multiplicada por un precio base",
    icon: DollarSign,
  },
];

function ModeSelector({
  label,
  icon: SectionIcon,
  value,
  onChange,
}: {
  label: string;
  icon: typeof Car;
  value: ComplementoMode;
  onChange: (v: ComplementoMode) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <SectionIcon size={14} className="text-[var(--noddo-primary)]" />
        <label className="font-ui text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
          {label}
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {MODE_OPTIONS.map(({ key, label: optLabel, desc, icon: Icon }) => {
          const active = value === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={cn(
                "flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-colors",
                active
                  ? "bg-[rgba(var(--noddo-primary-rgb),0.08)] border-[rgba(var(--noddo-primary-rgb),0.3)]"
                  : "bg-[var(--surface-1)] border-[var(--border-subtle)] hover:border-[var(--border-default)]"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                  active
                    ? "bg-[rgba(var(--noddo-primary-rgb),0.1)]"
                    : "bg-[var(--surface-3)]"
                )}
              >
                <Icon
                  size={16}
                  className={cn(
                    "transition-colors",
                    active
                      ? "text-[var(--noddo-primary)]"
                      : "text-[var(--text-tertiary)]"
                  )}
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-white">{optLabel}</span>
                <span className="font-mono text-[9px] leading-tight text-[var(--text-muted)]">
                  {desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function StepComplementos({
  parqueaderosMode,
  onParqueaderosModeChange,
  depositosMode,
  onDepositosModeChange,
}: StepComplementosProps) {
  return (
    <div className="flex flex-col gap-6">
      <ModeSelector
        label="Parqueaderos"
        icon={Car}
        value={parqueaderosMode}
        onChange={onParqueaderosModeChange}
      />
      <ModeSelector
        label="Depósitos"
        icon={Archive}
        value={depositosMode}
        onChange={onDepositosModeChange}
      />
    </div>
  );
}
