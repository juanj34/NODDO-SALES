"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  CalendarCheck,
  Search,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Download,
  Mail,
  Phone,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  UserX,
  TrendingUp,
} from "lucide-react";
import { useToast } from "@/components/dashboard/Toast";

interface Appointment {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  empresa: string | null;
  whatsapp_optin: boolean;
  scheduled_for: string;
  duration_minutes: number;
  timezone: string;
  status: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  no_show_count: number;
  confirmation_email_sent: boolean;
  reminder_24h_sent: boolean;
  reminder_2h_sent: boolean;
  created_at: string;
}

interface Stats {
  total_appointments: number;
  confirmed: number;
  attended: number;
  no_shows: number;
  cancelled: number;
  this_week: number;
  attendance_rate: number;
}

const STATUS_LABELS: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  confirmed: { label: "Confirmada", color: "text-blue-400 bg-blue-400/10 border-blue-400/20", icon: Clock },
  attended: { label: "Asistió", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", icon: CheckCircle2 },
  no_show: { label: "No asistió", color: "text-red-400 bg-red-400/10 border-red-400/20", icon: UserX },
  cancelled: { label: "Cancelada", color: "text-gray-400 bg-gray-400/10 border-gray-400/20", icon: XCircle },
  rescheduled: { label: "Reagendada", color: "text-amber-400 bg-amber-400/10 border-amber-400/20", icon: RefreshCw },
};

export default function AdminCitasPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const toast = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/marketing/appointments?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAppointments(data.appointments || []);
      setStats(data.stats || null);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = appointments.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.nombre.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.empresa || "").toLowerCase().includes(q)
    );
  });

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });

  const formatTime = (d: string, tz: string) =>
    new Date(d).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", timeZone: tz });

  const handleExportCSV = () => {
    const headers = ["Nombre", "Email", "Teléfono", "Empresa", "Fecha", "Hora", "Estado", "WhatsApp", "UTM Source", "Creado"];
    const rows = filtered.map((a) => [
      a.nombre,
      a.email,
      a.telefono || "",
      a.empresa || "",
      formatDate(a.scheduled_for),
      formatTime(a.scheduled_for, a.timezone),
      STATUS_LABELS[a.status]?.label || a.status,
      a.whatsapp_optin ? "Sí" : "No",
      a.utm_source || "",
      formatDate(a.created_at),
    ]);

    const csv = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `noddo-citas-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado");
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/marketing/appointments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)),
      );
      toast.success(`Estado actualizado a ${STATUS_LABELS[newStatus]?.label || newStatus}`);
    } catch {
      toast.error("Error actualizando estado");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[rgba(var(--site-primary-rgb),0.15)] flex items-center justify-center">
            <CalendarCheck className="w-5 h-5 text-[var(--site-primary)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Citas</h1>
            <p className="text-xs text-[var(--text-tertiary)]">Demos agendadas con constructoras</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border-default)] text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors disabled:opacity-30"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border-default)] text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Esta semana", value: stats.this_week, icon: CalendarCheck, accent: true },
            { label: "Confirmadas", value: stats.confirmed, icon: Clock },
            { label: "Asistieron", value: stats.attended, icon: CheckCircle2 },
            { label: "Tasa asistencia", value: `${stats.attendance_rate}%`, icon: TrendingUp, accent: true },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <card.icon className={`w-4 h-4 ${card.accent ? "text-[var(--site-primary)]" : "text-[var(--text-tertiary)]"}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                  {card.label}
                </span>
              </div>
              <p className={`text-2xl font-bold ${card.accent ? "text-[var(--site-primary)]" : "text-[var(--text-primary)]"}`}>
                {card.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email o empresa..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--site-primary)] transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] appearance-none cursor-pointer"
        >
          <option value="">Todos los estados</option>
          <option value="confirmed">Confirmadas</option>
          <option value="attended">Asistieron</option>
          <option value="no_show">No asistieron</option>
          <option value="cancelled">Canceladas</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--site-primary)]" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertTriangle className="w-8 h-8 text-red-400" />
          <p className="text-sm text-[var(--text-tertiary)]">Error cargando citas</p>
          <button
            onClick={fetchData}
            className="text-xs text-[var(--site-primary)] hover:underline"
          >
            Reintentar
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <CalendarCheck className="w-8 h-8 text-[var(--text-muted)]" />
          <p className="text-sm text-[var(--text-tertiary)]">No hay citas</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border-subtle)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--surface-1)] border-b border-[var(--border-subtle)]">
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Contacto</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Fecha</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Estado</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Reminders</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Fuente</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => {
                  const s = STATUS_LABELS[a.status] || STATUS_LABELS.confirmed;
                  const StatusIcon = s.icon;
                  return (
                    <tr
                      key={a.id}
                      className="border-b border-[var(--border-subtle)] hover:bg-[var(--surface-1)] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-[var(--text-primary)]">{a.nombre}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1 text-[11px] text-[var(--text-tertiary)]">
                            <Mail className="w-3 h-3" />
                            {a.email}
                          </span>
                          {a.telefono && (
                            <span className="flex items-center gap-1 text-[11px] text-[var(--text-tertiary)]">
                              <Phone className="w-3 h-3" />
                              {a.telefono}
                            </span>
                          )}
                          {a.empresa && (
                            <span className="flex items-center gap-1 text-[11px] text-[var(--text-tertiary)]">
                              <Building2 className="w-3 h-3" />
                              {a.empresa}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[var(--text-primary)]">{formatDate(a.scheduled_for)}</p>
                        <p className="text-[11px] text-[var(--text-tertiary)]">
                          {formatTime(a.scheduled_for, a.timezone)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold border ${s.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {s.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${a.confirmation_email_sent ? "bg-emerald-400" : "bg-gray-600"}`} title="Confirmación" />
                          <span className={`w-2 h-2 rounded-full ${a.reminder_24h_sent ? "bg-emerald-400" : "bg-gray-600"}`} title="24h" />
                          <span className={`w-2 h-2 rounded-full ${a.reminder_2h_sent ? "bg-emerald-400" : "bg-gray-600"}`} title="2h" />
                        </div>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                          {a.whatsapp_optin ? "WA activo" : ""}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {a.utm_source ? (
                          <span className="text-[11px] text-[var(--text-tertiary)]">
                            {a.utm_source} / {a.utm_medium || "—"}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[var(--text-muted)]">directo</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {a.status === "confirmed" && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => updateStatus(a.id, "attended")}
                              className="px-2 py-1 rounded-md text-[10px] font-bold text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 transition-colors"
                            >
                              Asistió
                            </button>
                            <button
                              onClick={() => updateStatus(a.id, "no_show")}
                              className="px-2 py-1 rounded-md text-[10px] font-bold text-red-400 bg-red-400/10 hover:bg-red-400/20 transition-colors"
                            >
                              No asistió
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
