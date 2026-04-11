"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Users,
  Calendar,
} from "lucide-react";
import { KPICard } from "@/components/dashboard/analytics/KPICard";
import { RevenueChart } from "@/components/admin/RevenueChart";

interface RevenueData {
  mrr: number;
  arr: number;
  trial_conversion_rate: number;
  churn_rate: number;
  revenue_over_time: Array<{ month: string; revenue: number }>;
  upcoming_renewals: Array<{
    id: string;
    user_id: string;
    plan: string;
    expires_at: string;
    user: { email: string } | null;
  }>;
  total_payments: number;
  completed_payments: number;
}

export default function AdminRevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/admin/revenue");
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-[var(--site-primary)]" size={28} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle size={28} className="text-amber-400 mb-3" />
        <p className="text-sm text-[var(--text-secondary)] mb-1">Error al cargar revenue</p>
        <p className="text-[11px] text-[var(--text-muted)] mb-4">Verifica tu conexión e intenta de nuevo</p>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-default)] transition-all"
        >
          <RefreshCw size={13} /> Reintentar
        </button>
      </div>
    );
  }

  const planColors: Record<string, string> = {
    basico: "text-neutral-400 bg-neutral-500/15 border-neutral-500/20",
    pro: "text-[var(--site-primary)] bg-[rgba(var(--site-primary-rgb),0.15)] border-[rgba(var(--site-primary-rgb),0.2)]",
    enterprise: "text-[#d4b05a] bg-[rgba(212,176,90,0.15)] border-[rgba(212,176,90,0.2)]",
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-light text-[var(--text-primary)]">
              Revenue & Billing
            </h1>
            <p className="text-[var(--text-tertiary)] text-sm mt-1">
              Análisis financiero de la plataforma
            </p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-xs font-ui font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-default)] transition-all"
          >
            <RefreshCw size={13} />
            Actualizar
          </button>
        </div>
      </motion.div>

      {/* KPI Strip */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <KPICard
          label="MRR"
          value={`$${data.mrr.toLocaleString("es-CO")}`}
          icon={<DollarSign size={16} />}
          suffix="mensual"
        />
        <KPICard
          label="ARR"
          value={`$${data.arr.toLocaleString("es-CO")}`}
          icon={<DollarSign size={16} />}
          suffix="anual"
        />
        <KPICard
          label="Trial Conversion"
          value={`${data.trial_conversion_rate.toFixed(1)}%`}
          icon={<TrendingUp size={16} />}
          trend={data.trial_conversion_rate}
        />
        <KPICard
          label="Churn Rate"
          value={`${data.churn_rate.toFixed(1)}%`}
          icon={<TrendingDown size={16} />}
          trend={-data.churn_rate}
        />
      </motion.div>

      {/* Revenue Chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-5"
      >
        <h2 className="font-ui text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4">
          Revenue Over Time (Últimos 12 Meses)
        </h2>
        <RevenueChart data={data.revenue_over_time} />
      </motion.div>

      {/* Upcoming Renewals */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-ui text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Próximos Renewals (30 días)
          </h2>
          <span className="text-xs text-[var(--text-muted)]">
            {data.upcoming_renewals.length} renewal{data.upcoming_renewals.length !== 1 ? "s" : ""}
          </span>
        </div>

        {data.upcoming_renewals.length === 0 ? (
          <div className="py-12 text-center text-[var(--text-muted)] text-sm">
            <Calendar size={24} className="mx-auto mb-2 opacity-30" />
            <p>No hay renewals próximos</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.upcoming_renewals.map((renewal, i) => (
              <motion.div
                key={renewal.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.02 }}
                className="flex items-center justify-between py-3 border-b border-[var(--border-subtle)] last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                    <Users size={14} className="text-[var(--site-primary)]" />
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-primary)]">
                      {renewal.user?.email || "Email desconocido"}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-ui font-bold uppercase tracking-wider border ${planColors[renewal.plan] || planColors.basic}`}
                      >
                        {renewal.plan}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        Expira:{" "}
                        {new Date(renewal.expires_at).toLocaleDateString("es-CO", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Payment Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="font-ui text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Total Payments
            </span>
          </div>
          <span className="font-heading text-3xl font-light text-white">{data.total_payments}</span>
        </div>
        <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="font-ui text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Completed Payments
            </span>
          </div>
          <span className="font-heading text-3xl font-light text-white">
            {data.completed_payments}
          </span>
          <p className="text-[10px] text-[var(--text-muted)] mt-1">
            {data.total_payments > 0
              ? `${((data.completed_payments / data.total_payments) * 100).toFixed(1)}% success rate`
              : "—"}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
