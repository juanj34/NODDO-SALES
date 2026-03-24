"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Loader2, FileText, Search, Download, User,
  Plus, Trash2, Car, Package, Check, Copy,
  ExternalLink, Minus, ArrowLeft, Clock, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";
import type { Currency, ComplementoMode, ComplementoSeleccion, Complemento } from "@/types";
import { useToast } from "@/components/dashboard/Toast";
import { useAuthRole } from "@/hooks/useAuthContext";
import { useEditorProject } from "@/hooks/useEditorProject";
import { calcularCotizacion, buildPrecioBaseComplementos } from "@/lib/cotizador/calcular";
import type { CotizadorConfig, ResultadoCotizacion } from "@/types";
import { CurrencyInput } from "@/components/dashboard/CurrencyInput";
import { NodDoDropdown } from "@/components/ui/NodDoDropdown";
import { PageHeader } from "@/components/dashboard/base/PageHeader";
import { Calculator } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ComplementosSection } from "@/components/dashboard/ComplementosSection";

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

interface LeadRow {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
}

interface RecentCotizacion {
  id: string;
  nombre: string;
  email: string;
  pdf_url: string | null;
  created_at: string;
  unidad_snapshot: { identificador?: string } | null;
  resultado: { precio_total?: number; precio_neto?: number } | null;
}

interface EditableFase {
  id: string;
  nombre: string;
  tipo: "fijo" | "porcentaje" | "resto";
  valor: number;
  cuotas: number;
  frecuencia: "unica" | "mensual" | "bimestral" | "trimestral";
  fecha?: string;
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
    fecha: f.fecha,
  }));
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "hace un momento";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

/* ── Page ──────────────────────────────────────────────── */

type CotizadorSubTab = "cotizar" | "addons";

export default function CotizadorOperativoPage() {
  const { project, refresh } = useEditorProject();
  const toast = useToast();
  const { user } = useAuthRole();
  const [subTab, setSubTab] = useState<CotizadorSubTab>("cotizar");

  const projectId = project.id;
  const cotizadorEnabled = project.cotizador_enabled && project.cotizador_config;
  const config = project.cotizador_config;
  const moneda = (config?.moneda || "COP") as Currency;

  // Units
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(true);

  // Complementos inventory
  const [complementos, setComplementos] = useState<Complemento[]>([]);

  // Leads search
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [leadSearch, setLeadSearch] = useState("");
  const [searchingLeads, setSearchingLeads] = useState(false);
  const leadSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Recent cotizaciones
  const [recentCotizaciones, setRecentCotizaciones] = useState<RecentCotizacion[]>([]);

  // Selection
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [unitSearch, setUnitSearch] = useState("");

  // Lead mode
  const [leadMode, setLeadMode] = useState<"search" | "new">("search");
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);

  // Client info (new client mode)
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  // Sandbox: editable phases
  const [editableFases, setEditableFases] = useState<EditableFase[]>([]);
  const [separacionIncluidaEnInicial, setSeparacionIncluidaEnInicial] = useState(false);

  // Per-quote overrides
  const [paymentPlanNombre, setPaymentPlanNombre] = useState("");
  const [adminFee, setAdminFee] = useState<number>(0);

  // Sandbox: selected discounts
  const [selectedDiscounts, setSelectedDiscounts] = useState<string[]>([]);

  // Sandbox: selected complementos
  const [selectedComplementos, setSelectedComplementos] = useState<ComplementoSeleccion[]>([]);

  // Sandbox: precio_base counts
  const [precioBaseParqCount, setPrecioBaseParqCount] = useState<number>(0);
  const [precioBaseDepoCount, setPrecioBaseDepoCount] = useState<number>(0);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [successState, setSuccessState] = useState<{
    id: string;
    pdfUrl: string | null;
    clientName: string;
    unitId: string;
    total: number;
  } | null>(null);

  const selectedUnit = units.find((u) => u.id === selectedUnitId);

  // Client info from selected lead or new form
  const effectiveClientName = leadMode === "search" && selectedLead ? selectedLead.nombre : clientName;
  const effectiveClientEmail = leadMode === "search" && selectedLead ? selectedLead.email : clientEmail;
  const effectiveClientPhone = leadMode === "search" && selectedLead ? (selectedLead.telefono || "") : clientPhone;

  const clientFormValid = effectiveClientName.trim().length > 0 && EMAIL_RE.test(effectiveClientEmail.trim());

  // Fetch units + complementos + recent cotizaciones on mount
  useEffect(() => {
    if (!projectId) return;
    (async () => {
      try {
        const [unitsRes, compRes, cotRes] = await Promise.all([
          fetch(`/api/unidades?proyecto_id=${projectId}`),
          fetch(`/api/complementos?proyecto_id=${projectId}`),
          fetch(`/api/cotizaciones?proyecto_id=${projectId}&limit=5`),
        ]);
        if (unitsRes.ok) setUnits(await unitsRes.json());
        if (compRes.ok) setComplementos(await compRes.json());
        if (cotRes.ok) {
          const data = await cotRes.json();
          setRecentCotizaciones(data.cotizaciones || []);
        }
      } finally {
        setLoadingUnits(false);
      }
    })();
  }, [projectId]);

  // Initialize editable fases from project config
  useEffect(() => {
    if (config) {
      setEditableFases(fasesFromConfig(config));
      setSeparacionIncluidaEnInicial(config.separacion_incluida_en_inicial ?? false);
      setSelectedDiscounts([]);
      setPaymentPlanNombre(config.payment_plan_nombre ?? "");
      setAdminFee(config.admin_fee ?? 0);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Lead search (debounced)
  useEffect(() => {
    if (leadMode !== "search" || leadSearch.length < 2) {
      setLeads([]);
      return;
    }
    if (leadSearchTimer.current) clearTimeout(leadSearchTimer.current);
    leadSearchTimer.current = setTimeout(async () => {
      setSearchingLeads(true);
      try {
        const res = await fetch(`/api/leads?proyecto_id=${projectId}&search=${encodeURIComponent(leadSearch)}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          setLeads(data.leads || []);
        }
      } finally {
        setSearchingLeads(false);
      }
    }, 400);
    return () => { if (leadSearchTimer.current) clearTimeout(leadSearchTimer.current); };
  }, [leadSearch, leadMode, projectId]);

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
    if (!unitSearch) return cotizableUnits;
    const s = unitSearch.toLowerCase();
    return cotizableUnits.filter(
      (u) =>
        u.identificador.toLowerCase().includes(s) ||
        u.tipologia?.nombre?.toLowerCase().includes(s)
    );
  }, [cotizableUnits, unitSearch]);

  // Complemento mode detection
  const parqMode = (project.parqueaderos_mode ?? "sin_inventario") as ComplementoMode;
  const depoMode = (project.depositos_mode ?? "sin_inventario") as ComplementoMode;
  const hasParqInventory = parqMode === "inventario_incluido" || parqMode === "inventario_separado";
  const hasDepoInventory = depoMode === "inventario_incluido" || depoMode === "inventario_separado";
  const hasParqPrecioBase = parqMode === "precio_base";
  const hasDepoPrecioBase = depoMode === "precio_base";
  const hasAnyAddons = complementos.some((c) => c.tipo === "addon" && c.estado === "disponible");
  const showComplementos = hasParqInventory || hasDepoInventory || hasParqPrecioBase || hasDepoPrecioBase || hasAnyAddons;

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

  // Auto-populate included complementos when unit is selected
  const includedComplementos = useMemo(() => {
    if (!selectedUnit || !selectedUnitId) return [];
    const parqCount = selectedUnit.parqueaderos ?? selectedUnit.tipologia?.parqueaderos ?? 0;
    const depoCount = selectedUnit.depositos ?? selectedUnit.tipologia?.depositos ?? 0;
    const assigned = complementos.filter((c) => c.unidad_id === selectedUnitId);
    const assignedParq = assigned.filter((c) => c.tipo === "parqueadero").slice(0, parqCount);
    const assignedDepo = assigned.filter((c) => c.tipo === "deposito").slice(0, depoCount);
    return [...assignedParq, ...assignedDepo];
  }, [selectedUnitId, selectedUnit, complementos]);

  const includedIds = useMemo(() => new Set(includedComplementos.map((c) => c.id)), [includedComplementos]);
  const availableParqueaderos = useMemo(
    () => complementos.filter((c) => c.tipo === "parqueadero" && c.estado === "disponible" && !includedIds.has(c.id)),
    [complementos, includedIds]
  );
  const availableDepositos = useMemo(
    () => complementos.filter((c) => c.tipo === "deposito" && c.estado === "disponible" && !includedIds.has(c.id)),
    [complementos, includedIds]
  );
  const availableAddons = useMemo(
    () => complementos.filter((c) => c.tipo === "addon" && c.estado === "disponible"),
    [complementos]
  );
  const hasAddons = availableAddons.length > 0;

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

  // Merge all complementos for calculation
  const allComplementos = useMemo(() => {
    const items = [...selectedComplementos];
    if (hasParqPrecioBase && precioBaseParqCount > 0 && project.parqueaderos_precio_base) {
      items.push(...buildPrecioBaseComplementos(precioBaseParqCount, project.parqueaderos_precio_base, 0, null));
    }
    if (hasDepoPrecioBase && precioBaseDepoCount > 0 && project.depositos_precio_base) {
      items.push(...buildPrecioBaseComplementos(0, null, precioBaseDepoCount, project.depositos_precio_base));
    }
    return items;
  }, [selectedComplementos, hasParqPrecioBase, hasDepoPrecioBase, precioBaseParqCount, precioBaseDepoCount, project]);

  // Build custom config from editable fases
  const customConfig = useMemo((): CotizadorConfig | null => {
    if (!config) return null;
    return {
      ...config,
      separacion_incluida_en_inicial: separacionIncluidaEnInicial,
      payment_plan_nombre: paymentPlanNombre || undefined,
      admin_fee: adminFee || undefined,
      fases: editableFases.map((f) => ({
        id: f.id,
        nombre: f.nombre,
        tipo: f.tipo,
        valor: f.valor,
        cuotas: f.cuotas,
        frecuencia: f.frecuencia,
        fecha: f.fecha || undefined,
      })),
    };
  }, [config, editableFases, separacionIncluidaEnInicial, paymentPlanNombre, adminFee]);

  // Calculate cotización live
  const cotizacion: ResultadoCotizacion | null = useMemo(() => {
    if (!selectedUnit?.precio || !customConfig) return null;
    try {
      return calcularCotizacion(
        selectedUnit.precio,
        customConfig,
        selectedDiscounts,
        allComplementos
      );
    } catch {
      return null;
    }
  }, [selectedUnit, customConfig, selectedDiscounts, allComplementos]);

  // Phase editing helpers
  const updateFase = useCallback((id: string, field: string, value: string | number) => {
    setEditableFases((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  }, []);

  const addFase = useCallback(() => {
    setEditableFases((prev) => [
      ...prev,
      { id: newFaseId(), nombre: "Nueva fase", tipo: "porcentaje", valor: 10, cuotas: 1, frecuencia: "unica", fecha: undefined },
    ]);
  }, []);

  const removeFase = useCallback((id: string) => {
    setEditableFases((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // Complemento helpers
  const addComplemento = useCallback(
    (comp: Complemento) => {
      const already = selectedComplementos.find((c) => c.complemento_id === comp.id);
      if (already) return;
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
    setSelectedComplementos((prev) => prev.filter((c) => c.complemento_id !== compId || !c.es_extra));
  }, []);

  const updateExtraPrice = useCallback((compId: string, newPrice: number) => {
    setSelectedComplementos((prev) =>
      prev.map((c) =>
        c.complemento_id === compId ? { ...c, precio: newPrice, precio_negociado: newPrice } : c
      )
    );
  }, []);

  // Generate cotización
  const handleGenerate = async () => {
    if (!selectedUnit || !clientFormValid) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/cotizaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proyecto_id: projectId,
          unidad_id: selectedUnit.id,
          nombre: effectiveClientName.trim(),
          email: effectiveClientEmail.trim(),
          telefono: effectiveClientPhone.trim() || undefined,
          agente_id: user?.id,
          agente_nombre: user?.email,
          custom_fases: editableFases.map((f) => ({
            nombre: f.nombre,
            tipo: f.tipo,
            valor: f.valor,
            cuotas: f.cuotas,
            frecuencia: f.frecuencia,
            fecha: f.fecha || undefined,
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
          payment_plan_nombre: paymentPlanNombre || undefined,
          admin_fee: adminFee || undefined,
        }),
      });

      if (res.ok) {
        const { id, pdf_url } = await res.json();
        const total = cotizacion?.precio_total ?? cotizacion?.precio_neto ?? 0;
        setSuccessState({
          id,
          pdfUrl: pdf_url,
          clientName: effectiveClientName.trim(),
          unitId: selectedUnit.identificador,
          total,
        });
        // Add to recent
        setRecentCotizaciones((prev) => [{
          id,
          nombre: effectiveClientName.trim(),
          email: effectiveClientEmail.trim(),
          pdf_url,
          created_at: new Date().toISOString(),
          unidad_snapshot: { identificador: selectedUnit.identificador },
          resultado: { precio_total: total },
        }, ...prev].slice(0, 5));
        toast.success("Cotización generada exitosamente");
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

  // Reset for new cotización
  const resetForNew = useCallback((keepClient = false) => {
    setSuccessState(null);
    setSelectedUnitId(null);
    setSelectedDiscounts([]);
    setSelectedComplementos([]);
    if (!keepClient) {
      setSelectedLead(null);
      setLeadSearch("");
      setClientName("");
      setClientEmail("");
      setClientPhone("");
      setLeadMode("search");
    }
    if (config) {
      setEditableFases(fasesFromConfig(config));
      setSeparacionIncluidaEnInicial(config.separacion_incluida_en_inicial ?? false);
      setPaymentPlanNombre(config.payment_plan_nombre ?? "");
      setAdminFee(config.admin_fee ?? 0);
    }
  }, [config]);

  const subTabs: { id: CotizadorSubTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { id: "cotizar", label: "Cotizar", icon: Calculator },
    { id: "addons", label: "Addons", icon: Sparkles },
  ];

  // Not enabled state — only for cotizar sub-tab
  if (!cotizadorEnabled && subTab === "cotizar") {
    return (
      <div className="max-w-4xl mx-auto space-y-5">
        <PageHeader
          icon={Calculator}
          title="Cotizador"
          description="Herramienta de cotización y extras opcionales"
        />
        {/* Sub-tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] w-fit">
          {subTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-ui font-bold uppercase tracking-[0.1em] transition-all",
                subTab === t.id
                  ? "bg-[var(--surface-3)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              )}
            >
              <t.icon size={13} />
              {t.label}
            </button>
          ))}
        </div>
        <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] p-10 text-center">
          <FileText size={32} className="mx-auto text-[var(--text-muted)] mb-4" />
          <p className="text-sm text-[var(--text-tertiary)] mb-3">
            Configura el cotizador en Configuración &gt; Cotizador para habilitar esta herramienta.
          </p>
        </div>
      </div>
    );
  }

  // Addons sub-tab
  if (subTab === "addons") {
    return (
      <div className="max-w-5xl mx-auto space-y-5">
        <PageHeader
          icon={Calculator}
          title="Cotizador"
          description="Herramienta de cotización y extras opcionales"
        />
        {/* Sub-tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] w-fit">
          {subTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-ui font-bold uppercase tracking-[0.1em] transition-all",
                subTab === t.id
                  ? "bg-[var(--surface-3)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              )}
            >
              <t.icon size={13} />
              {t.label}
            </button>
          ))}
        </div>
        <ComplementosSection
          project={project}
          onRefresh={refresh}
          fixedTab="addon"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <PageHeader
        icon={Calculator}
        title="Cotizador"
        description="Herramienta de cotización y extras opcionales"
      />
      {/* Sub-tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] w-fit">
        {subTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-ui font-bold uppercase tracking-[0.1em] transition-all",
              subTab === t.id
                ? "bg-[var(--surface-3)] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            )}
          >
            <t.icon size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Recent cotizaciones strip */}
      {recentCotizaciones.length > 0 && !successState && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Clock size={12} className="text-[var(--text-muted)] shrink-0" />
          <span className="text-[9px] font-ui font-bold uppercase tracking-[0.14em] text-[var(--text-muted)] shrink-0">
            Recientes
          </span>
          {recentCotizaciones.map((cot) => (
            <button
              key={cot.id}
              onClick={() => cot.pdf_url && window.open(cot.pdf_url, "_blank")}
              className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all text-[10px]"
            >
              <span className="text-[var(--text-primary)]">{cot.nombre}</span>
              <span className="text-[var(--text-muted)]">·</span>
              <span className="text-[var(--text-tertiary)]">{cot.unidad_snapshot?.identificador || "—"}</span>
              {cot.resultado && (
                <>
                  <span className="text-[var(--text-muted)]">·</span>
                  <span className="text-[var(--site-primary)]">
                    {formatCurrency(cot.resultado.precio_total ?? cot.resultado.precio_neto ?? 0, moneda, {})}
                  </span>
                </>
              )}
              <span className="text-[var(--text-muted)]">{timeAgo(cot.created_at)}</span>
            </button>
          ))}
        </div>
      )}

      {loadingUnits ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-[var(--site-primary)]" size={24} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* ═══ Left: Unit list ═══ */}
          <div className="lg:col-span-2 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] overflow-hidden flex flex-col" style={{ maxHeight: "80vh" }}>
            <div className="p-3 border-b border-[var(--border-subtle)]">
              <label htmlFor="search-units" className="block text-[10px] tracking-[0.12em] uppercase text-[var(--text-muted)] mb-1.5 font-ui font-bold">
                Buscar unidad
              </label>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  id="search-units"
                  type="text"
                  value={unitSearch}
                  onChange={(e) => setUnitSearch(e.target.value)}
                  placeholder="Nombre, ID o tipología..."
                  className="input-glass w-full pl-9 text-xs"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-subtle)]">
              {filteredUnits.length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--text-muted)]">
                  No hay unidades disponibles con precio
                </div>
              ) : (
                filteredUnits.map((unit) => (
                  <button
                    key={unit.id}
                    onClick={() => { setSelectedUnitId(unit.id); setSuccessState(null); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-left transition-all",
                      selectedUnitId === unit.id
                        ? "bg-[rgba(var(--site-primary-rgb),0.08)]"
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
                      {unit.precio ? formatCurrency(unit.precio, moneda, {}) : "—"}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* ═══ Right: Sandbox Panel ═══ */}
          <div className="lg:col-span-3 space-y-4 overflow-y-auto" style={{ maxHeight: "80vh" }}>
            <AnimatePresence mode="wait">
              {/* ── Success State ── */}
              {successState && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] p-8 text-center"
                >
                  <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                    <Check size={28} className="text-green-400" />
                  </div>
                  <h3 className="font-heading text-xl font-light text-[var(--text-primary)] mb-1">
                    Cotización generada
                  </h3>
                  <p className="text-xs text-[var(--text-tertiary)] mb-1">
                    {successState.clientName} · Unidad {successState.unitId}
                  </p>
                  <p className="font-heading text-lg text-[var(--site-primary)] mb-6">
                    {formatCurrency(successState.total, moneda)}
                  </p>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
                    {successState.pdfUrl && (
                      <a
                        href={successState.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--site-primary)] text-[var(--surface-0)] font-ui text-[10px] font-bold uppercase tracking-[0.1em] hover:brightness-110 transition-all"
                      >
                        <ExternalLink size={12} />
                        Ver PDF
                      </a>
                    )}
                    {successState.pdfUrl && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(successState.pdfUrl!);
                          toast.success("Link copiado");
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-default)] text-[var(--text-secondary)] font-ui text-[10px] font-bold uppercase tracking-[0.1em] hover:text-white hover:border-[var(--border-strong)] transition-all"
                      >
                        <Copy size={12} />
                        Copiar link
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-4 border-t border-[var(--border-subtle)]">
                    <button
                      onClick={() => resetForNew(false)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-secondary)] font-ui text-[10px] font-bold uppercase tracking-[0.1em] hover:text-white hover:border-[var(--border-default)] transition-all"
                    >
                      <Plus size={12} />
                      Nueva cotización
                    </button>
                    <button
                      onClick={() => resetForNew(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-secondary)] font-ui text-[10px] font-bold uppercase tracking-[0.1em] hover:text-white hover:border-[var(--border-default)] transition-all"
                    >
                      <ArrowLeft size={12} />
                      Mismo cliente, otra unidad
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── Empty state ── */}
              {!successState && !selectedUnit && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] p-6 flex flex-col items-center justify-center py-16 text-center"
                >
                  <FileText size={32} className="text-[var(--text-muted)] mb-4" />
                  <p className="text-sm text-[var(--text-tertiary)]">
                    Selecciona una unidad para crear una cotización
                  </p>
                </motion.div>
              )}

              {/* ── Main form ── */}
              {!successState && selectedUnit && (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* A: Lead / Client Selector */}
                  <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-[var(--site-primary)]" />
                        <span className="font-ui text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                          Cliente
                        </span>
                      </div>
                      <div className="flex items-center gap-1 p-0.5 bg-[var(--surface-2)] rounded-lg">
                        <button
                          onClick={() => { setLeadMode("search"); setSelectedLead(null); }}
                          className={cn(
                            "px-2.5 py-1 rounded-md text-[9px] font-ui font-bold uppercase tracking-wider transition-all",
                            leadMode === "search"
                              ? "bg-[var(--surface-3)] text-[var(--text-primary)]"
                              : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                          )}
                        >
                          Buscar
                        </button>
                        <button
                          onClick={() => { setLeadMode("new"); setSelectedLead(null); }}
                          className={cn(
                            "px-2.5 py-1 rounded-md text-[9px] font-ui font-bold uppercase tracking-wider transition-all",
                            leadMode === "new"
                              ? "bg-[var(--surface-3)] text-[var(--text-primary)]"
                              : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                          )}
                        >
                          Nuevo
                        </button>
                      </div>
                    </div>

                    {leadMode === "search" ? (
                      <div>
                        {selectedLead ? (
                          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[rgba(var(--site-primary-rgb),0.06)] border border-[rgba(var(--site-primary-rgb),0.2)]">
                            <User size={14} className="text-[var(--site-primary)]" />
                            <div className="flex-1 min-w-0">
                              <span className="text-xs text-[var(--text-primary)] font-medium block">{selectedLead.nombre}</span>
                              <span className="text-[10px] text-[var(--text-muted)]">{selectedLead.email}{selectedLead.telefono ? ` · ${selectedLead.telefono}` : ""}</span>
                            </div>
                            <button
                              onClick={() => { setSelectedLead(null); setLeadSearch(""); }}
                              className="text-[var(--text-muted)] hover:text-red-400 transition-colors text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="relative">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                            <input
                              type="text"
                              value={leadSearch}
                              onChange={(e) => setLeadSearch(e.target.value)}
                              placeholder="Buscar por nombre o email..."
                              className="input-glass w-full pl-9 text-xs"
                            />
                            {searchingLeads && (
                              <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[var(--text-muted)]" />
                            )}
                            {leads.length > 0 && (
                              <div className="absolute left-0 right-0 top-full mt-1 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-xl shadow-xl overflow-hidden z-20 max-h-48 overflow-y-auto">
                                {leads.map((lead) => (
                                  <button
                                    key={lead.id}
                                    onClick={() => { setSelectedLead(lead); setLeads([]); setLeadSearch(""); }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[var(--surface-3)] transition-colors"
                                  >
                                    <User size={12} className="text-[var(--text-muted)] shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <span className="text-xs text-[var(--text-primary)] block">{lead.nombre}</span>
                                      <span className="text-[10px] text-[var(--text-muted)] truncate block">{lead.email}</span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <input
                          type="text"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="Nombre completo"
                          className="input-glass w-full text-xs"
                        />
                        <input
                          type="email"
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                          placeholder="Email"
                          className="input-glass w-full text-xs"
                        />
                        <input
                          type="tel"
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          placeholder="Teléfono (opcional)"
                          className="input-glass w-full text-xs"
                        />
                      </div>
                    )}
                  </div>

                  {/* B: Unit Header */}
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

                  {/* C: Complementos */}
                  {showComplementos && (
                    <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] p-5">
                      <span className="font-ui text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)] block mb-3">
                        Complementos
                      </span>
                      <div className="space-y-4">
                        {hasParqPrecioBase && project.parqueaderos_precio_base && (
                          <PrecioBaseCounter
                            label="Parqueaderos"
                            icon={Car}
                            count={precioBaseParqCount}
                            onChange={setPrecioBaseParqCount}
                            precioUnitario={project.parqueaderos_precio_base}
                            moneda={moneda}
                          />
                        )}
                        {hasDepoPrecioBase && project.depositos_precio_base && (
                          <PrecioBaseCounter
                            label="Depósitos"
                            icon={Package}
                            count={precioBaseDepoCount}
                            onChange={setPrecioBaseDepoCount}
                            precioUnitario={project.depositos_precio_base}
                            moneda={moneda}
                          />
                        )}
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
                            moneda={moneda}
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
                            moneda={moneda}
                          />
                        )}
                        {hasAddons && (
                          <ComplementoSelector
                            label="Addons"
                            icon={Sparkles}
                            items={availableAddons}
                            selected={selectedComplementos.filter((c) => c.tipo === "addon" && c.es_extra)}
                            onAdd={addComplemento}
                            onRemove={removeComplemento}
                            onPriceChange={updateExtraPrice}
                            showPrecio
                            isExtra
                            moneda={moneda}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* D: Price Summary */}
                  {cotizacion && (
                    <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] p-5">
                      <span className="font-ui text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)] block mb-3">
                        Resumen de precio
                      </span>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[var(--text-secondary)]">Precio unidad</span>
                          <span className="text-[var(--text-primary)]">{formatCurrency(cotizacion.precio_base, moneda)}</span>
                        </div>
                        {cotizacion.complementos_total != null && cotizacion.complementos_total > 0 && (
                          <div className="flex justify-between">
                            <span className="text-[var(--text-secondary)]">+ Complementos</span>
                            <span className="text-[var(--text-primary)]">{formatCurrency(cotizacion.complementos_total, moneda)}</span>
                          </div>
                        )}
                        {config?.descuentos?.length ? (
                          <div className="pt-2 border-t border-[var(--border-subtle)]">
                            <span className="text-[10px] text-[var(--text-muted)] block mb-2">Descuentos</span>
                            {config.descuentos.map((desc) => (
                              <label key={desc.id} className="flex items-center gap-2 py-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedDiscounts.includes(desc.id)}
                                  onChange={(e) => {
                                    setSelectedDiscounts((prev) =>
                                      e.target.checked ? [...prev, desc.id] : prev.filter((d) => d !== desc.id)
                                    );
                                  }}
                                  className="rounded border-[var(--border-default)] bg-[var(--surface-2)] text-[var(--site-primary)] focus:ring-[var(--site-primary)] w-3.5 h-3.5"
                                />
                                <span className="text-[var(--text-secondary)]">
                                  {desc.nombre}
                                  <span className="text-[var(--text-muted)] ml-1">
                                    ({desc.tipo === "porcentaje" ? `${desc.valor}%` : formatCurrency(desc.valor, moneda)})
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
                                <span>-{formatCurrency(d.monto, moneda)}</span>
                              </div>
                            ))}
                          </>
                        )}
                        <div className="flex justify-between pt-2 border-t border-[var(--border-subtle)]">
                          <span className="font-medium text-[var(--text-primary)]">Total</span>
                          <span className="font-heading text-lg text-[var(--site-primary)]">
                            {formatCurrency(cotizacion.precio_total ?? cotizacion.precio_neto, moneda)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* E: Payment Plan — Sales Offer Table */}
                  {cotizacion && (
                    <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
                      {/* Header: Plan name + Selling Price + Admin Fee */}
                      <div className="px-5 pt-5 pb-3 space-y-3">
                        <input
                          type="text"
                          value={paymentPlanNombre}
                          onChange={(e) => setPaymentPlanNombre(e.target.value)}
                          className="w-full bg-transparent text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none border-b border-transparent focus:border-[rgba(var(--site-primary-rgb),0.3)] pb-1"
                          placeholder="Nombre del plan (ej. Payment Plan 35/65)"
                        />
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[rgba(var(--site-primary-rgb),0.08)] border border-[rgba(var(--site-primary-rgb),0.15)]">
                            <span className="text-[var(--text-muted)] font-ui text-[9px] uppercase tracking-wider font-bold">Precio</span>
                            <span className="text-[var(--site-primary)] font-mono font-medium">
                              {formatCurrency(cotizacion.precio_total ?? cotizacion.precio_neto, moneda)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[var(--text-muted)] font-ui text-[9px] uppercase tracking-wider font-bold">Admin Fee</span>
                            <CurrencyInput
                              value={adminFee || ""}
                              onChange={(v) => setAdminFee(Number(v) || 0)}
                              currency={moneda}
                              inputClassName="w-24 bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.4)]"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Table header */}
                      <div className="grid grid-cols-[1fr_60px_100px_1fr_28px] gap-1 px-5 py-2 bg-[var(--surface-2)] border-y border-[var(--border-subtle)]">
                        <span className="text-[8px] font-ui font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Descripción</span>
                        <span className="text-[8px] font-ui font-bold uppercase tracking-[0.14em] text-[var(--text-muted)] text-center">%</span>
                        <span className="text-[8px] font-ui font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Fecha</span>
                        <span className="text-[8px] font-ui font-bold uppercase tracking-[0.14em] text-[var(--text-muted)] text-right">Monto</span>
                        <span />
                      </div>

                      {/* Table rows */}
                      <div className="divide-y divide-[var(--border-subtle)]">
                        {editableFases.map((fase, i) => {
                          const faseResult = cotizacion.fases[i];
                          const pctOfTotal = faseResult
                            ? Math.round((faseResult.monto_total / (cotizacion.precio_total ?? cotizacion.precio_neto)) * 100)
                            : 0;
                          return (
                            <div key={fase.id} className="group">
                              <div className="grid grid-cols-[1fr_60px_100px_1fr_28px] gap-1 px-5 py-2.5 items-center">
                                {/* Description */}
                                <input
                                  type="text"
                                  value={fase.nombre}
                                  onChange={(e) => updateFase(fase.id, "nombre", e.target.value)}
                                  className="bg-transparent text-xs text-[var(--text-primary)] focus:outline-none placeholder:text-[var(--text-muted)] border-b border-transparent focus:border-[rgba(var(--site-primary-rgb),0.3)]"
                                  placeholder="Descripción"
                                />
                                {/* Percentage */}
                                {fase.tipo === "porcentaje" ? (
                                  <div className="flex items-center justify-center">
                                    <input
                                      type="number"
                                      value={fase.valor || ""}
                                      onChange={(e) => updateFase(fase.id, "valor", parseFloat(e.target.value) || 0)}
                                      className="w-10 bg-transparent text-xs text-center text-[var(--text-secondary)] focus:outline-none border-b border-transparent focus:border-[rgba(var(--site-primary-rgb),0.3)]"
                                    />
                                    <span className="text-[10px] text-[var(--text-muted)]">%</span>
                                  </div>
                                ) : fase.tipo === "resto" ? (
                                  <span className="text-[10px] text-[var(--text-muted)] text-center">{pctOfTotal}%</span>
                                ) : (
                                  <span className="text-[10px] text-[var(--text-muted)] text-center">{pctOfTotal}%</span>
                                )}
                                {/* Date */}
                                <input
                                  type="text"
                                  value={fase.fecha ?? ""}
                                  onChange={(e) => updateFase(fase.id, "fecha", e.target.value || "")}
                                  className="bg-transparent text-xs text-[var(--text-secondary)] focus:outline-none placeholder:text-[var(--text-muted)] border-b border-transparent focus:border-[rgba(var(--site-primary-rgb),0.3)]"
                                  placeholder="dd/mm/aaaa"
                                />
                                {/* Amount */}
                                {fase.tipo === "fijo" ? (
                                  <div className="text-right">
                                    <CurrencyInput
                                      value={fase.valor || ""}
                                      onChange={(v) => updateFase(fase.id, "valor", parseFloat(v) || 0)}
                                      currency={moneda}
                                      inputClassName="w-full bg-transparent text-xs text-right text-[var(--text-primary)] focus:outline-none border-b border-transparent focus:border-[rgba(var(--site-primary-rgb),0.3)]"
                                    />
                                  </div>
                                ) : (
                                  <span className="text-xs text-[var(--text-primary)] text-right font-mono">
                                    {faseResult ? formatCurrency(faseResult.monto_total, moneda, {}) : "—"}
                                  </span>
                                )}
                                {/* Delete */}
                                <button
                                  onClick={() => removeFase(fase.id)}
                                  className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded text-[var(--text-muted)] hover:text-red-400 transition-all"
                                  title="Eliminar"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                              {/* Installment detail (shown when cuotas > 1) */}
                              {faseResult && faseResult.cuotas > 1 && (
                                <div className="px-5 pb-2 -mt-1">
                                  <span className="text-[10px] text-[var(--text-muted)]">
                                    {faseResult.cuotas} cuotas de {formatCurrency(faseResult.monto_por_cuota, moneda)} · {frecLabels[fase.frecuencia]}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Totals row */}
                      <div className="grid grid-cols-[1fr_60px_100px_1fr_28px] gap-1 px-5 py-3 bg-[var(--surface-2)] border-t border-[var(--border-default)]">
                        <span className="text-xs font-medium text-[var(--text-primary)]">Total</span>
                        <span className="text-[10px] text-[var(--text-muted)] text-center">100%</span>
                        <span />
                        <span className="text-xs font-medium text-[var(--site-primary)] text-right font-mono">
                          {formatCurrency(
                            (cotizacion.precio_total ?? cotizacion.precio_neto) + adminFee,
                            moneda,
                            {}
                          )}
                        </span>
                        <span />
                      </div>

                      {/* Add row + options */}
                      <div className="px-5 py-3 flex items-center justify-between">
                        <button
                          onClick={addFase}
                          className="flex items-center gap-1.5 text-[10px] text-[var(--site-primary)] hover:text-white transition-colors"
                        >
                          <Plus size={12} /> Agregar pago
                        </button>
                        <label className="flex items-center gap-2 cursor-pointer text-[10px] text-[var(--text-muted)]">
                          <input
                            type="checkbox"
                            checked={separacionIncluidaEnInicial}
                            onChange={(e) => setSeparacionIncluidaEnInicial(e.target.checked)}
                            className="rounded border-[var(--border-default)] bg-[var(--surface-2)] text-[var(--site-primary)] focus:ring-[var(--site-primary)] w-3 h-3"
                          />
                          Separación incluida en inicial
                        </label>
                      </div>
                    </div>
                  )}

                  {/* F: Generate Button */}
                  <button
                    onClick={handleGenerate}
                    disabled={generating || !clientFormValid || !cotizacion}
                    className={cn(
                      "w-full py-3 rounded-xl font-ui text-xs font-bold uppercase tracking-[0.1em] flex items-center justify-center gap-2 transition-all",
                      clientFormValid && cotizacion
                        ? "bg-[var(--site-primary)] text-[var(--surface-0)] hover:brightness-110 cursor-pointer"
                        : "bg-[var(--surface-2)] text-[var(--text-muted)] cursor-not-allowed"
                    )}
                  >
                    {generating ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Download size={14} />
                    )}
                    {generating ? "Generando..." : "Generar cotización"}
                  </button>

                  {!clientFormValid && selectedUnit && (
                    <p className="text-[10px] text-[var(--text-muted)] text-center">
                      {leadMode === "search" && !selectedLead
                        ? "Selecciona o busca un cliente para continuar"
                        : "Ingresa nombre y email válido del cliente"
                      }
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
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
              {s.subtipo && <span className="text-[var(--text-muted)]">({s.subtipo})</span>}
              {isExtra && (s.precio_negociado ?? s.precio ?? 0) > 0 && <span className="text-[var(--site-primary)] text-[9px] font-ui uppercase">extra</span>}
              {isExtra && (s.precio_negociado ?? s.precio ?? 0) === 0 && <span className="text-green-400 text-[9px] font-ui uppercase">gratis</span>}
              {showPrecio && (s.precio != null || s.precio_negociado != null) ? (
                isExtra && onPriceChange ? (
                  <input
                    type="number"
                    value={s.precio_negociado ?? s.precio ?? ""}
                    onChange={(e) => onPriceChange(s.complemento_id, parseFloat(e.target.value) || 0)}
                    className="w-20 text-right text-[10px] bg-transparent border-b border-[var(--border-default)] text-[var(--site-primary)] focus:outline-none"
                    placeholder="Precio (0=gratis)"
                  />
                ) : (
                  <span className="text-[var(--site-primary)]">
                    {formatCurrency(s.precio_negociado ?? s.precio ?? 0, moneda, {})}
                  </span>
                )
              ) : isExtra && onPriceChange ? (
                <input
                  type="number"
                  value={s.precio_negociado ?? ""}
                  onChange={(e) => onPriceChange(s.complemento_id, parseFloat(e.target.value) || 0)}
                  className="w-20 text-right text-[10px] bg-transparent border-b border-[var(--border-default)] text-[var(--site-primary)] focus:outline-none"
                  placeholder="Precio (0=gratis)"
                />
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
                {comp.subtipo && <span className="text-[10px] text-[var(--text-muted)]">({comp.subtipo})</span>}
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
