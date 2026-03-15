"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface RevenueChartProps {
  data: Array<{ month: string; revenue: number }>;
}

export function RevenueChart({ data }: RevenueChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[220px] text-[var(--text-muted)] text-xs">
        No hay datos de revenue
      </div>
    );
  }

  // Formatear mes (2024-01 → Ene 2024)
  const formattedData = data.map((d) => ({
    ...d,
    monthLabel: new Date(d.month + "-01").toLocaleDateString("es-CO", {
      month: "short",
      year: "numeric",
    }),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={formattedData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b8973a" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#b8973a" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="monthLabel"
          stroke="rgba(255,255,255,0.2)"
          tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
          tickLine={false}
          axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
        />
        <YAxis
          stroke="rgba(255,255,255,0.2)"
          tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
          tickLine={false}
          axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "rgba(20, 20, 20, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "8px",
            padding: "8px 12px",
          }}
          labelStyle={{ color: "rgba(255,255,255,0.9)", fontSize: 11, marginBottom: 4 }}
          itemStyle={{ color: "#b8973a", fontSize: 11 }}
          formatter={(value) => [`$${Number(value).toLocaleString("es-CO")}`, "Revenue"]}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#b8973a"
          strokeWidth={2}
          fill="url(#revenueGrad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
