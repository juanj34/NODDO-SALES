"use client";

import { useState, useMemo } from "react";
import { useEditorProject } from "@/hooks/useEditorProject";
import { useAnalytics } from "@/hooks/useAnalytics";
import {
  pageTitle,
  pageDescription,
  sectionCard,
  sectionTitle,
  sectionDescription,
  emptyState,
  emptyStateIcon,
  emptyStateTitle,
  emptyStateDescription,
} from "@/components/dashboard/editor-styles";
import {
  BarChart3,
  Eye,
  Users,
  UserCheck,
  Percent,
  Loader2,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  ArrowDownRight,
  Layers,
  Download,
} from "lucide-react";
import { motion } from "framer-motion";
import { KPICard } from "@/components/dashboard/analytics/KPICard";
import { TimeRangeSelector, type TimeRange } from "@/components/dashboard/analytics/TimeRangeSelector";
import { ViewsChart } from "@/components/dashboard/analytics/ViewsChart";
import { LeadsChart } from "@/components/dashboard/analytics/LeadsChart";
import { DeviceChart } from "@/components/dashboard/analytics/DeviceChart";
import { RankedList } from "@/components/dashboard/analytics/RankedList";
import { InteractionCards } from "@/components/dashboard/analytics/InteractionCards";

const RANGE_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };

function exportAnalyticsCSV(data: NonNullable<ReturnType<typeof import("@/hooks/useAnalytics").useAnalytics>["data"]>, projectName: string) {
  const rows: string[][] = [
    ["Metric", "Value"],
    ["Total Views", String(data.summary.total_views)],
    ["Unique Visitors", String(data.summary.unique_visitors)],
    ["Total Leads", String(data.total_leads)],
    ["Conversion Rate", `${data.conversion_rate}%`],
    ["Bounce Rate", `${data.bounce_rate}%`],
    ["Pages/Session", data.avg_pages_per_session.toFixed(1)],
    [],
    ["Date", "Views", "Unique Visitors"],
    ...data.views_over_time.map((d) => [d.bucket, String(d.views), String(d.visitors)]),
    [],
    ["Page", "Views"],
    ...data.views_by_page.map((d) => [d.label, String(d.count)]),
    [],
    ["Referrer", "Views"],
    ...data.views_by_referrer.map((d) => [d.label, String(d.count)]),
    [],
    ["Country", "Views"],
    ...data.views_by_country.map((d) => [d.label, String(d.count)]),
  ];

  const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `analytics_${projectName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function EstadisticasPage() {
  const { project } = useEditorProject();
  const [range, setRange] = useState<TimeRange>("30d");
  const [customFrom, setCustomFrom] = useState<Date | null>(null);
  const [customTo, setCustomTo] = useState<Date | null>(null);

  const { from, to } = useMemo(() => {
    if (range === "custom" && customFrom && customTo) {
      return { from: customFrom, to: customTo };
    }
    const now = new Date();
    const days = RANGE_DAYS[range] || 30;
    return {
      from: new Date(now.getTime() - days * 86400000),
      to: now,
    };
  }, [range, customFrom, customTo]);

  const { data, loading, error, refresh } = useAnalytics(project.id, from, to);

  // Inventory breakdown from existing project data
  const inventoryBreakdown = useMemo(() => {
    const unidades = project.unidades || [];
    const statusMap: Record<string, { count: number; color: string }> = {
      disponible: { count: 0, color: "#22c55e" },
      separado: { count: 0, color: "#f59e0b" },
      reservada: { count: 0, color: "#3b82f6" },
      vendida: { count: 0, color: "#ef4444" },
    };
    for (const u of unidades) {
      if (statusMap[u.estado]) {
        statusMap[u.estado].count++;
      }
    }
    return statusMap;
  }, [project.unidades]);

  const totalUnits = project.unidades?.length || 0;

  // Error state
  if (error && !data) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className={pageTitle}>Estadísticas</h1>
            <p className={pageDescription}>
              Visualiza el rendimiento de tu micrositio
            </p>
          </div>
        </div>
        <div className={emptyState}>
          <div className={emptyStateIcon}>
            <AlertTriangle size={24} className="text-amber-400" />
          </div>
          <p className={emptyStateTitle}>Error al cargar datos</p>
          <p className={emptyStateDescription}>{error}</p>
          <button
            onClick={refresh}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-[var(--surface-3)] border border-[var(--border-default)] rounded-lg font-ui text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-4)] transition-all"
          >
            <RefreshCw size={13} />
            Reintentar
          </button>
        </div>
      </motion.div>
    );
  }

  // Initial loading
  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-[var(--site-primary)]" />
      </div>
    );
  }

  // No data yet (empty analytics)
  if (!data) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className={pageTitle}>Estadísticas</h1>
            <p className={pageDescription}>
              Visualiza el rendimiento de tu micrositio
            </p>
          </div>
        </div>
        <div className={emptyState}>
          <div className={emptyStateIcon}>
            <BarChart3 size={24} className="text-[var(--text-muted)]" />
          </div>
          <p className={emptyStateTitle}>Sin datos disponibles</p>
          <p className={emptyStateDescription}>
            Los datos aparecerán cuando tu micrositio reciba visitantes
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 relative"
    >
      {/* Loading overlay when refreshing with existing data */}
      {loading && (
        <div className="absolute inset-0 z-10 bg-[var(--surface-0)]/60 backdrop-blur-[2px] rounded-xl flex items-center justify-center pointer-events-none">
          <Loader2 size={24} className="animate-spin text-[var(--site-primary)]" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className={pageTitle}>Estadísticas</h1>
          <p className={pageDescription}>
            Rendimiento de tu micrositio en tiempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <button
              onClick={() => exportAnalyticsCSV(data, project.nombre)}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--surface-2)] text-[var(--text-tertiary)] hover:text-white hover:bg-[var(--surface-3)] transition-all"
              title="Exportar CSV"
            >
              <Download size={13} />
            </button>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--surface-2)] text-[var(--text-tertiary)] hover:text-white hover:bg-[var(--surface-3)] transition-all disabled:opacity-50"
            title="Actualizar datos"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
          <TimeRangeSelector
            value={range}
            onChange={setRange}
            onCustomRange={(f, t) => {
              setCustomFrom(f);
              setCustomTo(t);
            }}
          />
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard
          label="Visitas"
          value={data.summary.total_views}
          icon={<Eye size={16} />}
        />
        <KPICard
          label="Visitantes únicos"
          value={data.summary.unique_visitors}
          icon={<Users size={16} />}
        />
        <KPICard
          label="Leads"
          value={data.total_leads}
          icon={<UserCheck size={16} />}
        />
        <KPICard
          label="Conversión"
          value={`${data.conversion_rate}%`}
          icon={<Percent size={16} />}
        />
        <KPICard
          label="Rebote"
          value={`${data.bounce_rate}%`}
          icon={<ArrowDownRight size={16} />}
        />
        <KPICard
          label="Págs/sesión"
          value={data.avg_pages_per_session.toFixed(1)}
          icon={<Layers size={16} />}
        />
      </div>

      {/* Views Chart */}
      <div className={sectionCard}>
        <div className={sectionTitle}>
          <TrendingUp size={14} className="text-[var(--site-primary)]" />
          Visitas en el tiempo
        </div>
        <p className={sectionDescription}>
          Visitas totales y visitantes únicos por día
        </p>
        <ViewsChart data={data.views_over_time} />
      </div>

      {/* Breakdowns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pages */}
        <div className={sectionCard}>
          <div className={sectionTitle}>Páginas más vistas</div>
          <RankedList data={data.views_by_page} />
        </div>

        {/* Traffic Sources */}
        <div className={sectionCard}>
          <div className={sectionTitle}>Fuentes de tráfico</div>
          <RankedList data={data.views_by_referrer} />
        </div>

        {/* Devices */}
        <div className={sectionCard}>
          <div className={sectionTitle}>Dispositivos</div>
          <div className="pt-2">
            <DeviceChart data={data.views_by_device} />
          </div>
        </div>

        {/* Countries */}
        <div className={sectionCard}>
          <div className={sectionTitle}>Países</div>
          <RankedList data={data.views_by_country} />
        </div>
      </div>

      {/* Interactions */}
      <div className={sectionCard}>
        <div className={sectionTitle}>Interacciones</div>
        <p className={sectionDescription}>
          Clicks en WhatsApp, descargas de brochure, reproducciones de video y más
        </p>
        <InteractionCards summary={data.summary} />
      </div>

      {/* Leads Section */}
      <div className={sectionCard}>
        <div className={sectionTitle}>
          <UserCheck size={14} className="text-[var(--site-primary)]" />
          Leads en el tiempo
        </div>
        <LeadsChart data={data.leads_over_time} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Lead Sources */}
        <div className={sectionCard}>
          <div className={sectionTitle}>Leads por fuente</div>
          <p className={sectionDescription}>Distribución por UTM source</p>
          <RankedList data={data.leads_by_source} />
        </div>

        {/* Lead Tipologías */}
        <div className={sectionCard}>
          <div className={sectionTitle}>Leads por tipología</div>
          <p className={sectionDescription}>Tipologías de mayor interés</p>
          <RankedList data={data.leads_by_tipologia} />
        </div>

        {/* Lead Countries */}
        <div className={sectionCard}>
          <div className={sectionTitle}>Leads por país</div>
          <p className={sectionDescription}>Origen geográfico de los leads</p>
          <RankedList data={data.leads_by_country} />
        </div>
      </div>

      {/* Inventory Overview */}
      {totalUnits > 0 && (
        <div className={sectionCard}>
          <div className={sectionTitle}>Inventario</div>
          <p className={sectionDescription}>
            Estado actual de las {totalUnits} unidades del proyecto
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
            {Object.entries(inventoryBreakdown).map(([status, { count, color }]) => (
              <div
                key={status}
                className="flex items-center gap-3 p-3 bg-[var(--surface-2)] rounded-xl border border-[var(--border-subtle)]"
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <div>
                  <p className="font-heading text-xl font-light text-white leading-none">
                    {count}
                  </p>
                  <p className="font-ui text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)] mt-0.5 capitalize">
                    {status === "disponible" ? "Disponible" :
                     status === "separado" ? "Separado" :
                     status === "reservada" ? "Reservada" :
                     "Vendida"}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {/* Progress bar */}
          <div className="flex h-2 rounded-full overflow-hidden mt-4 bg-[var(--surface-3)]">
            {Object.entries(inventoryBreakdown).map(([status, { count, color }]) => {
              const pct = totalUnits > 0 ? (count / totalUnits) * 100 : 0;
              if (pct === 0) return null;
              return (
                <div
                  key={status}
                  className="h-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
