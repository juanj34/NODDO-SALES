"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  FolderOpen,
  Globe,
  MessageSquare,
  TrendingUp,
  UserPlus,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

interface Stats {
  totalUsers: number;
  totalProjects: number;
  publishedProjects: number;
  leadsThisMonth: number;
  totalLeads: number;
  recentSignups: number;
  planDistribution: Record<string, number>;
}

const PLAN_COLORS: Record<string, string> = {
  trial: "text-neutral-400 bg-neutral-500/15",
  proyecto: "text-[var(--site-primary)] bg-[rgba(184,151,58,0.15)]",
  studio: "text-[#d4b05a] bg-[rgba(212,176,90,0.15)]",
  enterprise: "text-[var(--site-primary)] bg-[rgba(var(--site-primary-rgb),0.15)]",
};

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error();
      setStats(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

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
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-default)] transition-all"
        >
          <RefreshCw size={13} /> Reintentar
        </button>
      </div>
    );
  }

  const metrics = [
    {
      label: "Total Usuarios",
      value: stats.totalUsers,
      icon: Users,
      color: "text-[var(--site-primary)]",
      bgColor: "bg-[rgba(184,151,58,0.15)] border-[rgba(184,151,58,0.20)]",
    },
    {
      label: "Total Proyectos",
      value: stats.totalProjects,
      icon: FolderOpen,
      color: "text-[#d4b05a]",
      bgColor: "bg-[rgba(212,176,90,0.15)] border-[rgba(212,176,90,0.20)]",
    },
    {
      label: "Publicados",
      value: stats.publishedProjects,
      icon: Globe,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/15 border-emerald-500/20",
    },
    {
      label: "Leads este mes",
      value: stats.leadsThisMonth,
      icon: MessageSquare,
      color: "text-[var(--site-primary)]",
      bgColor: "bg-[rgba(var(--site-primary-rgb),0.15)] border-[rgba(var(--site-primary-rgb),0.20)]",
    },
    {
      label: "Total Leads",
      value: stats.totalLeads,
      icon: TrendingUp,
      color: "text-amber-400",
      bgColor: "bg-amber-500/15 border-amber-500/20",
    },
    {
      label: "Registros (7d)",
      value: stats.recentSignups,
      icon: UserPlus,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/15 border-cyan-500/20",
    },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-light text-[var(--text-primary)]">
          Panel de Administración
        </h1>
        <p className="text-[var(--text-tertiary)] text-sm mt-1">
          Vista general de la plataforma NODDO
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-4 hover:border-[var(--border-default)] transition-all"
            >
              <div className={`w-8 h-8 rounded-lg ${m.bgColor} border flex items-center justify-center mb-3`}>
                <Icon size={16} className={m.color} />
              </div>
              <p className="font-heading text-2xl font-light text-white">{m.value}</p>
              <p className="text-[10px] text-[var(--text-muted)] font-ui uppercase tracking-wider mt-1">
                {m.label}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Plan distribution */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-6"
      >
        <h2 className="font-ui text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4">
          Distribución de Planes
        </h2>
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
      </motion.div>
    </div>
  );
}
