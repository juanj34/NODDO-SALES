"use client";

import { useState, useMemo, useCallback } from "react";
import { useEditorProject } from "@/hooks/useEditorProject";
import {
  emptyState,
  emptyStateIcon,
  emptyStateTitle,
  emptyStateDescription,
} from "@/components/dashboard/editor-styles";
import { PageHeader } from "@/components/dashboard/base/PageHeader";
import { cn } from "@/lib/utils";
import { formatCurrency as formatCurrencyFn } from "@/lib/currency";
import { Package, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/components/dashboard/Toast";
import type { Unidad } from "@/types";
import { NodDoDropdown } from "@/components/ui/NodDoDropdown";

// Compact currency formatter
const formatCurrency = (n: number) => formatCurrencyFn(n, "COP", { compact: true });

type EstadoUnidad = Unidad["estado"];

const ESTADOS: { value: EstadoUnidad; label: string; dot: string; bg: string }[] = [
  { value: "disponible", label: "Disponible", dot: "bg-green-500", bg: "bg-green-500/20 text-green-400" },
  { value: "separado", label: "Separado", dot: "bg-yellow-500", bg: "bg-yellow-500/20 text-yellow-400" },
  { value: "reservada", label: "Reservada", dot: "bg-orange-500", bg: "bg-orange-500/20 text-orange-400" },
  { value: "vendida", label: "Vendida", dot: "bg-red-500", bg: "bg-red-500/20 text-red-400" },
];

export default function DisponibilidadPage() {
  const { project, updateLocal } = useEditorProject();
  const toast = useToast();

  const unidades = useMemo(() => project.unidades ?? [], [project.unidades]);
  const tipologias = useMemo(() => project.tipologias ?? [], [project.tipologias]);
  const torres = useMemo(() => project.torres ?? [], [project.torres]);

  const [filterTorre, setFilterTorre] = useState<string>("");
  const [filterTipo, setFilterTipo] = useState<string>("");
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [publishing, setPublishing] = useState(false);

  const handlePublishAvailability = useCallback(async () => {
    setPublishing(true);
    try {
      const res = await fetch(`/api/proyectos/${project.id}/publicar-disponibilidad`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Error" }));
        toast.error(data.error || "Error al publicar disponibilidad");
        return;
      }
      toast.success("Disponibilidad publicada en el micrositio");
    } catch {
      toast.error("Error de conexión");
    } finally {
      setPublishing(false);
    }
  }, [project.id, toast]);

  // Filter units
  const filtered = useMemo(() => {
    let result = unidades;
    if (filterTorre) result = result.filter((u) => u.torre_id === filterTorre);
    if (filterTipo) result = result.filter((u) => u.tipologia_id === filterTipo);
    return result.sort((a, b) => (a.piso ?? 0) - (b.piso ?? 0) || a.identificador.localeCompare(b.identificador));
  }, [unidades, filterTorre, filterTipo]);

  // Counts
  const counts = useMemo(() => {
    const c: Record<EstadoUnidad, number> = { disponible: 0, separado: 0, reservada: 0, vendida: 0 };
    for (const u of filtered) c[u.estado]++;
    return c;
  }, [filtered]);

  // Status change handler
  const handleStatusChange = useCallback(async (unitId: string, newEstado: EstadoUnidad) => {
    const unit = unidades.find((u) => u.id === unitId);
    if (!unit || unit.estado === newEstado) return;

    const oldEstado = unit.estado;

    // Optimistic update
    setUpdatingIds((prev) => new Set(prev).add(unitId));
    updateLocal((prev) => ({
      ...prev,
      unidades: prev.unidades.map((u) => u.id === unitId ? { ...u, estado: newEstado } : u),
    }));

    try {
      const res = await fetch(`/api/unidades/${unitId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: newEstado }),
      });

      if (!res.ok) throw new Error("Error");

      toast.success(`${unit.identificador} → ${newEstado}`);
    } catch {
      // Revert on error
      updateLocal((prev) => ({
        ...prev,
        unidades: prev.unidades.map((u) => u.id === unitId ? { ...u, estado: oldEstado } : u),
      }));
      toast.error("Error al actualizar estado");
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(unitId);
        return next;
      });
    }
  }, [unidades, updateLocal, toast]);

  // Group by floor
  const grouped = useMemo(() => {
    const groups = new Map<number | null, Unidad[]>();
    for (const u of filtered) {
      const key = u.piso;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(u);
    }
    return Array.from(groups.entries()).sort((a, b) => (a[0] ?? 0) - (b[0] ?? 0));
  }, [filtered]);

  if (unidades.length === 0) {
    return (
      <div className="p-6 md:p-10 max-w-5xl mx-auto">
        <PageHeader
          icon={Package}
          title="Disponibilidad"
          description="Cambio rápido de estado de unidades"
        />
        <div className={emptyState}>
          <Package size={32} className={emptyStateIcon} />
          <h3 className={emptyStateTitle}>Sin unidades</h3>
          <p className={emptyStateDescription}>Agrega unidades en la sección de Inventario primero.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      {/* Header */}
      <PageHeader
        icon={Package}
        title="Disponibilidad"
        description="Cambio rápido de estado de unidades"
        actions={
          <button
            onClick={handlePublishAvailability}
            disabled={publishing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[rgba(var(--site-primary-rgb),0.1)] border border-[rgba(var(--site-primary-rgb),0.3)] text-[var(--site-primary)] rounded-xl text-xs font-ui font-semibold uppercase tracking-wider hover:bg-[rgba(var(--site-primary-rgb),0.15)] transition-all disabled:opacity-50"
          >
            {publishing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {publishing ? "Publicando..." : "Publicar disponibilidad"}
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {torres.length > 1 && (
          <NodDoDropdown
            variant="dashboard"
            size="sm"
            value={filterTorre}
            onChange={setFilterTorre}
            options={[
              { value: "", label: "Todas las torres" },
              ...torres.map((t) => ({ value: t.id, label: t.nombre })),
            ]}
          />
        )}
        {tipologias.length > 1 && (
          <NodDoDropdown
            variant="dashboard"
            size="sm"
            value={filterTipo}
            onChange={setFilterTipo}
            options={[
              { value: "", label: "Todas las tipologías" },
              ...tipologias.map((t) => ({ value: t.id, label: t.nombre })),
            ]}
          />
        )}
      </div>

      {/* Summary bar */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl">
        {ESTADOS.map((e) => (
          <div key={e.value} className="flex items-center gap-2">
            <span className={cn("w-2.5 h-2.5 rounded-full", e.dot)} />
            <span className="text-xs text-[var(--text-secondary)]">
              {e.label}
            </span>
            <span className="text-xs font-medium text-white">{counts[e.value]}</span>
          </div>
        ))}
        <div className="ml-auto text-xs text-[var(--text-muted)]">
          {filtered.length} unidades
        </div>
      </div>

      {/* Units list */}
      <div className="space-y-1">
        {grouped.map(([piso, units]) => (
          <div key={piso ?? "null"}>
            {/* Floor divider */}
            {piso !== null && (
              <div className="flex items-center gap-2 py-2 mt-3 first:mt-0">
                <span className="text-[10px] font-ui uppercase tracking-widest text-[var(--text-muted)] font-bold">
                  Piso {piso}
                </span>
                <div className="flex-1 h-px bg-[var(--border-subtle)]" />
              </div>
            )}
            {units.map((unit) => {
              const tipo = tipologias.find((t) => t.id === unit.tipologia_id);
              const isUpdating = updatingIds.has(unit.id);
              return (
                <div
                  key={unit.id}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors",
                    "hover:bg-[var(--surface-1)]",
                    isUpdating && "opacity-60"
                  )}
                >
                  {/* ID */}
                  <span className="text-sm font-medium text-white min-w-[70px]">
                    {unit.identificador}
                  </span>
                  {/* Tipología */}
                  <span className="text-xs text-[var(--text-tertiary)] min-w-[80px] truncate hidden sm:block">
                    {tipo?.nombre ?? "—"}
                  </span>
                  {/* Price */}
                  <span className="text-xs text-[var(--text-secondary)] min-w-[60px] text-right hidden sm:block">
                    {unit.precio ? formatCurrency(unit.precio) : "—"}
                  </span>
                  {/* Spacer */}
                  <div className="flex-1" />
                  {/* Status dots */}
                  <div className="flex items-center gap-1.5">
                    {ESTADOS.map((e) => (
                      <button
                        key={e.value}
                        onClick={() => handleStatusChange(unit.id, e.value)}
                        disabled={isUpdating}
                        title={e.label}
                        className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer",
                          unit.estado === e.value
                            ? `${e.dot} ring-2 ring-offset-1 ring-offset-[var(--surface-0)] ring-current scale-110`
                            : `${e.dot}/20 hover:${e.dot}/40`
                        )}
                      >
                        <span
                          className={cn(
                            "w-2.5 h-2.5 rounded-full",
                            unit.estado === e.value ? "bg-white" : e.dot
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
