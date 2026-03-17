"use client";

export const dynamic = "force-dynamic";

import { useState, useMemo, useEffect } from "react";
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
  Gauge,
  ChartBar,
} from "lucide-react";
import { useProjects, useAnalytics } from "@/hooks/useProjectsQuery";
import { ViewsChart } from "@/components/dashboard/analytics/ViewsChart";
import { DeviceChart } from "@/components/dashboard/analytics/DeviceChart";
import { RankedList } from "@/components/dashboard/analytics/RankedList";
import { TimeRangeSelector, type TimeRange } from "@/components/dashboard/analytics/TimeRangeSelector";
import { NodDoDropdown } from "@/components/ui/NodDoDropdown";
import { trackDashboardEvent } from "@/lib/dashboard-tracking";
import { useAuthRole } from "@/hooks/useAuthContext";
import { fontSize, gap } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

// Dashboard Analytics Components
import { AnalyticsOverview } from "@/components/dashboard/analytics/AnalyticsOverview";
import { EventsChart } from "@/components/dashboard/analytics/EventsChart";
import { PopularShortcuts } from "@/components/dashboard/analytics/PopularShortcuts";
import { RecentActivity } from "@/components/dashboard/analytics/RecentActivity";
import { SearchPatterns } from "@/components/dashboard/analytics/SearchPatterns";
import { AIUsageAnalytics } from "@/components/dashboard/analytics/AIUsageAnalytics";

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

type AnalyticsTab = "projects" | "dashboard";

interface DashboardAnalyticsData {
  overview: {
    total_events: number;
    unique_users: number;
    unique_sessions: number;
    avg_events_per_session: string;
  };
  events_by_day: Array<{ day: string; count: number }>;
  popular_shortcuts: Array<{ shortcut: string; clicks: number }>;
  top_searches: Array<{ query: string; count: number }>;
  recent_activity: Array<{
    id: string;
    event_type: string;
    user_role: string | null;
    created_at: string;
    metadata: Record<string, unknown>;
  }>;
  period_days: number;
  total_events: number;
}

export default function AnalyticsPage() {
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { user, role } = useAuthRole();
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("dashboard");
  const [projectId, setProjectId] = useState("");
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [dashboardPeriod, setDashboardPeriod] = useState(7);
  const [dashboardData, setDashboardData] = useState<DashboardAnalyticsData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // Track page view
  useEffect(() => {
    trackDashboardEvent("dashboard_view", {
      page: "analytics",
      tab: activeTab,
    }, user?.id, role || undefined);
  }, [activeTab, user?.id, role]);

  // Fetch dashboard analytics
  useEffect(() => {
    if (activeTab !== "dashboard") return;

    const fetchDashboardData = async () => {
      setDashboardLoading(true);
      try {
        const res = await fetch(`/api/analytics/dashboard?days=${dashboardPeriod}`);
        if (res.ok) {
          const json = await res.json();
          setDashboardData(json);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard analytics:", err);
      } finally {
        setDashboardLoading(false);
      }
    };

    fetchDashboardData();
  }, [activeTab, dashboardPeriod]);

  // Set default project when projects load
  if (!projectId && projects.length > 0 && !projectsLoading) {
    setProjectId(projects[0].id);
  }

  const { from, to } = useMemo(() => getDateRange(timeRange), [timeRange]);
  const { data, isLoading: loading } = useAnalytics(projectId, from, to);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className={cn("flex items-center mb-2", gap.relaxed)}>
          <BarChart3 size={20} className="text-[var(--site-primary)]" />
          <h1 className="font-heading text-3xl font-light text-[var(--text-primary)]">
            Analytics
          </h1>
        </div>
        <p className="text-sm text-[var(--text-tertiary)] font-mono font-light">
          {activeTab === "dashboard"
            ? "Métricas de uso del dashboard y comportamiento de usuarios"
            : "Análisis completo de tráfico y comportamiento de usuarios en microsites"}
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className={cn("flex border-b border-[var(--border-subtle)]", gap.normal)}
      >
        <button
          onClick={() => setActiveTab("dashboard")}
          className={cn(
            "px-4 py-2.5 font-ui text-xs font-bold uppercase tracking-wider",
            "border-b-2 transition-all",
            activeTab === "dashboard"
              ? "border-[var(--site-primary)] text-[var(--site-primary)]"
              : "border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          )}
        >
          <div className={cn("flex items-center", gap.normal)}>
            <Gauge size={14} />
            Dashboard
          </div>
        </button>
        <button
          onClick={() => setActiveTab("projects")}
          className={cn(
            "px-4 py-2.5 font-ui text-xs font-bold uppercase tracking-wider",
            "border-b-2 transition-all",
            activeTab === "projects"
              ? "border-[var(--site-primary)] text-[var(--site-primary)]"
              : "border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          )}
        >
          <div className={cn("flex items-center", gap.normal)}>
            <ChartBar size={14} />
            Proyectos
          </div>
        </button>
      </motion.div>

      {/* Dashboard Analytics Tab */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* Period selector */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex justify-end"
          >
            <select
              value={dashboardPeriod}
              onChange={(e) => setDashboardPeriod(parseInt(e.target.value, 10))}
              className="
                px-4 py-2
                bg-[var(--surface-2)]
                border border-[var(--border-default)]
                rounded-lg
                font-mono text-xs text-white
                focus:outline-none focus:border-[var(--site-primary)]
                transition-colors
              "
            >
              <option value={7}>Últimos 7 días</option>
              <option value={14}>Últimos 14 días</option>
              <option value={30}>Últimos 30 días</option>
              <option value={90}>Últimos 90 días</option>
            </select>
          </motion.div>

          {dashboardLoading || !dashboardData ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--site-primary)]" />
            </div>
          ) : (
            <>
              <AnalyticsOverview
                totalEvents={dashboardData.overview.total_events}
                uniqueUsers={dashboardData.overview.unique_users}
                uniqueSessions={dashboardData.overview.unique_sessions}
                avgEventsPerSession={dashboardData.overview.avg_events_per_session}
              />

              <div className={cn("grid grid-cols-1 lg:grid-cols-3", gap.spacious)}>
                <div className="lg:col-span-2">
                  <EventsChart data={dashboardData.events_by_day} />
                </div>
                <div>
                  <PopularShortcuts shortcuts={dashboardData.popular_shortcuts} />
                </div>
              </div>

              <div className={cn("grid grid-cols-1 lg:grid-cols-2", gap.spacious)}>
                <RecentActivity events={dashboardData.recent_activity} />
                <SearchPatterns searches={dashboardData.top_searches} />
              </div>

              {/* AI Usage Analytics */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.4 }}
              >
                <AIUsageAnalytics />
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.4 }}
                className="text-center pt-4"
              >
                <p className="font-mono text-xs text-[var(--text-muted)]">
                  {dashboardData.total_events.toLocaleString()} eventos registrados en los últimos {dashboardData.period_days} días
                </p>
              </motion.div>
            </>
          )}
        </div>
      )}

      {/* Projects Analytics Tab (existing content) */}
      {activeTab === "projects" && (
        <>
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
              <div className={cn("font-ui font-bold uppercase tracking-wider text-[var(--text-muted)]", fontSize.label)}>
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
              <div className={cn("font-ui font-bold uppercase tracking-wider text-[var(--text-muted)]", fontSize.label)}>
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
              <div className={cn("font-ui font-bold uppercase tracking-wider text-[var(--text-muted)]", fontSize.label)}>
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
              <div className={cn("font-ui font-bold uppercase tracking-wider text-[var(--text-muted)]", fontSize.label)}>
                Tasa de Rebote
              </div>
            </div>
          </motion.div>

          {/* Charts Section */}
          <div className={cn("grid grid-cols-1 lg:grid-cols-3", gap.loose)}>
            {/* Views over time (2 columns) */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="lg:col-span-2 glass-card p-6"
            >
              <div className={cn("flex items-center mb-6", gap.normal)}>
                <Activity size={14} className="text-[var(--site-primary)]" />
                <span className={cn("font-ui font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]", fontSize.label)}>
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
              <div className={cn("flex items-center mb-6", gap.normal)}>
                <Monitor size={14} className="text-[var(--site-primary)]" />
                <span className={cn("font-ui font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]", fontSize.label)}>
                  Dispositivos
                </span>
              </div>
              <DeviceChart data={data?.views_by_device || []} />
            </motion.div>
          </div>

          {/* Ranked lists */}
          <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3", gap.loose)}>
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
        </>
      )}
    </div>
  );
}
