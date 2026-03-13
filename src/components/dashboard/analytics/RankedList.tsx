"use client";

import type { AnalyticsBreakdown } from "@/types";

interface Props {
  data: AnalyticsBreakdown[];
  maxItems?: number;
}

export function RankedList({ data, maxItems = 6 }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-[var(--text-muted)] text-xs">
        Sin datos
      </div>
    );
  }

  const items = data.slice(0, maxItems);
  const maxCount = items[0]?.count || 1;
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, idx) => {
        const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
        const barWidth = Math.max((item.count / maxCount) * 100, 2);
        return (
          <div key={idx} className="relative">
            {/* Background bar */}
            <div
              className="absolute inset-y-0 left-0 rounded-md bg-[rgba(var(--site-primary-rgb),0.08)]"
              style={{ width: `${barWidth}%` }}
            />
            {/* Content */}
            <div className="relative flex items-center justify-between px-3 py-2">
              <span className="font-mono text-[12px] text-[var(--text-secondary)] truncate flex-1">
                {item.label}
              </span>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono text-[11px] text-[var(--text-muted)]">
                  {pct}%
                </span>
                <span className="font-mono text-[12px] text-white font-medium min-w-[32px] text-right">
                  {item.count.toLocaleString("es-CO")}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
