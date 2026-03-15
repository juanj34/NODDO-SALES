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

export function TrustBadges({ badges, className = "" }: TrustBadgesProps) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 ${className}`}>
      {badges.map((badge, index) => {
        const variant = badge.variant || "security";
        const styles = variantStyles[variant];
        const Icon = typeof badge.icon === "function" ? badge.icon : null;

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className={`flex items-center gap-2.5 p-3 rounded-xl border border-[var(--border-subtle)] ${styles.bg} backdrop-blur-sm`}
          >
            <div className={`shrink-0 ${styles.accent}`}>
              {Icon ? <Icon size={18} /> : (badge.icon as React.ReactNode)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">
                {badge.text}
              </p>
              {badge.subtext && (
                <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">
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
