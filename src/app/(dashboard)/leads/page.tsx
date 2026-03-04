"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Download, Search, Loader2 } from "lucide-react";
import type { Lead } from "@/types";

export default function LeadsPage() {
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
    const headers = ["Nombre", "Email", "Teléfono", "País", "Tipología", "Mensaje", "Fecha"];
    const rows = leads.map((l) => [
      l.nombre,
      l.email,
      l.telefono ?? "",
      l.pais ?? "",
      l.tipologia_interes ?? "",
      l.mensaje ?? "",
      new Date(l.created_at).toLocaleDateString("es-CO"),
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
          <h1 className="text-2xl font-light tracking-wider">Leads</h1>
          <p className="text-white/40 text-sm mt-1">
            {loading
              ? "Cargando..."
              : `${leads.length} contacto${leads.length !== 1 ? "s" : ""} recibido${leads.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={exportCSV}
          disabled={!leads.length || loading}
          className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-lg text-xs text-white/50 hover:text-white hover:border-white/30 transition-all disabled:opacity-30"
        >
          <Download size={14} />
          Exportar CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20"
          />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9A96E]/50 transition-colors"
          />
        </div>
        <select
          value={tipologia}
          onChange={(e) => setTipologia(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white/60 focus:outline-none focus:border-[#C9A96E]/50"
        >
          <option value="">Todas las tipologías</option>
          {uniqueTipologias.map((t) => (
            <option key={t} value={t!}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-[#C9A96E]" size={32} />
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-white/30 text-lg">No hay leads</p>
          <p className="text-white/20 text-sm mt-1">
            {debouncedSearch || tipologia
              ? "Intenta ajustar los filtros"
              : "Los leads aparecerán aquí cuando alguien llene el formulario"}
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/5 border border-white/5 rounded-xl overflow-hidden"
        >
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {["Nombre", "Email", "Teléfono", "País", "Tipología", "Fecha"].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left px-6 py-3 text-xs text-white/30 tracking-wider uppercase font-normal"
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
                  className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4 text-sm">{lead.nombre}</td>
                  <td className="px-6 py-4 text-sm text-white/60">
                    {lead.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-white/60">
                    {lead.telefono ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-white/60">
                    {lead.pais ?? "—"}
                  </td>
                  <td className="px-6 py-4">
                    {lead.tipologia_interes ? (
                      <span className="px-2 py-1 bg-[#C9A96E]/10 text-[#C9A96E] rounded text-xs">
                        {lead.tipologia_interes}
                      </span>
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-white/40">
                    {new Date(lead.created_at).toLocaleDateString("es-CO")}
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
