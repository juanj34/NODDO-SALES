"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Users, BarChart3, ToggleLeft, Calculator } from "lucide-react";
import { useTranslation } from "@/i18n";

interface Props {
  totalLeads: number;
  onAnalyticsClick: () => void;
}

export function DashboardShortcuts({ totalLeads, onAnalyticsClick }: Props) {
  const { t } = useTranslation("dashboard");

  const shortcuts = [
    {
      label: t("home.kpiLeads"),
      icon: <Users size={16} />,
      href: "/leads",
      badge: totalLeads > 0 ? totalLeads : undefined,
    },
    {
      label: t("home.analytics"),
      icon: <BarChart3 size={16} />,
      onClick: onAnalyticsClick,
    },
    {
      label: t("disponibilidad.title"),
      icon: <ToggleLeft size={16} />,
      href: "/disponibilidad",
    },
    {
      label: t("cotizador.title"),
      icon: <Calculator size={16} />,
      href: "/cotizador",
    },
  ];

  return (
    <div className="space-y-2">
      <span className="font-ui text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
        {t("home.shortcuts")}
      </span>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {shortcuts.map((item, idx) => {
          const content = (
            <>
              <div className="w-9 h-9 rounded-lg bg-[rgba(184,151,58,0.08)] border border-[rgba(184,151,58,0.12)] flex items-center justify-center text-[var(--site-primary)] group-hover:bg-[rgba(184,151,58,0.15)] transition-colors shrink-0">
                {item.icon}
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-ui text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                  {item.label}
                </span>
                {item.badge !== undefined && (
                  <span className="font-mono text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-[rgba(184,151,58,0.12)] text-[var(--site-primary)] leading-none">
                    {item.badge}
                  </span>
                )}
              </div>
            </>
          );

          const className =
            "group flex items-center gap-3 p-4 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] hover:bg-[var(--surface-2)] hover:border-[var(--border-default)] transition-all duration-200 cursor-pointer";

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06, duration: 0.35 }}
            >
              {item.href ? (
                <Link href={item.href} className={className}>
                  {content}
                </Link>
              ) : (
                <button onClick={item.onClick} className={`${className} w-full text-left`}>
                  {content}
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
