"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Activity,
  Globe,
  Monitor,
  Users,
  MousePointerClick,
  Clock,
  TrendingUp,
} from "lucide-react";
import { useProjects, useAnalytics } from "@/hooks/useProjectsQuery";
import { ViewsChart } from "@/components/dashboard/analytics/ViewsChart";
import { DeviceChart } from "@/components/dashboard/analytics/DeviceChart";
import { RankedList } from "@/components/dashboard/analytics/RankedList";
import { TimeRangeSelector, type TimeRange } from "@/components/dashboard/analytics/TimeRangeSelector";
import { useTranslation } from "@/i18n";
import { NodDoDropdown } from "@/components/ui/NodDoDropdown";

function getDateRange(range: TimeRange): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();
  switch (range) {
    case "7d":
      from.setDate(from.getDate() - 7);
      break;
    case "30d":
      from.setDate(from.getDate() - 30);
      break;
    case "90d":
      from.setDate(from.getDate() - 90);
      break;
  }
  return { from, to };
}

export default function AnalyticsPage() {
  const { t } = useTranslation("dashboard");
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const [projectId, setProjectId] = useState("");
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");

  // Set default project when projects load
  if (!projectId && projects.length > 0 && !projectsLoading) {
    setProjectId(projects[0].id);
  }

  const { from, to } = useMemo(() => getDateRange(timeRange), [timeRange]);
  const { data, isLoading: loading } = useAnalytics(projectId, from, to);

  const selectedProject = projects.find((p) => p.id === projectId);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 size={20} className="text-[var(--site-primary)]" />
          <h1 className="font-heading text-3xl font-light text-[var(--text-primary)]">
            Analytics
          </h1>
        </div>
        <p className="text-sm text-[var(--text-tertiary)] font-mono font-light">
          Análisis completo de tráfico y comportamiento de usuarios
        </p>
      </motion.div>

      {/* Project selector + Time range */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between"
      >
        {/* Project selector */}
        {projects.length > 0 && (
          <NodDoDropdown
            variant="dashboard"
            size="md"
            value={projectId}
            onChange={setProjectId}
            options={projects.map((p) => ({ value: p.id, label: p.nombre }))}
          />
        )}

        {/* Time range selector */}
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </motion.div>

      {projects.length === 0 ? (
        /* Empty state */
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="glass-card p-12 text-center"
        >
          <BarChart3 size={48} className="text-[var(--text-muted)] mx-auto mb-4" />
          <h3 className="font-heading text-xl text-[var(--text-secondary)] mb-2">
            No hay proyectos
          </h3>
          <p className="text-sm text-[var(--text-tertiary)] font-mono">
            Crea un proyecto primero para ver analytics
          </p>
        </motion.div>
      ) : (
        <>
          {/* KPI Cards */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {/* Total Views */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[rgba(var(--site-primary-rgb),0.1)] border border-[rgba(var(--site-primary-rgb),0.2)] flex items-center justify-center">
                  <Activity size={18} className="text-[var(--site-primary)]" />
                </div>
                <TrendingUp size={14} className="text-emerald-400" />
              </div>
              <div className="font-mono text-2xl font-light text-[var(--text-primary)] mb-1">
                {loading ? "..." : data?.summary?.total_views?.toLocaleString() || "0"}
              </div>
              <div className="font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Total Visitas
              </div>
            </div>

            {/* Unique Visitors */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[rgba(var(--site-primary-rgb),0.1)] border border-[rgba(var(--site-primary-rgb),0.2)] flex items-center justify-center">
                  <Users size={18} className="text-[var(--site-primary)]" />
                </div>
              </div>
              <div className="font-mono text-2xl font-light text-[var(--text-primary)] mb-1">
                {loading ? "..." : data?.summary?.unique_visitors?.toLocaleString() || "0"}
              </div>
              <div className="font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Visitantes Únicos
              </div>
            </div>

            {/* Total Sessions */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[rgba(var(--site-primary-rgb),0.1)] border border-[rgba(var(--site-primary-rgb),0.2)] flex items-center justify-center">
                  <Clock size={18} className="text-[var(--site-primary)]" />
                </div>
              </div>
              <div className="font-mono text-2xl font-light text-[var(--text-primary)] mb-1">
                {loading ? "..." : data?.summary?.total_sessions?.toLocaleString() || "0"}
              </div>
              <div className="font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Total Sesiones
              </div>
            </div>

            {/* Bounce Rate */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[rgba(var(--site-primary-rgb),0.1)] border border-[rgba(var(--site-primary-rgb),0.2)] flex items-center justify-center">
                  <MousePointerClick size={18} className="text-[var(--site-primary)]" />
                </div>
              </div>
              <div className="font-mono text-2xl font-light text-[var(--text-primary)] mb-1">
                {loading ? "..." : `${Math.round(data?.summary?.bounce_rate || 0)}%`}
              </div>
              <div className="font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Tasa de Rebote
              </div>
            </div>
          </motion.div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Views over time (2 columns) */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="lg:col-span-2 glass-card p-6"
            >
              <div className="flex items-center gap-2 mb-6">
                <Activity size={14} className="text-[var(--site-primary)]" />
                <span className="font-ui text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  Visitas en el Tiempo
                </span>
              </div>
              <ViewsChart data={data?.views_over_time || []} />
            </motion.div>

            {/* Device breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.35 }}
              className="glass-card p-6"
            >
              <div className="flex items-center gap-2 mb-6">
                <Monitor size={14} className="text-[var(--site-primary)]" />
                <span className="font-ui text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  Dispositivos
                </span>
              </div>
              <DeviceChart data={data?.views_by_device || []} />
            </motion.div>
          </div>

          {/* Ranked lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Top pages */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <RankedList
                title="Páginas Más Visitadas"
                icon={Globe}
                data={data?.views_by_page || []}
                              />
            </motion.div>

            {/* Top countries */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.45 }}
            >
              <RankedList
                title="Top Países"
                icon={Globe}
                data={data?.views_by_country || []}
                              />
            </motion.div>

            {/* Top referrers */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <RankedList
                title="Top Referidos"
                icon={Globe}
                data={data?.views_by_referrer || []}
                              />
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
