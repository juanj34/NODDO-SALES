"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Loader2,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { AuditLogEntry, AuditAction } from "@/types";

const ACTION_CONFIG: Record<AuditAction, { label: string; color: string; bg: string }> = {
  user_banned: { label: "Baneado", color: "text-red-400", bg: "bg-red-500/15" },
  user_unbanned: { label: "Desbaneado", color: "text-green-400", bg: "bg-green-500/15" },
  user_deleted: { label: "Eliminado", color: "text-red-400", bg: "bg-red-500/15" },
  plan_changed: { label: "Plan cambiado", color: "text-amber-400", bg: "bg-amber-500/15" },
  project_archived: { label: "Archivado", color: "text-amber-400", bg: "bg-amber-500/15" },
  project_deleted: { label: "Eliminado", color: "text-red-400", bg: "bg-red-500/15" },
  admin_added: { label: "Admin agregado", color: "text-green-400", bg: "bg-green-500/15" },
  admin_removed: { label: "Admin removido", color: "text-red-400", bg: "bg-red-500/15" },
  features_updated: { label: "Features actualizadas", color: "text-[var(--site-primary)]", bg: "bg-[rgba(184,151,58,0.15)]" },
};

const ALL_ACTIONS: AuditAction[] = [
  "user_banned", "user_unbanned", "user_deleted",
  "plan_changed", "project_archived", "project_deleted",
  "admin_added", "admin_removed", "features_updated",
];

export default function AdminActividadPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filterAction, setFilterAction] = useState<string>("");
  const limit = 30;

  const fetchEntries = async (p: number, action: string) => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(limit) });
      if (action) params.set("action", action);
      const res = await fetch(`/api/admin/audit?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEntries(data.entries);
      setTotal(data.total);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries(page, filterAction);
  }, [page, filterAction]);

  const totalPages = Math.ceil(total / limit);

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatTime = (d: string) => {
    const date = new Date(d);
    return date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-light text-[var(--text-primary)]">
          Registro de Actividad
        </h1>
        <p className="text-[var(--text-tertiary)] text-sm mt-1">
          Historial de acciones administrativas
        </p>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          value={filterAction}
          onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
          className="input-glass text-sm pr-8 max-w-xs"
        >
          <option value="">Todas las acciones</option>
          {ALL_ACTIONS.map((a) => (
            <option key={a} value={a}>{ACTION_CONFIG[a].label}</option>
          ))}
        </select>
        <span className="text-[11px] text-[var(--text-muted)]">
          {total} registro{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="animate-spin text-[var(--site-primary)]" size={28} />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <AlertTriangle size={28} className="text-amber-400 mb-3" />
          <p className="text-sm text-[var(--text-secondary)] mb-1">Error al cargar actividad</p>
          <button
            onClick={() => fetchEntries(page, filterAction)}
            className="flex items-center gap-2 px-4 py-2 mt-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-default)] transition-all"
          >
            <RefreshCw size={13} /> Reintentar
          </button>
        </div>
      ) : (
        <>
          <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-2)]">
                    <th className="text-left px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Fecha
                    </th>
                    <th className="text-left px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Admin
                    </th>
                    <th className="text-left px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Acción
                    </th>
                    <th className="text-left px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Target
                    </th>
                    <th className="text-left px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Detalles
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, i) => {
                    const config = ACTION_CONFIG[entry.action] || { label: entry.action, color: "text-neutral-400", bg: "bg-neutral-500/15" };
                    return (
                      <motion.tr
                        key={entry.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.01 }}
                        className="border-b border-[var(--border-subtle)] last:border-b-0 hover:bg-[var(--surface-2)] transition-colors"
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-xs text-[var(--text-tertiary)]">{formatDate(entry.created_at)}</span>
                          <br />
                          <span className="text-[10px] text-[var(--text-muted)]">{formatTime(entry.created_at)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-[var(--text-secondary)] truncate max-w-[180px] block">
                            {entry.admin_email}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-md font-ui text-[10px] font-bold uppercase tracking-wider ${config.color} ${config.bg}`}>
                            {config.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-0.5">
                            <span className="font-ui text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                              {entry.target_type}
                            </span>
                            <br />
                            <span className="text-[11px] text-[var(--text-tertiary)] font-mono truncate max-w-[160px] block">
                              {entry.target_id.slice(0, 8)}...
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-[200px]">
                          {Object.keys(entry.details).length > 0 ? (
                            <span className="text-[11px] text-[var(--text-tertiary)] font-mono">
                              {JSON.stringify(entry.details).slice(0, 60)}
                              {JSON.stringify(entry.details).length > 60 ? "..." : ""}
                            </span>
                          ) : (
                            <span className="text-[10px] text-[var(--text-muted)]">&mdash;</span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {entries.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Activity size={24} className="text-[var(--text-muted)] mb-3" />
                <p className="text-sm text-[var(--text-tertiary)]">
                  No hay registros de actividad
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="w-8 h-8 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="font-mono text-xs text-[var(--text-muted)]">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="w-8 h-8 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
