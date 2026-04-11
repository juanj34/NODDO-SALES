"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Loader2, ExternalLink, Upload, ArrowUpDown, ArrowUp, ArrowDown, Package, Settings2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import { useToast } from "@/components/dashboard/Toast";
import { useAuthRole } from "@/hooks/useAuthContext";
import { formatCurrency as formatCurrencyFn } from "@/lib/currency";
import { getInventoryColumns, getPrimaryArea, INVENTORY_COLUMN_KEYS } from "@/lib/inventory-columns";
import { UNIT_STATUS_COLORS } from "@/lib/status-colors";
import type { InventoryColumnConfig } from "@/types";
import {
  StatusChangeModal,
  type ProjectContextForModal,
  type StatusChangePayload,
  type EstadoUnidad,
  type ModalUnit,
} from "@/components/dashboard/StatusChangeModal";

/* ── Types ─────────────────────────────────────────────── */

interface UnitRow {
  id: string;
  identificador: string;
  piso: number | null;
  area_m2: number | null;
  area_construida: number | null;
  area_privada: number | null;
  area_lote: number | null;
  precio: number | null;
  precio_venta: number | null;
  lead_id: string | null;
  cotizacion_id: string | null;
  estado: EstadoUnidad;
  habitaciones: number | null;
  banos: number | null;
  parqueaderos: number | null;
  depositos: number | null;
  orientacion: string | null;
  vista: string | null;
  lote: string | null;
  etapa_nombre: string | null;
  torre_id: string | null;
  tipologia_id: string | null;
  tipologia: { nombre: string; precio_desde?: number | null; area_m2?: number | null; habitaciones?: number | null; banos?: number | null } | null;
  torre: { nombre: string } | null;
}

interface ProjectTab {
  id: string;
  nombre: string;
}

interface ProjectContext {
  tipologia_mode: "fija" | "multiple";
  precio_source: "unidad" | "tipologia";
  parqueaderos_mode: string;
  depositos_mode: string;
  moneda_base: string;
  disponibilidad_config: Record<string, unknown>;
  unidad_display_prefix: string | null;
  tipo_proyecto: string;
  inventory_columns: InventoryColumnConfig | null;
  tipologias: { id: string; nombre: string; area_m2: number | null; habitaciones: number | null; banos: number | null; precio_desde: number | null; parqueaderos: number | null; depositos: number | null }[];
  torres: { id: string; nombre: string }[];
  unidad_tipologias: { unidad_id: string; tipologia_id: string }[];
}

type SortField = "identificador" | "area" | "precio" | "estado";

const ALL_ESTADOS: { value: EstadoUnidad; label: string; short: string }[] = [
  { value: "disponible", label: "Disponible", short: "Disp." },
  { value: "proximamente", label: "Próximamente", short: "Prox." },
  { value: "separado", label: "Separado", short: "Sep." },
  { value: "reservada", label: "Reservada", short: "Res." },
  { value: "vendida", label: "Vendida", short: "Vend." },
];

const ESTADO_ORDER: Record<EstadoUnidad, number> = {
  disponible: 0, proximamente: 1, separado: 2, reservada: 3, vendida: 4,
};

const formatCurrency = (n: number, moneda?: string) => formatCurrencyFn(n, (moneda ?? "COP") as "COP");

/* ── Column visibility labels ────────────────────────── */
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

/* ── Page ──────────────────────────────────────────────── */

export default function DisponibilidadPage() {
  const { t } = useTranslation("dashboard");
  const toast = useToast();
  const { role } = useAuthRole();

  // Projects
  const [projects, setProjects] = useState<ProjectTab[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  // Units
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [unitsError, setUnitsError] = useState<string | null>(null);

  // Project context (loaded alongside units)
  const [projectCtx, setProjectCtx] = useState<ProjectContext | null>(null);

  // Filters
  const [filterTorre, setFilterTorre] = useState<string>("");
  const [filterTipo, setFilterTipo] = useState<string>("");
  const [filterEstado, setFilterEstado] = useState<EstadoUnidad | "">("");
  const [filterEtapa, setFilterEtapa] = useState<string>("");

  // Sorting
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [publishing, setPublishing] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  // Column visibility override
  const [columnOverrides, setColumnOverrides] = useState<Partial<InventoryColumnConfig>>({});
  const [showColSettings, setShowColSettings] = useState(false);

  // Modal state
  const [modalTarget, setModalTarget] = useState<{
    unit: ModalUnit;
    newEstado: EstadoUnidad;
  } | null>(null);

  // Project context cache for modal
  const contextCacheRef = useRef<Map<string, ProjectContextForModal>>(new Map());

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

  // Fetch units + project context when project changes
  useEffect(() => {
    if (!selectedProjectId) return;
    setLoadingUnits(true);
    setUnitsError(null);
    setFilterTorre("");
    setFilterTipo("");
    setFilterEstado("");
    setFilterEtapa("");
    setSortField(null);
    setColumnOverrides({});

    (async () => {
      try {
        const [unitsRes, ctxRes] = await Promise.all([
          fetch(`/api/unidades?proyecto_id=${selectedProjectId}`),
          fetch(`/api/proyectos/${selectedProjectId}/disponibilidad-context`),
        ]);

        if (unitsRes.ok) {
          setUnits(await unitsRes.json());
        } else {
          const errorData = await unitsRes.json().catch(() => ({ error: "Error desconocido" }));
          setUnitsError(errorData.error || `Error ${unitsRes.status}`);
          toast.error(`Error al cargar unidades: ${errorData.error || unitsRes.status}`);
        }

        if (ctxRes.ok) {
          const ctx: ProjectContext = await ctxRes.json();
          setProjectCtx(ctx);
          // Cache for modal
          const modalCtx: ProjectContextForModal = {
            projectId: selectedProjectId,
            tipologiaMode: ctx.tipologia_mode ?? "fija",
            precioSource: ctx.precio_source ?? "unidad",
            monedaBase: (ctx.moneda_base ?? "COP") as "COP",
            disponibilidadConfig: (ctx.disponibilidad_config ?? {}) as ProjectContextForModal["disponibilidadConfig"],
            unitDisplayPrefix: ctx.unidad_display_prefix ?? null,
            tipologias: ctx.tipologias ?? [],
            torres: ctx.torres ?? [],
            unidadTipologias: ctx.unidad_tipologias ?? [],
          };
          contextCacheRef.current.set(selectedProjectId, modalCtx);
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

  // ── Derived data ───────────────────────────────────────
  const columns = useMemo((): InventoryColumnConfig => {
    const base = projectCtx
      ? getInventoryColumns((projectCtx.tipo_proyecto ?? "hibrido") as "hibrido", projectCtx.inventory_columns)
      : getInventoryColumns("hibrido", null);
    // Apply user overrides
    return { ...base, ...columnOverrides };
  }, [projectCtx, columnOverrides]);

  const baseColumns = useMemo((): InventoryColumnConfig => {
    return projectCtx
      ? getInventoryColumns((projectCtx.tipo_proyecto ?? "hibrido") as "hibrido", projectCtx.inventory_columns)
      : getInventoryColumns("hibrido", null);
  }, [projectCtx]);

  const tipologias = useMemo(() => projectCtx?.tipologias ?? [], [projectCtx]);
  const torres = useMemo(() => projectCtx?.torres ?? [], [projectCtx]);
  const unidadTipologias = useMemo(() => projectCtx?.unidad_tipologias ?? [], [projectCtx]);
  const isMultiTipo = projectCtx?.tipologia_mode === "multiple";
  const isTipologiaPricing = projectCtx?.precio_source === "tipologia";
  const groupByEtapa = columns.etapa && !columns.piso;

  const hasAnyArea = columns.area_m2 || columns.area_construida || columns.area_privada || columns.area_lote;
  const hasSpecs = columns.habitaciones || columns.banos;

  const uniqueEtapas = useMemo(() => {
    if (!columns.etapa) return [];
    const set = new Set(units.map((u) => u.etapa_nombre).filter((e): e is string => !!e));
    return [...set].sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
  }, [units, columns.etapa]);

  const hasProximamente = useMemo(() => units.some((u) => u.estado === "proximamente"), [units]);
  const visibleEstados = useMemo(
    () => ALL_ESTADOS.filter((e) => e.value !== "proximamente" || hasProximamente),
    [hasProximamente]
  );

  // ── Filtering ─────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = units;
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
  }, [units, filterTorre, filterTipo, filterEstado, filterEtapa, isMultiTipo, unidadTipologias]);

  // ── Sorted data ───────────────────────────────────────
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

  const sorted = useMemo(() => {
    if (!sortField) {
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

  // ── Counts (from filtered, before sorting) ────────────
  const counts = useMemo(() => {
    let base = units;
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
      disponible: 0, separado: 0, reservada: 0, vendida: 0, proximamente: 0,
    };
    for (const u of base) c[u.estado]++;
    return { counts: c, total: base.length };
  }, [units, filterTorre, filterTipo, filterEtapa, isMultiTipo, unidadTipologias]);

  // ── Grouping ──────────────────────────────────────────
  const grouped = useMemo(() => {
    if (sortField) return [[null, sorted]] as [string | number | null, UnitRow[]][];

    if (groupByEtapa) {
      const groups = new Map<string | null, UnitRow[]>();
      for (const u of sorted) {
        const key = u.etapa_nombre ?? null;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(u);
      }
      return Array.from(groups.entries()) as [string | null, UnitRow[]][];
    }

    const groups = new Map<number | null, UnitRow[]>();
    for (const u of sorted) {
      const key = u.piso;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(u);
    }
    return Array.from(groups.entries()).sort(
      (a, b) => ((a[0] as number) ?? 0) - ((b[0] as number) ?? 0)
    ) as [number | string | null, UnitRow[]][];
  }, [sorted, sortField, groupByEtapa]);

  // ── Publish ───────────────────────────────────────────
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

  // ── Status change — open modal ────────────────────────
  const handleStatusChange = useCallback((unitId: string, newEstado: EstadoUnidad) => {
    const unit = units.find((u) => u.id === unitId);
    if (!unit || unit.estado === newEstado) return;

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
      lead_id: unit.lead_id,
      cotizacion_id: unit.cotizacion_id,
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

    setModalTarget({ unit: modalUnit, newEstado });
  }, [units]);

  // ── Confirm status change via modal ───────────────────
  const handleConfirmStatusChange = useCallback(async (payload: StatusChangePayload) => {
    if (!modalTarget) return;
    const unitId = modalTarget.unit.id;
    const original = units.find((u) => u.id === unitId);
    if (!original) return;

    // Optimistic update
    setUpdatingIds((prev) => new Set(prev).add(unitId));
    setUnits((prev) =>
      prev.map((u) =>
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
      )
    );
    setModalTarget(null);

    try {
      const res = await fetch(`/api/unidades/${unitId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Error");
      toast.success(`${original.identificador} → ${payload.estado}`);
    } catch {
      // Revert
      setUnits((prev) =>
        prev.map((u) => (u.id === unitId ? { ...original } : u))
      );
      toast.error("Error al actualizar estado");
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(unitId);
        return next;
      });
    }
  }, [modalTarget, units, toast]);

  // ── Sort icon helper ──────────────────────────────────
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

  // ── Toggle column visibility ──────────────────────────
  const toggleColumn = useCallback((key: keyof InventoryColumnConfig) => {
    setColumnOverrides((prev) => {
      const current = { ...baseColumns, ...prev };
      return { ...prev, [key]: !current[key] };
    });
  }, [baseColumns]);

  // ── Loading states ────────────────────────────────────
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

  const modalCtx = selectedProjectId ? contextCacheRef.current.get(selectedProjectId) : null;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-4">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center">
            <Package size={18} className="text-[var(--site-primary)]" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-light text-[var(--text-primary)]">
              {t("disponibilidad.title")}
            </h1>
            <p className="text-xs text-[var(--text-tertiary)]">
              {t("disponibilidad.description")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Column settings gear */}
          <div className="relative">
            <button
              onClick={() => setShowColSettings((v) => !v)}
              className={cn(
                "p-2 rounded-lg border transition-all",
                showColSettings
                  ? "bg-[rgba(184,151,58,0.12)] border-[rgba(184,151,58,0.25)] text-[var(--site-primary)]"
                  : "bg-[var(--surface-2)] border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:border-[var(--border-default)]"
              )}
              title="Columnas visibles"
            >
              <Settings2 size={16} />
            </button>

            {/* Dropdown */}
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
                            ? "bg-[rgba(184,151,58,0.2)] border-[rgba(184,151,58,0.4)]"
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

          {selectedProjectId && units.length > 0 && (
            <button
              onClick={handlePublishAvailability}
              disabled={publishing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[rgba(184,151,58,0.1)] border border-[rgba(184,151,58,0.3)] text-[var(--site-primary)] rounded-xl text-xs font-ui font-semibold uppercase tracking-wider hover:bg-[rgba(184,151,58,0.15)] transition-all disabled:opacity-50"
            >
              {publishing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {publishing ? "Publicando..." : "Publicar"}
            </button>
          )}
        </div>
      </div>

      {/* ── Project tabs ────────────────────────────────── */}
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
          {/* ── Filter bar (pill style, matching editor) ─── */}
          <div className="glass rounded-xl px-3 py-2 flex items-center gap-2 overflow-x-auto scrollbar-hide">
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
                            ? "bg-[rgba(184,151,58,0.15)] text-[var(--site-primary)] font-medium"
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
                            ? "bg-[rgba(184,151,58,0.15)] text-[var(--site-primary)] font-medium"
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
                            ? "bg-[rgba(184,151,58,0.15)] text-[var(--site-primary)] font-medium"
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

          {/* ── Table ───────────────────────────────────── */}
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
            {grouped.map(([groupKey, groupUnits]) => (
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
                {groupUnits.map((unit) => {
                  const tipo = tipologias.find((t) => t.id === unit.tipologia_id);
                  const isUpdating = updatingIds.has(unit.id);
                  const area = getPrimaryArea(unit, columns) ?? tipo?.area_m2;
                  const isUncommitted = isMultiTipo && ["disponible", "proximamente"].includes(unit.estado);
                  const displayPrice = unit.estado === "vendida" && unit.precio_venta != null
                    ? unit.precio_venta
                    : isTipologiaPricing
                      ? (unit.precio ?? tipo?.precio_desde ?? null)
                      : unit.precio;

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
                        {isUncommitted ? "—" : (tipo?.nombre ?? unit.tipologia?.nombre ?? "—")}
                      </span>
                      {hasAnyArea && (
                        <span className="text-xs font-mono text-[var(--text-secondary)] w-[65px] shrink-0 hidden sm:block">
                          {isUncommitted ? "—" : area != null ? `${area} m²` : "—"}
                        </span>
                      )}
                      {columns.precio && (
                        <span className="text-xs font-mono text-[var(--text-secondary)] w-[130px] shrink-0 hidden sm:block">
                          {isUncommitted ? "—" : displayPrice ? formatCurrency(displayPrice, projectCtx?.moneda_base) : "—"}
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
                              onClick={() => handleStatusChange(unit.id, e.value)}
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
        </>
      )}

      {/* ── Status change modal ──────────────────────────── */}
      {modalTarget && modalCtx && (
        <StatusChangeModal
          unit={modalTarget.unit}
          newEstado={modalTarget.newEstado}
          projectContext={modalCtx}
          userRole={role || "admin"}
          onConfirm={handleConfirmStatusChange}
          onClose={() => setModalTarget(null)}
        />
      )}
    </div>
  );
}
