"use client";

export const dynamic = "force-dynamic";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CircleDollarSign,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Download,
  DollarSign,
  Layers,
} from "lucide-react";
import { useProjects, useFinancialSummary } from "@/hooks/useProjectsQuery";
import { useAuthRole } from "@/hooks/useAuthContext";
import { trackDashboardEvent } from "@/lib/dashboard-tracking";
import {
  TimeRangeSelector,
  type TimeRange,
} from "@/components/dashboard/analytics/TimeRangeSelector";
import { NodDoDropdown } from "@/components/ui/NodDoDropdown";
import { FinancialKPIStrip } from "@/components/dashboard/analytics/FinancialKPIStrip";
import { InventoryBreakdown } from "@/components/dashboard/analytics/InventoryBreakdown";
import { ProjectFinancialTable } from "@/components/dashboard/analytics/ProjectFinancialTable";
import { RevenueChart } from "@/components/dashboard/analytics/RevenueChart";
import { UnitsSoldTable } from "@/components/dashboard/analytics/UnitsSoldTable";

const RANGE_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };

export default function FinancieroPage() {
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { user, role } = useAuthRole();
  const [projectId, setProjectId] = useState("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("90d");
  const [customFrom, setCustomFrom] = useState<Date | null>(null);
  const [customTo, setCustomTo] = useState<Date | null>(null);

  // Track page view
  useEffect(() => {
    trackDashboardEvent(
      "dashboard_view",
      { page: "financiero" },
      user?.id,
      role || undefined
    );
  }, [user?.id, role]);

  const { from, to } = useMemo(() => {
    if (timeRange === "custom" && customFrom && customTo) {
      return { from: customFrom, to: customTo };
    }
    const now = new Date();
    const days = RANGE_DAYS[timeRange] || 90;
    return {
      from: new Date(now.getTime() - days * 86400000),
      to: now,
    };
  }, [timeRange, customFrom, customTo]);

  const {
    data,
    isLoading: loading,
    error,
    refetch: refresh,
  } = useFinancialSummary(projectId, from, to);

  // Project selector options
  const projectOptions = useMemo(
    () => [
      { value: "all", label: "Todos los proyectos" },
      ...projects.map((p) => ({ value: p.id, label: p.nombre })),
    ],
    [projects]
  );

  // Export CSV
  const exportCSV = () => {
    if (!data) return;

    const rows: string[][] = [
      ["Métrica", "Valor"],
      ["Ingresos totales", String(data.total_revenue)],
      ["Inventario disponible", String(data.total_available_value)],
      ["Valor reservado", String(data.total_reservada_value)],
      ["Ritmo de ventas", `${data.avg_sales_velocity} unidades/mes`],
      ["Sell-through", `${data.sell_through_rate}%`],
      ["Total unidades", String(data.total_units)],
      ["Disponible", String(data.total_disponible)],
      ["Próximamente", String(data.total_proximamente)],
      ["Separado", String(data.total_separado)],
      ["Reservada", String(data.total_reservada)],
      ["Vendida", String(data.total_vendida)],
      [],
      ["Mes", "Ingresos", "Unidades"],
      ...data.monthly_revenue.map((m) => [
        m.month,
        String(m.revenue),
        String(m.count),
      ]),
      [],
      ["Unidad", "Tipología", "Área", "Precio", "Fecha"],
      ...data.units_sold_detail.map((u) => [
        u.identificador,
        u.tipologia || "—",
        u.area_m2 ? `${u.area_m2}` : "—",
        String(u.precio),
        u.sold_at,
      ]),
    ];

    const csv = rows
      .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financiero_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Error state
  if (error && !data) {
    return (
      <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <CircleDollarSign size={20} className="text-[var(--site-primary)]" />
          <h1 className="font-heading text-3xl font-light text-[var(--text-primary)]">
            Financiero
          </h1>
        </div>
        <div className="glass-card p-12 text-center">
          <AlertTriangle
            size={48}
            className="text-amber-400 mx-auto mb-4"
          />
          <h3 className="font-heading text-xl text-[var(--text-secondary)] mb-2">
            Error al cargar datos
          </h3>
          <p className="text-sm text-[var(--text-tertiary)] font-mono">
            {error?.message || "Error desconocido"}
          </p>
          <button
            onClick={() => refresh()}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[var(--surface-3)] border border-[var(--border-default)] rounded-lg font-ui text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-4)] transition-all"
          >
            <RefreshCw size={13} />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <CircleDollarSign
            size={20}
            className="text-[var(--site-primary)]"
          />
          <h1 className="font-heading text-3xl font-light text-[var(--text-primary)]">
            Financiero
          </h1>
        </div>
        <p className="text-sm text-[var(--text-tertiary)] font-mono font-light">
          Métricas de ventas e inventario de tus proyectos
        </p>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between"
      >
        <div className="flex items-center gap-3">
          {!projectsLoading && projects.length > 0 && (
            <NodDoDropdown
              variant="dashboard"
              size="md"
              value={projectId}
              onChange={setProjectId}
              options={projectOptions}
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <button
              onClick={exportCSV}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--surface-2)] text-[var(--text-tertiary)] hover:text-white hover:bg-[var(--surface-3)] transition-all"
              title="Exportar CSV"
            >
              <Download size={13} />
            </button>
          )}
          <button
            onClick={() => refresh()}
            disabled={loading}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--surface-2)] text-[var(--text-tertiary)] hover:text-white hover:bg-[var(--surface-3)] transition-all disabled:opacity-50"
            title="Actualizar datos"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
          <TimeRangeSelector
            value={timeRange}
            onChange={setTimeRange}
            onCustomRange={(f, t) => {
              setCustomFrom(f);
              setCustomTo(t);
            }}
          />
        </div>
      </motion.div>

      {/* Empty state - no projects */}
      {!projectsLoading && projects.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="glass-card p-12 text-center"
        >
          <CircleDollarSign
            size={48}
            className="text-[var(--text-muted)] mx-auto mb-4"
          />
          <h3 className="font-heading text-xl text-[var(--text-secondary)] mb-2">
            No hay proyectos
          </h3>
          <p className="text-sm text-[var(--text-tertiary)] font-mono">
            Crea un proyecto para ver métricas financieras
          </p>
        </motion.div>
      )}

      {/* Loading */}
      {loading && !data && (
        <div className="flex items-center justify-center py-16">
          <Loader2
            size={24}
            className="animate-spin text-[var(--site-primary)]"
          />
        </div>
      )}

      {/* Content */}
      {data && (
        <div className="space-y-6 relative">
          {/* Loading overlay when refreshing */}
          {loading && (
            <div className="absolute inset-0 z-10 bg-[var(--surface-0)]/60 backdrop-blur-[2px] rounded-xl flex items-center justify-center pointer-events-none">
              <Loader2
                size={24}
                className="animate-spin text-[var(--site-primary)]"
              />
            </div>
          )}

          {/* KPI Strip */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <FinancialKPIStrip
              totalRevenue={data.total_revenue}
              availableValue={data.total_available_value}
              reservedValue={data.total_reservada_value}
              salesVelocity={data.avg_sales_velocity}
              sellThroughRate={data.sell_through_rate}
              totalUnits={data.total_units}
              currency={data.primary_currency}
            />
          </motion.div>

          {/* Inventory Breakdown */}
          {data.total_units > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="glass-card p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Layers size={14} className="text-[var(--site-primary)]" />
                <span className="font-ui text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  Inventario
                </span>
              </div>
              <InventoryBreakdown
                disponible={data.total_disponible}
                proximamente={data.total_proximamente}
                separado={data.total_separado}
                reservada={data.total_reservada}
                vendida={data.total_vendida}
              />
            </motion.div>
          )}

          {/* Per-project breakdown table (only when viewing "all") */}
          {projectId === "all" && data.projects.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="glass-card p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <CircleDollarSign
                  size={14}
                  className="text-[var(--site-primary)]"
                />
                <span className="font-ui text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  Desglose por proyecto
                </span>
              </div>
              <ProjectFinancialTable projects={data.projects} />
            </motion.div>
          )}

          {/* Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={14} className="text-[var(--site-primary)]" />
              <span className="font-ui text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Ingresos mensuales
              </span>
            </div>
            <RevenueChart
              data={data.monthly_revenue}
              currency={data.primary_currency}
            />
          </motion.div>

          {/* Units Sold Table */}
          {data.units_sold_detail.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="glass-card p-6"
            >
              <div className="flex items-center gap-2 mb-2">
                <DollarSign
                  size={14}
                  className="text-[var(--site-primary)]"
                />
                <span className="font-ui text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  Unidades vendidas
                </span>
              </div>
              <p className="text-xs text-[var(--text-tertiary)] font-mono mb-2">
                {data.units_sold_detail.length} unidades vendidas en el periodo
              </p>
              <UnitsSoldTable
                units={data.units_sold_detail}
                currency={data.primary_currency}
              />
            </motion.div>
          )}

          {/* No financial data */}
          {data.total_units === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="glass-card p-12 text-center"
            >
              <CircleDollarSign
                size={48}
                className="text-[var(--text-muted)] mx-auto mb-4"
              />
              <h3 className="font-heading text-xl text-[var(--text-secondary)] mb-2">
                Sin datos financieros
              </h3>
              <p className="text-sm text-[var(--text-tertiary)] font-mono">
                Los datos aparecerán cuando haya unidades en tus proyectos
              </p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
