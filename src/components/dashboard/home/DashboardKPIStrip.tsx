"use client";

import { motion } from "framer-motion";
import { Eye, Users, UserCheck, Percent, Zap } from "lucide-react";
import { AnimatedCounter } from "./AnimatedCounter";
import { MiniSparkline } from "./MiniSparkline";
import { useTranslation } from "@/i18n";
import type { DashboardSummary } from "@/types";

interface Props {
  data: DashboardSummary;
}

export function DashboardKPIStrip({ data }: Props) {
  const { t } = useTranslation("dashboard");

  const kpis = [
    {
      label: t("home.kpiViews"),
      value: data.total_views,
      icon: <Eye size={16} />,
      sparkline: data.views_sparkline,
    },
    {
      label: t("home.kpiVisitors"),
      value: data.unique_visitors,
      icon: <Users size={16} />,
    },
    {
      label: t("home.kpiLeads"),
      value: data.total_leads,
      icon: <UserCheck size={16} />,
    },
    {
      label: t("home.kpiConversion"),
      value: data.conversion_rate,
      icon: <Percent size={16} />,
      suffix: "%",
      decimals: 1,
    },
    {
      label: t("home.kpiInteractions"),
      value: data.total_interactions,
      icon: <Zap size={16} />,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {kpis.map((kpi, idx) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.08, duration: 0.4 }}
          className="p-4 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] flex flex-col gap-2.5"
        >
          <div className="flex items-center justify-between">
            <span className="font-ui text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              {kpi.label}
            </span>
            <div className="w-7 h-7 rounded-lg bg-[rgba(184,151,58,0.08)] border border-[rgba(184,151,58,0.12)] flex items-center justify-center text-[var(--site-primary)]">
              {kpi.icon}
            </div>
          </div>

          <div className="flex items-end justify-between">
            <span className="font-heading text-2xl font-light text-white leading-none">
              <AnimatedCounter
                target={kpi.value}
                suffix={kpi.suffix}
                decimals={kpi.decimals}
              />
            </span>
            {kpi.sparkline && <MiniSparkline data={kpi.sparkline} />}
          </div>

          <span className="font-mono text-[10px] text-[var(--text-muted)]">
            {t("home.last7Days")}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
