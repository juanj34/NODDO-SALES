"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Webhook, Loader2, AlertTriangle, RefreshCw, Activity, TrendingUp } from "lucide-react";
import { WebhookLogTable } from "@/components/admin/WebhookLogTable";
import { KPICard } from "@/components/dashboard/analytics/KPICard";
import type { WebhookLog } from "@/types";

interface ProjectStat {
  proyecto_id: string;
  nombre: string;
  slug: string;
  total_webhooks: number;
  success_rate: number;
  last_delivery: string | null;
}

interface WebhooksData {
  total_projects_with_webhooks: number;
  total_deliveries: number;
  global_success_rate: number;
  project_stats: ProjectStat[];
  recent_logs: WebhookLog[];
}

export default function AdminWebhooksPage() {
  const [data, setData] = useState<WebhooksData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/admin/webhooks");
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
        <p className="text-sm text-[var(--text-secondary)] mb-1">Error al cargar webhooks</p>
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
              Webhook Monitoring
            </h1>
            <p className="text-[var(--text-tertiary)] text-sm mt-1">
              Monitoreo de entregas y health de webhooks
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
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <KPICard
          label="Proyectos con Webhooks"
          value={data.total_projects_with_webhooks.toString()}
          icon={<Webhook size={16} />}
          suffix="activos"
        />
        <KPICard
          label="Total Entregas"
          value={data.total_deliveries.toString()}
          icon={<Activity size={16} />}
          suffix="últimos 100"
        />
        <KPICard
          label="Success Rate (7 días)"
          value={`${data.global_success_rate.toFixed(1)}%`}
          icon={<TrendingUp size={16} />}
          trend={data.global_success_rate}
        />
      </motion.div>

      {/* Project Stats */}
      {data.project_stats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-5"
        >
          <h2 className="font-ui text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4">
            Proyectos con Webhooks Configurados
          </h2>
          <div className="space-y-2">
            {data.project_stats.map((project, i) => (
              <motion.div
                key={project.proyecto_id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.02 }}
                className="flex items-center justify-between py-3 border-b border-[var(--border-subtle)] last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                    <Webhook size={14} className="text-[var(--site-primary)]" />
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-primary)]">{project.nombre}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {project.total_webhooks} entrega{project.total_webhooks !== 1 ? "s" : ""}
                      </span>
                      {project.last_delivery && (
                        <span className="text-[10px] text-[var(--text-muted)]">
                          • Última:{" "}
                          {new Date(project.last_delivery).toLocaleDateString("es-CO", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div
                  className="px-2 py-1 rounded-md text-[10px] font-ui font-bold uppercase tracking-wider border"
                  style={{
                    background:
                      project.success_rate >= 75
                        ? "rgba(74, 222, 128, 0.15)"
                        : project.success_rate >= 50
                          ? "rgba(251, 191, 36, 0.15)"
                          : "rgba(239, 68, 68, 0.15)",
                    color:
                      project.success_rate >= 75
                        ? "#4ade80"
                        : project.success_rate >= 50
                          ? "#fbbf24"
                          : "#ef4444",
                    borderColor:
                      project.success_rate >= 75
                        ? "rgba(74, 222, 128, 0.2)"
                        : project.success_rate >= 50
                          ? "rgba(251, 191, 36, 0.2)"
                          : "rgba(239, 68, 68, 0.2)",
                  }}
                >
                  {project.success_rate.toFixed(1)}%
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Logs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-5"
      >
        <h2 className="font-ui text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4">
          Últimas Entregas (50 Recientes)
        </h2>
        <WebhookLogTable logs={data.recent_logs} />
      </motion.div>
    </div>
  );
}
