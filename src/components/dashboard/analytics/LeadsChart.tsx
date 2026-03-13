"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { AnalyticsBreakdown } from "@/types";

interface Props {
  data: AnalyticsBreakdown[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="bg-[var(--surface-3)] border border-[var(--border-default)] rounded-lg px-3 py-2 shadow-lg">
      <p className="font-mono text-[11px] text-[var(--text-muted)] mb-1">
        {label ? formatDate(label) : ""}
      </p>
      <p className="font-mono text-[12px] text-white">
        Leads: {payload[0]?.value || 0}
      </p>
    </div>
  );
}

export function LeadsChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-[var(--text-muted)] text-xs">
        Sin leads en este periodo
      </div>
    );
  }

  const chartData = data.map((d) => ({
    date: formatDate(d.label),
    count: d.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: "rgba(255,255,255,0.18)", fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "rgba(255,255,255,0.18)", fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          dataKey="count"
          fill="var(--site-primary)"
          radius={[4, 4, 0, 0]}
          maxBarSize={32}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
