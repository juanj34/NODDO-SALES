"use client";

import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface Props {
  data: Array<{ day: string; count: number }>;
}

export function EventsChart({ data }: Props) {
  // Format data for chart
  const chartData = data.map((item) => ({
    ...item,
    date: new Date(item.day).toLocaleDateString("es", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="
        bg-gradient-to-br from-[var(--surface-1)] to-[var(--surface-2)]
        border border-[var(--border-subtle)]
        rounded-2xl
        p-6
      "
    >
      <div className="mb-6">
        <h3 className="font-ui text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-1">
          Actividad por día
        </h3>
        <p className="font-mono text-xs text-[var(--text-tertiary)]">
          Eventos registrados en el período seleccionado
        </p>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(var(--contrast-rgb),0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              stroke="rgba(var(--contrast-rgb),0.3)"
              tick={{ fill: "rgba(var(--contrast-rgb),0.5)", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "rgba(var(--contrast-rgb),0.1)" }}
            />
            <YAxis
              stroke="rgba(var(--contrast-rgb),0.3)"
              tick={{ fill: "rgba(var(--contrast-rgb),0.5)", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "rgba(var(--contrast-rgb),0.1)" }}
            />
            <Tooltip
              cursor={{ fill: "rgba(184,151,58,0.1)" }}
              contentStyle={{
                backgroundColor: "var(--surface-3)",
                border: "1px solid rgba(var(--contrast-rgb),0.1)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "var(--text-primary)",
              }}
              labelStyle={{ color: "rgba(var(--contrast-rgb),0.7)", marginBottom: "4px" }}
            />
            <Bar
              dataKey="count"
              fill="rgba(184,151,58,0.7)"
              radius={[4, 4, 0, 0]}
              animationDuration={800}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
