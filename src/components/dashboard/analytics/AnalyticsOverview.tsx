"use client";

import { motion } from "framer-motion";
import { Activity, Users, MousePointer, TrendingUp } from "lucide-react";

interface Props {
  totalEvents: number;
  uniqueUsers: number;
  uniqueSessions: number;
  avgEventsPerSession: string;
}

const StatCard = ({
  icon: Icon,
  label,
  value,
  index,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05, duration: 0.3 }}
    className="
      bg-gradient-to-br from-[var(--surface-1)] to-[var(--surface-2)]
      border border-[var(--border-subtle)]
      rounded-2xl
      p-6
      hover:border-[rgba(var(--site-primary-rgb),0.3)]
      transition-all duration-300
    "
  >
    <div className="flex items-center gap-4">
      {/* Icon container */}
      <div
        className="
          w-14 h-14
          rounded-xl
          bg-[rgba(var(--site-primary-rgb),0.12)]
          border border-[rgba(var(--site-primary-rgb),0.2)]
          flex items-center justify-center
          shrink-0
        "
      >
        <Icon size={24} className="text-[var(--site-primary)]" />
      </div>

      {/* Content */}
      <div className="flex-1">
        <p className="font-mono text-xs text-[var(--text-tertiary)] mb-1">
          {label}
        </p>
        <p className="font-heading text-3xl font-light text-white">
          {value.toLocaleString()}
        </p>
      </div>
    </div>
  </motion.div>
);

export function AnalyticsOverview({
  totalEvents,
  uniqueUsers,
  uniqueSessions,
  avgEventsPerSession,
}: Props) {
  const stats = [
    {
      icon: Activity,
      label: "Total de eventos",
      value: totalEvents,
    },
    {
      icon: Users,
      label: "Usuarios únicos",
      value: uniqueUsers,
    },
    {
      icon: MousePointer,
      label: "Sesiones únicas",
      value: uniqueSessions,
    },
    {
      icon: TrendingUp,
      label: "Eventos por sesión",
      value: avgEventsPerSession,
    },
  ];

  return (
    <div>
      <span className="font-ui text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)] mb-3 block">
        Resumen
      </span>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <StatCard key={idx} {...stat} index={idx} />
        ))}
      </div>
    </div>
  );
}
