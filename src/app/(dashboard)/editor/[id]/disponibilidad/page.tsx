"use client";

export const dynamic = "force-dynamic";

import { useState, useMemo, useCallback } from "react";
import { getInventoryColumns, getPrimaryArea } from "@/lib/inventory-columns";
import { UNIT_STATUS_COLORS } from "@/lib/status-colors";
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
import {
  Package, Upload, Loader2, ArrowUpDown, ArrowUp, ArrowDown,
  AlertTriangle, ArrowRight, X,
  LayoutGrid, Maximize2, DollarSign, BedDouble, Bath,
  Car, Warehouse, Compass, Eye, MapPin, Building2, Layers,
} from "lucide-react";
import { useToast } from "@/components/dashboard/Toast";
import type { Unidad, ComplementoMode } from "@/types";
import { AnimatePresence, motion } from "framer-motion";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatCurrency = (n: number) => formatCurrencyFn(n, "COP");

type EstadoUnidad = Unidad["estado"];
type SortField = "identificador" | "area" | "precio" | "estado";

const ALL_ESTADOS: { value: EstadoUnidad; label: string; short: string }[] = [
  { value: "disponible", label: "Disponible", short: "Disp." },
  { value: "proximamente", label: "Próximamente", short: "Prox." },
  { value: "separado", label: "Separado", short: "Sep." },
  { value: "reservada", label: "Reservada", short: "Res." },
  { value: "vendida", label: "Vendida", short: "Vend." },
];

const ESTADO_ORDER: Record<EstadoUnidad, number> = {
  disponible: 0,
  proximamente: 1,
  separado: 2,
  reservada: 3,
  vendida: 4,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DisponibilidadPage() {
  const { project, updateLocal } = useEditorProject();
  const toast = useToast();

  // ── Derived data ──────────────────────────────────────────────────
  const unidades = useMemo(() => project.unidades ?? [], [project.unidades]);
  const tipologias = useMemo(() => project.tipologias ?? [], [project.tipologias]);
  const torres = useMemo(() => project.torres ?? [], [project.torres]);
  const isCasas = project.tipo_proyecto === "casas";
  const isLotes = project.tipo_proyecto === "lotes";
  const isLoteBased = isCasas || isLotes;
  const isTipologiaPricing = project.precio_source === "tipologia";
  const columns = useMemo(
    () => getInventoryColumns(project.tipo_proyecto ?? "hibrido", project.inventory_columns),
    [project.tipo_proyecto, project.inventory_columns]
  );
  const groupByEtapa = columns.etapa && !columns.piso;
  const isMultiTipo = project.tipologia_mode === "multiple";
  const unidadTipologias = useMemo(() => project.unidad_tipologias ?? [], [project.unidad_tipologias]);

  // Derived column visibility
  const hasAnyArea = columns.area_m2 || columns.area_construida || columns.area_privada || columns.area_lote;
  const hasSpecs = columns.habitaciones || columns.banos;
  // Unique etapas for filter dropdown
  const uniqueEtapas = useMemo(() => {
    if (!columns.etapa) return [];
    const set = new Set(unidades.map((u) => u.etapa_nombre).filter((e): e is string => !!e));
    return [...set].sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
  }, [unidades, columns.etapa]);

  // Show proximamente dot only if any unit uses it
  const hasProximamente = useMemo(() => unidades.some((u) => u.estado === "proximamente"), [unidades]);
  const visibleEstados = useMemo(
    () => ALL_ESTADOS.filter((e) => e.value !== "proximamente" || hasProximamente),
    [hasProximamente]
  );

  // ── State ─────────────────────────────────────────────────────────
  const [filterTorre, setFilterTorre] = useState<string>("");
  const [filterTipo, setFilterTipo] = useState<string>("");
  const [filterEstado, setFilterEstado] = useState<EstadoUnidad | "">("");
  const [filterEtapa, setFilterEtapa] = useState<string>("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [publishing, setPublishing] = useState(false);

  // ── Sorting ───────────────────────────────────────────────────────
  const toggleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDir("asc");
      }
    },
    [sortField]
  );

  // ── Filtering ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = unidades;
    if (filterTorre) result = result.filter((u) => u.torre_id === filterTorre);
    if (filterTipo) {
      if (isMultiTipo) {
        const compatibleIds = new Set(
          unidadTipologias
            .filter((ut) => ut.tipologia_id === filterTipo)
            .map((ut) => ut.unidad_id)
        );
        result = result.filter((u) => compatibleIds.has(u.id));
      } else {
        result = result.filter((u) => u.tipologia_id === filterTipo);
      }
    }
    if (filterEstado) result = result.filter((u) => u.estado === filterEstado);
    if (filterEtapa) result = result.filter((u) => u.etapa_nombre === filterEtapa);
    return result;
  }, [unidades, filterTorre, filterTipo, filterEstado, filterEtapa, isMultiTipo, unidadTipologias]);

  // ── Sorted data ───────────────────────────────────────────────────
  const sorted = useMemo(() => {
    if (!sortField) {
      // Default sort: piso then natural identificador
      return [...filtered].sort(
        (a, b) =>
          (a.piso ?? 0) - (b.piso ?? 0) ||
          a.identificador.localeCompare(b.identificador, "es", { numeric: true })
      );
    }
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortField) {
        case "identificador":
          return a.identificador.localeCompare(b.identificador, "es", { numeric: true }) * dir;
        case "area": {
          const va = getPrimaryArea(a, columns) ?? -1;
          const vb = getPrimaryArea(b, columns) ?? -1;
          return (va - vb) * dir;
        }
        case "precio": {
          const va = a.precio ?? -1;
          const vb = b.precio ?? -1;
          return (va - vb) * dir;
        }
        case "estado":
          return ((ESTADO_ORDER[a.estado] ?? 99) - (ESTADO_ORDER[b.estado] ?? 99)) * dir;
        default:
          return 0;
      }
    });
  }, [filtered, sortField, sortDir, columns]);

  // ── Counts (from filtered, before sorting) ────────────────────────
  const counts = useMemo(() => {
    // Count from all units (not filtered by estado) so we see totals
    let base = unidades;
    if (filterTorre) base = base.filter((u) => u.torre_id === filterTorre);
    if (filterTipo) {
      if (isMultiTipo) {
        const compatibleIds = new Set(
          unidadTipologias
            .filter((ut) => ut.tipologia_id === filterTipo)
            .map((ut) => ut.unidad_id)
        );
        base = base.filter((u) => compatibleIds.has(u.id));
      } else {
        base = base.filter((u) => u.tipologia_id === filterTipo);
      }
    }
    if (filterEtapa) base = base.filter((u) => u.etapa_nombre === filterEtapa);
    const c: Record<EstadoUnidad, number> = {
      disponible: 0,
      separado: 0,
      reservada: 0,
      vendida: 0,
      proximamente: 0,
    };
    for (const u of base) c[u.estado]++;
    return { counts: c, total: base.length };
  }, [unidades, filterTorre, filterTipo, filterEtapa, isMultiTipo, unidadTipologias]);

  // ── Grouping (disabled when sorting) ──────────────────────────────
  const grouped = useMemo(() => {
    // When sorting is active, show flat list
    if (sortField) return [[null, sorted]] as [string | number | null, Unidad[]][];

    if (groupByEtapa) {
      const groups = new Map<string | null, Unidad[]>();
      for (const u of sorted) {
        const key = u.etapa_nombre ?? null;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(u);
      }
      return Array.from(groups.entries()).map(
        ([etapa, units]) => [etapa, units] as [string | null, Unidad[]]
      );
    }

    const groups = new Map<number | null, Unidad[]>();
    for (const u of sorted) {
      const key = u.piso;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(u);
    }
    return Array.from(groups.entries()).sort(
      (a, b) => ((a[0] as number) ?? 0) - ((b[0] as number) ?? 0)
    ) as [number | string | null, Unidad[]][];
  }, [sorted, sortField, groupByEtapa]);

  // ── Publish ───────────────────────────────────────────────────────
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

  // ── Pre-sale complemento validation ───────────────────────────────
  const parqMode = project.parqueaderos_mode as ComplementoMode;
  const depoMode = project.depositos_mode as ComplementoMode;
  const parqInventory = parqMode === "inventario_incluido" || parqMode === "inventario_separado";
  const depoInventory = depoMode === "inventario_incluido" || depoMode === "inventario_separado";
  // ── Status change logic ───────────────────────────────────────────

  // Tipología selection modal for multi-tipo units
  const [tipoSelectUnit, setTipoSelectUnit] = useState<{
    unitId: string;
    estado: EstadoUnidad;
  } | null>(null);

  // General confirmation modal for all status changes
  const [confirmModal, setConfirmModal] = useState<{
    unitId: string;
    newEstado: EstadoUnidad;
    clearTipo: boolean;
    complementoWarning?: string;
  } | null>(null);

  const handleStatusChange = useCallback(
    (unitId: string, newEstado: EstadoUnidad) => {
      const unit = unidades.find((u) => u.id === unitId);
      if (!unit || unit.estado === newEstado) return;

      // Multi-tipo validation: require tipología selection before selling/reserving
      if (
        isMultiTipo &&
        !unit.tipologia_id &&
        ["separado", "reservada", "vendida"].includes(newEstado)
      ) {
        const hasOptions = unidadTipologias.some((ut) => ut.unidad_id === unitId);
        if (hasOptions) {
          setTipoSelectUnit({ unitId, estado: newEstado });
          return;
        }
      }

      // Check if reverting from committed to available (multi-tipo: will clear tipo)
      const isReverting =
        ["vendida", "reservada", "separado"].includes(unit.estado) &&
        ["disponible", "proximamente"].includes(newEstado);
      const clearTipo = isMultiTipo && isReverting && !!unit.tipologia_id;

      // Pre-sale complemento warning
      let complementoWarning = "";
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
          complementoWarning = `Faltan ${missing.join(" y ")}`;
        }
      }

      setConfirmModal({ unitId, newEstado, clearTipo, complementoWarning });
    },
    [
      unidades,
      tipologias,
      parqInventory,
      depoInventory,
      project.complementos,
      isMultiTipo,
      unidadTipologias,
    ]
  );

  const handleConfirmStatusChange = useCallback(async () => {
    if (!confirmModal) return;
    const { unitId, newEstado, clearTipo } = confirmModal;
    const unit = unidades.find((u) => u.id === unitId);
    if (!unit) return;

    const oldEstado = unit.estado;
    const oldTipoId = unit.tipologia_id;

    // Optimistic update
    setUpdatingIds((prev) => new Set(prev).add(unitId));
    updateLocal((prev) => ({
      ...prev,
      unidades: prev.unidades.map((u) =>
        u.id === unitId
          ? { ...u, estado: newEstado, ...(clearTipo ? { tipologia_id: null } : {}) }
          : u
      ),
    }));
    setConfirmModal(null);

    try {
      const body: Record<string, unknown> = { estado: newEstado };
      if (clearTipo) body.tipologia_id = null;

      const res = await fetch(`/api/unidades/${unitId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Error");
      toast.success(`${unit.identificador} → ${newEstado}`);
    } catch {
      // Revert on error
      updateLocal((prev) => ({
        ...prev,
        unidades: prev.unidades.map((u) =>
          u.id === unitId
            ? { ...u, estado: oldEstado, ...(clearTipo ? { tipologia_id: oldTipoId } : {}) }
            : u
        ),
      }));
      toast.error("Error al actualizar estado");
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(unitId);
        return next;
      });
    }
  }, [confirmModal, unidades, updateLocal, toast]);

  // ── Sort icon helper ──────────────────────────────────────────────
  const SortIcon = useCallback(
    ({ field }: { field: SortField }) => {
      if (sortField !== field)
        return <ArrowUpDown size={10} className="opacity-40" />;
      return sortDir === "asc" ? (
        <ArrowUp size={10} />
      ) : (
        <ArrowDown size={10} />
      );
    },
    [sortField, sortDir]
  );

  // ── Empty state ───────────────────────────────────────────────────
  if (unidades.length === 0) {
    return (
      <div className="p-6 md:p-10 max-w-6xl mx-auto">
        <PageHeader
          icon={Package}
          title="Disponibilidad"
          description="Cambio rápido de estado de unidades"
        />
        <div className={emptyState}>
          <Package size={32} className={emptyStateIcon} />
          <h3 className={emptyStateTitle}>Sin unidades</h3>
          <p className={emptyStateDescription}>
            Agrega unidades en la sección de Inventario primero.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      {/* ── Header ──────────────────────────────────────────────── */}
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
            {publishing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Upload size={14} />
            )}
            {publishing ? "Publicando..." : "Publicar disponibilidad"}
          </button>
        }
      />

      {/* ── Filter bar ──────────────────────────────────────── */}
      <div className="glass rounded-xl px-3 py-2 mb-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {/* Estado pills */}
        <div className="flex items-center gap-0.5 shrink-0">
          {visibleEstados.map((e) => {
            const sc = UNIT_STATUS_COLORS[e.value];
            const isActive = filterEstado === e.value;
            const count = counts.counts[e.value];
            return (
              <button
                key={e.value}
                onClick={() => setFilterEstado(isActive ? "" : e.value)}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-ui font-bold uppercase tracking-wider transition-all",
                  isActive
                    ? `${sc.bg} ${sc.text} font-medium`
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/5"
                )}
              >
                {e.short}
                <span className={cn(
                  "text-[9px] font-mono ml-0.5",
                  isActive ? "opacity-70" : "opacity-40"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tipología pills */}
        {tipologias.length > 1 && (
          <>
            <div className="w-px h-5 bg-white/[0.06] shrink-0" />
            <div className="flex items-center gap-0.5 shrink-0">
              {tipologias.map((t) => {
                const isActive = filterTipo === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setFilterTipo(isActive ? "" : t.id)}
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-mono transition-all",
                      isActive
                        ? "bg-[rgba(var(--site-primary-rgb),0.15)] text-[var(--site-primary)] font-medium"
                        : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/5"
                    )}
                  >
                    {t.nombre}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Torre pills */}
        {torres.length > 1 && (
          <>
            <div className="w-px h-5 bg-white/[0.06] shrink-0" />
            <div className="flex items-center gap-0.5 shrink-0">
              {torres.map((t) => {
                const isActive = filterTorre === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setFilterTorre(isActive ? "" : t.id)}
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-mono transition-all",
                      isActive
                        ? "bg-[rgba(var(--site-primary-rgb),0.15)] text-[var(--site-primary)] font-medium"
                        : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/5"
                    )}
                  >
                    {t.nombre}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Etapa pills */}
        {columns.etapa && uniqueEtapas.length > 1 && (
          <>
            <div className="w-px h-5 bg-white/[0.06] shrink-0" />
            <div className="flex items-center gap-0.5 shrink-0">
              {uniqueEtapas.map((e) => {
                const isActive = filterEtapa === e;
                return (
                  <button
                    key={e}
                    onClick={() => setFilterEtapa(isActive ? "" : e)}
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-mono transition-all",
                      isActive
                        ? "bg-[rgba(var(--site-primary-rgb),0.15)] text-[var(--site-primary)] font-medium"
                        : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/5"
                    )}
                  >
                    {e}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Unit count */}
        <span className="ml-auto text-[10px] font-mono text-[var(--text-muted)] shrink-0">
          {filterEstado || filterTorre || filterTipo || filterEtapa
            ? `${filtered.length} / ${counts.total}`
            : `${counts.total} uds`}
        </span>
      </div>

      {/* ── Table ───────────────────────────────────────────────── */}
      <div className="space-y-0">
        {/* Column header */}
        <div className="flex items-center gap-4 px-4 py-2 mb-1 sticky top-0 z-10 bg-[var(--surface-0)]">
          <button
            onClick={() => toggleSort("identificador")}
            className={cn(
              "flex items-center gap-1 w-[60px] shrink-0 font-ui text-[9px] font-bold uppercase tracking-[0.12em] transition-colors",
              sortField === "identificador" ? "text-[var(--site-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-tertiary)]"
            )}
          >
            Unidad <SortIcon field="identificador" />
          </button>
          <span className="w-[90px] shrink-0 font-ui text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)] hidden sm:block">
            Tipo
          </span>
          {hasAnyArea && (
            <button
              onClick={() => toggleSort("area")}
              className={cn(
                "items-center gap-1 w-[65px] shrink-0 font-ui text-[9px] font-bold uppercase tracking-[0.12em] transition-colors hidden sm:flex",
                sortField === "area" ? "text-[var(--site-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-tertiary)]"
              )}
            >
              Área <SortIcon field="area" />
            </button>
          )}
          {columns.precio && (
            <button
              onClick={() => toggleSort("precio")}
              className={cn(
                "items-center gap-1 w-[130px] shrink-0 font-ui text-[9px] font-bold uppercase tracking-[0.12em] transition-colors hidden sm:flex",
                sortField === "precio" ? "text-[var(--site-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-tertiary)]"
              )}
            >
              Precio <SortIcon field="precio" />
            </button>
          )}
          {hasSpecs && (
            <span className="w-[50px] shrink-0 font-ui text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)] hidden md:block">
              Specs
            </span>
          )}
          <button
            onClick={() => toggleSort("estado")}
            className={cn(
              "flex items-center gap-1 font-ui text-[9px] font-bold uppercase tracking-[0.12em] transition-colors",
              sortField === "estado" ? "text-[var(--site-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-tertiary)]"
            )}
          >
            Estado <SortIcon field="estado" />
          </button>
        </div>

        {/* Rows */}
        {grouped.map(([groupKey, units]) => (
          <div key={String(groupKey ?? "flat")}>
            {/* Group divider */}
            {groupKey !== null && (
              <div className="flex items-center gap-2 py-2 mt-3 first:mt-0">
                <span className="text-[10px] font-ui uppercase tracking-widest text-[var(--text-muted)] font-bold">
                  {groupByEtapa
                    ? (groupKey as string) || "Sin etapa"
                    : `Piso ${groupKey}`}
                </span>
                <div className="flex-1 h-px bg-[var(--border-subtle)]" />
              </div>
            )}
            {units.map((unit) => {
              const tipo = tipologias.find((t) => t.id === unit.tipologia_id);
              const isUpdating = updatingIds.has(unit.id);
              const area = getPrimaryArea(unit, columns) ?? tipo?.area_m2;
              const displayPrice = unit.estado === "vendida" && unit.precio_venta != null
                ? unit.precio_venta
                : isTipologiaPricing
                  ? (tipo?.precio_desde ?? unit.precio)
                  : unit.precio;
              const sc = UNIT_STATUS_COLORS[unit.estado];
              const isUncommitted = isMultiTipo && ["disponible", "proximamente"].includes(unit.estado);

              return (
                <div
                  key={unit.id}
                  className={cn(
                    "flex items-center gap-4 px-4 py-2 rounded-lg transition-colors",
                    "hover:bg-[var(--surface-1)]",
                    isUpdating && "opacity-50 pointer-events-none"
                  )}
                >
                  <span className="text-sm font-medium text-white w-[60px] shrink-0 truncate">
                    {unit.identificador}
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)] w-[90px] shrink-0 truncate hidden sm:block">
                    {isUncommitted ? "—" : (tipo?.nombre ?? "—")}
                  </span>
                  {hasAnyArea && (
                    <span className="text-xs font-mono text-[var(--text-secondary)] w-[65px] shrink-0 hidden sm:block">
                      {isUncommitted ? "—" : area != null ? `${area} m²` : "—"}
                    </span>
                  )}
                  {columns.precio && (
                    <span className="text-xs font-mono text-[var(--text-secondary)] w-[130px] shrink-0 hidden sm:block">
                      {isUncommitted ? "—" : displayPrice ? formatCurrency(displayPrice) : "—"}
                    </span>
                  )}
                  {hasSpecs && (
                    <span className="text-[11px] font-mono text-[var(--text-muted)] w-[50px] shrink-0 hidden md:block">
                      {isUncommitted
                        ? "—"
                        : [
                            columns.habitaciones && (unit.habitaciones ?? tipo?.habitaciones) != null
                              ? `${unit.habitaciones ?? tipo?.habitaciones}H`
                              : null,
                            columns.banos && (unit.banos ?? tipo?.banos) != null
                              ? `${unit.banos ?? tipo?.banos}B`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" ") || "—"}
                    </span>
                  )}

                  {/* Estado pills */}
                  <div className="flex items-center gap-1">
                      {visibleEstados.map((e) => {
                        const esc = UNIT_STATUS_COLORS[e.value];
                        const isActive = unit.estado === e.value;
                        return (
                          <button
                            key={e.value}
                            onClick={() =>
                              handleStatusChange(unit.id, e.value)
                            }
                            disabled={isUpdating}
                            className={cn(
                              "px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all border",
                              isActive
                                ? `${esc.bg} ${esc.text} ${esc.border}`
                                : "bg-transparent text-[var(--text-muted)] border-transparent hover:bg-[var(--surface-2)] hover:text-[var(--text-tertiary)]"
                            )}
                          >
                            {esc.short}
                          </button>
                        );
                      })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── Modal: select tipología before status change (multi-tipo) ── */}
      <AnimatePresence>
        {tipoSelectUnit &&
          (() => {
            const unit = unidades.find(
              (u) => u.id === tipoSelectUnit.unitId
            );
            const availTipos = tipologias.filter((t) =>
              unidadTipologias.some(
                (ut) =>
                  ut.unidad_id === tipoSelectUnit.unitId &&
                  ut.tipologia_id === t.id
              )
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
                  <h3 className="text-sm font-medium text-white mb-1">
                    Seleccionar tipología
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mb-4">
                    {unit?.identificador}: elige la tipología antes de cambiar a{" "}
                    {tipoSelectUnit.estado}
                  </p>
                  <div className="space-y-2 mb-4">
                    {availTipos.map((tipo) => (
                      <button
                        key={tipo.id}
                        onClick={async () => {
                          await fetch(
                            `/api/unidades/${tipoSelectUnit.unitId}`,
                            {
                              method: "PUT",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                tipologia_id: tipo.id,
                                estado: tipoSelectUnit.estado,
                              }),
                            }
                          );
                          updateLocal((prev) => ({
                            ...prev,
                            unidades: prev.unidades.map((u) =>
                              u.id === tipoSelectUnit.unitId
                                ? {
                                    ...u,
                                    tipologia_id: tipo.id,
                                    estado: tipoSelectUnit.estado,
                                  }
                                : u
                            ),
                          }));
                          toast.success(
                            `${unit?.identificador} → ${tipo.nombre} · ${tipoSelectUnit.estado}`
                          );
                          setTipoSelectUnit(null);
                        }}
                        className="w-full flex items-center justify-between p-3 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl hover:border-[rgba(var(--site-primary-rgb),0.3)] transition-colors text-left"
                      >
                        <div>
                          <p className="text-xs font-medium text-white">
                            {tipo.nombre}
                          </p>
                          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                            {[
                              tipo.area_m2 && `${tipo.area_m2} m²`,
                              tipo.habitaciones != null &&
                                `${tipo.habitaciones} hab`,
                              tipo.banos != null && `${tipo.banos} baños`,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
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

      {/* ── Confirmation modal for status changes ──────────────────── */}
      <AnimatePresence>
        {confirmModal &&
          (() => {
            const unit = unidades.find((u) => u.id === confirmModal.unitId);
            if (!unit) return null;
            const tip = tipologias.find((t) => t.id === unit.tipologia_id);
            const torre = torres.find((t) => t.id === unit.torre_id);
            const area = getPrimaryArea(unit, columns) ?? tip?.area_m2;
            const price = unit.estado === "vendida" && unit.precio_venta != null
              ? unit.precio_venta
              : isTipologiaPricing
                ? (tip?.precio_desde ?? unit.precio)
                : unit.precio;
            const newSc = UNIT_STATUS_COLORS[confirmModal.newEstado];
            const oldSc = UNIT_STATUS_COLORS[unit.estado];

            // Build info fields dynamically — only show fields with values (fall back to tipología data)
            const infoFields: { icon: typeof LayoutGrid; label: string; value: string; highlight?: boolean }[] = [];
            if (tip) infoFields.push({ icon: LayoutGrid, label: "Tipología", value: tip.nombre });
            if (area != null) infoFields.push({ icon: Maximize2, label: "Área", value: `${area} m²` });
            if (price != null) infoFields.push({ icon: DollarSign, label: "Precio", value: formatCurrency(price), highlight: true });
            const hab = unit.habitaciones ?? tip?.habitaciones;
            if (hab != null) infoFields.push({ icon: BedDouble, label: "Habitaciones", value: String(hab) });
            const ban = unit.banos ?? tip?.banos;
            if (ban != null) infoFields.push({ icon: Bath, label: "Baños", value: String(ban) });
            const parq = unit.parqueaderos ?? tip?.parqueaderos;
            if (parq != null) infoFields.push({ icon: Car, label: "Parqueaderos", value: String(parq) });
            if (unit.depositos != null) infoFields.push({ icon: Warehouse, label: "Depósitos", value: String(unit.depositos) });
            if (unit.orientacion) infoFields.push({ icon: Compass, label: "Orientación", value: unit.orientacion });
            if (unit.vista) infoFields.push({ icon: Eye, label: "Vista", value: unit.vista });
            if (unit.lote) infoFields.push({ icon: MapPin, label: "Lote", value: unit.lote });

            // Metadata line (torre, piso, etapa)
            const metaParts: string[] = [];
            if (torre) metaParts.push(torre.nombre);
            if (unit.piso != null) metaParts.push(`Piso ${unit.piso}`);
            if (unit.etapa_nombre) metaParts.push(unit.etapa_nombre);

            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                onClick={() => setConfirmModal(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-[var(--surface-2)] border border-[var(--border-default)] rounded-2xl max-w-lg w-full mx-4 shadow-2xl overflow-hidden"
                >
                  {/* Header */}
                  <div className="px-6 pt-5 pb-4 border-b border-[var(--border-subtle)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-2xl font-heading font-light text-white leading-none">
                            {unit.identificador}
                          </h3>
                          {/* Estado transition inline */}
                          <div className="flex items-center gap-1.5">
                            <span className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-ui font-bold uppercase tracking-wider border",
                              oldSc.bg, oldSc.text, oldSc.border
                            )}>
                              <span className={cn("w-1.5 h-1.5 rounded-full", oldSc.dot)} />
                              {UNIT_STATUS_COLORS[unit.estado].short}
                            </span>
                            <ArrowRight size={12} className="text-[var(--text-muted)] shrink-0" />
                            <span className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-ui font-bold uppercase tracking-wider border",
                              newSc.bg, newSc.text, newSc.border
                            )}>
                              <span className={cn("w-1.5 h-1.5 rounded-full", newSc.dot)} />
                              {UNIT_STATUS_COLORS[confirmModal.newEstado].short}
                            </span>
                          </div>
                        </div>
                        {metaParts.length > 0 && (
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--text-muted)]">
                            {torre && <Building2 size={10} className="shrink-0" />}
                            {metaParts.join(" · ")}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setConfirmModal(null)}
                        className="p-1.5 rounded-lg hover:bg-[var(--surface-3)] transition-colors text-[var(--text-muted)] hover:text-white shrink-0"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Unit info grid */}
                  {infoFields.length > 0 && (
                    <div className="px-6 py-4 border-b border-[var(--border-subtle)]">
                      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                        {infoFields.map((field) => (
                          <div key={field.label} className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-[var(--surface-3)] flex items-center justify-center shrink-0">
                              <field.icon size={13} className="text-[var(--text-tertiary)]" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[9px] font-ui uppercase tracking-[0.12em] text-[var(--text-muted)] leading-none mb-0.5">
                                {field.label}
                              </p>
                              <p className={cn(
                                "text-xs font-mono leading-none truncate",
                                field.highlight ? "text-[var(--site-primary)] font-medium" : "text-white"
                              )}>
                                {field.value}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warnings + Actions */}
                  <div className="px-6 py-4">
                    {/* Warnings */}
                    {confirmModal.clearTipo && (
                      <div className="flex items-start gap-2.5 p-3 bg-amber-500/8 border border-amber-500/15 rounded-xl mb-3">
                        <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[11px] font-medium text-amber-400 leading-snug">
                            Se liberará la tipología asignada
                          </p>
                          <p className="text-[10px] text-amber-400/60 mt-0.5">{tip?.nombre}</p>
                        </div>
                      </div>
                    )}
                    {confirmModal.complementoWarning && (
                      <div className="flex items-start gap-2.5 p-3 bg-amber-500/8 border border-amber-500/15 rounded-xl mb-3">
                        <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-amber-400 leading-snug">
                          {confirmModal.complementoWarning}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 mt-1">
                      <button
                        onClick={() => setConfirmModal(null)}
                        className="flex-1 px-4 py-2.5 text-[11px] font-ui uppercase tracking-wider text-[var(--text-secondary)] bg-[var(--surface-3)] border border-[var(--border-default)] rounded-xl hover:bg-[var(--surface-4)] transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleConfirmStatusChange}
                        className="flex-1 px-4 py-2.5 text-[11px] font-ui uppercase tracking-wider rounded-xl transition-all bg-[rgba(var(--site-primary-rgb),0.15)] text-[var(--site-primary)] border border-[rgba(var(--site-primary-rgb),0.3)] hover:bg-[rgba(var(--site-primary-rgb),0.25)] hover:border-[var(--site-primary)]"
                      >
                        Confirmar cambio
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })()}
      </AnimatePresence>
    </div>
  );
}
