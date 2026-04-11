"use client";

import { Building2, Home, MapPin, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepTipoProyectoProps {
  value: "apartamentos" | "casas" | "lotes" | "hibrido";
  onChange: (v: "apartamentos" | "casas" | "lotes" | "hibrido") => void;
}

const OPTIONS: {
  key: StepTipoProyectoProps["value"];
  label: string;
  desc: string;
  icon: typeof Building2;
}[] = [
  {
    key: "apartamentos",
    label: "Apartamentos",
    desc: "Edificio vertical con apartamentos",
    icon: Building2,
  },
  {
    key: "casas",
    label: "Casas",
    desc: "Desarrollo horizontal de casas",
    icon: Home,
  },
  {
    key: "lotes",
    label: "Lotes",
    desc: "Lotes para construcción",
    icon: MapPin,
  },
  {
    key: "hibrido",
    label: "Híbrido",
    desc: "Apartamentos, casas, lotes o locales comerciales",
    icon: Layers,
  },
];

export default function StepTipoProyecto({
  value,
  onChange,
}: StepTipoProyectoProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {OPTIONS.map(({ key, label, desc, icon: Icon }) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
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
  );
}
