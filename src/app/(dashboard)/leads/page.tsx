"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Download, Search, Loader2 } from "lucide-react";
import type { Lead } from "@/types";
import { useTranslation } from "@/i18n";

export default function LeadsPage() {
  const { t, locale } = useTranslation("dashboard");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tipologia, setTipologia] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (tipologia) params.set("tipologia", tipologia);
      const qs = params.toString();
      const res = await fetch(`/api/leads${qs ? `?${qs}` : ""}`);
      if (res.ok) setLeads(await res.json());
    } catch {
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, tipologia]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Gather unique tipologias from leads for filter dropdown
  const uniqueTipologias = [
    ...new Set(leads.map((l) => l.tipologia_interes).filter(Boolean)),
  ];

  const exportCSV = () => {
    if (!leads.length) return;
    const headers = [t("leads.name"), t("leads.email"), t("leads.phone"), t("leads.country"), t("leads.type"), "Mensaje", t("leads.date")];
    const rows = leads.map((l) => [
      l.nombre,
      l.email,
      l.telefono ?? "",
      l.pais ?? "",
      l.tipologia_interes ?? "",
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
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-2xl font-light">{t("leads.title")}</h1>
          <p className="text-[var(--text-tertiary)] text-sm mt-1">
            {loading
              ? t("leads.loading")
              : t("leads.contactCount", { count: String(leads.length) })}
          </p>
        </div>
        <button
          onClick={exportCSV}
          disabled={!leads.length || loading}
          className="flex items-center gap-2 px-4 py-2 border border-[var(--border-default)] rounded-lg font-ui text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-default)] transition-all disabled:opacity-30"
        >
          <Download size={14} />
          {t("leads.exportCsv")}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
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
          <p className="text-[var(--text-tertiary)] text-lg">{t("leads.noLeads")}</p>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            {debouncedSearch || tipologia
              ? t("leads.adjustFilters")
              : t("leads.leadsWillAppear")}
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl overflow-hidden"
        >
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                {[t("leads.name"), t("leads.email"), t("leads.phone"), t("leads.country"), t("leads.type"), t("leads.date")].map(
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
              {leads.map((lead, idx) => (
                <motion.tr
                  key={lead.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--surface-2)] transition-colors"
                >
                  <td className="px-6 py-4 text-sm">{lead.nombre}</td>
                  <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                    {lead.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                    {lead.telefono ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                    {lead.pais ?? "—"}
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
                  <td className="px-6 py-4 text-sm text-[var(--text-tertiary)]">
                    {new Date(lead.created_at).toLocaleDateString(locale === "es" ? "es-CO" : "en-US")}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
}
