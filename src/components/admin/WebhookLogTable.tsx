"use client";

import { CheckCircle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WebhookLog } from "@/types";

interface WebhookLogTableProps {
  logs: WebhookLog[];
}

export function WebhookLogTable({ logs }: WebhookLogTableProps) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock size={24} className="mx-auto mb-2 opacity-30 text-[var(--text-muted)]" />
        <p className="text-xs text-[var(--text-muted)]">No hay entregas registradas</p>
      </div>
    );
  }

  const getStatusColor = (statusCode: number | null, delivered: boolean) => {
    if (!delivered || !statusCode) return "text-red-400 bg-red-500/15 border-red-500/20";
    if (statusCode >= 200 && statusCode < 300) return "text-green-400 bg-green-500/15 border-green-500/20";
    if (statusCode >= 400 && statusCode < 500) return "text-amber-400 bg-amber-500/15 border-amber-500/20";
    return "text-red-400 bg-red-500/15 border-red-500/20";
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--border-subtle)]">
            <th className="text-left py-3 px-4 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Estado
            </th>
            <th className="text-left py-3 px-4 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Evento
            </th>
            <th className="text-left py-3 px-4 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              URL
            </th>
            <th className="text-left py-3 px-4 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Status Code
            </th>
            <th className="text-left py-3 px-4 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Fecha
            </th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr
              key={log.id}
              className="border-b border-[var(--border-subtle)] hover:bg-[var(--surface-2)] transition-colors"
            >
              {/* Estado */}
              <td className="py-3 px-4">
                {log.delivered ? (
                  <CheckCircle size={16} className="text-green-400" />
                ) : (
                  <XCircle size={16} className="text-red-400" />
                )}
              </td>

              {/* Evento */}
              <td className="py-3 px-4">
                <span className="text-xs font-mono text-[var(--text-primary)]">
                  {log.event_type}
                </span>
              </td>

              {/* URL */}
              <td className="py-3 px-4 max-w-xs">
                <span className="text-xs text-[var(--text-secondary)] truncate block">
                  {log.url}
                </span>
                {log.error && (
                  <span className="text-[10px] text-red-400 block mt-1 truncate">
                    {log.error}
                  </span>
                )}
              </td>

              {/* Status Code */}
              <td className="py-3 px-4">
                {log.status_code ? (
                  <span
                    className={cn(
                      "px-2 py-1 rounded-md text-[10px] font-mono font-bold border",
                      getStatusColor(log.status_code, log.delivered),
                    )}
                  >
                    {log.status_code}
                  </span>
                ) : (
                  <span className="text-[10px] text-[var(--text-muted)]">—</span>
                )}
              </td>

              {/* Fecha */}
              <td className="py-3 px-4">
                <span className="text-[11px] text-[var(--text-tertiary)]">
                  {new Date(log.created_at).toLocaleString("es-CO", {
                    month: "short",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
