"use client";

import { useState } from "react";
import { Search, Download, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG } from "./LeadStatusBadge";
import { NodDoDropdown } from "@/components/ui/NodDoDropdown";

export type DatePreset = "7d" | "30d" | "90d" | "all" | "custom";

interface Props {
  search: string;
  onSearchChange: (val: string) => void;
  statusFilters: string[];
  onStatusFiltersChange: (val: string[]) => void;
  datePreset: DatePreset;
  onDatePresetChange: (val: DatePreset) => void;
  customDateFrom: string;
  customDateTo: string;
  onCustomDateChange: (from: string, to: string) => void;
  proyectoId: string | null;
  onProyectoChange: (id: string | null) => void;
  projects: { id: string; nombre: string }[];
  total: number;
  onExport: () => void;
  loading: boolean;
  locale: string;
}

const datePresets: { value: DatePreset; label: string }[] = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "all", label: "Todo" },
];

function toInputDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function LeadsCRMFilters({
  search,
  onSearchChange,
  statusFilters,
  onStatusFiltersChange,
  datePreset,
  onDatePresetChange,
  customDateFrom,
  customDateTo,
  onCustomDateChange,
  proyectoId,
  onProyectoChange,
  projects,
  total,
  onExport,
  loading,
  locale,
}: Props) {
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const toggleStatus = (s: string) => {
    if (statusFilters.includes(s)) {
      onStatusFiltersChange(statusFilters.filter((f) => f !== s));
    } else {
      onStatusFiltersChange([...statusFilters, s]);
    }
  };

  const hasActiveFilters =
    statusFilters.length > 0 ||
    datePreset !== "all" ||
    proyectoId !== null ||
    search.length > 0;

  const clearAll = () => {
    onSearchChange("");
    onStatusFiltersChange([]);
    onDatePresetChange("all");
    onProyectoChange(null);
  };

  return (
    <div className="space-y-3 mb-5">
      {/* Row 1: Search + Export */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <label htmlFor="search-leads" className="block text-[10px] tracking-[0.12em] uppercase text-[var(--text-muted)] mb-1.5 font-ui font-bold">
            {locale === "es" ? "Buscar" : "Search"}
          </label>
          <Search
            size={14}
            className="absolute left-3 bottom-1/2 translate-y-1/2 text-[var(--text-muted)]"
            aria-hidden="true"
          />
          <input
            id="search-leads"
            type="text"
            placeholder={locale === "es" ? "Nombre, email o teléfono..." : "Name, email or phone..."}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)] transition-colors"
            aria-label={locale === "es" ? "Buscar leads por nombre, email o teléfono" : "Search leads by name, email or phone"}
          />
        </div>
        <button
          onClick={onExport}
          disabled={total === 0 || loading}
          className="flex items-center gap-2 px-4 py-2 border border-[var(--border-default)] rounded-lg font-ui text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-default)] transition-all disabled:opacity-30 shrink-0"
          aria-label={locale === "es" ? "Exportar leads a CSV" : "Export leads to CSV"}
        >
          <Download size={14} aria-hidden="true" />
          CSV
        </button>
      </div>

      {/* Row 2: Status chips + Date presets + Project + More */}
      <div className="flex gap-2 items-center flex-wrap">
        {/* Status chips */}
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          const isActive = statusFilters.includes(key);
          return (
            <button
              key={key}
              onClick={() => toggleStatus(key)}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all",
                isActive
                  ? cfg.bg
                  : "border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--border-default)]"
              )}
              aria-label={locale === "es" ? `Filtrar por estado ${cfg.label}` : `Filter by status ${cfg.labelEn}`}
              aria-pressed={isActive}
            >
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  isActive ? cfg.dot : "bg-[var(--text-muted)]"
                )}
                aria-hidden="true"
              />
              {locale === "es" ? cfg.label : cfg.labelEn}
            </button>
          );
        })}

        {/* Separator */}
        <div className="w-px h-5 bg-[var(--border-subtle)] mx-1" />

        {/* Date presets */}
        <div className="flex items-center bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-lg p-0.5" role="group" aria-label={locale === "es" ? "Filtros de fecha" : "Date filters"}>
          {datePresets.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onDatePresetChange(opt.value)}
              className={cn(
                "px-2.5 py-1 font-ui text-[10px] font-bold uppercase tracking-[0.1em] rounded-md transition-all",
                datePreset === opt.value
                  ? "bg-[var(--site-primary)] text-[#141414] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              )}
              aria-label={locale === "es" ? `Últimos ${opt.label}` : `Last ${opt.label}`}
              aria-pressed={datePreset === opt.value}
            >
              {opt.label}
            </button>
          ))}
          <button
            onClick={() => onDatePresetChange("custom")}
            className={cn(
              "px-2.5 py-1 font-ui text-[10px] font-bold uppercase tracking-[0.1em] rounded-md transition-all",
              datePreset === "custom"
                ? "bg-[var(--site-primary)] text-[#141414] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            )}
            aria-label={locale === "es" ? "Rango personalizado" : "Custom range"}
            aria-pressed={datePreset === "custom"}
          >
            Custom
          </button>
        </div>

        {/* Custom date inputs */}
        {datePreset === "custom" && (
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <input
              type="date"
              value={customDateFrom}
              max={customDateTo || toInputDate(new Date())}
              onChange={(e) => onCustomDateChange(e.target.value, customDateTo)}
              className="input-glass px-2 py-1 text-[11px] font-mono w-full sm:w-[125px]"
              aria-label={locale === "es" ? "Fecha desde" : "Date from"}
            />
            <span className="text-[var(--text-muted)] text-[10px]" aria-hidden="true">—</span>
            <input
              type="date"
              value={customDateTo}
              min={customDateFrom}
              max={toInputDate(new Date())}
              onChange={(e) => onCustomDateChange(customDateFrom, e.target.value)}
              className="input-glass px-2 py-1 text-[11px] font-mono w-full sm:w-[125px]"
              aria-label={locale === "es" ? "Fecha hasta" : "Date to"}
            />
          </div>
        )}

        {/* Project filter (only if multiple projects) */}
        {projects.length > 1 && (
          <>
            <div className="w-px h-5 bg-[var(--border-subtle)] mx-1" />
            <NodDoDropdown
              variant="dashboard"
              size="sm"
              value={proyectoId || ""}
              onChange={(val) => onProyectoChange(val || null)}
              options={[
                { value: "", label: locale === "es" ? "Todos los proyectos" : "All projects" },
                ...projects.map((p) => ({ value: p.id, label: p.nombre })),
              ]}
            />
          </>
        )}

        {/* More filters toggle */}
        <button
          onClick={() => setShowMoreFilters(!showMoreFilters)}
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all",
            showMoreFilters
              ? "border-[rgba(var(--site-primary-rgb),0.3)] text-[var(--site-primary)] bg-[rgba(var(--site-primary-rgb),0.08)]"
              : "border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          )}
          aria-label={locale === "es" ? "Mostrar más filtros" : "Show more filters"}
          aria-expanded={showMoreFilters}
        >
          <SlidersHorizontal size={12} aria-hidden="true" />
          {locale === "es" ? "Más" : "More"}
        </button>

        {/* Clear all filters */}
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-white transition-all"
            aria-label={locale === "es" ? "Limpiar todos los filtros" : "Clear all filters"}
          >
            <X size={11} aria-hidden="true" />
            {locale === "es" ? "Limpiar" : "Clear"}
          </button>
        )}
      </div>

      {/* More filters panel - hidden by default */}
      {showMoreFilters && (
        <div className="flex gap-3 items-center px-1">
          {/* Single project selector on mobile if not shown above */}
          {projects.length === 1 && (
            <span className="text-[11px] text-[var(--text-muted)]">
              {locale === "es" ? "Proyecto:" : "Project:"}{" "}
              <span className="text-[var(--text-secondary)]">{projects[0].nombre}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
