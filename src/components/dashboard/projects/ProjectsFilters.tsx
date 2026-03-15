"use client";

import { Search, X, Plus } from "lucide-react";
import { NodDoDropdown } from "@/components/ui/NodDoDropdown";
import { useTranslation } from "@/i18n";

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  onCreateClick?: () => void;
  isAdmin: boolean;
  total: number;
}

const STATUS_OPTIONS = [
  { value: "todos", label: "Todos", color: "text-[var(--text-secondary)]" },
  { value: "publicado", label: "Publicado", color: "text-green-400" },
  { value: "borrador", label: "Borrador", color: "text-[var(--site-primary)]" },
  { value: "archivado", label: "Archivado", color: "text-gray-400" },
];

const SORT_OPTIONS = [
  { value: "reciente", label: "Más reciente" },
  { value: "antiguo", label: "Más antiguo" },
  { value: "nombre", label: "A-Z" },
  { value: "nombre-desc", label: "Z-A" },
  { value: "leads", label: "Más leads" },
  { value: "visitas", label: "Más visitas" },
];

export function ProjectsFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange,
  onCreateClick,
  isAdmin,
  total,
}: Props) {
  const { t } = useTranslation("dashboard");

  const hasActiveFilters = search !== "" || statusFilter !== "todos";

  const clearFilters = () => {
    onSearchChange("");
    onStatusFilterChange("todos");
  };

  return (
    <div className="space-y-3">
      {/* Row 1: Search + Create Button */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nombre o slug..."
            className="
              w-full
              pl-10 pr-10
              py-2.5
              bg-[var(--surface-2)]
              border border-[var(--border-default)]
              rounded-[0.625rem]
              text-sm text-white
              placeholder:text-[var(--text-muted)]
              focus:outline-none
              focus:border-[rgba(var(--site-primary-rgb),0.5)]
              focus:shadow-[0_0_0_3px_rgba(var(--site-primary-rgb),0.10)]
              transition-all
            "
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Create Project Button (admin only) */}
        {isAdmin && onCreateClick && (
          <button
            onClick={onCreateClick}
            className="
              flex items-center gap-2
              px-4 py-2.5
              bg-[var(--site-primary)]
              text-[#141414]
              rounded-[0.625rem]
              font-ui text-xs font-bold uppercase tracking-[0.1em]
              hover:brightness-110
              transition-all
              shadow-[0_4px_12px_rgba(var(--site-primary-rgb),0.2)]
              shrink-0
            "
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Crear Proyecto</span>
            <span className="sm:hidden">Crear</span>
          </button>
        )}
      </div>

      {/* Row 2: Status chips + Sort + Clear */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Status chips */}
        <div className="flex items-center gap-2">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status.value}
              onClick={() => onStatusFilterChange(status.value)}
              className={`
                px-3 py-1.5
                rounded-lg
                font-mono text-xs font-medium
                uppercase tracking-wider
                transition-all
                ${
                  statusFilter === status.value
                    ? "bg-[var(--site-primary)] text-[#141414] shadow-[0_2px_8px_rgba(var(--site-primary-rgb),0.3)]"
                    : `${status.color} bg-[var(--surface-2)] hover:bg-[var(--surface-3)]`
                }
              `}
            >
              {status.label}
            </button>
          ))}
        </div>

        {/* Sort dropdown */}
        <NodDoDropdown
          variant="dashboard"
          size="sm"
          value={sortBy}
          onChange={onSortChange}
          options={SORT_OPTIONS}
          placeholder="Ordenar por"
        />

        {/* Results count */}
        <span className="font-mono text-xs text-[var(--text-tertiary)] ml-auto">
          {total} {total === 1 ? "proyecto" : "proyectos"}
        </span>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="
              flex items-center gap-1.5
              px-3 py-1.5
              text-xs font-mono
              text-[var(--text-muted)]
              hover:text-white
              border border-[var(--border-default)]
              bg-[var(--surface-2)]
              rounded-lg
              transition-colors
            "
          >
            <X size={12} />
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  );
}
