"use client";

import { motion } from "framer-motion";
import { Users, BarChart3, ToggleLeft, Calculator } from "lucide-react";

interface Props {
  shortcuts: Array<{ shortcut: string; clicks: number }>;
}

const SHORTCUT_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ size?: number }>; color: string }
> = {
  leads: {
    label: "Leads",
    icon: Users,
    color: "rgba(99, 102, 241, 0.7)", // Indigo
  },
  analytics: {
    label: "Analytics",
    icon: BarChart3,
    color: "rgba(16, 185, 129, 0.7)", // Green
  },
  disponibilidad: {
    label: "Disponibilidad",
    icon: ToggleLeft,
    color: "rgba(245, 158, 11, 0.7)", // Amber
  },
  cotizador: {
    label: "Cotizador",
    icon: Calculator,
    color: "rgba(139, 92, 246, 0.7)", // Purple
  },
};

export function PopularShortcuts({ shortcuts }: Props) {
  const totalClicks = shortcuts.reduce((sum, s) => sum + s.clicks, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="
        bg-gradient-to-br from-[var(--surface-1)] to-[var(--surface-2)]
        border border-[var(--border-subtle)]
        rounded-2xl
        p-6
      "
    >
      <div className="mb-4">
        <h3 className="font-ui text-xs font-bold uppercase tracking-wider text-white mb-1">
          Shortcuts más usados
        </h3>
        <p className="font-mono text-xs text-[var(--text-tertiary)]">
          {totalClicks} clicks totales
        </p>
      </div>

      <div className="space-y-3">
        {shortcuts.map((item, idx) => {
          const config = SHORTCUT_CONFIG[item.shortcut] || {
            label: item.shortcut,
            icon: Users,
            color: "rgba(184,151,58,0.7)",
          };
          const Icon = config.icon;
          const percentage = totalClicks > 0 ? (item.clicks / totalClicks) * 100 : 0;

          return (
            <motion.div
              key={item.shortcut}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + idx * 0.05, duration: 0.3 }}
              className="relative"
            >
              {/* Background bar */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ delay: 0.3 + idx * 0.05, duration: 0.6 }}
                className="absolute inset-0 rounded-lg opacity-20"
                style={{ backgroundColor: config.color }}
              />

              {/* Content */}
              <div className="relative flex items-center gap-3 p-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${config.color}20` }}
                >
                  <Icon size={16} style={{ color: config.color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-ui text-xs font-bold uppercase tracking-wider text-white">
                    {config.label}
                  </p>
                  <p className="font-mono text-xs text-[var(--text-tertiary)]">
                    {percentage.toFixed(1)}%
                  </p>
                </div>

                <div className="font-mono text-sm font-bold text-white">
                  {item.clicks}
                </div>
              </div>
            </motion.div>
          );
        })}

        {shortcuts.length === 0 && (
          <p className="text-center text-[var(--text-muted)] text-sm py-8">
            No hay datos de shortcuts
          </p>
        )}
      </div>
    </motion.div>
  );
}
