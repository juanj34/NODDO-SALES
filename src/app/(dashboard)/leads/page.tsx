"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  Tag,
  Calendar,
  Globe,
} from "lucide-react";
import type { Lead } from "@/types";
import { useTranslation } from "@/i18n";

const STATUS_CONFIG: Record<string, { label: string; labelEn: string; dot: string; bg: string }> = {
  nuevo: { label: "Nuevo", labelEn: "New", dot: "bg-blue-400", bg: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  contactado: { label: "Contactado", labelEn: "Contacted", dot: "bg-amber-400", bg: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  calificado: { label: "Calificado", labelEn: "Qualified", dot: "bg-emerald-400", bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
  cerrado: { label: "Cerrado", labelEn: "Closed", dot: "bg-[var(--text-muted)]", bg: "bg-white/5 text-[var(--text-muted)] border-white/10" },
};

export default function LeadsPage() {
  const { t, locale } = useTranslation("dashboard");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tipologia, setTipologia] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const limit = 50;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, tipologia, statusFilter]);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (tipologia) params.set("tipologia", tipologia);
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("limit", String(limit));
      const qs = params.toString();
      const res = await fetch(`/api/leads${qs ? `?${qs}` : ""}`);
      if (res.ok) {
        const json = await res.json();
        setLeads(json.data);
        setTotal(json.total);
      }
    } catch {
      setLeads([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, tipologia, statusFilter, page]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setUpdatingStatus(leadId);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
        if (selectedLead?.id === leadId) {
          setSelectedLead(updated);
        }
      }
    } catch {
      // silent
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Gather unique tipologias from current page for filter dropdown
  const uniqueTipologias = [
    ...new Set(leads.map((l) => l.tipologia_interes).filter(Boolean)),
  ];

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const showingFrom = total === 0 ? 0 : (page - 1) * limit + 1;
  const showingTo = Math.min(page * limit, total);

  const exportCSV = async () => {
    if (total === 0) return;
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (tipologia) params.set("tipologia", tipologia);
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", "1");
      params.set("limit", "10000");
      const res = await fetch(`/api/leads?${params.toString()}`);
      if (!res.ok) return;
      const json = await res.json();
      const allLeads: Lead[] = json.data;

      const headers = [t("leads.name"), t("leads.email"), t("leads.phone"), t("leads.country"), t("leads.type"), "Status", "Mensaje", t("leads.date")];
      const rows = allLeads.map((l) => [
        l.nombre,
        l.email,
        l.telefono ?? "",
        l.pais ?? "",
        l.tipologia_interes ?? "",
        l.status ?? "nuevo",
        l.mensaje ?? "",
        new Date(l.created_at).toLocaleDateString(locale === "es" ? "es-CO" : "en-US"),
      ]);
      const csv = [
        headers.join(","),
        ...rows.map((r) =>
          r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Silent fail on export
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(locale === "es" ? "es-CO" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-2xl font-light">{t("leads.title")}</h1>
          <p className="text-[var(--text-tertiary)] text-sm mt-1">
            {loading
              ? t("leads.loading")
              : t("leads.contactCount", { count: String(total) })}
          </p>
        </div>
        <button
          onClick={exportCSV}
          disabled={total === 0 || loading}
          className="flex items-center gap-2 px-4 py-2 border border-[var(--border-default)] rounded-lg font-ui text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-default)] transition-all disabled:opacity-30"
        >
          <Download size={14} />
          {t("leads.exportCsv")}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            type="text"
            placeholder={t("leads.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)] transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg px-4 py-2 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]"
        >
          <option value="">Status: Todos</option>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>
              {locale === "es" ? cfg.label : cfg.labelEn}
            </option>
          ))}
        </select>
        <select
          value={tipologia}
          onChange={(e) => setTipologia(e.target.value)}
          className="bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg px-4 py-2 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]"
        >
          <option value="">{t("leads.allTypes")}</option>
          {uniqueTipologias.map((tip) => (
            <option key={tip} value={tip!}>
              {tip}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-[var(--site-primary)]" size={32} />
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-heading text-xl font-light text-[var(--text-secondary)]">{t("leads.noLeads")}</p>
          <p className="text-[var(--text-muted)] text-[12px] leading-[1.7] mt-2">
            {debouncedSearch || tipologia || statusFilter
              ? t("leads.adjustFilters")
              : t("leads.leadsWillAppear")}
          </p>
        </div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl overflow-hidden"
          >
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {[t("leads.name"), t("leads.email"), t("leads.phone"), t("leads.type"), "Status", t("leads.date")].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-6 py-3 font-ui text-[10px] text-[var(--text-tertiary)] tracking-wider uppercase font-bold"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {leads.map((lead, idx) => {
                  const statusCfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG.nuevo;
                  return (
                    <motion.tr
                      key={lead.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => setSelectedLead(lead)}
                      className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--surface-3)] transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 text-sm">{lead.nombre}</td>
                      <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                        {lead.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                        {lead.telefono ?? "—"}
                      </td>
                      <td className="px-6 py-4">
                        {lead.tipologia_interes ? (
                          <span className="px-2 py-1 bg-[rgba(var(--site-primary-rgb),0.1)] text-[var(--site-primary)] rounded text-xs">
                            {lead.tipologia_interes}
                          </span>
                        ) : (
                          <span className="text-[var(--text-muted)]">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${statusCfg.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                          {locale === "es" ? statusCfg.label : statusCfg.labelEn}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--text-tertiary)]">
                        {formatDate(lead.created_at)}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-[var(--text-muted)] text-xs">
                {showingFrom}–{showingTo} de {total}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--border-default)] rounded-lg font-ui text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={12} />
                  Anterior
                </button>
                <span className="text-[var(--text-tertiary)] text-xs tabular-nums">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--border-default)] rounded-lg font-ui text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Siguiente
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedLead && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedLead(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 pb-0">
                <div>
                  <h2 className="font-heading text-xl font-light text-white">
                    {selectedLead.nombre}
                  </h2>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    {formatDate(selectedLead.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="text-[var(--text-muted)] hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Status selector */}
              <div className="px-6 pt-4">
                <label className="block font-ui text-[10px] text-[var(--text-tertiary)] mb-2 tracking-wider uppercase font-bold">
                  Status
                </label>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                    const isActive = selectedLead.status === key;
                    const isUpdating = updatingStatus === selectedLead.id;
                    return (
                      <button
                        key={key}
                        onClick={() => !isActive && handleStatusChange(selectedLead.id, key)}
                        disabled={isUpdating}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${
                          isActive
                            ? cfg.bg
                            : "border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--border-default)]"
                        } disabled:opacity-50`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? cfg.dot : "bg-[var(--text-muted)]"}`} />
                        {locale === "es" ? cfg.label : cfg.labelEn}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Details */}
              <div className="p-6 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <DetailRow icon={<Mail size={13} />} label={t("leads.email")} value={selectedLead.email} />
                  <DetailRow icon={<Phone size={13} />} label={t("leads.phone")} value={selectedLead.telefono} />
                  <DetailRow icon={<MapPin size={13} />} label={t("leads.country")} value={selectedLead.pais} />
                  <DetailRow icon={<Tag size={13} />} label={t("leads.type")} value={selectedLead.tipologia_interes} />
                  <DetailRow icon={<Calendar size={13} />} label={t("leads.date")} value={formatDate(selectedLead.created_at)} />
                  {selectedLead.utm_source && (
                    <DetailRow icon={<Globe size={13} />} label="UTM Source" value={selectedLead.utm_source} />
                  )}
                </div>
                {selectedLead.mensaje && (
                  <div className="pt-2">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <MessageSquare size={13} className="text-[var(--text-muted)]" />
                      <span className="font-ui text-[10px] text-[var(--text-tertiary)] tracking-wider uppercase font-bold">
                        Mensaje
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed bg-[var(--surface-2)] rounded-xl p-3 border border-[var(--border-subtle)] whitespace-pre-wrap">
                      {selectedLead.mensaje}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start gap-2 p-2.5 bg-[var(--surface-2)] rounded-xl border border-[var(--border-subtle)]">
      <span className="text-[var(--text-muted)] mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="font-ui text-[9px] text-[var(--text-muted)] tracking-wider uppercase font-bold">
          {label}
        </p>
        <p className="text-sm text-[var(--text-secondary)] truncate">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}
