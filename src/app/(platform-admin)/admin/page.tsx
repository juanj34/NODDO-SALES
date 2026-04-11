"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Users,
  FolderOpen,
  MessageSquare,
  Eye,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Activity,
  CalendarCheck,
  ShieldCheck,
  Download,
  ArrowRight,
} from "lucide-react";
import { KPICard } from "@/components/dashboard/analytics/KPICard";
import { ViewsChart } from "@/components/dashboard/analytics/ViewsChart";
import { LeadsChart } from "@/components/dashboard/analytics/LeadsChart";
import { RankedList } from "@/components/dashboard/analytics/RankedList";
import { DeviceChart } from "@/components/dashboard/analytics/DeviceChart";
import { InteractionCards } from "@/components/dashboard/analytics/InteractionCards";
import { TimeRangeSelector, type TimeRange } from "@/components/dashboard/analytics/TimeRangeSelector";
import { GrowthChart } from "@/components/admin/GrowthChart";
import { FunnelChart } from "@/components/admin/FunnelChart";
import { StorageOverview } from "@/components/admin/StorageOverview";
import type { PlatformStats } from "@/types";

const PLAN_COLORS: Record<string, string> = {
  basico: "text-neutral-400 bg-neutral-500/15",
  pro: "text-[var(--site-primary)] bg-[rgba(184,151,58,0.15)]",
  enterprise: "text-[#d4b05a] bg-[rgba(212,176,90,0.15)]",
};

function Section({ title, children, delay = 0 }: { title: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-5"
    >
      <h2 className="font-ui text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4">
        {title}
      </h2>
      {children}
    </motion.div>
  );
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [range, setRange] = useState<TimeRange>("30d");

  const fetchStats = useCallback(async (r: TimeRange) => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/admin/stats?range=${r}`);
      if (!res.ok) throw new Error();
      setStats(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(range);
  }, [range, fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-[var(--site-primary)]" size={28} />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle size={28} className="text-amber-400 mb-3" />
        <p className="text-sm text-[var(--text-secondary)] mb-1">Error al cargar estadísticas</p>
        <p className="text-[11px] text-[var(--text-muted)] mb-4">Verifica tu conexión e intenta de nuevo</p>
        <button
          onClick={() => fetchStats(range)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-default)] transition-all"
        >
          <RefreshCw size={13} /> Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-light text-[var(--text-primary)]">
            Panel de Administración
          </h1>
          <p className="text-[var(--text-tertiary)] text-sm mt-1">
            Vista general de la plataforma NODDO
          </p>
        </div>
        <TimeRangeSelector value={range} onChange={setRange} />
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Usuarios"
          value={stats.totalUsers}
          icon={<Users size={16} />}
          trend={stats.usersTrend}
        />
        <KPICard
          label="Proyectos"
          value={stats.totalProjects}
          icon={<FolderOpen size={16} />}
          trend={stats.projectsTrend}
        />
        <KPICard
          label="Leads"
          value={stats.leadsInRange}
          icon={<MessageSquare size={16} />}
          trend={stats.leadsTrend}
          suffix={`de ${stats.totalLeads} total`}
        />
        <KPICard
          label="Visitas"
          value={stats.platformSummary.total_views}
          icon={<Eye size={16} />}
          trend={stats.viewsTrend}
          suffix={`${stats.platformSummary.unique_visitors.toLocaleString("es-CO")} únicos`}
        />
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.3 }}
      >
        <h2 className="font-ui text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Ver actividad */}
          <Link
            href="/admin/actividad"
            className="group bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-5 hover:border-[var(--site-primary)] hover:bg-[var(--surface-2)] transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center group-hover:bg-[rgba(var(--site-primary-rgb),0.1)] group-hover:border-[var(--site-primary)] transition-all">
                <Activity size={20} className="text-[var(--site-primary)]" />
              </div>
              <ArrowRight size={14} className="text-[var(--text-muted)] group-hover:text-[var(--site-primary)] transition-colors" />
            </div>
            <h3 className="font-ui text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] group-hover:text-white transition-colors mb-1">
              Ver Actividad
            </h3>
            <p className="text-[10px] text-[var(--text-muted)] font-mono font-light">
              Logs de auditoría recientes
            </p>
          </Link>

          {/* Citas de hoy */}
          <Link
            href="/admin/citas?filter=today"
            className="group bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-5 hover:border-[var(--site-primary)] hover:bg-[var(--surface-2)] transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center group-hover:bg-[rgba(var(--site-primary-rgb),0.1)] group-hover:border-[var(--site-primary)] transition-all">
                <CalendarCheck size={20} className="text-[var(--site-primary)]" />
              </div>
              <ArrowRight size={14} className="text-[var(--text-muted)] group-hover:text-[var(--site-primary)] transition-colors" />
            </div>
            <h3 className="font-ui text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] group-hover:text-white transition-colors mb-1">
              Citas de Hoy
            </h3>
            <p className="text-[10px] text-[var(--text-muted)] font-mono font-light">
              Ver demos programadas hoy
            </p>
          </Link>

          {/* Gestionar admins */}
          <Link
            href="/admin/admins"
            className="group bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-5 hover:border-[var(--site-primary)] hover:bg-[var(--surface-2)] transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center group-hover:bg-[rgba(var(--site-primary-rgb),0.1)] group-hover:border-[var(--site-primary)] transition-all">
                <ShieldCheck size={20} className="text-[var(--site-primary)]" />
              </div>
              <ArrowRight size={14} className="text-[var(--text-muted)] group-hover:text-[var(--site-primary)] transition-colors" />
            </div>
            <h3 className="font-ui text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] group-hover:text-white transition-colors mb-1">
              Gestionar Admins
            </h3>
            <p className="text-[10px] text-[var(--text-muted)] font-mono font-light">
              Permisos de plataforma
            </p>
          </Link>

          {/* Exportar reporte */}
          <button
            onClick={() => {
              // TODO: Implementar export completo
              alert("Función de exportación completa en desarrollo");
            }}
            className="group bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-5 hover:border-[var(--site-primary)] hover:bg-[var(--surface-2)] transition-all text-left"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center group-hover:bg-[rgba(var(--site-primary-rgb),0.1)] group-hover:border-[var(--site-primary)] transition-all">
                <Download size={20} className="text-[var(--site-primary)]" />
              </div>
              <ArrowRight size={14} className="text-[var(--text-muted)] group-hover:text-[var(--site-primary)] transition-colors" />
            </div>
            <h3 className="font-ui text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] group-hover:text-white transition-colors mb-1">
              Exportar Reporte
            </h3>
            <p className="text-[10px] text-[var(--text-muted)] font-mono font-light">
              Descargar CSV completo
            </p>
          </button>
        </div>
      </motion.div>

      {/* Row 1: Views + Leads charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="Visitas y Visitantes" delay={0.05}>
          <ViewsChart data={stats.viewsOverTime} />
        </Section>
        <Section title="Leads" delay={0.1}>
          <LeadsChart data={stats.leadsOverTime} />
        </Section>
      </div>

      {/* Row 2: Growth charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="Nuevos Usuarios" delay={0.15}>
          <GrowthChart data={stats.usersOverTime} label="Usuarios" />
        </Section>
        <Section title="Nuevos Proyectos" delay={0.2}>
          <GrowthChart data={stats.projectsOverTime} label="Proyectos" />
        </Section>
      </div>

      {/* Row 3: Rankings + Device */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Section title="Top Proyectos por Visitas" delay={0.25}>
          <RankedList
            data={stats.topProjectsByViews.map((p) => ({
              label: p.nombre,
              count: p.views,
            }))}
          />
        </Section>
        <Section title="Top Proyectos por Leads" delay={0.3}>
          <RankedList
            data={stats.topProjectsByLeads.map((p) => ({
              label: p.nombre,
              count: p.leads,
            }))}
          />
        </Section>
        <Section title="Dispositivos" delay={0.35}>
          <DeviceChart data={stats.viewsByDevice} />
        </Section>
      </div>

      {/* Row 4: Country + Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="Origen por País" delay={0.4}>
          <RankedList data={stats.viewsByCountry} />
        </Section>
        <Section title="Embudo de Conversión" delay={0.45}>
          <FunnelChart data={stats.funnel} />
        </Section>
      </div>

      {/* Row 5: Interactions */}
      <Section title="Interacciones" delay={0.5}>
        <InteractionCards summary={stats.platformSummary} />
      </Section>

      {/* Row 6: Plan distribution */}
      <Section title="Distribución de Planes" delay={0.55}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(stats.planDistribution).map(([plan, count]) => (
            <div key={plan} className="flex items-center gap-3">
              <span className={`px-2 py-1 rounded-md font-ui text-[10px] font-bold uppercase tracking-wider ${PLAN_COLORS[plan] || "text-neutral-400 bg-neutral-500/15"}`}>
                {plan}
              </span>
              <span className="font-heading text-lg font-light text-white">{count}</span>
            </div>
          ))}
          {stats.totalUsers - Object.values(stats.planDistribution).reduce((a, b) => a + b, 0) > 0 && (
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 rounded-md font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--surface-3)]">
                Sin plan
              </span>
              <span className="font-heading text-lg font-light text-white">
                {stats.totalUsers - Object.values(stats.planDistribution).reduce((a, b) => a + b, 0)}
              </span>
            </div>
          )}
        </div>
      </Section>

      {/* Row 7: Storage overview */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.3 }}
      >
        <h2 className="font-ui text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4">
          Almacenamiento Global
        </h2>
        <StorageOverview data={stats.storage} />
      </motion.div>
    </div>
  );
}
