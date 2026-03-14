"use client";

import { Users, CalendarDays, FileText, Sparkles } from "lucide-react";
import type { LeadStats } from "@/types";

interface Props {
  stats: LeadStats | null;
  loading: boolean;
}

const cards = [
  { key: "total_all", label: "Total Registros", labelEn: "Total Leads", icon: Users },
  { key: "this_month", label: "Este Mes", labelEn: "This Month", icon: CalendarDays },
  { key: "with_cotizaciones", label: "Con Cotizaciones", labelEn: "With Quotes", icon: FileText },
  { key: "nuevo", label: "Nuevos", labelEn: "New", icon: Sparkles },
] as const;

export function LeadsCRMStats({ stats, loading }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {cards.map((card) => {
        const value =
          card.key === "nuevo"
            ? stats?.by_status?.nuevo ?? 0
            : stats?.[card.key] ?? 0;
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            className="p-4 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-ui text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                {card.label}
              </span>
              <div className="w-7 h-7 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-tertiary)]">
                <Icon size={14} />
              </div>
            </div>
            <div>
              {loading ? (
                <div className="h-8 w-16 bg-[var(--surface-2)] rounded-lg animate-pulse" />
              ) : (
                <span className="font-heading text-3xl font-light text-white leading-none">
                  {value.toLocaleString("es-CO")}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
