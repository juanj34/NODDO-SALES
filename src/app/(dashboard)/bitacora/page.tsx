"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@/i18n";
import { ActivityTimeline } from "@/components/dashboard/bitacora/ActivityTimeline";
import { ActivityFilters } from "@/components/dashboard/bitacora/ActivityFilters";
import type { ActivityLog } from "@/types";

export default function BitacoraPage() {
  const { t, locale } = useTranslation("dashboard");

  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 50;

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [proyectoId, setProyectoId] = useState<string | null>(null);
  const [datePreset, setDatePreset] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);
  const [projects, setProjects] = useState<{ id: string; nombre: string }[]>([]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [debouncedSearch, categoryFilter, proyectoId, dateFrom, dateTo]);

  // Handle date presets
  const handleDatePreset = useCallback((preset: string) => {
    setDatePreset(preset || null);
    if (!preset) { setDateFrom(null); setDateTo(null); return; }
    const now = new Date();
    if (preset === "today") {
      const d = now.toISOString().split("T")[0];
      setDateFrom(d); setDateTo(d);
    } else if (preset === "7d") {
      const from = new Date(now); from.setDate(from.getDate() - 7);
      setDateFrom(from.toISOString().split("T")[0]); setDateTo(null);
    } else if (preset === "30d") {
      const from = new Date(now); from.setDate(from.getDate() - 30);
      setDateFrom(from.toISOString().split("T")[0]); setDateTo(null);
    }
  }, []);

  // Fetch
  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (categoryFilter) params.set("action_category", categoryFilter);
      if (proyectoId) params.set("proyecto_id", proyectoId);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);

      const res = await fetch(`/api/bitacora?${params}`);
      if (res.ok) {
        const json = await res.json();
        setActivities(json.data);
        setTotal(json.total);
      }

      // Load projects list once
      if (projects.length === 0) {
        const projRes = await fetch("/api/proyectos");
        if (projRes.ok) {
          const projData = await projRes.json();
          setProjects(
            (projData as { id: string; nombre: string }[]).map((p) => ({
              id: p.id,
              nombre: p.nombre,
            }))
          );
        }
      }
    } catch {
      setActivities([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, categoryFilter, proyectoId, dateFrom, dateTo, projects.length]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  const exportCSV = async () => {
    if (total === 0) return;
    const params = new URLSearchParams();
    if (categoryFilter) params.set("action_category", categoryFilter);
    if (proyectoId) params.set("proyecto_id", proyectoId);
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    try {
      const res = await fetch(`/api/bitacora/export?${params}`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bitacora_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { /* silent */ }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const showFrom = total === 0 ? 0 : (page - 1) * limit + 1;
  const showTo = Math.min(page * limit, total);

  return (
    <div className="min-h-screen p-6 md:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl md:text-3xl font-light text-[var(--text-primary)]">
          {t("sidebar.bitacora")}
        </h1>
        <p className="text-[var(--text-muted)] text-xs mt-1 tabular-nums">
          {loading
            ? locale === "es" ? "Cargando..." : "Loading..."
            : `${total} ${locale === "es" ? "actividad(es)" : "activit(ies)"}`}
        </p>
      </div>

      {/* Filters */}
      <ActivityFilters
        search={search}
        onSearchChange={setSearch}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        proyectoId={proyectoId}
        onProyectoChange={setProyectoId}
        datePreset={datePreset}
        onDatePreset={handleDatePreset}
        projects={projects}
        onExport={exportCSV}
        total={total}
        loading={loading}
        locale={locale}
      />

      {/* Timeline */}
      <ActivityTimeline activities={activities} loading={loading} locale={locale} />

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--border-subtle)]">
          <p className="text-[var(--text-muted)] text-[11px] tabular-nums">
            {showFrom}&ndash;{showTo} {locale === "es" ? "de" : "of"} {total}
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
            <span className="text-[var(--text-muted)] text-[11px] tabular-nums">
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
  );
}
