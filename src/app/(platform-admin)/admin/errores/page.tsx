"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Clock,
  User,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Filter,
  Bug,
} from "lucide-react";

/* ── Types ───────────────────────────────────────────────────────────── */

interface ErrorLog {
  id: string;
  error_message: string;
  error_stack: string | null;
  error_code: string | null;
  route: string;
  method: string;
  status_code: number;
  user_id: string | null;
  user_email: string | null;
  user_role: string | null;
  proyecto_id: string | null;
  proyecto_nombre: string | null;
  severity: "warning" | "error" | "critical";
  fingerprint: string | null;
  occurrence_count: number;
  resolved: boolean;
  resolved_at: string | null;
  resolution_note: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
}

interface ErrorStats {
  total_unresolved: number;
  critical: number;
  errors: number;
  warnings: number;
}

interface ErrorsResponse {
  errors: ErrorLog[];
  total: number;
  routes: string[];
  stats: ErrorStats;
}

/* ── Severity config ─────────────────────────────────────────────────── */

const severityConfig = {
  critical: {
    label: "Crítico",
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.12)",
    border: "rgba(239, 68, 68, 0.25)",
    icon: AlertOctagon,
  },
  error: {
    label: "Error",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.12)",
    border: "rgba(245, 158, 11, 0.25)",
    icon: XCircle,
  },
  warning: {
    label: "Warning",
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.12)",
    border: "rgba(59, 130, 246, 0.25)",
    icon: AlertTriangle,
  },
};

/* ── Component ───────────────────────────────────────────────────────── */

export default function AdminErrorsPage() {
  const [data, setData] = useState<ErrorsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Filters
  const [severityFilter, setSeverityFilter] = useState<string>("");
  const [routeFilter, setRouteFilter] = useState<string>("");
  const [showResolved, setShowResolved] = useState(false);

  // Expanded row
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Resolving state
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams();
      if (severityFilter) params.set("severity", severityFilter);
      if (routeFilter) params.set("route", routeFilter);
      params.set("resolved", showResolved ? "true" : "false");
      params.set("limit", "100");

      const res = await fetch(`/api/admin/errors?${params}`);
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [severityFilter, routeFilter, showResolved]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleResolve = async (id: string, resolved: boolean) => {
    setResolvingId(id);
    try {
      const res = await fetch("/api/admin/errors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, resolved }),
      });
      if (res.ok) {
        await fetchData();
      }
    } finally {
      setResolvingId(null);
    }
  };

  /* ── Loading ─────────────────────────────────────────────────────── */

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-[var(--site-primary)]" size={28} />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle size={28} className="text-amber-400 mb-3" />
        <p className="text-sm text-[var(--text-secondary)] mb-1">Error al cargar errores</p>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 mt-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:text-white transition-all"
        >
          <RefreshCw size={13} /> Reintentar
        </button>
      </div>
    );
  }

  const stats = data?.stats;
  const errors = data?.errors ?? [];
  const routes = data?.routes ?? [];

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
                Error Log
              </h1>
              {stats && stats.total_unresolved > 0 && (
                <span
                  className="px-2 py-1 rounded-md font-mono text-[11px] font-medium"
                  style={{
                    background: stats.critical > 0 ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
                    color: stats.critical > 0 ? "#ef4444" : "#f59e0b",
                    border: `1px solid ${stats.critical > 0 ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}`,
                  }}
                >
                  {stats.total_unresolved} sin resolver
                </span>
              )}
            </div>
            <p className="text-[var(--text-tertiary)] text-sm mt-1">
              Errores de API con contexto de usuario y proyecto
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-xs font-ui font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-default)] transition-all disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Actualizar
          </button>
        </div>
      </motion.div>

      {/* Stats strip */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          <StatCard label="Sin resolver" value={stats.total_unresolved} color="#f4f0e8" />
          <StatCard label="Críticos" value={stats.critical} color="#ef4444" />
          <StatCard label="Errores" value={stats.errors} color="#f59e0b" />
          <StatCard label="Warnings" value={stats.warnings} color="#3b82f6" />
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="flex flex-wrap items-center gap-3"
      >
        <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
          <Filter size={13} />
          <span className="text-[11px] font-ui font-bold uppercase tracking-wider">Filtros</span>
        </div>

        {/* Severity filter */}
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="input-glass text-xs px-3 py-1.5 rounded-lg min-w-[120px]"
        >
          <option value="">Todas las severidades</option>
          <option value="critical">Crítico</option>
          <option value="error">Error</option>
          <option value="warning">Warning</option>
        </select>

        {/* Route filter */}
        <select
          value={routeFilter}
          onChange={(e) => setRouteFilter(e.target.value)}
          className="input-glass text-xs px-3 py-1.5 rounded-lg min-w-[180px]"
        >
          <option value="">Todas las rutas</option>
          {routes.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        {/* Resolved toggle */}
        <button
          onClick={() => setShowResolved(!showResolved)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all ${
            showResolved
              ? "bg-green-500/10 border-green-500/20 text-green-400"
              : "bg-[var(--surface-2)] border-[var(--border-subtle)] text-[var(--text-secondary)]"
          }`}
        >
          <CheckCircle2 size={13} />
          {showResolved ? "Mostrando resueltos" : "Ver resueltos"}
        </button>
      </motion.div>

      {/* Error list */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="space-y-2"
      >
        {errors.length === 0 ? (
          <div className="text-center py-16 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl">
            <Bug size={28} className="mx-auto mb-3 opacity-20 text-green-400" />
            <p className="text-sm text-[var(--text-secondary)]">
              {showResolved ? "No hay errores resueltos" : "No hay errores pendientes"}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              Los errores de API aparecerán aquí automáticamente
            </p>
          </div>
        ) : (
          errors.map((err, i) => (
            <ErrorRow
              key={err.id}
              error={err}
              index={i}
              expanded={expandedId === err.id}
              onToggle={() => setExpandedId(expandedId === err.id ? null : err.id)}
              onResolve={handleResolve}
              resolving={resolvingId === err.id}
            />
          ))
        )}
      </motion.div>

      {/* Total count */}
      {data && data.total > errors.length && (
        <p className="text-center text-[11px] text-[var(--text-muted)]">
          Mostrando {errors.length} de {data.total} errores
        </p>
      )}
    </div>
  );
}

/* ── Stat card ───────────────────────────────────────────────────────── */

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-4">
      <p className="text-[11px] font-ui font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
        {label}
      </p>
      <p className="font-mono text-2xl font-medium" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

/* ── Error row ───────────────────────────────────────────────────────── */

function ErrorRow({
  error: err,
  index,
  expanded,
  onToggle,
  onResolve,
  resolving,
}: {
  error: ErrorLog;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onResolve: (id: string, resolved: boolean) => void;
  resolving: boolean;
}) {
  const sev = severityConfig[err.severity];
  const SevIcon = sev.icon;
  const timeAgo = getTimeAgo(err.created_at);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.02 * index, duration: 0.2 }}
      className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl overflow-hidden"
    >
      {/* Summary row */}
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-[var(--surface-2)] transition-colors"
      >
        {/* Severity icon */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: sev.bg }}
        >
          <SevIcon size={14} style={{ color: sev.color }} />
        </div>

        {/* Message + metadata */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[var(--text-primary)] truncate pr-4">
            {err.error_message}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
            <span className="font-mono text-[11px] text-[var(--text-muted)]">
              {err.method} {err.route}
            </span>
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium"
              style={{ background: sev.bg, color: sev.color, border: `1px solid ${sev.border}` }}
            >
              {err.status_code}
            </span>
            {err.occurrence_count > 1 && (
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                x{err.occurrence_count}
              </span>
            )}
            {err.user_email && (
              <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                <User size={10} />
                {err.user_email}
              </span>
            )}
            {err.proyecto_nombre && (
              <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                <FolderOpen size={10} />
                {err.proyecto_nombre}
              </span>
            )}
          </div>
        </div>

        {/* Time + chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
            <Clock size={10} />
            {timeAgo}
          </span>
          {expanded ? (
            <ChevronDown size={14} className="text-[var(--text-muted)]" />
          ) : (
            <ChevronRight size={14} className="text-[var(--text-muted)]" />
          )}
        </div>
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 border-t border-[var(--border-subtle)] space-y-3">
              {/* Error details */}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DetailItem label="Error code" value={err.error_code} />
                <DetailItem label="Status" value={String(err.status_code)} />
                <DetailItem label="Usuario" value={err.user_email} />
                <DetailItem label="Rol" value={err.user_role} />
                <DetailItem label="Proyecto" value={err.proyecto_nombre ?? err.proyecto_id} />
                <DetailItem label="Ocurrencias" value={String(err.occurrence_count)} />
                <DetailItem
                  label="Fecha"
                  value={new Date(err.created_at).toLocaleString("es-CO", {
                    timeZone: "America/Bogota",
                  })}
                />
                <DetailItem label="Fingerprint" value={err.fingerprint} mono />
              </div>

              {/* Stack trace */}
              {err.error_stack && (
                <div>
                  <p className="text-[10px] font-ui font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                    Stack Trace
                  </p>
                  <pre className="bg-[var(--surface-0)] border border-[var(--border-subtle)] rounded-lg p-3 text-[11px] font-mono text-[var(--text-secondary)] overflow-x-auto max-h-48 whitespace-pre-wrap break-words">
                    {err.error_stack}
                  </pre>
                </div>
              )}

              {/* Metadata */}
              {err.metadata && Object.keys(err.metadata).length > 0 && (
                <div>
                  <p className="text-[10px] font-ui font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                    Metadata
                  </p>
                  <pre className="bg-[var(--surface-0)] border border-[var(--border-subtle)] rounded-lg p-3 text-[11px] font-mono text-[var(--text-secondary)] overflow-x-auto max-h-32">
                    {JSON.stringify(err.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                {err.resolved ? (
                  <button
                    onClick={() => onResolve(err.id, false)}
                    disabled={resolving}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all disabled:opacity-50"
                  >
                    {resolving ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                    Reabrir
                  </button>
                ) : (
                  <button
                    onClick={() => onResolve(err.id, true)}
                    disabled={resolving}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-all disabled:opacity-50"
                  >
                    {resolving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                    Marcar resuelto
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Detail item ─────────────────────────────────────────────────────── */

function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] font-ui font-bold uppercase tracking-wider text-[var(--text-muted)] mb-0.5">
        {label}
      </p>
      <p
        className={`text-xs text-[var(--text-secondary)] ${mono ? "font-mono" : ""} truncate`}
      >
        {value}
      </p>
    </div>
  );
}

/* ── Time ago helper ─────────────────────────────────────────────────── */

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}sem`;
}
