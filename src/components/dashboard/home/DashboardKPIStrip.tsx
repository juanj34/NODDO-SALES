"use client";

import { motion } from "framer-motion";
import { Eye, Users, UserCheck, Zap } from "lucide-react";
import { AnimatedCounter } from "./AnimatedCounter";
import { MiniSparkline } from "./MiniSparkline";
import { useTranslation } from "@/i18n";
import { NodDoDropdown } from "@/components/ui/NodDoDropdown";
import type { DashboardSummary } from "@/types";

interface Props {
  data: DashboardSummary;
  projects?: { id: string; nombre: string }[];
  selectedProjectId?: string | null;
  onSelectProject?: (id: string | null) => void;
}

export function DashboardKPIStrip({ data, projects, selectedProjectId, onSelectProject }: Props) {
  const { t } = useTranslation("dashboard");

  // Resolve values based on project filter
  const filtered = selectedProjectId ? data.project_stats[selectedProjectId] : null;
  const views = filtered ? filtered.views_7d : data.total_views;
  const visitors = filtered ? filtered.visitors_7d : data.unique_visitors;
  const leads = filtered ? filtered.leads_7d : data.total_leads;
  const interactions = filtered ? filtered.interactions_7d : data.total_interactions;
  const sparkline = filtered ? filtered.sparkline : data.views_sparkline;

  const kpis = [
    {
      label: t("home.kpiViews"),
      value: views,
      icon: <Eye size={16} />,
      sparkline,
    },
    {
      label: t("home.kpiVisitors"),
      value: visitors,
      icon: <Users size={16} />,
    },
    {
      label: t("home.kpiLeads"),
      value: leads,
      icon: <UserCheck size={16} />,
    },
    {
      label: t("home.kpiInteractions"),
      value: interactions,
      icon: <Zap size={16} />,
    },
  ];

  return (
    <div className="space-y-3">
      {/* Project filter row */}
      {projects && projects.length > 1 && onSelectProject && (
        <div className="flex items-center gap-2">
          <span className="font-ui text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            {t("home.last7Days")}
          </span>
          <NodDoDropdown
            value={selectedProjectId || "all"}
            onChange={(val) => onSelectProject(val === "all" ? null : val)}
            options={[
              { value: "all", label: t("sidebar.allProjects") },
              ...projects.map((p) => ({ value: p.id, label: p.nombre })),
            ]}
          />
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
                <AnimatedCounter target={kpi.value} />
              </span>
              {kpi.sparkline && <MiniSparkline data={kpi.sparkline} />}
            </div>

            <span className="font-mono text-[10px] text-[var(--text-muted)]">
              {t("home.last7Days")}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
