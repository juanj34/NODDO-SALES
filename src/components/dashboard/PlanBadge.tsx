"use client";

import { Zap, Sparkles, Building2 } from "lucide-react";
import Link from "next/link";
import type { Plan } from "@/lib/plan-limits";

interface PlanBadgeProps {
  plan: Plan;
  size?: "sm" | "md" | "lg";
  showLink?: boolean;
  className?: string;
}

const PLAN_CONFIG: Record<Plan, { label: string; color: string; icon: typeof Zap }> = {
  basic: {
    label: "Basic",
    color: "#9CA3AF", // Gray
    icon: Zap,
  },
  premium: {
    label: "⭐ Premium",
    color: "#b8973a", // NODDO Gold
    icon: Sparkles,
  },
  enterprise: {
    label: "Enterprise",
    color: "#E5E7EB", // Platinum/white
    icon: Building2,
  },
};

export function PlanBadge({ plan, size = "md", showLink = false, className = "" }: PlanBadgeProps) {
  const config = PLAN_CONFIG[plan];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-2 py-1 text-[9px] gap-1",
    md: "px-3 py-1.5 text-[10px] gap-1.5",
    lg: "px-4 py-2 text-xs gap-2",
  };

  const iconSizes = {
    sm: 10,
    md: 12,
    lg: 14,
  };

  const badge = (
    <div
      className={`inline-flex items-center rounded-lg font-ui font-bold uppercase tracking-wider transition-all ${sizeClasses[size]} ${className}`}
      style={{
        background: `linear-gradient(135deg, ${config.color}15, ${config.color}05)`,
        border: `1px solid ${config.color}30`,
        color: config.color,
      }}
    >
      <Icon size={iconSizes[size]} />
      <span>{config.label}</span>
    </div>
  );

  if (showLink) {
    return (
      <Link href="/settings/billing" className="inline-block hover:opacity-80 transition-opacity">
        {badge}
      </Link>
    );
  }

  return badge;
}
