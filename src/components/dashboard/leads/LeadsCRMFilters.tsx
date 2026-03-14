"use client";

import { useState } from "react";
import { Search, Download, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG } from "./LeadStatusBadge";

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
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            type="text"
            placeholder={locale === "es" ? "Buscar nombre, email o teléfono..." : "Search name, email or phone..."}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)] transition-colors"
          />
        </div>
        <button
          onClick={onExport}
          disabled={total === 0 || loading}
          className="flex items-center gap-2 px-4 py-2 border border-[var(--border-default)] rounded-lg font-ui text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-default)] transition-all disabled:opacity-30 shrink-0"
        >
          <Download size={14} />
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
            >
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  isActive ? cfg.dot : "bg-[var(--text-muted)]"
                )}
              />
              {locale === "es" ? cfg.label : cfg.labelEn}
            </button>
          );
        })}

        {/* Separator */}
        <div className="w-px h-5 bg-[var(--border-subtle)] mx-1" />

        {/* Date presets */}
        <div className="flex items-center bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-lg p-0.5">
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
            />
            <span className="text-[var(--text-muted)] text-[10px]">—</span>
            <input
              type="date"
              value={customDateTo}
              min={customDateFrom}
              max={toInputDate(new Date())}
              onChange={(e) => onCustomDateChange(customDateFrom, e.target.value)}
              className="input-glass px-2 py-1 text-[11px] font-mono w-full sm:w-[125px]"
            />
          </div>
        )}

        {/* Project filter (only if multiple projects) */}
        {projects.length > 1 && (
          <>
            <div className="w-px h-5 bg-[var(--border-subtle)] mx-1" />
            <select
              value={proyectoId || ""}
              onChange={(e) => onProyectoChange(e.target.value || null)}
              className="bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-[11px] text-[var(--text-secondary)] focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]"
            >
              <option value="">{locale === "es" ? "Todos los proyectos" : "All projects"}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
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
        >
          <SlidersHorizontal size={12} />
          {locale === "es" ? "Más" : "More"}
        </button>

        {/* Clear all filters */}
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-white transition-all"
          >
            <X size={11} />
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
