"use client";

import { Sparkles } from "lucide-react";

interface FeatureAdoptionCardProps {
  feature: string;
  enabledCount: number;
  adoptionRate: number;
  totalProjects: number;
}

const FEATURE_LABELS: Record<string, string> = {
  cotizador: "NodDo Quote",
  webhooks: "Webhooks",
  custom_domain: "Dominio Custom",
  tour_360: "Tour 360°",
  video_hosting: "Videos",
  brochure: "Brochure",
  analytics: "Analytics",
};

export function FeatureAdoptionCard({
  feature,
  enabledCount,
  adoptionRate,
  totalProjects,
}: FeatureAdoptionCardProps) {
  const displayName = FEATURE_LABELS[feature] || feature;

  // Color basado en adopción
  const getBarColor = () => {
    if (adoptionRate >= 75) return "#b8973a"; // Gold
    if (adoptionRate >= 50) return "#d4b05a"; // Light gold
    if (adoptionRate >= 25) return "#f59e0b"; // Orange
    return "#ef4444"; // Red (low adoption)
  };

  return (
    <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-5 hover:border-[var(--border-default)] transition-all group">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center group-hover:border-[var(--site-primary)] group-hover:bg-[rgba(var(--site-primary-rgb),0.1)] transition-all">
            <Sparkles size={14} className="text-[var(--site-primary)]" />
          </div>
          <h3 className="font-ui text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            {displayName}
          </h3>
        </div>
        <span
          className="px-2 py-1 rounded-md font-ui text-[9px] font-bold uppercase tracking-wider"
          style={{
            background: `rgba(${adoptionRate >= 50 ? "184, 151, 58" : "239, 68, 68"}, 0.15)`,
            color: adoptionRate >= 50 ? "#b8973a" : "#ef4444",
          }}
        >
          {adoptionRate.toFixed(1)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-[var(--surface-3)] rounded-full overflow-hidden mb-3">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(adoptionRate, 100)}%`,
            background: getBarColor(),
          }}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--text-muted)]">
          {enabledCount} de {totalProjects}
        </span>
        <span className="font-mono text-[var(--text-tertiary)]">
          {enabledCount} proyecto{enabledCount !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
