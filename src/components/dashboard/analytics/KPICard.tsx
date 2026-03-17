"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Icon } from "@/components/ui";
import { fontSize, gap, padding, letterSpacing } from "@/lib/design-tokens";

interface Props {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number | null;
  suffix?: string;
}

export function KPICard({ label, value, icon, trend, suffix }: Props) {
  return (
    <div className={cn("bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] flex flex-col", padding.comfortable, gap.relaxed)}>
      <div className="flex items-center justify-between">
        <span className={cn("font-ui font-bold uppercase text-[var(--text-muted)]", fontSize.label, letterSpacing.wider)}>
          {label}
        </span>
        <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-tertiary)]">
          {icon}
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className={cn("font-heading font-light text-white leading-none", fontSize.hero)}>
          {typeof value === "number" ? value.toLocaleString("es-CO") : value}
        </span>
        {suffix && (
          <span className={cn("text-[var(--text-muted)] mb-1", fontSize.md)}>{suffix}</span>
        )}
      </div>
      {trend !== undefined && trend !== null && (
        <div className="flex items-center gap-1">
          {trend >= 0 ? (
            <Icon icon={TrendingUp} size="xs" className="text-green-400" />
          ) : (
            <Icon icon={TrendingDown} size="xs" className="text-red-400" />
          )}
          <span
            className={cn(
              "font-medium",
              fontSize.body,
              trend >= 0 ? "text-green-400" : "text-red-400"
            )}
          >
            {trend >= 0 ? "+" : ""}{trend.toFixed(1)}%
          </span>
          <span className={cn("text-[var(--text-muted)]", fontSize.body)}>vs periodo anterior</span>
        </div>
      )}
    </div>
  );
}
