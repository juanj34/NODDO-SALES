"use client";

export const dynamic = "force-dynamic";

import { useState, useMemo, useCallback } from "react";
import { getInventoryColumns } from "@/lib/inventory-columns";
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
import type { Unidad, ComplementoMode } from "@/types";
import { NodDoDropdown } from "@/components/ui/NodDoDropdown";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

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
  const isCasas = project.tipo_proyecto === "casas";
  const isLotes = project.tipo_proyecto === "lotes";
  const isLoteBased = isCasas || isLotes;
  const columns = useMemo(
    () => getInventoryColumns(project.tipo_proyecto ?? "hibrido", project.inventory_columns),
    [project.tipo_proyecto, project.inventory_columns]
  );
  const groupByEtapa = columns.etapa && !columns.piso;
  const isMultiTipo = project.tipologia_mode === "multiple";
  const unidadTipologias = useMemo(() => project.unidad_tipologias ?? [], [project.unidad_tipologias]);

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
    if (filterTipo) {
      if (isMultiTipo) {
        const compatibleIds = new Set(
          unidadTipologias.filter(ut => ut.tipologia_id === filterTipo).map(ut => ut.unidad_id)
        );
        result = result.filter((u) => compatibleIds.has(u.id));
      } else {
        result = result.filter((u) => u.tipologia_id === filterTipo);
      }
    }
    return result.sort((a, b) => (a.piso ?? 0) - (b.piso ?? 0) || a.identificador.localeCompare(b.identificador));
  }, [unidades, filterTorre, filterTipo, isMultiTipo, unidadTipologias]);

  // Counts
  const counts = useMemo(() => {
    const c: Record<EstadoUnidad, number> = { disponible: 0, separado: 0, reservada: 0, vendida: 0, proximamente: 0 };
    for (const u of filtered) c[u.estado]++;
    return c;
  }, [filtered]);

  // Pre-sale complementos validation
  const parqMode = project.parqueaderos_mode as ComplementoMode;
  const depoMode = project.depositos_mode as ComplementoMode;
  const parqInventory = parqMode === "inventario_incluido" || parqMode === "inventario_separado";
  const depoInventory = depoMode === "inventario_incluido" || depoMode === "inventario_separado";
  const [vendidaWarning, setVendidaWarning] = useState<{ callback: () => void } | null>(null);
  const [vendidaWarningMessage, setVendidaWarningMessage] = useState("");

  // Status change handler
  const doStatusChange = useCallback(async (unitId: string, newEstado: EstadoUnidad) => {
    const unit = unidades.find((u) => u.id === unitId);
    if (!unit) return;

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

  // Tipología selection modal for multi-tipo units
  const [tipoSelectUnit, setTipoSelectUnit] = useState<{ unitId: string; estado: EstadoUnidad } | null>(null);

  const handleStatusChange = useCallback((unitId: string, newEstado: EstadoUnidad) => {
    const unit = unidades.find((u) => u.id === unitId);
    if (!unit || unit.estado === newEstado) return;

    // Multi-tipo validation: require tipología selection before selling/reserving
    if (isMultiTipo && !unit.tipologia_id && ["separado", "reservada", "vendida"].includes(newEstado)) {
      const hasOptions = unidadTipologias.some(ut => ut.unidad_id === unitId);
      if (hasOptions) {
        setTipoSelectUnit({ unitId, estado: newEstado });
        return;
      }
    }

    // Pre-sale validation: check complementos before marking as vendida
    if (newEstado === "vendida" && (parqInventory || depoInventory)) {
      const allComplementos = project.complementos || [];
      const tip = tipologias.find((t) => t.id === unit.tipologia_id);
      const expectedParq = unit.parqueaderos ?? tip?.parqueaderos ?? 0;
      const expectedDepo = unit.depositos ?? tip?.depositos ?? 0;
      const assigned = allComplementos.filter((c) => c.unidad_id === unitId);
      const assignedParq = assigned.filter((c) => c.tipo === "parqueadero").length;
      const assignedDepo = assigned.filter((c) => c.tipo === "deposito").length;

      const missing: string[] = [];
      if (parqInventory && assignedParq < expectedParq) {
        missing.push(`${expectedParq - assignedParq} parqueadero(s)`);
      }
      if (depoInventory && assignedDepo < expectedDepo) {
        missing.push(`${expectedDepo - assignedDepo} depósito(s)`);
      }

      if (missing.length > 0) {
        setVendidaWarningMessage(`${unit.identificador}: faltan ${missing.join(" y ")}`);
        setVendidaWarning({ callback: () => doStatusChange(unitId, newEstado) });
        return;
      }
    }

    doStatusChange(unitId, newEstado);
  }, [unidades, tipologias, parqInventory, depoInventory, project.complementos, doStatusChange, isMultiTipo, unidadTipologias]);

  // Group by floor (apartments) or etapa (houses)
  const grouped = useMemo(() => {
    if (groupByEtapa) {
      // Group by etapa_nombre for houses/lotes
      const groups = new Map<string | null, Unidad[]>();
      for (const u of filtered) {
        const key = u.etapa_nombre ?? null;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(u);
      }
      // Convert to same format as floor grouping (use string key)
      return Array.from(groups.entries()).map(([etapa, units]) => [etapa, units] as [string | null, Unidad[]]);
    }
    const groups = new Map<number | null, Unidad[]>();
    for (const u of filtered) {
      const key = u.piso;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(u);
    }
    return Array.from(groups.entries()).sort((a, b) => ((a[0] as number) ?? 0) - ((b[0] as number) ?? 0)) as [number | string | null, Unidad[]][];
  }, [filtered, groupByEtapa]);

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
              { value: "", label: isLoteBased ? "Todas las etapas" : "Todas las torres" },
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
        {grouped.map(([groupKey, units]) => (
          <div key={String(groupKey ?? "null")}>
            {/* Group divider */}
            {groupKey !== null && (
              <div className="flex items-center gap-2 py-2 mt-3 first:mt-0">
                <span className="text-[10px] font-ui uppercase tracking-widest text-[var(--text-muted)] font-bold">
                  {groupByEtapa ? (groupKey || "Sin etapa") : `Piso ${groupKey}`}
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
                    {isMultiTipo && !unit.tipologia_id
                      ? `${unidadTipologias.filter(ut => ut.unidad_id === unit.id).length} tipos`
                      : (tipo?.nombre ?? "—")}
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

      {/* Modal: select tipología before status change (multi-tipo) */}
      <AnimatePresence>
        {tipoSelectUnit && (() => {
          const unit = unidades.find(u => u.id === tipoSelectUnit.unitId);
          const availTipos = tipologias.filter(t =>
            unidadTipologias.some(ut => ut.unidad_id === tipoSelectUnit.unitId && ut.tipologia_id === t.id)
          );
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
              onClick={() => setTipoSelectUnit(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[var(--surface-2)] border border-[var(--border-default)] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
              >
                <h3 className="text-sm font-medium text-white mb-1">Seleccionar tipología</h3>
                <p className="text-xs text-[var(--text-secondary)] mb-4">
                  {unit?.identificador}: elige la tipología antes de cambiar a {tipoSelectUnit.estado}
                </p>
                <div className="space-y-2 mb-4">
                  {availTipos.map(tipo => (
                    <button
                      key={tipo.id}
                      onClick={async () => {
                        // Confirm tipología + change estado
                        await fetch(`/api/unidades/${tipoSelectUnit.unitId}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ tipologia_id: tipo.id, estado: tipoSelectUnit.estado }),
                        });
                        updateLocal((prev) => ({
                          ...prev,
                          unidades: prev.unidades.map(u =>
                            u.id === tipoSelectUnit.unitId
                              ? { ...u, tipologia_id: tipo.id, estado: tipoSelectUnit.estado }
                              : u
                          ),
                        }));
                        toast.success(`${unit?.identificador} → ${tipo.nombre} · ${tipoSelectUnit.estado}`);
                        setTipoSelectUnit(null);
                      }}
                      className="w-full flex items-center justify-between p-3 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl hover:border-[rgba(var(--site-primary-rgb),0.3)] transition-colors text-left"
                    >
                      <div>
                        <p className="text-xs font-medium text-white">{tipo.nombre}</p>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                          {[tipo.area_m2 && `${tipo.area_m2} m²`, tipo.habitaciones != null && `${tipo.habitaciones} hab`, tipo.banos != null && `${tipo.banos} baños`].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      {tipo.precio_desde != null && (
                        <span className="text-xs text-[var(--site-primary)] font-medium">
                          {formatCurrency(tipo.precio_desde)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setTipoSelectUnit(null)}
                  className="w-full px-4 py-2 text-xs font-ui uppercase tracking-wider text-[var(--text-secondary)] bg-[var(--surface-3)] border border-[var(--border-default)] rounded-xl hover:bg-[var(--surface-4)] transition-colors"
                >
                  Cancelar
                </button>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Warning: selling without complementos */}
      <AnimatePresence>
        {vendidaWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => { setVendidaWarning(null); setVendidaWarningMessage(""); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--surface-2)] border border-[var(--border-default)] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <AlertTriangle size={18} className="text-amber-400" />
                </div>
                <h3 className="text-sm font-medium text-white">Complementos pendientes de asignar</h3>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-6 whitespace-pre-line">
                {vendidaWarningMessage}{"\n\n"}¿Deseas marcar como vendida de todas formas? Los complementos se pueden asignar después.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => { setVendidaWarning(null); setVendidaWarningMessage(""); }}
                  className="px-4 py-2 text-xs font-ui uppercase tracking-wider text-[var(--text-secondary)] bg-[var(--surface-3)] border border-[var(--border-default)] rounded-xl hover:bg-[var(--surface-4)] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => { vendidaWarning.callback(); setVendidaWarning(null); setVendidaWarningMessage(""); }}
                  className="px-4 py-2 text-xs font-ui uppercase tracking-wider text-white bg-amber-600 rounded-xl hover:bg-amber-500 transition-colors"
                >
                  Continuar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
