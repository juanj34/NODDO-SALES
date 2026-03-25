"use client";

import { Search, Download, Calendar, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  categoryFilter: string | null;
  onCategoryChange: (v: string | null) => void;
  proyectoId: string | null;
  onProyectoChange: (v: string | null) => void;
  datePreset: string | null;
  onDatePreset: (v: string) => void;
  projects: { id: string; nombre: string }[];
  onExport: () => void;
  total: number;
  loading: boolean;
  locale: string;
}

const CATEGORIES = [
  { value: "project",     es: "Proyectos",      en: "Projects" },
  { value: "unit",        es: "Unidades",        en: "Units" },
  { value: "lead",        es: "Leads",           en: "Leads" },
  { value: "cotizacion",  es: "Cotizaciones",    en: "Quotes" },
  { value: "gallery",     es: "Galeria",         en: "Gallery" },
  { value: "video",       es: "Videos",          en: "Videos" },
  { value: "tipologia",   es: "Tipologias",      en: "Types" },
  { value: "colaborador", es: "Colaboradores",   en: "Collaborators" },
  { value: "content",     es: "Contenido",       en: "Content" },
];

const DATE_PRESETS = [
  { value: "today", es: "Hoy",     en: "Today" },
  { value: "7d",    es: "7 dias",  en: "7 days" },
  { value: "30d",   es: "30 dias", en: "30 days" },
];

export function ActivityFilters({
  search,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  proyectoId,
  onProyectoChange,
  datePreset,
  onDatePreset,
  projects,
  onExport,
  total,
  loading,
  locale,
}: ActivityFiltersProps) {
  const hasFilters = !!(search || categoryFilter || proyectoId || datePreset);

  const clearAll = () => {
    onSearchChange("");
    onCategoryChange(null);
    onProyectoChange(null);
    onDatePreset("");
  };

  return (
    <div className="glass-card p-4 mb-6 space-y-3">
      {/* Search + Export row */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={locale === "es" ? "Buscar actividades..." : "Search activities..."}
            className="input-glass w-full pl-10 pr-8 py-2 text-sm"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={onExport}
          disabled={total === 0 || loading}
          className="btn-outline-warm px-4 py-2 text-xs flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Download size={14} />
          CSV
        </button>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => onCategoryChange(categoryFilter === cat.value ? null : cat.value)}
            className={cn(
              "px-2.5 py-1 rounded-lg font-ui text-[10px] font-bold uppercase tracking-wider transition-all",
              categoryFilter === cat.value
                ? "bg-[rgba(var(--site-primary-rgb),0.15)] text-[var(--site-primary)] border border-[var(--site-primary)]"
                : "bg-[var(--surface-2)] text-[var(--text-muted)] border border-transparent hover:border-[var(--border-default)] hover:text-[var(--text-tertiary)]"
            )}
          >
            {locale === "es" ? cat.es : cat.en}
          </button>
        ))}
      </div>

      {/* Date presets + Project filter + Clear */}
      <div className="flex flex-wrap items-center gap-2">
        <Calendar size={13} className="text-[var(--text-muted)]" />
        {DATE_PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => onDatePreset(datePreset === p.value ? "" : p.value)}
            className={cn(
              "px-2 py-1 rounded-md font-ui text-[10px] font-bold uppercase tracking-wider transition-all",
              datePreset === p.value
                ? "bg-[rgba(var(--site-primary-rgb),0.15)] text-[var(--site-primary)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-tertiary)] hover:bg-[var(--surface-2)]"
            )}
          >
            {locale === "es" ? p.es : p.en}
          </button>
        ))}

        {projects.length > 1 && (
          <select
            value={proyectoId || ""}
            onChange={(e) => onProyectoChange(e.target.value || null)}
            className="input-glass px-2.5 py-1 text-xs ml-1"
          >
            <option value="">{locale === "es" ? "Todos los proyectos" : "All projects"}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        )}

        {hasFilters && (
          <button
            onClick={clearAll}
            className="ml-auto flex items-center gap-1 px-2 py-1 rounded-md font-ui text-[10px] font-bold uppercase tracking-wider text-red-400/60 hover:text-red-400 hover:bg-red-500/8 transition-all"
          >
            <X size={11} />
            {locale === "es" ? "Limpiar" : "Clear"}
          </button>
        )}
      </div>
    </div>
  );
}
