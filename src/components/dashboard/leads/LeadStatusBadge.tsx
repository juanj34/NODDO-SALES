"use client";

import { cn } from "@/lib/utils";

export const STATUS_CONFIG: Record<
  string,
  { label: string; labelEn: string; dot: string; bg: string }
> = {
  nuevo: {
    label: "Nuevo",
    labelEn: "New",
    dot: "bg-blue-400",
    bg: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  },
  contactado: {
    label: "Contactado",
    labelEn: "Contacted",
    dot: "bg-amber-400",
    bg: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  },
  calificado: {
    label: "Calificado",
    labelEn: "Qualified",
    dot: "bg-emerald-400",
    bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  },
  cerrado: {
    label: "Cerrado",
    labelEn: "Closed",
    dot: "bg-[var(--text-muted)]",
    bg: "bg-white/5 text-[var(--text-muted)] border-white/10",
  },
};

interface Props {
  status: string;
  locale: string;
  size?: "sm" | "md";
}

export function LeadStatusBadge({ status, locale, size = "md" }: Props) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.nuevo;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg font-bold uppercase tracking-wider border",
        cfg.bg,
        size === "sm"
          ? "px-1.5 py-0.5 text-[9px]"
          : "px-2 py-1 text-[10px]"
      )}
    >
      <span
        className={cn(
          "rounded-full",
          cfg.dot,
          size === "sm" ? "w-1 h-1" : "w-1.5 h-1.5"
        )}
      />
      {locale === "es" ? cfg.label : cfg.labelEn}
    </span>
  );
}
