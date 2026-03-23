"use client";

import { LucideIcon, Shield, Clock, Users, Award } from "lucide-react";
import { motion } from "framer-motion";

type TrustBadgeVariant = "security" | "speed" | "social" | "guarantee";

interface TrustBadge {
  icon: LucideIcon | React.ReactNode;
  text: string;
  subtext?: string;
  variant?: TrustBadgeVariant;
}

interface TrustBadgesProps {
  badges: TrustBadge[];
  className?: string;
  /** Override grid columns class (default: auto based on badge count) */
  columns?: string;
}

const variantStyles: Record<TrustBadgeVariant, { accent: string; bg: string }> = {
  security: {
    accent: "text-[var(--site-primary)]",
    bg: "bg-[rgba(var(--site-primary-rgb),0.08)]",
  },
  speed: {
    accent: "text-emerald-400",
    bg: "bg-emerald-400/8",
  },
  social: {
    accent: "text-blue-400",
    bg: "bg-blue-400/8",
  },
  guarantee: {
    accent: "text-[var(--site-primary)]",
    bg: "bg-[rgba(var(--site-primary-rgb),0.08)]",
  },
};

export function TrustBadges({ badges, className = "", columns }: TrustBadgesProps) {
  const gridCols = columns ?? (badges.length === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4");

  return (
    <div className={`grid ${gridCols} gap-2.5 ${className}`}>
      {badges.map((badge, index) => {
        const variant = badge.variant || "security";
        const styles = variantStyles[variant];
        const isComponent = typeof badge.icon === "function" || (typeof badge.icon === "object" && badge.icon !== null && "render" in (badge.icon as unknown as Record<string, unknown>));
        const Icon = isComponent ? (badge.icon as LucideIcon) : null;

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border border-[var(--border-subtle)] ${styles.bg} backdrop-blur-sm text-center`}
          >
            <div className={`shrink-0 ${styles.accent}`}>
              {Icon ? <Icon size={20} /> : (badge.icon as React.ReactNode)}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-[var(--text-primary)] leading-tight">
                {badge.text}
              </p>
              {badge.subtext && (
                <p className="text-[10px] text-[var(--text-muted)] leading-tight mt-0.5">
                  {badge.subtext}
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// Predefined badge presets for common use cases
export const trustBadgePresets = {
  contactForm: (t: (key: string) => string): TrustBadge[] => [
    {
      icon: Shield,
      text: t("site.trustBadges.dataEncrypted"),
      variant: "security",
    },
    {
      icon: Clock,
      text: t("site.trustBadges.fastResponse"),
      subtext: t("site.trustBadges.guaranteed"),
      variant: "speed",
    },
    {
      icon: Users,
      text: t("site.trustBadges.familiesTrust"),
      variant: "social",
    },
    {
      icon: Award,
      text: t("site.trustBadges.certified"),
      variant: "guarantee",
    },
  ],
  cotizador: (t: (key: string) => string): TrustBadge[] => [
    {
      icon: Shield,
      text: t("site.trustBadges.noCommitment"),
      variant: "security",
    },
    {
      icon: Clock,
      text: t("site.trustBadges.freePDF"),
      subtext: t("site.trustBadges.fiveMin"),
      variant: "speed",
    },
    {
      icon: Award,
      text: t("site.trustBadges.flexiblePlans"),
      variant: "guarantee",
    },
  ],
};
