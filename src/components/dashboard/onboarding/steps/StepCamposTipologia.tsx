"use client";

import {
  Maximize,
  Ruler,
  Home,
  LandPlot,
  Palmtree,
  BedDouble,
  Bath,
  Car,
  Package,
  DollarSign,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TipologiaFieldsConfig } from "@/types";
import type { LucideIcon } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface StepCamposTipologiaProps {
  fields: TipologiaFieldsConfig;
  onChange: (fields: TipologiaFieldsConfig) => void;
  tipoProyecto: "apartamentos" | "casas" | "lotes" | "hibrido";
  onReset: () => void;
}

/* ------------------------------------------------------------------ */
/*  Field definitions grouped by category                              */
/* ------------------------------------------------------------------ */

interface FieldDef {
  key: keyof TipologiaFieldsConfig;
  label: string;
  icon: LucideIcon;
}

interface CategoryDef {
  title: string;
  fields: FieldDef[];
}

const CATEGORIES: CategoryDef[] = [
  {
    title: "Dimensiones",
    fields: [
      { key: "area_m2", label: "Área total", icon: Maximize },
      { key: "area_construida", label: "Área construida", icon: Ruler },
      { key: "area_privada", label: "Área privada", icon: Home },
      { key: "area_lote", label: "Área lote", icon: LandPlot },
      { key: "area_balcon", label: "Balcón", icon: Palmtree },
    ],
  },
  {
    title: "Espacios",
    fields: [
      { key: "habitaciones", label: "Habitaciones", icon: BedDouble },
      { key: "banos", label: "Baños", icon: Bath },
      { key: "parqueaderos", label: "Parqueaderos", icon: Car },
      { key: "depositos", label: "Depósitos", icon: Package },
    ],
  },
  {
    title: "Financiero",
    fields: [{ key: "precio", label: "Precio", icon: DollarSign }],
  },
];

/* ------------------------------------------------------------------ */
/*  Toggle switch                                                      */
/* ------------------------------------------------------------------ */

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-[18px] w-[32px] shrink-0 cursor-pointer rounded-full transition-colors duration-200",
        checked
          ? "bg-[var(--noddo-primary)]"
          : "bg-[var(--surface-3)]"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-[14px] w-[14px] rounded-full bg-white shadow-sm transition-transform duration-200",
          "absolute top-[2px]",
          checked ? "translate-x-[16px]" : "translate-x-[2px]"
        )}
      />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function StepCamposTipologia({
  fields,
  onChange,
  onReset,
}: StepCamposTipologiaProps) {
  function handleToggle(key: keyof TipologiaFieldsConfig, value: boolean) {
    onChange({ ...fields, [key]: value });
  }

  return (
    <div className="flex flex-col gap-5">
      {CATEGORIES.map((cat) => (
        <div key={cat.title} className="flex flex-col gap-1.5">
          {/* Category header */}
          <span className="font-ui text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)] mb-1">
            {cat.title}
          </span>

          {/* Field rows */}
          <div className="flex flex-col gap-0.5">
            {cat.fields.map(({ key, label, icon: Icon }) => (
              <div
                key={key}
                className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-[var(--surface-1)]"
              >
                {/* Icon + label */}
                <div className="flex items-center gap-3">
                  <Icon
                    size={16}
                    className={cn(
                      "shrink-0 transition-colors",
                      fields[key]
                        ? "text-[var(--noddo-primary)]"
                        : "text-[var(--text-tertiary)]"
                    )}
                  />
                  <span className="text-[13px] text-[var(--text-primary)]">
                    {label}
                  </span>
                </div>

                {/* Toggle */}
                <Toggle
                  checked={fields[key]}
                  onChange={(v) => handleToggle(key, v)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Reset button */}
      <button
        type="button"
        onClick={onReset}
        className="flex items-center justify-center gap-1.5 self-center rounded-lg px-3 py-1.5 text-[11px] text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-1)] hover:text-[var(--text-secondary)]"
      >
        <RotateCcw size={12} />
        <span>Restablecer</span>
      </button>
    </div>
  );
}
