"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { LeadWithMeta, LeadStats } from "@/types";
import { useTranslation } from "@/i18n";
import { useToast } from "@/components/dashboard/Toast";
import { LeadsCRMStats } from "@/components/dashboard/leads/LeadsCRMStats";
import { LeadsCRMFilters, type DatePreset } from "@/components/dashboard/leads/LeadsCRMFilters";
import { LeadsCRMTable } from "@/components/dashboard/leads/LeadsCRMTable";
import { LeadDetailPanel } from "@/components/dashboard/leads/LeadDetailPanel";
import { cn } from "@/lib/utils";

function getDateRange(preset: DatePreset, customFrom: string, customTo: string) {
  if (preset === "all") return { from: null, to: null };
  if (preset === "custom") return { from: customFrom || null, to: customTo || null };
  const now = new Date();
  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
  const from = new Date(now);
  from.setDate(from.getDate() - days);
  return { from: from.toISOString().split("T")[0], to: null };
}

function toInputDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export default function LeadsPage() {
  const { locale } = useTranslation("dashboard");
  const toast = useToast();

  // Data state
  const [leads, setLeads] = useState<LeadWithMeta[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [projects, setProjects] = useState<{ id: string; nombre: string }[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 50;

  // Filter state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [customDateFrom, setCustomDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return toInputDate(d);
  });
  const [customDateTo, setCustomDateTo] = useState(() => toInputDate(new Date()));
  const [proyectoId, setProyectoId] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"newest" | "oldest">("newest");

  // Detail panel state
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Stats tracking — only load stats once initially
  const [statsLoaded, setStatsLoaded] = useState(false);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilters, datePreset, customDateFrom, customDateTo, proyectoId, sortDir]);

  // Fetch leads
  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      // For multi-select status: API only supports single status, so we pass the first one
      // If multiple statuses selected, we need to make multiple requests or handle differently
      // For simplicity, single status for API, but we show chips as toggles
      if (statusFilters.length === 1) {
        params.set("status", statusFilters[0]);
      }
      const { from: dateFrom, to: dateTo } = getDateRange(datePreset, customDateFrom, customDateTo);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
      if (proyectoId) params.set("proyecto_id", proyectoId);
      params.set("sort", sortDir);
      params.set("page", String(page));
      params.set("limit", String(limit));
      params.set("include_cotizacion_count", "true");

      // Include stats on first load
      if (!statsLoaded) {
        params.set("include_stats", "true");
      }

      const res = await fetch(`/api/leads?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        let leadsData: LeadWithMeta[] = json.data;

        // Client-side filter for multi-status (when >1 status selected)
        if (statusFilters.length > 1) {
          leadsData = leadsData.filter((l) => statusFilters.includes(l.status));
        }

        setLeads(leadsData);
        setTotal(json.total);

        if (json.stats) {
          setStats(json.stats);
          setStatsLoaded(true);
        }
        if (json.projects) {
          setProjects(json.projects);
        }
      }
    } catch {
      toast.error(locale === "es" ? "Error cargando registros" : "Error loading leads");
      setLeads([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilters, datePreset, customDateFrom, customDateTo, proyectoId, sortDir, page, statsLoaded, locale, toast]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Escape key to close panel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedLeadId) {
        setSelectedLeadId(null);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [selectedLeadId]);

  // Status change handler with optimistic update
  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setUpdatingStatus(leadId);

    // Optimistic update
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus as LeadWithMeta["status"] } : l))
    );

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        // Revert on failure
        fetchLeads();
        toast.error(locale === "es" ? "Error actualizando status" : "Error updating status");
      }
    } catch {
      fetchLeads();
      toast.error(locale === "es" ? "Error actualizando status" : "Error updating status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  // CSV export
  const exportCSV = async () => {
    if (total === 0) return;
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilters.length === 1) params.set("status", statusFilters[0]);
      const { from: dateFrom, to: dateTo } = getDateRange(datePreset, customDateFrom, customDateTo);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
      if (proyectoId) params.set("proyecto_id", proyectoId);
      params.set("sort", sortDir);
      params.set("page", "1");
      params.set("limit", "10000");
      params.set("include_cotizacion_count", "true");

      const res = await fetch(`/api/leads?${params.toString()}`);
      if (!res.ok) return;
      const json = await res.json();
      const allLeads: LeadWithMeta[] = json.data;

      const headers = [
        locale === "es" ? "Nombre" : "Name",
        "Email",
        locale === "es" ? "Teléfono" : "Phone",
        locale === "es" ? "País" : "Country",
        locale === "es" ? "Tipología" : "Type",
        "Status",
        locale === "es" ? "Mensaje" : "Message",
        locale === "es" ? "Proyecto" : "Project",
        locale === "es" ? "Cotizaciones" : "Quotes",
        "UTM Source",
        "UTM Medium",
        "UTM Campaign",
        locale === "es" ? "Fecha" : "Date",
      ];
      const rows = allLeads.map((l) => [
        l.nombre,
        l.email,
        l.telefono ?? "",
        l.pais ?? "",
        l.tipologia_interes ?? "",
        l.status ?? "nuevo",
        l.mensaje ?? "",
        l.proyecto_nombre ?? "",
        String(l.cotizaciones_count ?? 0),
        l.utm_source ?? "",
        l.utm_medium ?? "",
        l.utm_campaign ?? "",
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
      a.download = `registros_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Silent fail on export
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const showingFrom = total === 0 ? 0 : (page - 1) * limit + 1;
  const showingTo = Math.min(page * limit, total);
  const selectedLead = leads.find((l) => l.id === selectedLeadId);

  return (
    <div className="flex h-[calc(100vh-56px)] md:h-screen">
      {/* Main content area */}
      <div
        className={cn(
          "flex-1 flex flex-col overflow-hidden transition-all duration-300",
          selectedLeadId && "lg:mr-[420px]"
        )}
      >
        {/* Header */}
        <div className="px-6 pt-6 md:px-8 md:pt-8">
          <div className="mb-6">
            <h1 className="font-heading text-2xl font-light">
              {locale === "es" ? "Registros" : "Leads"}
            </h1>
            <p className="text-[var(--text-tertiary)] text-sm mt-1">
              {loading
                ? locale === "es" ? "Cargando..." : "Loading..."
                : locale === "es"
                  ? `${total} registro(s)`
                  : `${total} lead(s)`}
            </p>
          </div>

          {/* Stats */}
          <LeadsCRMStats stats={stats} loading={!statsLoaded} />

          {/* Filters */}
          <LeadsCRMFilters
            search={search}
            onSearchChange={setSearch}
            statusFilters={statusFilters}
            onStatusFiltersChange={setStatusFilters}
            datePreset={datePreset}
            onDatePresetChange={setDatePreset}
            customDateFrom={customDateFrom}
            customDateTo={customDateTo}
            onCustomDateChange={(from, to) => {
              setCustomDateFrom(from);
              setCustomDateTo(to);
            }}
            proyectoId={proyectoId}
            onProyectoChange={setProyectoId}
            projects={projects}
            total={total}
            onExport={exportCSV}
            loading={loading}
            locale={locale}
          />
        </div>

        {/* Table + Pagination (scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-6">
          <LeadsCRMTable
            leads={leads}
            loading={loading}
            selectedId={selectedLeadId}
            onSelect={(id) => setSelectedLeadId(selectedLeadId === id ? null : id)}
            sortDir={sortDir}
            onSortChange={setSortDir}
            locale={locale}
            multiProject={projects.length > 1}
          />

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between mt-5">
              <p className="text-[var(--text-muted)] text-xs tabular-nums">
                {showingFrom}–{showingTo} {locale === "es" ? "de" : "of"} {total}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--border-default)] rounded-lg font-ui text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={12} />
                  {locale === "es" ? "Anterior" : "Prev"}
                </button>
                <span className="text-[var(--text-tertiary)] text-xs tabular-nums">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--border-default)] rounded-lg font-ui text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {locale === "es" ? "Siguiente" : "Next"}
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      <AnimatePresence>
        {selectedLeadId && selectedLead && (
          <LeadDetailPanel
            leadId={selectedLeadId}
            lead={selectedLead}
            onClose={() => setSelectedLeadId(null)}
            onStatusChange={handleStatusChange}
            updatingStatus={updatingStatus}
            locale={locale}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
