"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Loader2, ExternalLink, FileText, Search, Download, User,
  Plus, Trash2, ChevronDown, Car, Package,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";
import type { Currency, ComplementoMode, ComplementoSeleccion, Complemento } from "@/types";
import { useTranslation } from "@/i18n";
import { useToast } from "@/components/dashboard/Toast";
import { useAuthRole } from "@/hooks/useAuthContext";
import { calcularCotizacion, buildPrecioBaseComplementos } from "@/lib/cotizador/calcular";
import type { CotizadorConfig, ResultadoCotizacion } from "@/types";
import { Minus } from "lucide-react";
import { CurrencyInput } from "@/components/dashboard/CurrencyInput";
import { NodDoDropdown } from "@/components/ui/NodDoDropdown";

/* ── Types ─────────────────────────────────────────────── */

interface UnitRow {
  id: string;
  identificador: string;
  piso: number | null;
  area_m2: number | null;
  precio: number | null;
  estado: string;
  habitaciones: number | null;
  banos: number | null;
  vista: string | null;
  parqueaderos: number | null;
  depositos: number | null;
  tipologia: { nombre: string; parqueaderos: number | null; depositos: number | null } | null;
  torre: { nombre: string } | null;
}

interface ProjectForCotizador {
  id: string;
  nombre: string;
  constructora: string | null;
  cotizador_enabled: boolean;
  cotizador_config: CotizadorConfig | null;
  color_primario: string | null;
  parqueaderos_mode: ComplementoMode;
  depositos_mode: ComplementoMode;
  parqueaderos_precio_base: number | null;
  depositos_precio_base: number | null;
}

interface EditableFase {
  id: string;
  nombre: string;
  tipo: "fijo" | "porcentaje" | "resto";
  valor: number;
  cuotas: number;
  frecuencia: "unica" | "mensual" | "bimestral" | "trimestral";
}

/* ── Helpers ───────────────────────────────────────────── */

const frecLabels: Record<string, string> = {
  unica: "Pago único",
  mensual: "Mensual",
  bimestral: "Bimestral",
  trimestral: "Trimestral",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let faseIdCounter = 0;
function newFaseId() {
  return `f-${++faseIdCounter}-${Date.now()}`;
}

function fasesFromConfig(config: CotizadorConfig): EditableFase[] {
  return config.fases.map((f) => ({
    id: newFaseId(),
    nombre: f.nombre,
    tipo: f.tipo,
    valor: f.valor,
    cuotas: f.cuotas,
    frecuencia: f.frecuencia,
  }));
}

/* ── Page ──────────────────────────────────────────────── */

export default function CotizadorPage() {
  const { t } = useTranslation("dashboard");
  const toast = useToast();
  const { user, role } = useAuthRole();

  // Projects
  const [projects, setProjects] = useState<ProjectForCotizador[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Units
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);

  // Complementos inventory
  const [complementos, setComplementos] = useState<Complemento[]>([]);

  // Selection
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Sandbox: editable phases
  const [editableFases, setEditableFases] = useState<EditableFase[]>([]);
  const [separacionIncluidaEnInicial, setSeparacionIncluidaEnInicial] = useState(false);

  // Sandbox: selected discounts
  const [selectedDiscounts, setSelectedDiscounts] = useState<string[]>([]);

  // Sandbox: selected complementos
  const [selectedComplementos, setSelectedComplementos] = useState<ComplementoSeleccion[]>([]);

  // Sandbox: precio_base counts
  const [precioBaseParqCount, setPrecioBaseParqCount] = useState<number>(0);
  const [precioBaseDepoCount, setPrecioBaseDepoCount] = useState<number>(0);

  // Client info
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  // PDF generation
  const [generating, setGenerating] = useState(false);

  const isAdmin = role === "admin";

  // Fetch projects
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/proyectos");
        if (res.ok) {
          const data = await res.json();
          const mapped: ProjectForCotizador[] = data.map(
            (p: Record<string, unknown>) => ({
              id: p.id as string,
              nombre: p.nombre as string,
              constructora: p.constructora as string | null,
              cotizador_enabled: p.cotizador_enabled as boolean,
              cotizador_config: p.cotizador_config as CotizadorConfig | null,
              color_primario: p.color_primario as string | null,
              parqueaderos_mode: (p.parqueaderos_mode as ComplementoMode) || "sin_inventario",
              depositos_mode: (p.depositos_mode as ComplementoMode) || "sin_inventario",
              parqueaderos_precio_base: (p.parqueaderos_precio_base as number | null) ?? null,
              depositos_precio_base: (p.depositos_precio_base as number | null) ?? null,
            })
          );
          setProjects(mapped);
          if (mapped.length > 0) setSelectedProjectId(mapped[0].id);
        }
      } finally {
        setLoadingProjects(false);
      }
    })();
  }, []);

  // Fetch units + complementos when project changes
  useEffect(() => {
    if (!selectedProjectId) return;
    setLoadingUnits(true);
    setSelectedUnitId(null);
    setSearch("");
    setSelectedComplementos([]);

    (async () => {
      try {
        const [unitsRes, compRes] = await Promise.all([
          fetch(`/api/unidades?proyecto_id=${selectedProjectId}`),
          fetch(`/api/complementos?proyecto_id=${selectedProjectId}`),
        ]);
        if (unitsRes.ok) setUnits(await unitsRes.json());
        if (compRes.ok) setComplementos(await compRes.json());
      } finally {
        setLoadingUnits(false);
      }
    })();
  }, [selectedProjectId]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const selectedUnit = units.find((u) => u.id === selectedUnitId);

  // Initialize editable fases from project config when project changes
  useEffect(() => {
    if (selectedProject?.cotizador_config) {
      setEditableFases(fasesFromConfig(selectedProject.cotizador_config));
      setSeparacionIncluidaEnInicial(selectedProject.cotizador_config.separacion_incluida_en_inicial ?? false);
      setSelectedDiscounts([]);
    }
  }, [selectedProject?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Available units (cotizable)
  const cotizableUnits = useMemo(() => {
    return units.filter(
      (u) =>
        (u.estado === "disponible" || u.estado === "separado") &&
        u.precio &&
        u.precio > 0
    );
  }, [units]);

  // Filtered by search
  const filteredUnits = useMemo(() => {
    if (!search) return cotizableUnits;
    const s = search.toLowerCase();
    return cotizableUnits.filter(
      (u) =>
        u.identificador.toLowerCase().includes(s) ||
        u.tipologia?.nombre?.toLowerCase().includes(s)
    );
  }, [cotizableUnits, search]);

  // Complemento mode detection
  const hasParqInventory = selectedProject?.parqueaderos_mode === "inventario_incluido" || selectedProject?.parqueaderos_mode === "inventario_separado";
  const hasDepoInventory = selectedProject?.depositos_mode === "inventario_incluido" || selectedProject?.depositos_mode === "inventario_separado";
  const hasParqPrecioBase = selectedProject?.parqueaderos_mode === "precio_base";
  const hasDepoPrecioBase = selectedProject?.depositos_mode === "precio_base";
  const showComplementos = hasParqInventory || hasDepoInventory || hasParqPrecioBase || hasDepoPrecioBase;

  // Initialize precio_base counts from unit/tipologia when unit changes
  useEffect(() => {
    if (!selectedUnit) {
      setPrecioBaseParqCount(0);
      setPrecioBaseDepoCount(0);
      return;
    }
    if (hasParqPrecioBase) {
      setPrecioBaseParqCount(selectedUnit.parqueaderos ?? selectedUnit.tipologia?.parqueaderos ?? 0);
    }
    if (hasDepoPrecioBase) {
      setPrecioBaseDepoCount(selectedUnit.depositos ?? selectedUnit.tipologia?.depositos ?? 0);
    }
  }, [selectedUnitId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-populate included complementos when unit is selected (for inventory modes)
  const includedComplementos = useMemo(() => {
    if (!selectedUnit || !selectedUnitId) return [];
    const parqCount = selectedUnit.parqueaderos ?? selectedUnit.tipologia?.parqueaderos ?? 0;
    const depoCount = selectedUnit.depositos ?? selectedUnit.tipologia?.depositos ?? 0;
    const assigned = complementos.filter((c) => c.unidad_id === selectedUnitId);
    const assignedParq = assigned.filter((c) => c.tipo === "parqueadero").slice(0, parqCount);
    const assignedDepo = assigned.filter((c) => c.tipo === "deposito").slice(0, depoCount);
    return [...assignedParq, ...assignedDepo];
  }, [selectedUnitId, selectedUnit, complementos]);

  // Available complementos (not sold, not already included, tipo-filtered)
  const includedIds = useMemo(() => new Set(includedComplementos.map((c) => c.id)), [includedComplementos]);
  const availableParqueaderos = useMemo(
    () => complementos.filter((c) => c.tipo === "parqueadero" && c.estado === "disponible" && !includedIds.has(c.id)),
    [complementos, includedIds]
  );
  const availableDepositos = useMemo(
    () => complementos.filter((c) => c.tipo === "deposito" && c.estado === "disponible" && !includedIds.has(c.id)),
    [complementos, includedIds]
  );

  // Auto-set included complementos when unit changes
  useEffect(() => {
    if (!selectedUnitId) { setSelectedComplementos([]); return; }
    if (!hasParqInventory && !hasDepoInventory) return;
    const included: ComplementoSeleccion[] = includedComplementos.map((c) => ({
      complemento_id: c.id,
      tipo: c.tipo,
      identificador: c.identificador,
      subtipo: c.subtipo,
      precio: null,
      suma_al_total: false,
      es_extra: false,
    }));
    setSelectedComplementos(included);
  }, [selectedUnitId, includedComplementos.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Merge all complementos for calculation: inventory + precio_base virtual items
  const allComplementos = useMemo(() => {
    const items = [...selectedComplementos];
    if (hasParqPrecioBase && precioBaseParqCount > 0 && selectedProject?.parqueaderos_precio_base) {
      items.push(...buildPrecioBaseComplementos(precioBaseParqCount, selectedProject.parqueaderos_precio_base, 0, null));
    }
    if (hasDepoPrecioBase && precioBaseDepoCount > 0 && selectedProject?.depositos_precio_base) {
      items.push(...buildPrecioBaseComplementos(0, null, precioBaseDepoCount, selectedProject.depositos_precio_base));
    }
    return items;
  }, [selectedComplementos, hasParqPrecioBase, hasDepoPrecioBase, precioBaseParqCount, precioBaseDepoCount, selectedProject]);

  // Build custom config from editable fases
  const customConfig = useMemo((): CotizadorConfig | null => {
    if (!selectedProject?.cotizador_config) return null;
    return {
      ...selectedProject.cotizador_config,
      separacion_incluida_en_inicial: separacionIncluidaEnInicial,
      fases: editableFases.map((f) => ({
        id: f.id,
        nombre: f.nombre,
        tipo: f.tipo,
        valor: f.valor,
        cuotas: f.cuotas,
        frecuencia: f.frecuencia,
      })),
    };
  }, [selectedProject?.cotizador_config, editableFases, separacionIncluidaEnInicial]);

  // Calculate cotización live
  const cotizacion: ResultadoCotizacion | null = useMemo(() => {
    if (!selectedUnit?.precio || !customConfig) return null;
    return calcularCotizacion(
      selectedUnit.precio,
      customConfig,
      selectedDiscounts,
      allComplementos
    );
  }, [selectedUnit, customConfig, selectedDiscounts, allComplementos]);

  // Client form validation
  const clientFormValid = clientName.trim().length > 0 && EMAIL_RE.test(clientEmail.trim());

  // Phase editing helpers
  const updateFase = useCallback((id: string, field: string, value: string | number) => {
    setEditableFases((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  }, []);

  const addFase = useCallback(() => {
    setEditableFases((prev) => [
      ...prev,
      {
        id: newFaseId(),
        nombre: "Nueva fase",
        tipo: "porcentaje",
        valor: 10,
        cuotas: 1,
        frecuencia: "unica",
      },
    ]);
  }, []);

  const removeFase = useCallback((id: string) => {
    setEditableFases((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // Complemento selection helpers
  const addComplemento = useCallback(
    (comp: Complemento) => {
      const already = selectedComplementos.find((c) => c.complemento_id === comp.id);
      if (already) return;

      // Manually added items are always "extras" — they always add to total
      setSelectedComplementos((prev) => [
        ...prev,
        {
          complemento_id: comp.id,
          tipo: comp.tipo,
          identificador: comp.identificador,
          subtipo: comp.subtipo,
          precio: comp.precio,
          suma_al_total: true,
          es_extra: true,
        },
      ]);
    },
    [selectedComplementos]
  );

  const removeComplemento = useCallback((compId: string) => {
    // Only allow removing extras, not included items
    setSelectedComplementos((prev) => prev.filter((c) => c.complemento_id !== compId || !c.es_extra));
  }, []);

  const updateExtraPrice = useCallback((compId: string, newPrice: number) => {
    setSelectedComplementos((prev) =>
      prev.map((c) =>
        c.complemento_id === compId ? { ...c, precio: newPrice, precio_negociado: newPrice } : c
      )
    );
  }, []);

  // Generate PDF
  const handleGeneratePdf = async () => {
    if (!selectedUnit || !selectedProjectId || !clientFormValid) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/cotizaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proyecto_id: selectedProjectId,
          unidad_id: selectedUnit.id,
          nombre: clientName.trim(),
          email: clientEmail.trim(),
          telefono: clientPhone.trim() || undefined,
          agente_id: user?.id,
          agente_nombre: user?.email,
          custom_fases: editableFases.map((f) => ({
            nombre: f.nombre,
            tipo: f.tipo,
            valor: f.valor,
            cuotas: f.cuotas,
            frecuencia: f.frecuencia,
          })),
          descuentos_seleccionados: selectedDiscounts,
          complemento_ids: selectedComplementos.filter((c) => !c.es_precio_base).map((c) => c.complemento_id),
          complemento_selections: selectedComplementos.filter((c) => !c.es_precio_base).map((c) => ({
            complemento_id: c.complemento_id,
            es_extra: c.es_extra ?? false,
            precio_negociado: c.precio_negociado,
          })),
          precio_base_parqueaderos: hasParqPrecioBase ? precioBaseParqCount : undefined,
          precio_base_depositos: hasDepoPrecioBase ? precioBaseDepoCount : undefined,
          separacion_incluida: separacionIncluidaEnInicial,
        }),
      });

      if (res.ok) {
        const { pdf_url } = await res.json();
        if (pdf_url) window.open(pdf_url, "_blank");
        toast.success("Cotización generada");
        setClientName("");
        setClientEmail("");
        setClientPhone("");
      } else {
        const err = await res.json();
        toast.error(err.error || "Error al generar cotización");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setGenerating(false);
    }
  };

  const moneda = selectedProject?.cotizador_config?.moneda || "COP";

  // Loading
  if (loadingProjects) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--site-primary)]" size={28} />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center py-24">
        <h2 className="font-heading text-2xl font-light text-[var(--text-primary)] mb-3">
          {t("cotizador.title")}
        </h2>
        <p className="text-sm text-[var(--text-tertiary)]">
          No tienes proyectos configurados.
        </p>
      </div>
    );
  }

  const cotizadorEnabled = selectedProject?.cotizador_enabled && selectedProject?.cotizador_config;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-light text-[var(--text-primary)] mb-1">
          {t("cotizador.title")}
        </h1>
        <p className="text-xs text-[var(--text-tertiary)]">
          {t("cotizador.description")}
        </p>
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
      ) : !cotizadorEnabled ? (
        <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] p-10 text-center">
          <FileText size={32} className="mx-auto text-[var(--text-muted)] mb-4" />
          <p className="text-sm text-[var(--text-tertiary)] mb-3">
            {isAdmin ? t("cotizador.notConfigured") : t("cotizador.notConfiguredCollab")}
          </p>
          {isAdmin && (
            <Link
              href={`/editor/${selectedProjectId}/config`}
              className="inline-flex items-center gap-1.5 text-xs text-[var(--site-primary)] hover:underline"
            >
              {t("cotizador.configureLink")}
              <ExternalLink size={12} />
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Left: Unit list */}
          <div className="lg:col-span-2 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] overflow-hidden flex flex-col" style={{ maxHeight: "80vh" }}>
            <div className="p-3 border-b border-[var(--border-subtle)]">
              <div className="relative">
                <label htmlFor="search-cotizador" className="block text-[10px] tracking-[0.12em] uppercase text-[var(--text-muted)] mb-1.5 font-ui font-bold">
                  {t("cotizador.search")}
                </label>
                <Search size={13} className="absolute left-3.5 bottom-1/2 translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  id="search-cotizador"
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("cotizador.search")}
                  className="input-glass w-full pl-9 text-xs"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-subtle)]">
              {filteredUnits.length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--text-muted)]">
                  {t("cotizador.noAvailable")}
                </div>
              ) : (
                filteredUnits.map((unit) => (
                  <button
                    key={unit.id}
                    onClick={() => setSelectedUnitId(unit.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-left transition-all",
                      selectedUnitId === unit.id
                        ? "bg-[rgba(184,151,58,0.08)]"
                        : "hover:bg-[var(--surface-2)]"
                    )}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        background: unit.estado === "disponible" ? "#4ade80" : "#facc15",
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-[var(--text-primary)] font-medium block">
                        {unit.identificador}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] truncate block">
                        {unit.tipologia?.nombre || "—"}
                        {unit.area_m2 ? ` · ${unit.area_m2}m²` : ""}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--text-tertiary)] shrink-0">
                      {unit.precio ? formatCurrency(unit.precio, "COP", {}) : "—"}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right: Sandbox Panel */}
          <div className="lg:col-span-3 space-y-4 overflow-y-auto" style={{ maxHeight: "80vh" }}>
            {!selectedUnit ? (
              <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] p-6 flex flex-col items-center justify-center py-16 text-center">
                <FileText size={32} className="text-[var(--text-muted)] mb-4" />
                <p className="text-sm text-[var(--text-tertiary)]">
                  {t("cotizador.selectUnit")}
                </p>
              </div>
            ) : !cotizacion ? (
              <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] p-6 flex items-center justify-center py-16">
                <Loader2 className="animate-spin text-[var(--site-primary)]" size={24} />
              </div>
            ) : (
              <>
                {/* A: Unit Header */}
                <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] p-5">
                  <h3 className="font-heading text-xl font-light text-[var(--text-primary)] mb-1">
                    Unidad {selectedUnit.identificador}
                  </h3>
                  <p className="text-xs text-[var(--text-tertiary)] mb-3">
                    {selectedUnit.tipologia?.nombre || "—"}
                    {selectedUnit.torre?.nombre ? ` · ${selectedUnit.torre.nombre}` : ""}
                    {selectedUnit.piso !== null ? ` · Piso ${selectedUnit.piso}` : ""}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {selectedUnit.area_m2 && (
                      <DetailBox label="Area" value={`${selectedUnit.area_m2} m²`} />
                    )}
                    {selectedUnit.habitaciones !== null && (
                      <DetailBox label="Hab." value={String(selectedUnit.habitaciones)} />
                    )}
                    {selectedUnit.banos !== null && (
                      <DetailBox label="Baños" value={String(selectedUnit.banos)} />
                    )}
                    {selectedUnit.vista && (
                      <DetailBox label="Vista" value={selectedUnit.vista} />
                    )}
                  </div>
                </div>

                {/* B: Complementos Selection */}
                {showComplementos && (
                  <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] p-5">
                    <span className="font-ui text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)] block mb-3">
                      Complementos
                    </span>

                    <div className="space-y-4">
                      {/* Precio Base: Parqueaderos */}
                      {hasParqPrecioBase && selectedProject?.parqueaderos_precio_base && (
                        <PrecioBaseCounter
                          label="Parqueaderos"
                          icon={Car}
                          count={precioBaseParqCount}
                          onChange={setPrecioBaseParqCount}
                          precioUnitario={selectedProject.parqueaderos_precio_base}
                          moneda={moneda as Currency}
                        />
                      )}
                      {/* Precio Base: Depósitos */}
                      {hasDepoPrecioBase && selectedProject?.depositos_precio_base && (
                        <PrecioBaseCounter
                          label="Depósitos"
                          icon={Package}
                          count={precioBaseDepoCount}
                          onChange={setPrecioBaseDepoCount}
                          precioUnitario={selectedProject.depositos_precio_base}
                          moneda={moneda as Currency}
                        />
                      )}

                      {/* Inventory mode: Included items (read-only) */}
                      {(hasParqInventory || hasDepoInventory) && (() => {
                        const includedItems = selectedComplementos.filter((c) => !c.es_extra);
                        const parqCount = selectedUnit?.parqueaderos ?? selectedUnit?.tipologia?.parqueaderos ?? 0;
                        const depoCount = selectedUnit?.depositos ?? selectedUnit?.tipologia?.depositos ?? 0;
                        const includedParq = includedItems.filter((c) => c.tipo === "parqueadero");
                        const includedDepo = includedItems.filter((c) => c.tipo === "deposito");

                        return (includedParq.length > 0 || includedDepo.length > 0 || parqCount > 0 || depoCount > 0) ? (
                          <div>
                            <span className="text-[10px] text-[var(--text-muted)] block mb-2">Incluidos con la unidad</span>
                            <div className="flex flex-wrap gap-1.5">
                              {includedParq.map((s) => (
                                <span key={s.complemento_id} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green-500/8 border border-green-500/20 text-[11px]">
                                  <Car size={11} className="text-green-400" />
                                  <span className="text-[var(--text-primary)]">{s.identificador}</span>
                                  <span className="text-green-400 text-[9px] font-ui uppercase">incluido</span>
                                </span>
                              ))}
                              {hasParqInventory && includedParq.length < parqCount && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/8 border border-amber-500/20 text-[11px] text-amber-400 italic">
                                  {parqCount - includedParq.length} parq. sin asignar
                                </span>
                              )}
                              {includedDepo.map((s) => (
                                <span key={s.complemento_id} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green-500/8 border border-green-500/20 text-[11px]">
                                  <Package size={11} className="text-green-400" />
                                  <span className="text-[var(--text-primary)]">{s.identificador}</span>
                                  <span className="text-green-400 text-[9px] font-ui uppercase">incluido</span>
                                </span>
                              ))}
                              {hasDepoInventory && includedDepo.length < depoCount && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/8 border border-amber-500/20 text-[11px] text-amber-400 italic">
                                  {depoCount - includedDepo.length} dep. sin asignar
                                </span>
                              )}
                            </div>
                          </div>
                        ) : null;
                      })()}

                      {/* Inventory mode: Extra items (addable) */}
                      {hasParqInventory && (
                        <ComplementoSelector
                          label="Parqueadero extra"
                          icon={Car}
                          items={availableParqueaderos}
                          selected={selectedComplementos.filter((c) => c.tipo === "parqueadero" && c.es_extra)}
                          onAdd={addComplemento}
                          onRemove={removeComplemento}
                          onPriceChange={updateExtraPrice}
                          showPrecio
                          isExtra
                          moneda={moneda as Currency}
                        />
                      )}
                      {hasDepoInventory && (
                        <ComplementoSelector
                          label="Depósito extra"
                          icon={Package}
                          items={availableDepositos}
                          selected={selectedComplementos.filter((c) => c.tipo === "deposito" && c.es_extra)}
                          onAdd={addComplemento}
                          onRemove={removeComplemento}
                          onPriceChange={updateExtraPrice}
                          showPrecio
                          isExtra
                          moneda={moneda as Currency}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* C: Price Summary */}
                <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] p-5">
                  <span className="font-ui text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)] block mb-3">
                    Resumen de precio
                  </span>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Precio unidad</span>
                      <span className="text-[var(--text-primary)]">{formatCurrency(cotizacion.precio_base, moneda as Currency)}</span>
                    </div>

                    {cotizacion.complementos_total != null && cotizacion.complementos_total > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">+ Complementos</span>
                        <span className="text-[var(--text-primary)]">{formatCurrency(cotizacion.complementos_total, moneda as Currency)}</span>
                      </div>
                    )}

                    {/* Discount toggles */}
                    {selectedProject?.cotizador_config?.descuentos?.length ? (
                      <div className="pt-2 border-t border-[var(--border-subtle)]">
                        <span className="text-[10px] text-[var(--text-muted)] block mb-2">Descuentos</span>
                        {selectedProject.cotizador_config.descuentos.map((desc) => (
                          <label key={desc.id} className="flex items-center gap-2 py-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedDiscounts.includes(desc.id)}
                              onChange={(e) => {
                                setSelectedDiscounts((prev) =>
                                  e.target.checked
                                    ? [...prev, desc.id]
                                    : prev.filter((d) => d !== desc.id)
                                );
                              }}
                              className="rounded border-[var(--border-default)] bg-[var(--surface-2)] text-[var(--site-primary)] focus:ring-[var(--site-primary)] w-3.5 h-3.5"
                            />
                            <span className="text-[var(--text-secondary)]">
                              {desc.nombre}
                              <span className="text-[var(--text-muted)] ml-1">
                                ({desc.tipo === "porcentaje" ? `${desc.valor}%` : formatCurrency(desc.valor, moneda as Currency)})
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : null}

                    {cotizacion.descuentos_aplicados.length > 0 && (
                      <>
                        {cotizacion.descuentos_aplicados.map((d, i) => (
                          <div key={i} className="flex justify-between text-green-400">
                            <span>- {d.nombre}</span>
                            <span>-{formatCurrency(d.monto, moneda as Currency)}</span>
                          </div>
                        ))}
                      </>
                    )}

                    <div className="flex justify-between pt-2 border-t border-[var(--border-subtle)]">
                      <span className="font-medium text-[var(--text-primary)]">Total</span>
                      <span className="font-heading text-lg text-[var(--site-primary)]">
                        {formatCurrency(cotizacion.precio_total ?? cotizacion.precio_neto, moneda as Currency)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* D: Editable Payment Plan */}
                <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-ui text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                      Plan de pagos
                    </span>
                    <button
                      onClick={addFase}
                      className="flex items-center gap-1 text-[10px] text-[var(--site-primary)] hover:text-white transition-colors"
                    >
                      <Plus size={12} /> Agregar fase
                    </button>
                  </div>

                  {/* Separacion incluida toggle */}
                  <label className="flex items-center gap-2 mb-3 cursor-pointer text-xs text-[var(--text-secondary)]">
                    <input
                      type="checkbox"
                      checked={separacionIncluidaEnInicial}
                      onChange={(e) => setSeparacionIncluidaEnInicial(e.target.checked)}
                      className="rounded border-[var(--border-default)] bg-[var(--surface-2)] text-[var(--site-primary)] focus:ring-[var(--site-primary)] w-3.5 h-3.5"
                    />
                    Separación incluida en cuota inicial
                  </label>

                  <div className="space-y-2">
                    {editableFases.map((fase, i) => (
                      <div
                        key={fase.id}
                        className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]"
                      >
                        <div className="grid grid-cols-12 gap-2 items-end">
                          {/* Name */}
                          <div className="col-span-3">
                            <label className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider block mb-1">Nombre</label>
                            <input
                              type="text"
                              value={fase.nombre}
                              onChange={(e) => updateFase(fase.id, "nombre", e.target.value)}
                              className="input-glass w-full text-xs py-1.5"
                            />
                          </div>
                          {/* Type */}
                          <div className="col-span-2">
                            <label className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider block mb-1">Tipo</label>
                            <NodDoDropdown
                              variant="form"
                              size="sm"
                              value={fase.tipo}
                              onChange={(val) => updateFase(fase.id, "tipo", val)}
                              options={[
                                { value: "fijo", label: "Fijo ($)" },
                                { value: "porcentaje", label: "Porcentaje (%)" },
                                { value: "resto", label: "Resto" },
                              ]}
                            />
                          </div>
                          {/* Value */}
                          <div className="col-span-2">
                            <label className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider block mb-1">Valor</label>
                            {fase.tipo === "fijo" ? (
                              <CurrencyInput
                                value={fase.valor || ""}
                                onChange={(v) => updateFase(fase.id, "valor", parseFloat(v) || 0)}
                                currency={moneda as Currency}
                                inputClassName="input-glass w-full text-xs py-1.5"
                              />
                            ) : (
                              <input
                                type="number"
                                value={fase.tipo === "resto" ? "" : fase.valor}
                                onChange={(e) => updateFase(fase.id, "valor", parseFloat(e.target.value) || 0)}
                                disabled={fase.tipo === "resto"}
                                className="input-glass w-full text-xs py-1.5 disabled:opacity-40"
                                placeholder={fase.tipo === "resto" ? "Auto" : ""}
                              />
                            )}
                          </div>
                          {/* Cuotas */}
                          <div className="col-span-1">
                            <label className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider block mb-1">Cuotas</label>
                            <input
                              type="number"
                              min={1}
                              value={fase.cuotas}
                              onChange={(e) => updateFase(fase.id, "cuotas", parseInt(e.target.value) || 1)}
                              className="input-glass w-full text-xs py-1.5"
                            />
                          </div>
                          {/* Frecuencia */}
                          <div className="col-span-2">
                            <label className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider block mb-1">Frec.</label>
                            <NodDoDropdown
                              variant="form"
                              size="sm"
                              value={fase.frecuencia}
                              onChange={(val) => updateFase(fase.id, "frecuencia", val)}
                              options={[
                                { value: "unica", label: "Única" },
                                { value: "mensual", label: "Mensual" },
                                { value: "bimestral", label: "Bimestral" },
                                { value: "trimestral", label: "Trimestral" },
                              ]}
                            />
                          </div>
                          {/* Delete */}
                          <div className="col-span-2 flex items-center gap-2 justify-end">
                            {cotizacion.fases[i] && (
                              <span className="text-[10px] text-[var(--site-primary)]">
                                {formatCurrency(cotizacion.fases[i].monto_total, moneda as Currency, {})}
                              </span>
                            )}
                            <button
                              onClick={() => removeFase(fase.id)}
                              className="p-1 hover:bg-red-500/10 rounded text-[var(--text-muted)] hover:text-red-400 transition-colors"
                              title="Eliminar fase"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                        {/* Per-cuota info */}
                        {cotizacion.fases[i] && cotizacion.fases[i].cuotas > 1 && (
                          <div className="mt-1 text-[10px] text-[var(--text-muted)]">
                            {cotizacion.fases[i].cuotas} cuotas de {formatCurrency(cotizacion.fases[i].monto_por_cuota, moneda as Currency)} · {frecLabels[fase.frecuencia]}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* E: Client Info */}
                <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <User size={14} className="text-[var(--site-primary)]" />
                    <span className="font-ui text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                      {t("cotizador.clientInfo")}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder={t("cotizador.clientName")}
                      className="input-glass w-full text-xs"
                    />
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder={t("cotizador.clientEmail")}
                      className="input-glass w-full text-xs"
                    />
                    <input
                      type="tel"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder={t("cotizador.clientPhone")}
                      className="input-glass w-full text-xs"
                    />
                  </div>
                </div>

                {/* F: Generate */}
                <button
                  onClick={handleGeneratePdf}
                  disabled={generating || !clientFormValid}
                  className={cn(
                    "btn-noddo w-full py-3 font-ui text-xs font-bold uppercase tracking-[0.1em] flex items-center justify-center gap-2",
                    !clientFormValid && !generating && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {generating ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Download size={14} />
                  )}
                  {generating ? t("cotizador.generating") : t("cotizador.generatePdf")}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Small Components ──────────────────────────────────── */

function DetailBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]">
      <span className="font-ui text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)] block mb-0.5">
        {label}
      </span>
      <span className="text-xs text-[var(--text-primary)]">{value}</span>
    </div>
  );
}

function PrecioBaseCounter({
  label,
  icon: Icon,
  count,
  onChange,
  precioUnitario,
  moneda,
}: {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  count: number;
  onChange: (n: number) => void;
  precioUnitario: number;
  moneda: Currency;
}) {
  return (
    <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)]">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={13} className="text-[var(--text-tertiary)]" />
        <span className="text-xs text-[var(--text-secondary)]">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(0, count - 1))}
          className="w-7 h-7 rounded-lg bg-[var(--surface-3)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-default)] transition-all"
        >
          <Minus size={12} />
        </button>
        <span className="text-sm text-[var(--text-primary)] font-medium min-w-[20px] text-center">{count}</span>
        <button
          onClick={() => onChange(count + 1)}
          className="w-7 h-7 rounded-lg bg-[var(--surface-3)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-default)] transition-all"
        >
          <Plus size={12} />
        </button>
        <span className="text-[10px] text-[var(--text-muted)] ml-1">
          × {formatCurrency(precioUnitario, moneda, {})}
        </span>
        <span className="ml-auto text-xs text-[var(--site-primary)] font-medium">
          = {formatCurrency(count * precioUnitario, moneda, {})}
        </span>
      </div>
    </div>
  );
}

function ComplementoSelector({
  label,
  icon: Icon,
  items,
  selected,
  onAdd,
  onRemove,
  onPriceChange,
  showPrecio,
  isExtra,
  moneda,
}: {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  items: Complemento[];
  selected: ComplementoSeleccion[];
  onAdd: (comp: Complemento) => void;
  onRemove: (compId: string) => void;
  onPriceChange?: (compId: string, price: number) => void;
  showPrecio: boolean;
  isExtra?: boolean;
  moneda: Currency;
}) {
  const [open, setOpen] = useState(false);
  const selectedIds = new Set(selected.map((s) => s.complemento_id));
  const available = items.filter((i) => !selectedIds.has(i.id));

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={13} className="text-[var(--text-tertiary)]" />
        <span className="text-xs text-[var(--text-secondary)]">{label}</span>
        {available.length > 0 && (
          <button
            onClick={() => setOpen(!open)}
            className="ml-auto text-[10px] text-[var(--site-primary)] hover:text-white transition-colors flex items-center gap-1"
          >
            <Plus size={11} /> Agregar
          </button>
        )}
      </div>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map((s) => (
            <span
              key={s.complemento_id}
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px]",
                isExtra
                  ? "bg-[rgba(184,151,58,0.06)] border border-[rgba(184,151,58,0.2)]"
                  : "bg-[var(--surface-2)] border border-[var(--border-subtle)]"
              )}
            >
              <span className="text-[var(--text-primary)]">{s.identificador}</span>
              {s.subtipo && (
                <span className="text-[var(--text-muted)]">({s.subtipo})</span>
              )}
              {isExtra && (
                <span className="text-[var(--site-primary)] text-[9px] font-ui uppercase">extra</span>
              )}
              {showPrecio && (s.precio != null || s.precio_negociado != null) ? (
                isExtra && onPriceChange ? (
                  <input
                    type="number"
                    value={s.precio_negociado ?? s.precio ?? ""}
                    onChange={(e) => onPriceChange(s.complemento_id, parseFloat(e.target.value) || 0)}
                    className="w-20 text-right text-[10px] bg-transparent border-b border-[var(--border-default)] text-[var(--site-primary)] focus:outline-none"
                    placeholder="Precio"
                  />
                ) : (
                  <span className="text-[var(--site-primary)]">
                    {formatCurrency(s.precio_negociado ?? s.precio ?? 0, moneda, {})}
                  </span>
                )
              ) : isExtra ? (
                onPriceChange ? (
                  <input
                    type="number"
                    value={s.precio_negociado ?? ""}
                    onChange={(e) => onPriceChange(s.complemento_id, parseFloat(e.target.value) || 0)}
                    className="w-20 text-right text-[10px] bg-transparent border-b border-[var(--border-default)] text-[var(--site-primary)] focus:outline-none"
                    placeholder="Precio"
                  />
                ) : null
              ) : null}
              <button
                onClick={() => onRemove(s.complemento_id)}
                className="text-[var(--text-muted)] hover:text-red-400 ml-0.5"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)]">
          {available.length === 0 ? (
            <div className="p-3 text-center text-[10px] text-[var(--text-muted)]">
              No hay items disponibles
            </div>
          ) : (
            available.map((comp) => (
              <button
                key={comp.id}
                onClick={() => {
                  onAdd(comp);
                  if (available.length <= 1) setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--surface-3)] transition-colors text-xs"
              >
                <span className="text-[var(--text-primary)]">{comp.identificador}</span>
                {comp.subtipo && (
                  <span className="text-[10px] text-[var(--text-muted)]">({comp.subtipo})</span>
                )}
                {showPrecio && comp.precio != null && (
                  <span className="ml-auto text-[var(--site-primary)]">
                    {formatCurrency(comp.precio, moneda, {})}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
