"use client";

import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface HealthStatusCardProps {
  label: string;
  status: "healthy" | "warning" | "critical";
  value: number | string;
  max?: number;
  suffix?: string;
  metadata?: Record<string, unknown>;
}

export function HealthStatusCard({
  label,
  status,
  value,
  max,
  suffix,
  metadata,
}: HealthStatusCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case "healthy":
        return {
          bg: "rgba(74, 222, 128, 0.15)",
          border: "rgba(74, 222, 128, 0.2)",
          text: "#4ade80",
          icon: CheckCircle,
        };
      case "warning":
        return {
          bg: "rgba(251, 191, 36, 0.15)",
          border: "rgba(251, 191, 36, 0.2)",
          text: "#fbbf24",
          icon: AlertTriangle,
        };
      case "critical":
        return {
          bg: "rgba(239, 68, 68, 0.15)",
          border: "rgba(239, 68, 68, 0.2)",
          text: "#ef4444",
          icon: XCircle,
        };
    }
  };

  const colors = getStatusColor();
  const Icon = colors.icon;

  // Calcular porcentaje si hay max
  const percentage = max && typeof value === "number" ? (value / max) * 100 : 0;

  return (
    <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-5 hover:border-[var(--border-default)] transition-all group">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg border flex items-center justify-center"
            style={{
              background: colors.bg,
              borderColor: colors.border,
            }}
          >
            <Icon size={14} style={{ color: colors.text }} />
          </div>
          <h3 className="font-ui text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            {label}
          </h3>
        </div>
        <span
          className="px-2 py-1 rounded-md font-ui text-[9px] font-bold uppercase tracking-wider border"
          style={{
            background: colors.bg,
            color: colors.text,
            borderColor: colors.border,
          }}
        >
          {status}
        </span>
      </div>

      {/* Value */}
      <div className="mb-3">
        <div className="flex items-baseline gap-2">
          <span className="font-heading text-3xl font-light text-white">
            {typeof value === "number" ? value.toFixed(1) : value}
          </span>
          {suffix && <span className="text-xs text-[var(--text-muted)]">{suffix}</span>}
          {max && (
            <span className="text-xs text-[var(--text-muted)]">
              / {max}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar if max is provided */}
      {max && typeof value === "number" && (
        <div className="relative h-2 bg-[var(--surface-3)] rounded-full overflow-hidden mb-3">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(percentage, 100)}%`,
              background: colors.text,
            }}
          />
        </div>
      )}

      {/* Metadata */}
      {metadata && (
        <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
          {Object.entries(metadata).map(([key, val]) => (
            <span key={key}>
              {key}: <span className="text-[var(--text-tertiary)]">{String(val)}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
