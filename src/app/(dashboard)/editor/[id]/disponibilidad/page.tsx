"use client";

export const dynamic = "force-dynamic";

import { useState, useMemo, useCallback } from "react";
import { getInventoryColumns, getPrimaryArea, INVENTORY_COLUMN_KEYS } from "@/lib/inventory-columns";
import { UNIT_STATUS_COLORS } from "@/lib/status-colors";
import type { InventoryColumnConfig } from "@/types";
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
  Package, Upload, Loader2, ArrowUpDown, ArrowUp, ArrowDown, Settings2,
} from "lucide-react";
import { useToast } from "@/components/dashboard/Toast";
import { useTranslation } from "@/i18n";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { useAuthRole } from "@/hooks/useAuthContext";
import type { Unidad, ComplementoMode } from "@/types";
import {
  StatusChangeModal,
  type ProjectContextForModal,
  type StatusChangePayload,
  type EstadoUnidad,
  type ModalUnit,
} from "@/components/dashboard/StatusChangeModal";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatCurrency = (n: number) => formatCurrencyFn(n, "COP");

type SortField = "identificador" | "area" | "precio" | "estado";

const COL_LABELS: Record<string, string> = {
  area_m2: "Área m²",
  area_construida: "Área construida",
  area_privada: "Área privada",
  area_lote: "Área lote",
  precio: "Precio",
  habitaciones: "Habitaciones",
  banos: "Baños",
  parqueaderos: "Parqueaderos",
  depositos: "Depósitos",
  orientacion: "Orientación",
  vista: "Vista",
  piso: "Piso",
  etapa: "Etapa",
};

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
  const { t } = useTranslation("editor");
  const { t: tTooltips } = useTranslation("tooltips");
  const { role } = useAuthRole();

  // ── Derived data ──────────────────────────────────────────────────
  const unidades = useMemo(() => project.unidades ?? [], [project.unidades]);
  const tipologias = useMemo(() => project.tipologias ?? [], [project.tipologias]);
  const torres = useMemo(() => project.torres ?? [], [project.torres]);
  const isCasas = project.tipo_proyecto === "casas";
  const isLotes = project.tipo_proyecto === "lotes";
  const isLoteBased = isCasas || isLotes;
  const isTipologiaPricing = project.precio_source === "tipologia";
  const baseColumns = useMemo(
    () => getInventoryColumns(project.tipo_proyecto ?? "hibrido", project.inventory_columns),
    [project.tipo_proyecto, project.inventory_columns]
  );
  // Column visibility override (user can toggle via gear icon)
  const [columnOverrides, setColumnOverrides] = useState<Partial<InventoryColumnConfig>>({});
  const [showColSettings, setShowColSettings] = useState(false);
  const columns = useMemo(
    () => ({ ...baseColumns, ...columnOverrides }),
    [baseColumns, columnOverrides]
  );
  const toggleColumn = useCallback((key: keyof InventoryColumnConfig) => {
    setColumnOverrides((prev) => {
      const current = { ...baseColumns, ...prev };
      return { ...prev, [key]: !current[key] };
    });
  }, [baseColumns]);
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
        toast.error(data.error || t("disponibilidadPage.updateError"));
        return;
      }
      toast.success(t("disponibilidadPage.published"));
    } catch {
      toast.error(t("errors.connectionError"));
    } finally {
      setPublishing(false);
    }
  }, [project.id, toast, t]);

  // ── Pre-sale complemento validation ───────────────────────────────
  const parqMode = project.parqueaderos_mode as ComplementoMode;
  const depoMode = project.depositos_mode as ComplementoMode;
  const parqInventory = parqMode === "inventario_incluido" || parqMode === "inventario_separado";
  const depoInventory = depoMode === "inventario_incluido" || depoMode === "inventario_separado";

  // ── Status change modal ─────────────────────────────────────────
  const [modalTarget, setModalTarget] = useState<{
    unit: ModalUnit;
    newEstado: EstadoUnidad;
    complementoWarning?: string;
  } | null>(null);

  // Build project context for the shared modal
  const projectContextForModal = useMemo((): ProjectContextForModal => ({
    projectId: project.id,
    tipologiaMode: project.tipologia_mode ?? "fija",
    precioSource: project.precio_source ?? "unidad",
    monedaBase: project.moneda_base ?? "COP",
    disponibilidadConfig: project.disponibilidad_config ?? {},
    unitDisplayPrefix: project.unidad_display_prefix ?? null,
    tipologias: tipologias.map((t) => ({
      id: t.id,
      nombre: t.nombre,
      area_m2: t.area_m2 ?? null,
      habitaciones: t.habitaciones ?? null,
      banos: t.banos ?? null,
      precio_desde: t.precio_desde ?? null,
      parqueaderos: t.parqueaderos ?? null,
      depositos: t.depositos ?? null,
    })),
    torres: torres.map((t) => ({ id: t.id, nombre: t.nombre })),
    unidadTipologias: unidadTipologias.map((ut) => ({
      unidad_id: ut.unidad_id,
      tipologia_id: ut.tipologia_id,
    })),
  }), [project, tipologias, torres, unidadTipologias]);

  const handleStatusChange = useCallback(
    (unitId: string, newEstado: EstadoUnidad) => {
      const unit = unidades.find((u) => u.id === unitId);
      if (!unit || unit.estado === newEstado) return;

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

      const modalUnit: ModalUnit = {
        id: unit.id,
        identificador: unit.identificador,
        tipologia_id: unit.tipologia_id,
        estado: unit.estado,
        piso: unit.piso,
        area_m2: unit.area_m2,
        area_construida: unit.area_construida ?? null,
        area_privada: unit.area_privada ?? null,
        area_lote: unit.area_lote ?? null,
        precio: unit.precio,
        precio_venta: unit.precio_venta,
        lead_id: unit.lead_id ?? null,
        cotizacion_id: unit.cotizacion_id ?? null,
        habitaciones: unit.habitaciones,
        banos: unit.banos,
        parqueaderos: unit.parqueaderos,
        depositos: unit.depositos,
        orientacion: unit.orientacion,
        vista: unit.vista,
        lote: unit.lote,
        etapa_nombre: unit.etapa_nombre,
        torre_id: unit.torre_id,
      };

      setModalTarget({ unit: modalUnit, newEstado, complementoWarning });
    },
    [unidades, tipologias, parqInventory, depoInventory, project.complementos]
  );

  const handleConfirmStatusChange = useCallback(async (payload: StatusChangePayload) => {
    if (!modalTarget) return;
    const unitId = modalTarget.unit.id;
    const unit = unidades.find((u) => u.id === unitId);
    if (!unit) return;

    const oldEstado = unit.estado;
    const oldTipoId = unit.tipologia_id;
    const oldPrecioVenta = unit.precio_venta;
    const oldLeadId = unit.lead_id;
    const oldCotizacionId = unit.cotizacion_id;

    // Optimistic update
    setUpdatingIds((prev) => new Set(prev).add(unitId));
    updateLocal((prev) => ({
      ...prev,
      unidades: prev.unidades.map((u) =>
        u.id === unitId
          ? {
              ...u,
              estado: payload.estado,
              ...(payload.tipologia_id !== undefined ? { tipologia_id: payload.tipologia_id } : {}),
              ...(payload.precio_venta !== undefined ? { precio_venta: payload.precio_venta } : {}),
              ...(payload.lead_id !== undefined ? { lead_id: payload.lead_id } : {}),
              ...(payload.cotizacion_id !== undefined ? { cotizacion_id: payload.cotizacion_id } : {}),
            }
          : u
      ),
    }));
    setModalTarget(null);

    try {
      const res = await fetch(`/api/unidades/${unitId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Error");
      const selTipo = payload.tipologia_id
        ? tipologias.find((t) => t.id === payload.tipologia_id)
        : null;
      const suffix = selTipo ? ` · ${selTipo.nombre}` : "";
      toast.success(`${unit.identificador} → ${payload.estado}${suffix}`);
    } catch {
      // Revert on error
      updateLocal((prev) => ({
        ...prev,
        unidades: prev.unidades.map((u) =>
          u.id === unitId
            ? { ...u, estado: oldEstado, tipologia_id: oldTipoId, precio_venta: oldPrecioVenta, lead_id: oldLeadId, cotizacion_id: oldCotizacionId }
            : u
        ),
      }));
      toast.error(t("disponibilidadPage.updateError"));
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(unitId);
        return next;
      });
    }
  }, [modalTarget, unidades, tipologias, updateLocal, toast, t]);

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
          <div className="flex items-center gap-2">
            {/* Column visibility gear */}
            <div className="relative">
              <button
                onClick={() => setShowColSettings((v) => !v)}
                className={cn(
                  "p-2 rounded-lg border transition-all",
                  showColSettings
                    ? "bg-[rgba(var(--site-primary-rgb),0.12)] border-[rgba(var(--site-primary-rgb),0.25)] text-[var(--site-primary)]"
                    : "bg-[var(--surface-2)] border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:border-[var(--border-default)]"
                )}
                title="Columnas visibles"
              >
                <Settings2 size={16} />
              </button>
              {showColSettings && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowColSettings(false)} />
                  <div className="absolute right-0 top-full mt-2 z-50 w-56 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-xl shadow-xl py-2">
                    <p className="px-3 pb-2 text-[9px] font-ui uppercase tracking-widest text-[var(--text-muted)] font-bold border-b border-[var(--border-subtle)] mb-1">
                      Columnas visibles
                    </p>
                    {INVENTORY_COLUMN_KEYS.map(({ key }) => {
                      const isOn = columns[key];
                      return (
                        <button
                          key={key}
                          onClick={() => toggleColumn(key)}
                          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs hover:bg-[var(--surface-3)] transition-colors"
                        >
                          <span className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0",
                            isOn
                              ? "bg-[rgba(var(--site-primary-rgb),0.2)] border-[rgba(var(--site-primary-rgb),0.4)]"
                              : "bg-[var(--surface-3)] border-[var(--border-default)]"
                          )}>
                            {isOn && (
                              <span className="w-2 h-2 rounded-sm bg-[var(--site-primary)]" />
                            )}
                          </span>
                          <span className={cn(
                            "transition-colors",
                            isOn ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
                          )}>
                            {COL_LABELS[key] ?? key}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
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
          </div>
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
            <InfoTooltip content={tTooltips("inventario.estado.short")} variant="dashboard" />
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

      {/* ── Status change modal ──────────────────────────────────── */}
      {modalTarget && (
        <StatusChangeModal
          unit={modalTarget.unit}
          newEstado={modalTarget.newEstado}
          projectContext={{
            ...projectContextForModal,
            complementoWarning: modalTarget.complementoWarning,
          }}
          userRole={role || "admin"}
          onConfirm={handleConfirmStatusChange}
          onClose={() => setModalTarget(null)}
        />
      )}
    </div>
  );
}
