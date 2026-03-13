"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { AnalyticsBreakdown } from "@/types";
import { Monitor, Smartphone, Tablet } from "lucide-react";

interface Props {
  data: AnalyticsBreakdown[];
}

const DEVICE_CONFIG: Record<string, { color: string; icon: typeof Monitor; label: string }> = {
  desktop: { color: "var(--site-primary)", icon: Monitor, label: "Desktop" },
  mobile: { color: "rgba(255,255,255,0.35)", icon: Smartphone, label: "Mobile" },
  tablet: { color: "rgba(255,255,255,0.18)", icon: Tablet, label: "Tablet" },
  unknown: { color: "rgba(255,255,255,0.10)", icon: Monitor, label: "Otro" },
};

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (!active || !payload) return null;
  const entry = payload[0];
  return (
    <div className="bg-[var(--surface-3)] border border-[var(--border-default)] rounded-lg px-3 py-2 shadow-lg">
      <p className="font-mono text-[12px] text-white">
        {entry?.name}: {entry?.value?.toLocaleString("es-CO")}
      </p>
    </div>
  );
}

export function DeviceChart({ data }: Props) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-[180px] text-[var(--text-muted)] text-xs">
        Sin datos
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: DEVICE_CONFIG[d.label]?.label || d.label,
    value: d.count,
    color: DEVICE_CONFIG[d.label]?.color || "rgba(255,255,255,0.10)",
  }));

  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width={120} height={120}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={36}
            outerRadius={54}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-col gap-2 flex-1">
        {data.map((d) => {
          const config = DEVICE_CONFIG[d.label] || DEVICE_CONFIG.unknown;
          const Icon = config.icon;
          const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
          return (
            <div key={d.label} className="flex items-center gap-2">
              <Icon size={13} style={{ color: config.color }} />
              <span className="font-mono text-[11px] text-[var(--text-secondary)] flex-1">
                {config.label}
              </span>
              <span className="font-mono text-[11px] text-white font-medium">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
