"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Loader2, AlertTriangle, RefreshCw, Send, CheckCircle } from "lucide-react";
import { KPICard } from "@/components/dashboard/analytics/KPICard";

interface EmailRecord {
  id: string;
  created_at: string;
  confirmation_sent: boolean;
  reminder_24h_sent: boolean;
  reminder_2h_sent: boolean;
}

interface EmailsOverTime {
  day: string;
  confirmation: number;
  reminder_24h: number;
  reminder_2h: number;
  total: number;
}

interface EmailsData {
  total_appointments: number;
  confirmation_sent: number;
  confirmation_rate: number;
  reminder_24h_sent: number;
  reminder_24h_rate: number;
  reminder_2h_sent: number;
  reminder_2h_rate: number;
  recent_emails: EmailRecord[];
  emails_over_time: EmailsOverTime[];
}

export default function AdminEmailsPage() {
  const [data, setData] = useState<EmailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/admin/emails");
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
        <p className="text-sm text-[var(--text-secondary)] mb-1">Error al cargar email stats</p>
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
              Email Campaign Stats
            </h1>
            <p className="text-[var(--text-tertiary)] text-sm mt-1">
              Estadísticas de envío de emails automáticos
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
          label="Total Citas"
          value={data.total_appointments.toString()}
          icon={<Mail size={16} />}
          suffix="creadas"
        />
        <KPICard
          label="Confirmación"
          value={`${data.confirmation_rate.toFixed(1)}%`}
          icon={<CheckCircle size={16} />}
          suffix={`${data.confirmation_sent} enviados`}
        />
        <KPICard
          label="Reminder 24h"
          value={`${data.reminder_24h_rate.toFixed(1)}%`}
          icon={<Send size={16} />}
          suffix={`${data.reminder_24h_sent} enviados`}
        />
        <KPICard
          label="Reminder 2h"
          value={`${data.reminder_2h_rate.toFixed(1)}%`}
          icon={<Send size={16} />}
          suffix={`${data.reminder_2h_sent} enviados`}
        />
      </motion.div>

      {/* Email Sequences */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-5"
      >
        <h2 className="font-ui text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4">
          Sequences de Email
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              name: "Confirmación",
              description: "Enviado inmediatamente al crear la cita",
              count: data.confirmation_sent,
              rate: data.confirmation_rate,
            },
            {
              name: "Reminder 24h",
              description: "Enviado 24 horas antes de la cita",
              count: data.reminder_24h_sent,
              rate: data.reminder_24h_rate,
            },
            {
              name: "Reminder 2h",
              description: "Enviado 2 horas antes de la cita",
              count: data.reminder_2h_sent,
              rate: data.reminder_2h_rate,
            },
          ].map((sequence, i) => (
            <motion.div
              key={sequence.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.02 }}
              className="p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]"
            >
              <div className="flex items-center gap-2 mb-2">
                <Mail size={14} className="text-[var(--site-primary)]" />
                <h3 className="font-ui text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  {sequence.name}
                </h3>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mb-3">{sequence.description}</p>
              <div className="flex items-baseline gap-2">
                <span className="font-heading text-2xl font-light text-white">
                  {sequence.count}
                </span>
                <span className="text-xs text-[var(--text-muted)]">enviados</span>
              </div>
              <div className="mt-2 text-[10px] text-[var(--text-tertiary)]">
                {sequence.rate.toFixed(1)}% del total
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Emails */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-5"
      >
        <h2 className="font-ui text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4">
          Últimos Emails Enviados (50 Recientes)
        </h2>
        {data.recent_emails.length === 0 ? (
          <div className="text-center py-12">
            <Mail size={24} className="mx-auto mb-2 opacity-30 text-[var(--text-muted)]" />
            <p className="text-xs text-[var(--text-muted)]">No hay emails enviados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  <th className="text-left py-3 px-4 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Cita ID
                  </th>
                  <th className="text-left py-3 px-4 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Confirmación
                  </th>
                  <th className="text-left py-3 px-4 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Reminder 24h
                  </th>
                  <th className="text-left py-3 px-4 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Reminder 2h
                  </th>
                  <th className="text-left py-3 px-4 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.recent_emails.map((email) => (
                  <tr
                    key={email.id}
                    className="border-b border-[var(--border-subtle)] hover:bg-[var(--surface-2)] transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className="text-xs font-mono text-[var(--text-primary)]">
                        {email.id.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {email.confirmation_sent ? (
                        <CheckCircle size={14} className="text-green-400" />
                      ) : (
                        <span className="text-xs text-[var(--text-muted)]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {email.reminder_24h_sent ? (
                        <CheckCircle size={14} className="text-green-400" />
                      ) : (
                        <span className="text-xs text-[var(--text-muted)]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {email.reminder_2h_sent ? (
                        <CheckCircle size={14} className="text-green-400" />
                      ) : (
                        <span className="text-xs text-[var(--text-muted)]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] text-[var(--text-tertiary)]">
                        {new Date(email.created_at).toLocaleDateString("es-CO", {
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
        )}
      </motion.div>
    </div>
  );
}
