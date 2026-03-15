"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { HeartPulse, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { HealthStatusCard } from "@/components/admin/HealthStatusCard";

interface HealthMetric {
  status: "healthy" | "warning" | "critical";
  value: number | string;
  max?: number;
  label: string;
  metadata?: Record<string, unknown>;
}

interface CriticalIncident {
  id: string;
  metric_type: string;
  value: number;
  created_at: string;
  metadata: Record<string, unknown>;
}

interface HealthData {
  database: HealthMetric;
  storage: HealthMetric;
  webhooks: HealthMetric;
  api_errors: HealthMetric;
  critical_incidents: CriticalIncident[];
}

const METRIC_LABELS: Record<string, string> = {
  db_connections: "Conexiones DB",
  storage_usage: "Uso de Storage",
  api_errors: "Errores API",
  email_delivery: "Entrega Email",
  webhook_failures: "Fallos Webhook",
};

export default function AdminHealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/admin/health");
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
        <p className="text-sm text-[var(--text-secondary)] mb-1">Error al cargar health</p>
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

  // Overall system status (worst status wins)
  const statuses = [data.database.status, data.storage.status, data.webhooks.status, data.api_errors.status];
  const overallStatus = statuses.includes("critical")
    ? "critical"
    : statuses.includes("warning")
      ? "warning"
      : "healthy";

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
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-2xl font-light text-[var(--text-primary)]">
                System Health
              </h1>
              <span
                className="px-2 py-1 rounded-md font-ui text-[9px] font-bold uppercase tracking-wider border"
                style={{
                  background:
                    overallStatus === "healthy"
                      ? "rgba(74, 222, 128, 0.15)"
                      : overallStatus === "warning"
                        ? "rgba(251, 191, 36, 0.15)"
                        : "rgba(239, 68, 68, 0.15)",
                  color:
                    overallStatus === "healthy"
                      ? "#4ade80"
                      : overallStatus === "warning"
                        ? "#fbbf24"
                        : "#ef4444",
                  borderColor:
                    overallStatus === "healthy"
                      ? "rgba(74, 222, 128, 0.2)"
                      : overallStatus === "warning"
                        ? "rgba(251, 191, 36, 0.2)"
                        : "rgba(239, 68, 68, 0.2)",
                }}
              >
                {overallStatus}
              </span>
            </div>
            <p className="text-[var(--text-tertiary)] text-sm mt-1">
              Monitoreo de infraestructura y servicios
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

      {/* Health Status Cards */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <HealthStatusCard
          label={data.database.label}
          status={data.database.status}
          value={data.database.value}
          max={data.database.max}
          metadata={data.database.metadata}
        />
        <HealthStatusCard
          label={data.storage.label}
          status={data.storage.status}
          value={data.storage.value}
          max={data.storage.max}
          suffix="GB"
          metadata={data.storage.metadata}
        />
        <HealthStatusCard
          label={data.webhooks.label}
          status={data.webhooks.status}
          value={data.webhooks.value}
          suffix="%"
          metadata={data.webhooks.metadata}
        />
        <HealthStatusCard
          label={data.api_errors.label}
          status={data.api_errors.status}
          value={data.api_errors.value}
          max={data.api_errors.max}
          metadata={data.api_errors.metadata}
        />
      </motion.div>

      {/* Critical Incidents Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-ui text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Incidentes Críticos (Últimos 10)
          </h2>
          <span className="text-xs text-[var(--text-muted)]">
            {data.critical_incidents.length} incidente{data.critical_incidents.length !== 1 ? "s" : ""}
          </span>
        </div>

        {data.critical_incidents.length === 0 ? (
          <div className="text-center py-12">
            <HeartPulse size={24} className="mx-auto mb-2 opacity-30 text-green-400" />
            <p className="text-xs text-[var(--text-muted)]">
              No hay incidentes críticos registrados
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.critical_incidents.map((incident, i) => (
              <motion.div
                key={incident.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.02 }}
                className="flex items-center justify-between py-3 border-b border-[var(--border-subtle)] last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
                    <AlertTriangle size={14} className="text-red-400" />
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-primary)]">
                      {METRIC_LABELS[incident.metric_type] || incident.metric_type}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-[var(--text-muted)]">
                        Valor: {incident.value}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        • {new Date(incident.created_at).toLocaleString("es-CO", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
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
    </div>
  );
}
