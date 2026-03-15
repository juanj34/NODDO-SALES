"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Search,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Download,
  Mail,
  Phone,
  Globe,
} from "lucide-react";
import { useToast } from "@/components/dashboard/Toast";

interface LeadRow {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  mensaje: string;
  created_at: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  projectName: string;
  projectSlug: string;
  ownerEmail: string;
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const toast = useToast();

  const fetchLeads = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/admin/leads");
      if (!res.ok) throw new Error();
      setLeads(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const filtered = leads.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.nombre.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      l.projectName.toLowerCase().includes(q) ||
      l.ownerEmail.toLowerCase().includes(q)
    );
  });

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatTime = (d: string) => {
    const date = new Date(d);
    return date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  };

  const handleExportCSV = () => {
    const headers = ["Nombre", "Email", "Teléfono", "Mensaje", "Proyecto", "Owner", "Fecha", "UTM Source", "UTM Medium", "UTM Campaign"];
    const rows = filtered.map((l) => [
      l.nombre,
      l.email,
      l.telefono,
      l.mensaje.replace(/"/g, '""'),
      l.projectName,
      l.ownerEmail,
      l.created_at,
      l.utm_source || "",
      l.utm_medium || "",
      l.utm_campaign || "",
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-noddo-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filtered.length} leads exportados`);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-light text-[var(--text-primary)]">
            Leads
          </h1>
          <p className="text-[var(--text-tertiary)] text-sm mt-1">
            {leads.length} leads en total
          </p>
        </div>
        {leads.length > 0 && (
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-xs font-ui font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-default)] transition-all"
          >
            <Download size={13} />
            Exportar CSV
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, email o proyecto..."
          className="input-glass w-full pl-10 text-sm"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="animate-spin text-[var(--site-primary)]" size={28} />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <AlertTriangle size={28} className="text-amber-400 mb-3" />
          <p className="text-sm text-[var(--text-secondary)] mb-1">Error al cargar leads</p>
          <p className="text-[11px] text-[var(--text-muted)] mb-4">Verifica tu conexión e intenta de nuevo</p>
          <button
            onClick={fetchLeads}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-default)] transition-all"
          >
            <RefreshCw size={13} /> Reintentar
          </button>
        </div>
      ) : (
        <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-2)]">
                  <th className="text-left px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Lead
                  </th>
                  <th className="text-left px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Contacto
                  </th>
                  <th className="text-left px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Proyecto
                  </th>
                  <th className="text-left px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Owner
                  </th>
                  <th className="text-left px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Mensaje
                  </th>
                  <th className="text-left px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    UTM
                  </th>
                  <th className="text-left px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead, i) => (
                  <motion.tr
                    key={lead.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.01 }}
                    className="border-b border-[var(--border-subtle)] last:border-b-0 hover:bg-[var(--surface-2)] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="text-xs text-[var(--text-primary)] font-medium">
                        {lead.nombre || "Sin nombre"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {lead.email && (
                          <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                            <Mail size={10} className="text-[var(--text-muted)] shrink-0" />
                            <span className="truncate max-w-[180px]">{lead.email}</span>
                          </div>
                        )}
                        {lead.telefono && (
                          <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
                            <Phone size={10} className="text-[var(--text-muted)] shrink-0" />
                            {lead.telefono}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-[var(--text-secondary)]">{lead.projectName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] text-[var(--text-tertiary)]">{lead.ownerEmail}</span>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <span className="text-[11px] text-[var(--text-tertiary)] line-clamp-2">
                        {lead.mensaje || <span className="text-[var(--text-muted)]">&mdash;</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {lead.utm_source ? (
                        <div className="flex items-center gap-1">
                          <Globe size={10} className="text-[var(--text-muted)] shrink-0" />
                          <span className="text-[10px] text-[var(--text-tertiary)]">{lead.utm_source}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-[var(--text-muted)]">&mdash;</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>
                        <span className="text-xs text-[var(--text-tertiary)]">{formatDate(lead.created_at)}</span>
                        <br />
                        <span className="text-[10px] text-[var(--text-muted)]">{formatTime(lead.created_at)}</span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquare size={24} className="text-[var(--text-muted)] mb-3" />
              <p className="text-sm text-[var(--text-tertiary)]">
                {search ? "No se encontraron leads" : "No hay leads registrados"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
