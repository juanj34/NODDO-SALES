"use client";

import { motion } from "framer-motion";
import { Eye, Users, UserCheck, Zap } from "lucide-react";
import { AnimatedCounter } from "./AnimatedCounter";
import { MiniSparkline } from "./MiniSparkline";
import { useTranslation } from "@/i18n";
import { NodDoDropdown } from "@/components/ui/NodDoDropdown";
import { Icon } from "@/components/ui";
import { fontSize, gap, letterSpacing } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
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
      icon: <Icon icon={Eye} size="md" />,
      sparkline,
    },
    {
      label: t("home.kpiVisitors"),
      value: visitors,
      icon: <Icon icon={Users} size="md" />,
    },
    {
      label: t("home.kpiLeads"),
      value: leads,
      icon: <Icon icon={UserCheck} size="md" />,
    },
    {
      label: t("home.kpiInteractions"),
      value: interactions,
      icon: <Icon icon={Zap} size="md" />,
    },
  ];

  return (
    <div className="space-y-3">
      {/* Project filter row */}
      {projects && projects.length > 1 && onSelectProject && (
        <div className={cn("flex items-center", gap.normal)}>
          <span className={cn("font-ui font-bold uppercase text-[var(--text-muted)]", fontSize.caption, letterSpacing.widest)}>
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
      <div className={cn("grid grid-cols-2 lg:grid-cols-4", gap.relaxed)}>
        {kpis.map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.4 }}
            className={cn("p-4 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] flex flex-col", gap.relaxed)}
          >
            <div className="flex items-center justify-between">
              <span className={cn("font-ui font-bold uppercase text-[var(--text-muted)]", fontSize.caption, letterSpacing.widest)}>
                {kpi.label}
              </span>
              <div className="w-7 h-7 rounded-lg bg-[rgba(var(--site-primary-rgb),0.08)] border border-[rgba(var(--site-primary-rgb),0.12)] flex items-center justify-center text-[var(--site-primary)]">
                {kpi.icon}
              </div>
            </div>

            <div className={cn("flex items-end justify-between", gap.normal)}>
              <span className="font-heading text-2xl font-light text-white leading-none">
                <AnimatedCounter target={kpi.value} />
              </span>
              {kpi.sparkline && <MiniSparkline data={kpi.sparkline} />}
            </div>

            <span className={cn("font-mono text-[var(--text-muted)]", fontSize.label)}>
              {t("home.last7Days")}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
