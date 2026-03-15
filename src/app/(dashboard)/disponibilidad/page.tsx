"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Loader2, ExternalLink, Search, ArrowUpDown, ArrowUp, ArrowDown, X, Upload } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import { useToast } from "@/components/dashboard/Toast";
import { NodDoDropdown } from "@/components/ui/NodDoDropdown";
import { formatCurrency } from "@/lib/currency";

/* ── Types ─────────────────────────────────────────────── */

type EstadoUnidad = "disponible" | "separado" | "reservada" | "vendida";

interface UnitRow {
  id: string;
  identificador: string;
  piso: number | null;
  area_m2: number | null;
  precio: number | null;
  estado: EstadoUnidad;
  tipologia: { nombre: string } | null;
  torre: { nombre: string } | null;
}

interface ProjectTab {
  id: string;
  nombre: string;
}

type SortField = "identificador" | "area" | "precio" | "estado" | "piso";
type SortDir = "asc" | "desc";

const ESTADO_ORDER: Record<EstadoUnidad, number> = {
  disponible: 0, separado: 1, reservada: 2, vendida: 3,
};

/* ── Constants ─────────────────────────────────────────── */

const ESTADOS: { key: EstadoUnidad; color: string; bg: string }[] = [
  { key: "disponible", color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  { key: "separado", color: "#facc15", bg: "rgba(250,204,21,0.12)" },
  { key: "reservada", color: "#fb923c", bg: "rgba(251,146,60,0.12)" },
  { key: "vendida", color: "#f87171", bg: "rgba(248,113,113,0.12)" },
];

/* ── Helpers ───────────────────────────────────────────── */
// formatPrice moved to src/lib/currency.ts → formatCurrency(, "COP", { compact: true }) with compact option

/* ── Page ──────────────────────────────────────────────── */

export default function DisponibilidadPage() {
  const { t } = useTranslation("dashboard");
  const toast = useToast();

  // Projects
  const [projects, setProjects] = useState<ProjectTab[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  // Units
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [unitsError, setUnitsError] = useState<string | null>(null);

  // Filters
  const [filterTorre, setFilterTorre] = useState<string>("all");
  const [filterTipo, setFilterTipo] = useState<string>("all");
  const [filterEstado, setFilterEstado] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Sorting
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [publishing, setPublishing] = useState(false);

  // Fetch projects
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/proyectos");
        if (res.ok) {
          const data = await res.json();
          const tabs = data.map((p: { id: string; nombre: string }) => ({
            id: p.id,
            nombre: p.nombre,
          }));
          setProjects(tabs);
          if (tabs.length > 0) setSelectedProjectId(tabs[0].id);
        } else {
          const errorData = await res.json().catch(() => ({ error: "Error desconocido" }));
          setProjectsError(errorData.error || `Error ${res.status}`);
          toast.error(`Error al cargar proyectos: ${errorData.error || res.status}`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error de conexión";
        setProjectsError(msg);
        toast.error(`Error al cargar proyectos: ${msg}`);
      } finally {
        setLoadingProjects(false);
      }
    })();
  }, [toast]);

  // Fetch units when project changes
  useEffect(() => {
    if (!selectedProjectId) return;
    setLoadingUnits(true);
    setUnitsError(null);
    setFilterTorre("all");
    setFilterTipo("all");
    setFilterEstado("all");
    setSearchQuery("");
    setSortField(null);

    (async () => {
      try {
        const res = await fetch(`/api/unidades?proyecto_id=${selectedProjectId}`);
        if (res.ok) {
          setUnits(await res.json());
        } else {
          const errorData = await res.json().catch(() => ({ error: "Error desconocido" }));
          setUnitsError(errorData.error || `Error ${res.status}`);
          toast.error(`Error al cargar unidades: ${errorData.error || res.status}`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error de conexión";
        setUnitsError(msg);
        toast.error(`Error al cargar unidades: ${msg}`);
      } finally {
        setLoadingUnits(false);
      }
    })();
  }, [selectedProjectId, toast]);

  // Derived filter options
  const torres = useMemo(() => {
    const set = new Set<string>();
    units.forEach((u) => { if (u.torre?.nombre) set.add(u.torre.nombre); });
    return Array.from(set).sort();
  }, [units]);

  const tipologias = useMemo(() => {
    const set = new Set<string>();
    units.forEach((u) => { if (u.tipologia?.nombre) set.add(u.tipologia.nombre); });
    return Array.from(set).sort();
  }, [units]);

  // Filtered units
  const filtered = useMemo(() => {
    return units.filter((u) => {
      if (filterTorre !== "all" && u.torre?.nombre !== filterTorre) return false;
      if (filterTipo !== "all" && u.tipologia?.nombre !== filterTipo) return false;
      if (filterEstado !== "all" && u.estado !== filterEstado) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchId = u.identificador.toLowerCase().includes(q);
        const matchTipo = u.tipologia?.nombre?.toLowerCase().includes(q);
        if (!matchId && !matchTipo) return false;
      }
      return true;
    });
  }, [units, filterTorre, filterTipo, filterEstado, searchQuery]);

  // Sort + group by piso
  const sortedFiltered = useMemo(() => {
    if (!sortField) return filtered;
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "identificador":
          cmp = a.identificador.localeCompare(b.identificador, "es", { numeric: true });
          break;
        case "area":
          cmp = (a.area_m2 ?? 0) - (b.area_m2 ?? 0);
          break;
        case "precio":
          cmp = (a.precio ?? 0) - (b.precio ?? 0);
          break;
        case "estado":
          cmp = ESTADO_ORDER[a.estado] - ESTADO_ORDER[b.estado];
          break;
        case "piso":
          cmp = (a.piso ?? -1) - (b.piso ?? -1);
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return arr;
  }, [filtered, sortField, sortDir]);

  const grouped = useMemo(() => {
    const map = new Map<number | null, UnitRow[]>();

    // Group units by floor while preserving sorted order
    for (const u of sortedFiltered) {
      const key = u.piso;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(u);
    }

    // Keep floors in the order they appear in sortedFiltered
    // This preserves the sort order chosen by the user
    const entries: [number | null, UnitRow[]][] = [];
    const seenFloors = new Set<number | null>();

    for (const u of sortedFiltered) {
      if (!seenFloors.has(u.piso)) {
        seenFloors.add(u.piso);
        entries.push([u.piso, map.get(u.piso)!]);
      }
    }

    return entries;
  }, [sortedFiltered]);

  // Summary counts
  const summary = useMemo(() => {
    const counts: Record<EstadoUnidad, number> = {
      disponible: 0, separado: 0, reservada: 0, vendida: 0,
    };
    filtered.forEach((u) => { counts[u.estado]++; });
    return counts;
  }, [filtered]);

  // Status change
  const handleStatusChange = useCallback(async (unitId: string, newEstado: EstadoUnidad) => {
    // Optimistic
    setUnits((prev) =>
      prev.map((u) => (u.id === unitId ? { ...u, estado: newEstado } : u))
    );

    const res = await fetch(`/api/unidades/${unitId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: newEstado }),
    });

    if (!res.ok) {
      // Revert
      const original = units.find((u) => u.id === unitId);
      if (original) {
        setUnits((prev) =>
          prev.map((u) => (u.id === unitId ? { ...u, estado: original.estado } : u))
        );
      }
      toast.error("Error al actualizar estado");
    }
  }, [units, toast]);

  // Toggle sort
  const toggleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      if (sortDir === "asc") setSortDir("desc");
      else { setSortField(null); setSortDir("asc"); }
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }, [sortField, sortDir]);

  const hasActiveFilters = filterTorre !== "all" || filterTipo !== "all" || filterEstado !== "all" || searchQuery !== "";

  const clearAllFilters = useCallback(() => {
    setFilterTorre("all");
    setFilterTipo("all");
    setFilterEstado("all");
    setSearchQuery("");
    setSortField(null);
    setSortDir("asc");
  }, []);

  // Publish availability
  const handlePublishAvailability = useCallback(async () => {
    if (!selectedProjectId) return;

    setPublishing(true);
    try {
      const res = await fetch(`/api/proyectos/${selectedProjectId}/publicar-disponibilidad`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Error" }));
        toast.error(data.error || "Error al publicar disponibilidad");
        return;
      }

      const data = await res.json();
      toast.success(`Disponibilidad publicada: ${data.unidades_count} unidades actualizadas`);
    } catch {
      toast.error("Error de conexión");
    } finally {
      setPublishing(false);
    }
  }, [selectedProjectId, toast]);

  // Loading
  if (loadingProjects) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--site-primary)]" size={28} />
      </div>
    );
  }

  if (projectsError) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center py-24">
        <h2 className="font-heading text-2xl font-light text-[var(--text-primary)] mb-3">
          {t("disponibilidad.title")}
        </h2>
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
          <p className="text-sm text-red-400 mb-2">Error al cargar proyectos</p>
          <p className="text-xs text-red-300/70">{projectsError}</p>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center py-24">
        <h2 className="font-heading text-2xl font-light text-[var(--text-primary)] mb-3">
          {t("disponibilidad.title")}
        </h2>
        <p className="text-sm text-[var(--text-tertiary)]">
          No tienes proyectos configurados.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="font-heading text-2xl font-light text-[var(--text-primary)] mb-1">
            {t("disponibilidad.title")}
          </h1>
          <p className="text-xs text-[var(--text-tertiary)]">
            {t("disponibilidad.description")}
          </p>
        </div>

        {selectedProjectId && units.length > 0 && (
          <button
            onClick={handlePublishAvailability}
            disabled={publishing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[rgba(184,151,58,0.1)] border border-[rgba(184,151,58,0.3)] text-[var(--site-primary)] rounded-xl text-xs font-ui font-semibold uppercase tracking-wider hover:bg-[rgba(184,151,58,0.15)] transition-all disabled:opacity-50"
          >
            {publishing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {publishing ? "Publicando..." : "Publicar disponibilidad"}
          </button>
        )}
      </div>

      {/* Project tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedProjectId(p.id)}
            className={cn(
              "px-4 py-2 rounded-lg font-ui text-[10px] font-bold uppercase tracking-[0.1em] whitespace-nowrap transition-all shrink-0",
              selectedProjectId === p.id
                ? "bg-[rgba(184,151,58,0.12)] text-[var(--site-primary)] border border-[rgba(184,151,58,0.25)]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)] border border-transparent"
            )}
          >
            {p.nombre}
          </button>
        ))}
      </div>

      {loadingUnits ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-[var(--site-primary)]" size={24} />
        </div>
      ) : unitsError ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-10 text-center">
          <p className="text-sm text-red-400 mb-2">Error al cargar unidades</p>
          <p className="text-xs text-red-300/70">{unitsError}</p>
        </div>
      ) : units.length === 0 ? (
        <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] p-10 text-center">
          <p className="text-sm text-[var(--text-tertiary)] mb-3">
            {t("disponibilidad.noUnitsDescription")}
          </p>
          <Link
            href={`/editor/${selectedProjectId}`}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--site-primary)] hover:underline"
          >
            {t("disponibilidad.configureLink")}
            <ExternalLink size={12} />
          </Link>
        </div>
      ) : (
        <>
          {/* Search + Filters toolbar */}
          <div className="space-y-3">
            {/* Search bar */}
            <div className="relative">
              <label htmlFor="search-units" className="block text-[10px] tracking-[0.12em] uppercase text-[var(--text-muted)] mb-1.5 font-ui font-bold">
                Buscar
              </label>
              <Search size={14} className="absolute left-3.5 bottom-1/2 translate-y-1/2 text-[var(--text-muted)]" />
              <input
                id="search-units"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Identificador o tipología..."
                className="input-glass text-xs w-full pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 bottom-1/2 translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                  aria-label="Limpiar búsqueda"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter row */}
            <div className="flex gap-2 flex-wrap items-center">
              {/* Torre filter */}
              {torres.length > 1 && (
                <NodDoDropdown
                  variant="dashboard"
                  size="sm"
                  value={filterTorre}
                  onChange={setFilterTorre}
                  options={[
                    { value: "all", label: t("disponibilidad.allTorres") },
                    ...torres.map((tn) => ({ value: tn, label: tn })),
                  ]}
                />
              )}

              {/* Tipologia filter */}
              {tipologias.length > 1 && (
                <NodDoDropdown
                  variant="dashboard"
                  size="sm"
                  value={filterTipo}
                  onChange={setFilterTipo}
                  options={[
                    { value: "all", label: t("disponibilidad.allTipos") },
                    ...tipologias.map((tn) => ({ value: tn, label: tn })),
                  ]}
                />
              )}

              {/* Estado filter */}
              <NodDoDropdown
                variant="dashboard"
                size="sm"
                value={filterEstado}
                onChange={setFilterEstado}
                options={[
                  { value: "all", label: "Todos los estados" },
                  ...ESTADOS.map((e) => ({
                    value: e.key,
                    label: e.key.charAt(0).toUpperCase() + e.key.slice(1),
                  })),
                ]}
              />

              {/* Clear all */}
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1 text-[10px] text-[var(--site-primary)] hover:brightness-110 font-ui uppercase tracking-wider transition-all"
                >
                  <X size={10} />
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Summary strip */}
          <div className="flex gap-4 flex-wrap items-center">
            {ESTADOS.map((e) => (
              <button
                key={e.key}
                onClick={() => setFilterEstado(filterEstado === e.key ? "all" : e.key)}
                className={cn(
                  "flex items-center gap-1.5 transition-opacity",
                  filterEstado !== "all" && filterEstado !== e.key ? "opacity-40" : "opacity-100"
                )}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: e.color }}
                />
                <span className="text-[11px] text-[var(--text-tertiary)]">
                  {summary[e.key]}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] font-ui uppercase tracking-wider">
                  {t(`disponibilidad.summary.${e.key}` as `disponibilidad.summary.disponible`)}
                </span>
              </button>
            ))}
            <span className="text-[10px] text-[var(--text-muted)] ml-auto">
              {filtered.length} unidades
            </span>
          </div>

          {/* Column sort header */}
          <div className="flex items-center gap-3 px-4 py-2 bg-[var(--surface-1)] rounded-lg border border-[var(--border-subtle)]">
            {([
              { field: "identificador" as SortField, label: "Unidad", width: "w-20" },
              { field: "piso" as SortField, label: "Piso", width: "w-14 hidden sm:flex" },
            ] as const).map(({ field, label, width }) => (
              <button
                key={field}
                onClick={() => toggleSort(field)}
                className={cn(
                  "flex items-center gap-1 shrink-0 font-ui text-[9px] font-bold uppercase tracking-[0.12em] transition-colors",
                  width,
                  sortField === field ? "text-[var(--site-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-tertiary)]"
                )}
              >
                {label}
                {sortField === field ? (
                  sortDir === "asc" ? <ArrowUp size={10} /> : <ArrowDown size={10} />
                ) : (
                  <ArrowUpDown size={10} className="opacity-40" />
                )}
              </button>
            ))}
            <span className="flex-1 min-w-0 font-ui text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Tipología
            </span>
            {([
              { field: "area" as SortField, label: "Área", width: "w-16 hidden sm:flex" },
              { field: "precio" as SortField, label: "Precio", width: "w-16 hidden sm:flex justify-end" },
              { field: "estado" as SortField, label: "Estado", width: "w-[100px]" },
            ] as const).map(({ field, label, width }) => (
              <button
                key={field}
                onClick={() => toggleSort(field)}
                className={cn(
                  "flex items-center gap-1 shrink-0 font-ui text-[9px] font-bold uppercase tracking-[0.12em] transition-colors",
                  width,
                  sortField === field ? "text-[var(--site-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-tertiary)]"
                )}
              >
                {label}
                {sortField === field ? (
                  sortDir === "asc" ? <ArrowUp size={10} /> : <ArrowDown size={10} />
                ) : (
                  <ArrowUpDown size={10} className="opacity-40" />
                )}
              </button>
            ))}
          </div>

          {/* Units by floor */}
          {filtered.length === 0 ? (
            <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] p-10 text-center">
              <p className="text-sm text-[var(--text-tertiary)] mb-2">
                No se encontraron unidades
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Ajusta los filtros o la búsqueda para ver resultados
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {grouped.map(([piso, floorUnits]) => (
                <div key={piso ?? "null"} className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
                  {/* Floor header — more prominent */}
                  <div className="px-4 py-3 border-b border-[var(--border-default)] bg-[var(--surface-2)]">
                    <div className="flex items-center gap-3">
                      <span className="font-ui text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                        {piso !== null ? `Piso ${piso}` : "Sin piso"}
                      </span>
                      {sortField && sortField !== "piso" && (
                        <span className="text-[9px] text-[var(--text-muted)] font-mono">
                          (ordenado por {
                            sortField === "precio" ? "precio" :
                            sortField === "area" ? "área" :
                            sortField === "estado" ? "estado" :
                            "ID"
                          })
                        </span>
                      )}
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {floorUnits.length} {floorUnits.length === 1 ? "unidad" : "unidades"}
                      </span>
                      <div className="flex-1" />
                      {/* Mini status summary for this floor */}
                      <div className="flex gap-2">
                        {ESTADOS.map((e) => {
                          const count = floorUnits.filter((u) => u.estado === e.key).length;
                          if (count === 0) return null;
                          return (
                            <div key={e.key} className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: e.color }} />
                              <span className="text-[9px] text-[var(--text-muted)]">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Unit rows */}
                  <div className="divide-y divide-[var(--border-subtle)]">
                    {floorUnits.map((unit) => (
                      <div
                        key={unit.id}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--surface-2)] transition-colors"
                      >
                        {/* ID */}
                        <span className="text-xs text-[var(--text-primary)] font-medium w-20 shrink-0">
                          {unit.identificador}
                        </span>

                        {/* Piso (matches sort header) */}
                        <span className="text-[11px] text-[var(--text-muted)] w-14 shrink-0 hidden sm:block">
                          {unit.piso ?? "—"}
                        </span>

                        {/* Tipologia */}
                        <span className="text-[11px] text-[var(--text-tertiary)] truncate flex-1 min-w-0">
                          {unit.tipologia?.nombre || "—"}
                        </span>

                        {/* Area */}
                        <span className="text-[11px] text-[var(--text-muted)] shrink-0 w-16 hidden sm:block">
                          {unit.area_m2 ? `${unit.area_m2}m²` : "—"}
                        </span>

                        {/* Price */}
                        <span className="text-[11px] text-[var(--text-tertiary)] shrink-0 w-16 text-right hidden sm:block">
                          {unit.precio ? formatCurrency(unit.precio, "COP", { compact: true }) : "—"}
                        </span>

                        {/* Status selector */}
                        <div className="flex gap-1 shrink-0">
                          {ESTADOS.map((e) => (
                            <button
                              key={e.key}
                              onClick={() => {
                                if (unit.estado !== e.key) handleStatusChange(unit.id, e.key);
                              }}
                              title={e.key}
                              className={cn(
                                "w-5 h-5 rounded-md flex items-center justify-center transition-all",
                                unit.estado === e.key
                                  ? "ring-1 ring-offset-1 ring-offset-[var(--surface-1)]"
                                  : "opacity-30 hover:opacity-70"
                              )}
                              style={{
                                background: e.bg,
                                ...(unit.estado === e.key ? { ringColor: e.color } : {}),
                              }}
                            >
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ background: e.color }}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
