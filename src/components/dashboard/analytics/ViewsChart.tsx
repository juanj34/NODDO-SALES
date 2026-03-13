"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { AnalyticsTimeSeries } from "@/types";

interface Props {
  data: AnalyticsTimeSeries[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="bg-[var(--surface-3)] border border-[var(--border-default)] rounded-lg px-3 py-2 shadow-lg">
      <p className="font-mono text-[11px] text-[var(--text-muted)] mb-1">
        {label ? formatDate(label) : ""}
      </p>
      {payload.map((entry) => (
        <p key={entry.name} className="font-mono text-[12px] text-white">
          {entry.name === "views" ? "Visitas" : "Únicos"}: {entry.value.toLocaleString("es-CO")}
        </p>
      ))}
    </div>
  );
}

export function ViewsChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[260px] text-[var(--text-muted)] text-xs">
        Sin datos de visitas en este periodo
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    date: formatDate(d.bucket),
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b8973a" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#b8973a" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="visitorsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.08} />
            <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
          </linearGradient>
        </defs>
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
        <Area
          type="monotone"
          dataKey="views"
          stroke="#b8973a"
          strokeWidth={2}
          fill="url(#viewsGradient)"
          name="views"
        />
        <Area
          type="monotone"
          dataKey="visitors"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          fill="url(#visitorsGradient)"
          name="visitors"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
