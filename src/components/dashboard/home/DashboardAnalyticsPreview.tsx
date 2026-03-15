"use client";

import { useState, useMemo, forwardRef } from "react";
import { motion } from "framer-motion";
import { BarChart3, Activity, Globe, Monitor } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { ViewsChart } from "@/components/dashboard/analytics/ViewsChart";
import { DeviceChart } from "@/components/dashboard/analytics/DeviceChart";
import { RankedList } from "@/components/dashboard/analytics/RankedList";
import { TimeRangeSelector, type TimeRange } from "@/components/dashboard/analytics/TimeRangeSelector";
import { useTranslation } from "@/i18n";
import { NodDoDropdown } from "@/components/ui/NodDoDropdown";

interface Props {
  projects: { id: string; nombre: string }[];
  defaultProjectId?: string;
}

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

export const DashboardAnalyticsPreview = forwardRef<HTMLDivElement, Props>(
  function DashboardAnalyticsPreview({ projects, defaultProjectId }, ref) {
    const { t } = useTranslation("dashboard");
    const [projectId, setProjectId] = useState(defaultProjectId || projects[0]?.id || "");
    const [timeRange, setTimeRange] = useState<TimeRange>("7d");

    const { from, to } = useMemo(() => getDateRange(timeRange), [timeRange]);
    const { data, loading } = useAnalytics(projectId, from, to);

    if (projects.length === 0) return null;

    return (
      <motion.div
        ref={ref}
        id="analytics-section"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] overflow-hidden"
      >
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3 p-5 pb-0">
          <div className="flex items-center gap-2 mr-auto">
            <BarChart3 size={14} className="text-[var(--site-primary)]" />
            <span className="font-ui text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              {t("home.analytics")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Project selector */}
            {projects.length > 1 && (
              <NodDoDropdown
                variant="dashboard"
                size="sm"
                value={projectId}
                onChange={setProjectId}
                options={projects.map((p) => ({ value: p.id, label: p.nombre }))}
              />
            )}

            {/* Time range */}
            <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {loading ? (
            <AnalyticsSkeleton />
          ) : !data ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BarChart3 size={24} className="text-[var(--text-muted)] mb-3" />
              <p className="font-mono text-xs text-[var(--text-muted)]">
                {t("home.noAnalyticsData")}
              </p>
              <p className="font-mono text-[10px] text-[var(--text-muted)] opacity-60 mt-1">
                {t("home.noAnalyticsDescription")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left: Views chart + mini stats */}
              <div className="lg:col-span-2 space-y-4">
                <div className="h-[220px]">
                  <ViewsChart data={data.views_over_time} />
                </div>

                {/* Mini stats row */}
                <div className="flex items-center gap-6 pt-2 border-t border-[var(--border-subtle)]">
                  <MiniStat
                    icon={<Activity size={12} />}
                    label={t("home.bounceRate")}
                    value={`${data.bounce_rate.toFixed(1)}%`}
                  />
                  <MiniStat
                    icon={<Monitor size={12} />}
                    label={t("home.pagesPerSession")}
                    value={data.avg_pages_per_session.toFixed(1)}
                  />
                  {data.views_by_page[0] && (
                    <MiniStat
                      icon={<Globe size={12} />}
                      label="Top page"
                      value={data.views_by_page[0].label}
                    />
                  )}
                </div>
              </div>

              {/* Right: Device chart + Referrers */}
              <div className="space-y-5">
                <div>
                  <span className="font-ui text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)] mb-3 block">
                    {t("home.devices")}
                  </span>
                  <DeviceChart data={data.views_by_device} />
                </div>

                <div className="border-t border-[var(--border-subtle)] pt-4">
                  <span className="font-ui text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)] mb-3 block">
                    {t("home.trafficSources")}
                  </span>
                  <RankedList data={data.views_by_referrer} maxItems={4} />
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  }
);

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[var(--text-muted)]">{icon}</span>
      <div className="min-w-0">
        <p className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
          {label}
        </p>
        <p className="font-mono text-[12px] text-[var(--text-secondary)] truncate max-w-[120px]">
          {value}
        </p>
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-pulse">
      <div className="lg:col-span-2 space-y-4">
        <div className="h-[220px] bg-[var(--surface-2)] rounded-lg" />
        <div className="flex gap-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-8 w-24 bg-[var(--surface-2)] rounded" />
          ))}
        </div>
      </div>
      <div className="space-y-5">
        <div className="h-[140px] bg-[var(--surface-2)] rounded-lg" />
        <div className="h-[120px] bg-[var(--surface-2)] rounded-lg" />
      </div>
    </div>
  );
}
