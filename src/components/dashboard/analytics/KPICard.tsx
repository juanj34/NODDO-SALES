"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number | null;
  suffix?: string;
}

export function KPICard({ label, value, icon, trend, suffix }: Props) {
  return (
    <div className="p-5 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-ui text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
          {label}
        </span>
        <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-tertiary)]">
          {icon}
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="font-heading text-3xl font-light text-white leading-none">
          {typeof value === "number" ? value.toLocaleString("es-CO") : value}
        </span>
        {suffix && (
          <span className="text-xs text-[var(--text-muted)] mb-1">{suffix}</span>
        )}
      </div>
      {trend !== undefined && trend !== null && (
        <div className="flex items-center gap-1">
          {trend >= 0 ? (
            <TrendingUp size={12} className="text-green-400" />
          ) : (
            <TrendingDown size={12} className="text-red-400" />
          )}
          <span
            className={cn(
              "text-[11px] font-medium",
              trend >= 0 ? "text-green-400" : "text-red-400"
            )}
          >
            {trend >= 0 ? "+" : ""}{trend.toFixed(1)}%
          </span>
          <span className="text-[11px] text-[var(--text-muted)]">vs periodo anterior</span>
        </div>
      )}
    </div>
  );
}
