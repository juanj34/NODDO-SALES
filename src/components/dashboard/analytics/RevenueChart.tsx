"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { MonthlyRevenue, Currency } from "@/types";

interface Props {
  data: MonthlyRevenue[];
  currency: Currency;
}

export function RevenueChart({ data, currency }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[260px] text-[var(--text-muted)] text-xs">
        Sin ventas en este periodo
      </div>
    );
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      notation: "compact",
    }).format(value);

  const chartData = data.map((d) => ({
    ...d,
    monthLabel: new Date(d.month + "-01").toLocaleDateString("es-CO", { month: "short", year: "2-digit" }),
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis
          dataKey="monthLabel"
          tick={{ fontSize: 10, fill: "rgba(255,255,255,0.18)", fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={formatCurrency}
          tick={{ fontSize: 10, fill: "rgba(255,255,255,0.18)", fontFamily: "var(--font-mono)" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload) return null;
            const data = payload[0]?.payload;
            return (
              <div className="bg-[var(--surface-3)] border border-[var(--border-default)] rounded-lg px-3 py-2 shadow-lg">
                <p className="font-mono text-[11px] text-[var(--text-muted)] mb-1">{data.monthLabel}</p>
                <p className="font-mono text-[12px] text-white">Ingresos: {formatCurrency(data.revenue)}</p>
                <p className="font-mono text-[11px] text-[var(--text-secondary)]">{data.count} unidades</p>
              </div>
            );
          }}
        />
        <Bar dataKey="revenue" fill="#b8973a" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
