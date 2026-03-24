"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Loader2, ExternalLink, FileText, Search, Download, User,
  Plus, Trash2, Car, Package, Sparkles,
  Minus, AlertTriangle, Calendar, ChevronRight, ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";
import type { Currency, ComplementoMode, ComplementoSeleccion, Complemento, Tipologia, UnidadTipologia } from "@/types";
import { useTranslation } from "@/i18n";
import { useToast } from "@/components/dashboard/Toast";
import { useAuthRole } from "@/hooks/useAuthContext";
import { calcularCotizacion, buildPrecioBaseComplementos } from "@/lib/cotizador/calcular";
import type { CotizadorConfig, ResultadoCotizacion } from "@/types";
import { CurrencyInput } from "@/components/dashboard/CurrencyInput";
import type { PaymentRow } from "@/lib/cotizador/payment-rows";
import {
  newRowId,
  parseDateStr,
  formatDateDisplay,
  addMonthsToDate,
  resolveRowAmount,
  computeBalance,
  deriveStructure,
  autoDistributeDates,
  paymentRowsFromConfig,
  paymentRowsToFases,
} from "@/lib/cotizador/payment-rows";

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
  tipologia_id: string | null;
  tipologia: { nombre: string; parqueaderos: number | null; depositos: number | null; precio_desde: number | null } | null;
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
  precio_source: "unidad" | "tipologia";
  tipologia_mode: "fija" | "multiple";
}

/* ── Helpers ───────────────────────────────────────────── */

function resolveUnitPrice(unit: UnitRow, precioSource: "unidad" | "tipologia"): number | null {
  if (precioSource === "tipologia") {
    return unit.tipologia?.precio_desde ?? unit.precio ?? null;
  }
  return unit.precio ?? unit.tipologia?.precio_desde ?? null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ── Page ──────────────────────────────────────────────── */

export default function CotizadorPage() {
  const { t } = useTranslation("dashboard");
  const toast = useToast();
  const { user, role } = useAuthRole();

  /* ── Wizard step ── */
  const [currentStep, setCurrentStep] = useState<0 | 1>(0);

  /* ── Key dates ── */
  const [fechaCompra, setFechaCompra] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState("");

  /* ── Projects ── */
  const [projects, setProjects] = useState<ProjectForCotizador[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);

  /* ── Units ── */
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);

  /* ── Complementos inventory ── */
  const [complementos, setComplementos] = useState<Complemento[]>([]);

  /* ── Selection ── */
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  /* ── Tipologia selection ── */
  const [selectedTipologiaId, setSelectedTipologiaId] = useState<string | null>(null);

  /* ── Multi-tipología support ── */
  const [tipologias, setTipologias] = useState<Tipologia[]>([]);
  const [unidadTipologias, setUnidadTipologias] = useState<UnidadTipologia[]>([]);
  const [selectedQuoteTipId, setSelectedQuoteTipId] = useState<string | null>(null);

  /* ── Payment rows ── */
  const [paymentRows, setPaymentRows] = useState<PaymentRow[]>([]);

  /* ── Per-quote overrides ── */
  const [paymentPlanNombre, setPaymentPlanNombre] = useState("");
  const [adminFee, setAdminFee] = useState<number>(0);

  /* ── Selected discounts ── */
  const [selectedDiscounts, setSelectedDiscounts] = useState<string[]>([]);

  /* ── Selected complementos ── */
  const [selectedComplementos, setSelectedComplementos] = useState<ComplementoSeleccion[]>([]);

  /* ── Precio_base counts ── */
  const [precioBaseParqCount, setPrecioBaseParqCount] = useState<number>(0);
  const [precioBaseDepoCount, setPrecioBaseDepoCount] = useState<number>(0);

  /* ── Client info ── */
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  /* ── Generation ── */
  const [generating, setGenerating] = useState(false);

  const isAdmin = role === "admin";

  /* ── Effects ── */

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
              precio_source: (p.precio_source as "unidad" | "tipologia") || "unidad",
              tipologia_mode: (p.tipologia_mode as "fija" | "multiple") || "fija",
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

  // Fetch units + complementos + multi-tipo data when project changes
  useEffect(() => {
    if (!selectedProjectId) return;
    setLoadingUnits(true);
    setSelectedUnitId(null);
    setSearch("");
    setSelectedComplementos([]);
    setSelectedTipologiaId(null);
    setSelectedQuoteTipId(null);
    setCurrentStep(0);
    setTipologias([]);
    setUnidadTipologias([]);

    const proj = projects.find((p) => p.id === selectedProjectId);
    const isMulti = proj?.tipologia_mode === "multiple";

    (async () => {
      try {
        const fetches: Promise<Response>[] = [
          fetch(`/api/unidades?proyecto_id=${selectedProjectId}`),
          fetch(`/api/complementos?proyecto_id=${selectedProjectId}`),
        ];
        // For multi-tipo projects, fetch full project data (tipologias + unidad_tipologias)
        if (isMulti) {
          fetches.push(fetch(`/api/proyectos/${selectedProjectId}`));
        }
        const responses = await Promise.all(fetches);
        if (responses[0].ok) setUnits(await responses[0].json());
        if (responses[1].ok) setComplementos(await responses[1].json());
        if (isMulti && responses[2]?.ok) {
          const fullProject = await responses[2].json();
          setTipologias(fullProject.tipologias ?? []);
          setUnidadTipologias(fullProject.unidad_tipologias ?? []);
        }
      } finally {
        setLoadingUnits(false);
      }
    })();
  }, [selectedProjectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const selectedUnit = units.find((u) => u.id === selectedUnitId);
  const config = selectedProject?.cotizador_config ?? null;
  const showAdminFee = (config?.admin_fee ?? 0) > 0;

  const isMultiTipo = (selectedProject?.tipologia_mode ?? "fija") === "multiple";
  const selectedQuoteTipologia = selectedQuoteTipId ? tipologias.find((t) => t.id === selectedQuoteTipId) : null;

  const getUnitTipologias = useCallback((unitId: string): Tipologia[] => {
    if (!isMultiTipo) return [];
    const tipoIds = unidadTipologias.filter((ut) => ut.unidad_id === unitId).map((ut) => ut.tipologia_id);
    return tipologias.filter((t) => tipoIds.includes(t.id));
  }, [isMultiTipo, unidadTipologias, tipologias]);

  // Initialize payment rows from project config when project changes
  useEffect(() => {
    if (config) {
      const entrega = config.fecha_estimada_entrega || "";
      setFechaEntrega(entrega);
      setPaymentRows(paymentRowsFromConfig(config, 0, "", entrega));
      setSelectedDiscounts([]);
      setPaymentPlanNombre(config.payment_plan_nombre ?? "");
      setAdminFee(config.admin_fee ?? 0);
    }
  }, [selectedProject?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-expand payment rows when unit changes
  const precioSource = selectedProject?.precio_source ?? "unidad";
  const selectedUnitPrice = useMemo(() => {
    if (!selectedUnit) return null;
    if (isMultiTipo && precioSource === "tipologia" && selectedQuoteTipologia) {
      return selectedQuoteTipologia.precio_desde ?? selectedUnit.precio ?? null;
    }
    return resolveUnitPrice(selectedUnit, precioSource);
  }, [selectedUnit, isMultiTipo, precioSource, selectedQuoteTipologia]);

  useEffect(() => {
    if (config && selectedUnitPrice && selectedUnitPrice > 0) {
      setPaymentRows(paymentRowsFromConfig(config, 0, fechaCompra, fechaEntrega));
    }
  }, [selectedUnitId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-select quote tipología when unit or tab changes (multi mode)
  useEffect(() => {
    if (!isMultiTipo || !selectedUnitId) return;
    if (selectedTipologiaId) {
      setSelectedQuoteTipId(selectedTipologiaId);
      return;
    }
    const unitTipoIds = unidadTipologias
      .filter((ut) => ut.unidad_id === selectedUnitId)
      .map((ut) => ut.tipologia_id);
    setSelectedQuoteTipId(unitTipoIds.length === 1 ? unitTipoIds[0] : null);
  }, [selectedUnitId, selectedTipologiaId, isMultiTipo, unidadTipologias]);

  /* ── Filtered units ── */

  const cotizableUnits = useMemo(() => {
    return units.filter((u) => {
      if (u.estado !== "disponible" && u.estado !== "separado") return false;
      if (isMultiTipo && precioSource === "tipologia") {
        const tipoIds = unidadTipologias.filter((ut) => ut.unidad_id === u.id).map((ut) => ut.tipologia_id);
        const hasPrice = tipoIds.some((tid) => {
          const tipo = tipologias.find((t) => t.id === tid);
          return tipo?.precio_desde != null && tipo.precio_desde > 0;
        });
        return hasPrice || (u.precio != null && u.precio > 0);
      }
      const price = resolveUnitPrice(u, precioSource);
      return price != null && price > 0;
    });
  }, [units, precioSource, isMultiTipo, unidadTipologias, tipologias]);

  const tipologiasFromUnits = useMemo(() => {
    const map = new Map<string, { id: string; nombre: string; count: number }>();
    if (isMultiTipo) {
      const cotizableIds = new Set(cotizableUnits.map((u) => u.id));
      for (const ut of unidadTipologias) {
        if (cotizableIds.has(ut.unidad_id)) {
          const tipo = tipologias.find((t) => t.id === ut.tipologia_id);
          if (tipo) {
            const existing = map.get(tipo.id);
            map.set(tipo.id, {
              id: tipo.id,
              nombre: tipo.nombre,
              count: (existing?.count ?? 0) + 1,
            });
          }
        }
      }
    } else {
      for (const u of cotizableUnits) {
        if (u.tipologia_id && u.tipologia?.nombre) {
          const existing = map.get(u.tipologia_id);
          map.set(u.tipologia_id, {
            id: u.tipologia_id,
            nombre: u.tipologia.nombre,
            count: (existing?.count ?? 0) + 1,
          });
        }
      }
    }
    return Array.from(map.values());
  }, [cotizableUnits, isMultiTipo, unidadTipologias, tipologias]);

  const filteredUnits = useMemo(() => {
    let filtered = cotizableUnits;
    if (selectedTipologiaId) {
      if (isMultiTipo) {
        const unitIdsForTipo = new Set(
          unidadTipologias.filter((ut) => ut.tipologia_id === selectedTipologiaId).map((ut) => ut.unidad_id)
        );
        filtered = filtered.filter((u) => unitIdsForTipo.has(u.id));
      } else {
        filtered = filtered.filter((u) => u.tipologia_id === selectedTipologiaId);
      }
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.identificador.toLowerCase().includes(s) ||
          u.tipologia?.nombre?.toLowerCase().includes(s)
      );
    }
    return filtered;
  }, [cotizableUnits, selectedTipologiaId, search, isMultiTipo, unidadTipologias]);

  /* ── Complementos ── */

  const hasParqInventory = selectedProject?.parqueaderos_mode === "inventario_incluido" || selectedProject?.parqueaderos_mode === "inventario_separado";
  const hasDepoInventory = selectedProject?.depositos_mode === "inventario_incluido" || selectedProject?.depositos_mode === "inventario_separado";
  const hasParqPrecioBase = selectedProject?.parqueaderos_mode === "precio_base";
  const hasDepoPrecioBase = selectedProject?.depositos_mode === "precio_base";
  const hasAnyAddons = complementos.some((c) => c.tipo === "addon" && c.estado === "disponible");
  const showComplementos = hasParqInventory || hasDepoInventory || hasParqPrecioBase || hasDepoPrecioBase || hasAnyAddons;

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

  /* ── Pricing (3-phase) ── */

  const rawTotal = useMemo(() => {
    if (!selectedUnitPrice || !config) return 0;
    try {
      const tempConfig: CotizadorConfig = { ...config, fases: [] };
      const result = calcularCotizacion(selectedUnitPrice, tempConfig, selectedDiscounts, allComplementos);
      return result.precio_total ?? result.precio_neto;
    } catch { return selectedUnitPrice; }
  }, [selectedUnitPrice, config, selectedDiscounts, allComplementos]);

  const customConfig = useMemo((): CotizadorConfig | null => {
    if (!config) return null;
    return {
      ...config,
      separacion_incluida_en_inicial: false,
      payment_plan_nombre: paymentPlanNombre || undefined,
      admin_fee: adminFee || undefined,
      fases: paymentRowsToFases(paymentRows, rawTotal),
    };
  }, [config, paymentRows, rawTotal, paymentPlanNombre, adminFee]);

  const cotizacion: ResultadoCotizacion | null = useMemo(() => {
    if (!selectedUnitPrice || !customConfig) return null;
    try {
      return calcularCotizacion(selectedUnitPrice, customConfig, selectedDiscounts, allComplementos);
    } catch { return null; }
  }, [selectedUnitPrice, customConfig, selectedDiscounts, allComplementos]);

  /* ── Payment balance & structure ── */

  const { assigned: balanceAssigned, pctAssigned: balancePct } = useMemo(
    () => computeBalance(paymentRows, rawTotal),
    [paymentRows, rawTotal]
  );
  const balanceRemaining = rawTotal - balanceAssigned;
  const structure = useMemo(() => deriveStructure(paymentRows, rawTotal), [paymentRows, rawTotal]);
  const overBudget = balanceRemaining < 0;

  const clientFormValid = clientName.trim().length > 0 && EMAIL_RE.test(clientEmail.trim());
  const needsQuoteTip = isMultiTipo && getUnitTipologias(selectedUnitId ?? "").length > 1;
  const canProceedToStep1 = !!selectedUnit && !!cotizacion && clientFormValid && (!needsQuoteTip || !!selectedQuoteTipId);
  const moneda = (config?.moneda || "COP") as Currency;

  /* ── Callbacks ── */

  const updateRow = useCallback((id: string, field: keyof PaymentRow, value: string | number) => {
    setPaymentRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  }, []);

  const addCuota = useCallback(() => {
    setPaymentRows((prev) => {
      const nonRestoRows = prev.filter((r) => r.tipo_valor !== "resto");
      const lastRow = nonRestoRows[nonRestoRows.length - 1];
      let newDate = "";
      if (lastRow?.fecha) {
        const parsed = parseDateStr(lastRow.fecha);
        if (parsed) newDate = formatDateDisplay(addMonthsToDate(parsed, 1));
      }
      const newRow: PaymentRow = {
        id: newRowId(),
        nombre: `Cuota ${nonRestoRows.length}`,
        tipo_valor: "porcentaje",
        valor: 5,
        fecha: newDate,
      };
      const restoIdx = prev.findIndex((r) => r.tipo_valor === "resto");
      if (restoIdx >= 0) {
        const result = [...prev];
        result.splice(restoIdx, 0, newRow);
        return result;
      }
      return [...prev, newRow];
    });
  }, []);

  const removeCuota = useCallback((id: string) => {
    setPaymentRows((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const toggleRowType = useCallback((id: string) => {
    setPaymentRows((prev) =>
      prev.map((r) => {
        if (r.id !== id || r.tipo_valor === "resto") return r;
        if (r.tipo_valor === "porcentaje") {
          const amount = rawTotal > 0 ? Math.round(rawTotal * (r.valor / 100)) : 0;
          return { ...r, tipo_valor: "fijo" as const, valor: amount };
        }
        const pct = rawTotal > 0 ? Math.round((r.valor / rawTotal) * 10000) / 100 : 0;
        return { ...r, tipo_valor: "porcentaje" as const, valor: pct };
      })
    );
  }, [rawTotal]);

  const handleAutoDistribute = useCallback(() => {
    setPaymentRows((prev) => autoDistributeDates(prev, fechaCompra, fechaEntrega));
  }, [fechaCompra, fechaEntrega]);

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
          tipologia_id: isMultiTipo ? selectedQuoteTipId : undefined,
          nombre: clientName.trim(),
          email: clientEmail.trim(),
          telefono: clientPhone.trim() || undefined,
          agente_id: user?.id,
          agente_nombre: user?.email,
          custom_fases: paymentRowsToFases(paymentRows, rawTotal),
          descuentos_seleccionados: selectedDiscounts,
          complemento_ids: selectedComplementos.filter((c) => !c.es_precio_base).map((c) => c.complemento_id),
          complemento_selections: selectedComplementos.filter((c) => !c.es_precio_base).map((c) => ({
            complemento_id: c.complemento_id,
            es_extra: c.es_extra ?? false,
            precio_negociado: c.precio_negociado,
          })),
          precio_base_parqueaderos: hasParqPrecioBase ? precioBaseParqCount : undefined,
          precio_base_depositos: hasDepoPrecioBase ? precioBaseDepoCount : undefined,
          separacion_incluida: false,
          payment_plan_nombre: paymentPlanNombre || undefined,
          admin_fee: adminFee || undefined,
        }),
      });

      if (res.ok) {
        const { pdf_url } = await res.json();
        if (pdf_url) window.open(pdf_url, "_blank");
        toast.success("Cotización generada");
        setClientName("");
        setClientEmail("");
        setClientPhone("");
        setSelectedQuoteTipId(null);
        setCurrentStep(0);
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

  /* ── Loading / empty states ── */

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

  /* ── Render ── */

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

      {/* Step indicator */}
      {!loadingUnits && cotizadorEnabled && selectedUnit && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentStep(0)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-ui font-bold uppercase tracking-[0.1em] transition-all",
              currentStep === 0
                ? "bg-[rgba(184,151,58,0.12)] text-[var(--site-primary)] border border-[rgba(184,151,58,0.25)]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] border border-transparent"
            )}
          >
            <span className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold",
              currentStep === 0 ? "bg-[var(--site-primary)] text-[var(--surface-0)]" : "bg-[var(--surface-3)] text-[var(--text-muted)]"
            )}>1</span>
            Unidad y cliente
          </button>
          <ChevronRight size={12} className="text-[var(--text-muted)]" />
          <button
            onClick={() => canProceedToStep1 && setCurrentStep(1)}
            disabled={!canProceedToStep1 && currentStep !== 1}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-ui font-bold uppercase tracking-[0.1em] transition-all",
              currentStep === 1
                ? "bg-[rgba(184,151,58,0.12)] text-[var(--site-primary)] border border-[rgba(184,151,58,0.25)]"
                : canProceedToStep1
                  ? "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] border border-transparent cursor-pointer"
                  : "text-[var(--text-muted)] border border-transparent cursor-not-allowed opacity-50"
            )}
          >
            <span className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold",
              currentStep === 1 ? "bg-[var(--site-primary)] text-[var(--surface-0)]" : "bg-[var(--surface-3)] text-[var(--text-muted)]"
            )}>2</span>
            Plan de pagos
          </button>
        </div>
      )}

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
              href={`/editor/${selectedProjectId}/cotizador-settings`}
              className="inline-flex items-center gap-1.5 text-xs text-[var(--site-primary)] hover:underline"
            >
              {t("cotizador.configureLink")}
              <ExternalLink size={12} />
            </Link>
          )}
        </div>
      ) : currentStep === 0 ? (
        /* ═══ Step 0: Unit + Client ═══ */
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Left: Unit list */}
          <div className="lg:col-span-2 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] overflow-hidden flex flex-col" style={{ maxHeight: "80vh" }}>
            {/* Tipología tabs */}
            {tipologiasFromUnits.length > 1 && (
              <div className="p-3 border-b border-[var(--border-subtle)]">
                <span className="block text-[10px] tracking-[0.12em] uppercase text-[var(--text-muted)] mb-1.5 font-ui font-bold">
                  Tipología
                </span>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setSelectedTipologiaId(null)}
                    className={cn(
                      "px-2.5 py-1.5 rounded-lg text-[10px] font-ui font-bold uppercase tracking-[0.08em] transition-all",
                      !selectedTipologiaId
                        ? "bg-[var(--site-primary)] text-[var(--surface-0)] shadow-sm"
                        : "bg-[var(--surface-2)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                    )}
                  >
                    Todos ({cotizableUnits.length})
                  </button>
                  {tipologiasFromUnits.map((tip) => (
                    <button
                      key={tip.id}
                      onClick={() => setSelectedTipologiaId(tip.id)}
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg text-[10px] font-ui font-bold uppercase tracking-[0.08em] transition-all",
                        selectedTipologiaId === tip.id
                          ? "bg-[var(--site-primary)] text-[var(--surface-0)] shadow-sm"
                          : "bg-[var(--surface-2)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                      )}
                    >
                      {tip.nombre} ({tip.count})
                    </button>
                  ))}
                </div>
              </div>
            )}

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
                        {isMultiTipo
                          ? (() => {
                              const tipos = getUnitTipologias(unit.id);
                              return tipos.length > 0 ? tipos.map((t) => t.nombre).join(" / ") : "—";
                            })()
                          : (unit.tipologia?.nombre || "—")}
                        {unit.area_m2 ? ` · ${unit.area_m2}m²` : ""}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--text-tertiary)] shrink-0">
                      {(() => {
                        if (isMultiTipo && precioSource === "tipologia") {
                          if (selectedTipologiaId) {
                            const tipo = tipologias.find((t) => t.id === selectedTipologiaId);
                            return tipo?.precio_desde ? formatCurrency(tipo.precio_desde, moneda, {}) : "—";
                          }
                          const utIds = unidadTipologias.filter((ut) => ut.unidad_id === unit.id).map((ut) => ut.tipologia_id);
                          const prices = utIds.map((tid) => tipologias.find((t) => t.id === tid)?.precio_desde).filter((p): p is number => p != null && p > 0);
                          const minP = prices.length > 0 ? Math.min(...prices) : (unit.precio ?? null);
                          return minP ? formatCurrency(minP, moneda, {}) : "—";
                        }
                        const p = resolveUnitPrice(unit, precioSource);
                        return p ? formatCurrency(p, moneda, {}) : "—";
                      })()}
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
                    {isMultiTipo ? (selectedQuoteTipologia?.nombre ?? "Seleccionar tipología") : (selectedUnit.tipologia?.nombre || "—")}
                    {selectedUnit.torre?.nombre ? ` · ${selectedUnit.torre.nombre}` : ""}
                    {selectedUnit.piso !== null ? ` · Piso ${selectedUnit.piso}` : ""}
                  </p>

                  {/* Multi-tipología picker */}
                  {isMultiTipo && (() => {
                    const availTipos = getUnitTipologias(selectedUnit.id);
                    return availTipos.length > 1 ? (
                      <div className="mb-3">
                        <span className="block text-[10px] tracking-[0.12em] uppercase text-[var(--text-muted)] mb-1.5 font-ui font-bold">
                          Tipología para cotizar
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {availTipos.map((tipo) => (
                            <button
                              key={tipo.id}
                              onClick={() => setSelectedQuoteTipId(tipo.id)}
                              className={cn(
                                "px-3 py-2 rounded-lg text-[11px] font-ui font-bold uppercase tracking-[0.08em] transition-all border",
                                selectedQuoteTipId === tipo.id
                                  ? "bg-[rgba(184,151,58,0.12)] text-[var(--site-primary)] border-[rgba(184,151,58,0.3)]"
                                  : "bg-[var(--surface-2)] text-[var(--text-tertiary)] border-[var(--border-subtle)] hover:text-[var(--text-secondary)] hover:border-[var(--border-default)]"
                              )}
                            >
                              <span className="block">{tipo.nombre}</span>
                              {tipo.area_m2 && (
                                <span className="block text-[9px] font-normal normal-case tracking-normal mt-0.5 opacity-70">
                                  {tipo.area_m2}m²
                                  {tipo.habitaciones != null ? ` · ${tipo.habitaciones} hab` : ""}
                                  {tipo.precio_desde ? ` · ${formatCurrency(tipo.precio_desde, moneda, {})}` : ""}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                        {!selectedQuoteTipId && (
                          <p className="text-[10px] text-amber-400 mt-1.5 flex items-center gap-1">
                            <AlertTriangle size={10} />
                            Selecciona una tipología para continuar
                          </p>
                        )}
                      </div>
                    ) : null;
                  })()}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(isMultiTipo && selectedQuoteTipologia ? selectedQuoteTipologia.area_m2 : selectedUnit.area_m2) ? (
                      <DetailBox label="Area" value={`${isMultiTipo && selectedQuoteTipologia ? selectedQuoteTipologia.area_m2 : selectedUnit.area_m2} m²`} />
                    ) : null}
                    {(isMultiTipo && selectedQuoteTipologia ? selectedQuoteTipologia.habitaciones : selectedUnit.habitaciones) !== null && (
                      <DetailBox label="Hab." value={String(isMultiTipo && selectedQuoteTipologia ? selectedQuoteTipologia.habitaciones : selectedUnit.habitaciones)} />
                    )}
                    {(isMultiTipo && selectedQuoteTipologia ? selectedQuoteTipologia.banos : selectedUnit.banos) !== null && (
                      <DetailBox label="Baños" value={String(isMultiTipo && selectedQuoteTipologia ? selectedQuoteTipologia.banos : selectedUnit.banos)} />
                    )}
                    {selectedUnit.vista && (
                      <DetailBox label="Vista" value={selectedUnit.vista} />
                    )}
                  </div>
                </div>

                {/* B: Complementos */}
                {showComplementos && (
                  <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] p-5">
                    <span className="font-ui text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)] block mb-3">
                      Complementos
                    </span>
                    <div className="space-y-4">
                      {hasParqPrecioBase && selectedProject?.parqueaderos_precio_base && (
                        <PrecioBaseCounter
                          label="Parqueaderos"
                          icon={Car}
                          count={precioBaseParqCount}
                          onChange={setPrecioBaseParqCount}
                          precioUnitario={selectedProject.parqueaderos_precio_base}
                          moneda={moneda}
                        />
                      )}
                      {hasDepoPrecioBase && selectedProject?.depositos_precio_base && (
                        <PrecioBaseCounter
                          label="Depósitos"
                          icon={Package}
                          count={precioBaseDepoCount}
                          onChange={setPrecioBaseDepoCount}
                          precioUnitario={selectedProject.depositos_precio_base}
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

                {/* C: Price Summary */}
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

                {/* D: Client Info */}
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

                {/* E: Continuar button */}
                <button
                  onClick={() => setCurrentStep(1)}
                  disabled={!canProceedToStep1}
                  className={cn(
                    "w-full py-3 rounded-xl font-ui text-xs font-bold uppercase tracking-[0.1em] flex items-center justify-center gap-2 transition-all",
                    canProceedToStep1
                      ? "bg-[var(--site-primary)] text-[var(--surface-0)] hover:brightness-110 cursor-pointer"
                      : "bg-[var(--surface-2)] text-[var(--text-muted)] cursor-not-allowed"
                  )}
                >
                  Continuar al plan de pagos
                  <ChevronRight size={14} />
                </button>

                {!clientFormValid && selectedUnit && (
                  <p className="text-[10px] text-[var(--text-muted)] text-center">
                    Ingresa nombre y email válido del cliente para continuar
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        /* ═══ Step 1: Payment Plan Builder ═══ */
        <div className="space-y-4">
          {/* Top bar: back + unit summary + total */}
          {selectedUnit && cotizacion && (
            <>
              <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
                <button
                  onClick={() => setCurrentStep(0)}
                  className="flex items-center gap-1.5 text-[10px] font-ui font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <ArrowLeft size={14} />
                  Volver
                </button>
                <div className="h-4 w-px bg-[var(--border-subtle)]" />
                <span className="text-xs text-[var(--text-primary)] font-medium">
                  Unidad {selectedUnit.identificador}
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  {isMultiTipo ? (selectedQuoteTipologia?.nombre ?? "—") : (selectedUnit.tipologia?.nombre || "—")}
                  {(() => {
                    const area = isMultiTipo && selectedQuoteTipologia ? selectedQuoteTipologia.area_m2 : selectedUnit.area_m2;
                    return area ? ` · ${area}m²` : "";
                  })()}
                </span>
                <div className="ml-auto px-3 py-1 rounded-lg bg-[rgba(184,151,58,0.1)] border border-[rgba(184,151,58,0.2)]">
                  <span className="text-[var(--site-primary)] font-mono text-sm font-medium">
                    {formatCurrency(cotizacion.precio_total ?? cotizacion.precio_neto, moneda, {})}
                  </span>
                </div>
              </div>

              {/* Key dates row */}
              <div className="flex flex-wrap items-end gap-4 px-5 py-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
                <div className="flex-1 min-w-[160px]">
                  <label className="flex items-center gap-1.5 text-[9px] font-ui font-bold uppercase tracking-[0.14em] text-[var(--text-muted)] mb-1.5">
                    <Calendar size={11} />
                    Fecha de compra
                  </label>
                  <input
                    type="text"
                    value={fechaCompra}
                    onChange={(e) => setFechaCompra(e.target.value)}
                    placeholder="dd/mm/aaaa"
                    className="input-glass w-full text-xs font-mono"
                  />
                </div>
                <div className="flex-1 min-w-[160px]">
                  <label className="flex items-center gap-1.5 text-[9px] font-ui font-bold uppercase tracking-[0.14em] text-[var(--text-muted)] mb-1.5">
                    <Calendar size={11} />
                    Fecha de entrega
                  </label>
                  <input
                    type="text"
                    value={fechaEntrega}
                    onChange={(e) => setFechaEntrega(e.target.value)}
                    placeholder="dd/mm/aaaa"
                    className="input-glass w-full text-xs font-mono"
                  />
                </div>
                <button
                  onClick={handleAutoDistribute}
                  disabled={!fechaCompra || !fechaEntrega}
                  className={cn(
                    "px-3 py-2 rounded-lg text-[10px] font-ui font-bold uppercase tracking-[0.08em] transition-all",
                    fechaCompra && fechaEntrega
                      ? "bg-[var(--surface-2)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-strong)]"
                      : "bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-muted)] cursor-not-allowed"
                  )}
                >
                  Auto-distribuir fechas
                </button>
              </div>

              {/* Plan header: name + structure + admin fee */}
              <div className="px-5 py-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <input
                      type="text"
                      value={paymentPlanNombre}
                      onChange={(e) => setPaymentPlanNombre(e.target.value)}
                      className="w-full bg-transparent text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none border-b border-transparent focus:border-[rgba(184,151,58,0.3)] pb-1"
                      placeholder="Nombre del plan (ej. Payment Plan 35/65)"
                    />
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]">
                    <span className="text-[var(--text-muted)] font-ui text-[9px] uppercase tracking-wider font-bold">Estructura</span>
                    <span className="text-[var(--site-primary)] font-mono font-medium text-sm">{structure}</span>
                  </div>
                  {showAdminFee && (
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--text-muted)] font-ui text-[9px] uppercase tracking-wider font-bold">
                        {config?.admin_fee_label || "Admin Fee"}
                      </span>
                      <CurrencyInput
                        value={adminFee || ""}
                        onChange={(v) => setAdminFee(Number(v) || 0)}
                        currency={moneda}
                        inputClassName="w-24 bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[rgba(184,151,58,0.4)]"
                        placeholder="0"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Payment table */}
              <div className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-[1fr_140px_100px_1fr_40px_28px] gap-1 px-5 py-2 bg-[var(--surface-2)] border-b border-[var(--border-subtle)]">
                  <span className="text-[8px] font-ui font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Descripción</span>
                  <span className="text-[8px] font-ui font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Valor</span>
                  <span className="text-[8px] font-ui font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Fecha</span>
                  <span className="text-[8px] font-ui font-bold uppercase tracking-[0.14em] text-[var(--text-muted)] text-right">Monto</span>
                  <span className="text-[8px] font-ui font-bold uppercase tracking-[0.14em] text-[var(--text-muted)] text-center">%</span>
                  <span />
                </div>

                {/* Payment rows */}
                <div className="divide-y divide-[var(--border-subtle)]">
                  {paymentRows.map((row, rowIdx) => {
                    const resolvedAmount = resolveRowAmount(row, rawTotal, paymentRows);
                    const pct = rawTotal > 0 ? Math.round((resolvedAmount / rawTotal) * 100) : 0;
                    const isResto = row.tipo_valor === "resto";
                    const canDelete = !isResto && rowIdx > 0;

                    return (
                      <div key={row.id} className="group">
                        <div className="grid grid-cols-[1fr_140px_100px_1fr_40px_28px] gap-1 px-5 py-2.5 items-center">
                          {/* Description */}
                          <input
                            type="text"
                            value={row.nombre}
                            onChange={(e) => updateRow(row.id, "nombre", e.target.value)}
                            className="bg-transparent text-xs text-[var(--text-primary)] focus:outline-none placeholder:text-[var(--text-muted)] border-b border-transparent focus:border-[rgba(184,151,58,0.3)]"
                            placeholder="Descripción"
                          />

                          {/* Valor with tipo toggle */}
                          <div className="flex items-center gap-1">
                            {isResto ? (
                              <span className="text-[8px] font-ui font-bold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--surface-3)] px-2 py-1 rounded">auto</span>
                            ) : (
                              <>
                                <button
                                  onClick={() => toggleRowType(row.id)}
                                  className={cn(
                                    "shrink-0 w-7 h-6 rounded text-[10px] font-ui font-bold transition-all border",
                                    row.tipo_valor === "porcentaje"
                                      ? "bg-[rgba(184,151,58,0.15)] border-[rgba(184,151,58,0.3)] text-[var(--site-primary)]"
                                      : "bg-[var(--surface-3)] border-[var(--border-subtle)] text-[var(--text-tertiary)]"
                                  )}
                                  title={row.tipo_valor === "porcentaje" ? "Cambiar a monto fijo" : "Cambiar a porcentaje"}
                                >
                                  {row.tipo_valor === "porcentaje" ? "%" : "$"}
                                </button>
                                {row.tipo_valor === "porcentaje" ? (
                                  <input
                                    type="number"
                                    value={row.valor || ""}
                                    onChange={(e) => updateRow(row.id, "valor", parseFloat(e.target.value) || 0)}
                                    className="w-full bg-transparent text-xs text-[var(--text-primary)] focus:outline-none border-b border-transparent focus:border-[rgba(184,151,58,0.3)] min-w-0"
                                    placeholder="0"
                                    step="0.01"
                                  />
                                ) : (
                                  <CurrencyInput
                                    value={row.valor || ""}
                                    onChange={(v) => updateRow(row.id, "valor", parseFloat(v) || 0)}
                                    currency={moneda}
                                    inputClassName="w-full bg-transparent text-xs text-[var(--text-primary)] focus:outline-none border-b border-transparent focus:border-[rgba(184,151,58,0.3)] min-w-0"
                                  />
                                )}
                              </>
                            )}
                          </div>

                          {/* Date */}
                          <input
                            type="text"
                            value={row.fecha}
                            onChange={(e) => updateRow(row.id, "fecha", e.target.value)}
                            className="bg-transparent text-xs text-[var(--text-secondary)] font-mono focus:outline-none placeholder:text-[var(--text-muted)] border-b border-transparent focus:border-[rgba(184,151,58,0.3)]"
                            placeholder="dd/mm/aaaa"
                          />

                          {/* Resolved amount */}
                          <span className={cn(
                            "text-xs text-right font-mono",
                            isResto && overBudget ? "text-red-400" : "text-[var(--text-primary)]"
                          )}>
                            {formatCurrency(Math.max(0, resolvedAmount), moneda, {})}
                            {isResto && overBudget && (
                              <AlertTriangle size={10} className="inline ml-1 -mt-0.5" />
                            )}
                          </span>

                          {/* Percentage */}
                          <span className="text-[10px] text-[var(--text-muted)] text-center">{pct}%</span>

                          {/* Delete */}
                          {canDelete ? (
                            <button
                              onClick={() => removeCuota(row.id)}
                              className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded text-[var(--text-muted)] hover:text-red-400 transition-all"
                              title="Eliminar cuota"
                            >
                              <Trash2 size={11} />
                            </button>
                          ) : (
                            <span />
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Add cuota */}
                  <div className="px-5 py-2">
                    <button
                      onClick={addCuota}
                      className="flex items-center gap-1.5 text-[10px] text-[var(--site-primary)] hover:text-white transition-colors"
                    >
                      <Plus size={12} /> Agregar cuota
                    </button>
                  </div>
                </div>

                {/* Warning */}
                {overBudget && (
                  <div className="px-5 py-2 bg-red-500/5 border-t border-red-500/20 flex items-center gap-2">
                    <AlertTriangle size={12} className="text-red-400 shrink-0" />
                    <span className="text-[10px] text-red-400">
                      Las cuotas exceden el total. Ajusta los montos.
                    </span>
                  </div>
                )}

                {/* Totals */}
                <div className="grid grid-cols-[1fr_140px_100px_1fr_40px_28px] gap-1 px-5 py-3 bg-[var(--surface-2)] border-t border-[var(--border-default)]">
                  <span className="text-xs font-medium text-[var(--text-primary)]">Total</span>
                  <span />
                  <span />
                  <span className="text-xs font-medium text-[var(--site-primary)] text-right font-mono">
                    {formatCurrency(rawTotal + adminFee, moneda, {})}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] text-center">100%</span>
                  <span />
                </div>
              </div>

              {/* Running balance bar */}
              <div className="px-5 py-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-[var(--text-secondary)]">
                    Asignado: <span className="text-[var(--text-primary)] font-medium">{formatCurrency(balanceAssigned, moneda, {})}</span>
                    <span className="text-[var(--text-muted)] ml-1">({balancePct}%)</span>
                  </span>
                  <span className="text-[var(--text-secondary)]">
                    Contra entrega: <span className={cn("font-medium", overBudget ? "text-red-400" : "text-[var(--text-primary)]")}>{formatCurrency(Math.max(0, balanceRemaining), moneda, {})}</span>
                    <span className="text-[var(--text-muted)] ml-1">({Math.max(0, 100 - balancePct)}%)</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[var(--surface-3)] overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      overBudget ? "bg-red-500" : "bg-[var(--site-primary)]"
                    )}
                    style={{ width: `${Math.min(100, balancePct)}%` }}
                  />
                </div>
              </div>

              {/* Generate */}
              <button
                onClick={handleGeneratePdf}
                disabled={generating || !clientFormValid}
                className={cn(
                  "w-full py-3 rounded-xl font-ui text-xs font-bold uppercase tracking-[0.1em] flex items-center justify-center gap-2 transition-all",
                  clientFormValid
                    ? "bg-[var(--site-primary)] text-[var(--surface-0)] hover:brightness-110 cursor-pointer"
                    : "bg-[var(--surface-2)] text-[var(--text-muted)] cursor-not-allowed"
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
              {isExtra && (s.precio_negociado ?? s.precio ?? 0) > 0 && (
                <span className="text-[var(--site-primary)] text-[9px] font-ui uppercase">extra</span>
              )}
              {isExtra && (s.precio_negociado ?? s.precio ?? 0) === 0 && (
                <span className="text-green-400 text-[9px] font-ui uppercase">gratis</span>
              )}
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
