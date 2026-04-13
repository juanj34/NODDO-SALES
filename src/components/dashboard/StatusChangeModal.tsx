"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";
import { UNIT_STATUS_COLORS } from "@/lib/status-colors";
import { getUnitDisplayName } from "@/lib/unit-display";
import {
  X, ArrowRight, AlertTriangle, Loader2, Check,
  LayoutGrid, Maximize2, DollarSign, BedDouble, Bath,
  Car, Warehouse, Compass, Eye, MapPin, Building2,
  User, FileText, Search,
} from "lucide-react";
import type { Currency, DisponibilidadConfig } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EstadoUnidad = "disponible" | "separado" | "reservada" | "vendida" | "proximamente";

export interface ModalUnit {
  id: string;
  identificador: string;
  tipologia_id: string | null;
  estado: EstadoUnidad;
  piso: number | null;
  area_m2: number | null;
  area_construida?: number | null;
  area_privada?: number | null;
  area_lote?: number | null;
  precio: number | null;
  precio_venta: number | null;
  lead_id: string | null;
  cotizacion_id: string | null;
  habitaciones: number | null;
  banos: number | null;
  parqueaderos: number | null;
  depositos: number | null;
  orientacion: string | null;
  vista: string | null;
  lote: string | null;
  etapa_nombre: string | null;
  torre_id: string | null;
}

export interface ModalTipologia {
  id: string;
  nombre: string;
  area_m2: number | null;
  habitaciones: number | null;
  banos: number | null;
  precio_desde: number | null;
  parqueaderos: number | null;
  depositos: number | null;
}

export interface ModalTorre {
  id: string;
  nombre: string;
}

export interface ModalUnidadTipologia {
  unidad_id: string;
  tipologia_id: string;
}

export interface ModalLead {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  status: string;
}

export interface ModalCotizacion {
  id: string;
  nombre: string;
  email: string;
  resultado: { precio_neto?: number; precio_total?: number } | null;
  created_at: string;
  pdf_url: string | null;
}

export interface ProjectContextForModal {
  projectId: string;
  tipologiaMode: "fija" | "multiple";
  precioSource: "unidad" | "tipologia";
  monedaBase: Currency;
  disponibilidadConfig: DisponibilidadConfig;
  tipologias: ModalTipologia[];
  torres: ModalTorre[];
  unidadTipologias: ModalUnidadTipologia[];
  complementoWarning?: string;
  unitDisplayPrefix?: string | null;
}

export interface StatusChangePayload {
  estado: EstadoUnidad;
  tipologia_id?: string | null;
  precio_venta?: number | null;
  lead_id?: string | null;
  cotizacion_id?: string | null;
  _metadata?: {
    price_discrepancy?: { cotizacion_price: number; sale_price: number; percent_diff: number };
    sold_without_client?: boolean;
  };
}

interface StatusChangeModalProps {
  unit: ModalUnit;
  newEstado: EstadoUnidad;
  projectContext: ProjectContextForModal;
  userRole: "admin" | "administrador" | "director" | "asesor";
  onConfirm: (payload: StatusChangePayload) => Promise<void>;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const COMMITTED_STATES: EstadoUnidad[] = ["separado", "reservada", "vendida"];

const LEAD_STATUS_COLORS: Record<string, string> = {
  nuevo: "text-blue-400",
  contactado: "text-yellow-400",
  calificado: "text-green-400",
  cerrado: "text-red-400",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StatusChangeModal({
  unit,
  newEstado,
  projectContext,
  userRole,
  onConfirm,
  onClose,
}: StatusChangeModalProps) {
  const {
    tipologiaMode,
    precioSource,
    monedaBase,
    disponibilidadConfig,
    tipologias,
    torres,
    unidadTipologias,
    complementoWarning,
    unitDisplayPrefix,
  } = projectContext;

  const isMultiTipo = tipologiaMode === "multiple";
  const isCommitting = COMMITTED_STATES.includes(newEstado);
  const wasCommitted = COMMITTED_STATES.includes(unit.estado);
  const isReverting = wasCommitted && !isCommitting;
  const isAdmin = userRole === "admin" || userRole === "administrador";

  // ── Tipología logic ────────────────────────────────────────────
  const showTipoSelector = useMemo(() => {
    if (!isCommitting) return false;
    if (isMultiTipo) {
      // Multi-tipo: show if unit has >1 available tipología
      return unidadTipologias.filter((ut) => ut.unidad_id === unit.id).length > 1;
    }
    // Fija mode: show if project has >1 tipología (user can reassign)
    return tipologias.length > 1;
  }, [isCommitting, isMultiTipo, unidadTipologias, unit.id, tipologias.length]);

  const availTipos = useMemo(() => {
    if (!showTipoSelector) return [];
    if (isMultiTipo) {
      return tipologias.filter((t) =>
        unidadTipologias.some(
          (ut) => ut.unidad_id === unit.id && ut.tipologia_id === t.id
        )
      );
    }
    return tipologias; // fija: all tipologías
  }, [showTipoSelector, isMultiTipo, tipologias, unidadTipologias, unit.id]);

  const clearTipo = isMultiTipo && isReverting && !!unit.tipologia_id;

  // ── State ──────────────────────────────────────────────────────
  const [selectedTipoId, setSelectedTipoId] = useState<string | null>(() => {
    // Pre-select current tipología if unit already has one
    if (unit.tipologia_id) return unit.tipologia_id;
    if (!showTipoSelector) return null;
    if (isMultiTipo) {
      const ids = unidadTipologias
        .filter((ut) => ut.unidad_id === unit.id)
        .map((ut) => ut.tipologia_id);
      return ids.length === 1 ? ids[0] : null;
    }
    return tipologias.length === 1 ? tipologias[0].id : null;
  });

  const [confirming, setConfirming] = useState(false);

  // Sale fields
  const resolvedTipoId = selectedTipoId ?? unit.tipologia_id;
  const tip = resolvedTipoId ? tipologias.find((t) => t.id === resolvedTipoId) : null;

  const autoPrice = useMemo(() => {
    if (unit.precio_venta != null && wasCommitted) return unit.precio_venta;
    if (precioSource === "tipologia") return tip?.precio_desde ?? unit.precio;
    return unit.precio;
  }, [unit.precio_venta, unit.precio, wasCommitted, precioSource, tip]);

  const [precioVentaStr, setPrecioVentaStr] = useState(() =>
    autoPrice != null ? String(autoPrice) : ""
  );
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(unit.lead_id);
  const [selectedCotizacionId, setSelectedCotizacionId] = useState<string | null>(unit.cotizacion_id);
  const [sellWithoutClient, setSellWithoutClient] = useState(false);

  // Update price when tipología changes
  useEffect(() => {
    if (!showTipoSelector || !selectedTipoId) return;
    const selTip = tipologias.find((t) => t.id === selectedTipoId);
    if (selTip) {
      const newPrice = precioSource === "tipologia"
        ? (selTip.precio_desde ?? unit.precio)
        : unit.precio;
      if (newPrice != null) setPrecioVentaStr(String(newPrice));
    }
  }, [selectedTipoId, showTipoSelector, tipologias, precioSource, unit.precio]);

  // ── Sale context (leads + cotizaciones) lazy load ──────────────
  const [saleContext, setSaleContext] = useState<{
    leads: ModalLead[];
    cotizaciones: ModalCotizacion[];
    loading: boolean;
    loaded: boolean;
  }>({ leads: [], cotizaciones: [], loading: false, loaded: false });

  const [leadSearch, setLeadSearch] = useState("");

  useEffect(() => {
    if (!isCommitting || !isAdmin || saleContext.loaded) return;
    setSaleContext((prev) => ({ ...prev, loading: true }));
    fetch(`/api/unidades/${unit.id}/sale-context`)
      .then((r) => r.json())
      .then((data) => {
        setSaleContext({
          leads: data.leads ?? [],
          cotizaciones: data.cotizaciones ?? [],
          loading: false,
          loaded: true,
        });
      })
      .catch(() => {
        setSaleContext((prev) => ({ ...prev, loading: false, loaded: true }));
      });
  }, [isCommitting, isAdmin, unit.id, saleContext.loaded]);

  const filteredLeads = useMemo(() => {
    if (!leadSearch) return saleContext.leads.slice(0, 20);
    const q = leadSearch.toLowerCase();
    return saleContext.leads
      .filter(
        (l) =>
          l.nombre.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [saleContext.leads, leadSearch]);

  // Auto-fill price when cotización is selected
  useEffect(() => {
    if (!selectedCotizacionId) return;
    const cot = saleContext.cotizaciones.find((c) => c.id === selectedCotizacionId);
    if (cot?.resultado?.precio_neto != null) {
      setPrecioVentaStr(String(cot.resultado.precio_neto));
    }
  }, [selectedCotizacionId, saleContext.cotizaciones]);

  // Detect price discrepancy with linked cotización
  const priceDiscrepancy = useMemo(() => {
    if (!selectedCotizacionId) return null;
    const cot = saleContext.cotizaciones.find((c) => c.id === selectedCotizacionId);
    if (!cot?.resultado?.precio_neto) return null;
    const cotPrice = cot.resultado.precio_neto;
    const salePrice = parseFloat(precioVentaStr);
    if (isNaN(salePrice) || salePrice === cotPrice) return null;
    return {
      cotizacionPrice: cotPrice,
      salePrice,
      percentDiff: ((salePrice - cotPrice) / cotPrice) * 100,
    };
  }, [selectedCotizacionId, saleContext.cotizaciones, precioVentaStr]);

  // ── Resolve display data ───────────────────────────────────────
  const torre = torres.find((t) => t.id === unit.torre_id);
  const oldSc = UNIT_STATUS_COLORS[unit.estado];
  const newSc = UNIT_STATUS_COLORS[newEstado];
  const estadoLabel = newSc.label;

  const metaParts: string[] = [];
  if (torre) metaParts.push(torre.nombre);
  if (unit.piso != null) metaParts.push(`Piso ${unit.piso}`);
  if (unit.etapa_nombre) metaParts.push(`Etapa ${unit.etapa_nombre}`);

  // Info fields
  const area = unit.area_m2 ?? unit.area_construida ?? unit.area_privada ?? unit.area_lote ?? tip?.area_m2;
  const displayPrice = autoPrice;

  const infoFields: { icon: typeof LayoutGrid; label: string; value: string; highlight?: boolean }[] = [];
  if (tip && !showTipoSelector) infoFields.push({ icon: LayoutGrid, label: "Tipología", value: tip.nombre });
  if (area != null) infoFields.push({ icon: Maximize2, label: "Área", value: `${area} m²` });
  if (displayPrice != null) infoFields.push({ icon: DollarSign, label: "Precio", value: formatCurrency(displayPrice, monedaBase), highlight: true });
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

  // ── Validation ─────────────────────────────────────────────────
  const canConfirm = useMemo(() => {
    if (showTipoSelector && !selectedTipoId) return false;
    if (isCommitting && isAdmin && !sellWithoutClient) {
      if (disponibilidadConfig?.require_lead_on_commit && !selectedLeadId) return false;
      if (disponibilidadConfig?.require_cotizacion_on_commit && !selectedCotizacionId) return false;
    }
    return true;
  }, [showTipoSelector, selectedTipoId, isCommitting, isAdmin, sellWithoutClient, disponibilidadConfig, selectedLeadId, selectedCotizacionId]);

  // ── Confirm handler ────────────────────────────────────────────
  const handleConfirm = useCallback(async () => {
    if (!canConfirm || confirming) return;
    setConfirming(true);

    const payload: StatusChangePayload = { estado: newEstado };
    if (clearTipo) payload.tipologia_id = null;
    if (showTipoSelector && selectedTipoId) payload.tipologia_id = selectedTipoId;

    if (isCommitting && isAdmin) {
      const pv = parseFloat(precioVentaStr);
      if (!isNaN(pv) && pv > 0) payload.precio_venta = pv;
      if (!sellWithoutClient) {
        if (selectedLeadId) payload.lead_id = selectedLeadId;
        if (selectedCotizacionId) payload.cotizacion_id = selectedCotizacionId;
      }
    }

    // Attach metadata for bitácora
    const meta: StatusChangePayload["_metadata"] = {};
    if (sellWithoutClient) meta.sold_without_client = true;
    if (priceDiscrepancy) {
      meta.price_discrepancy = {
        cotizacion_price: priceDiscrepancy.cotizacionPrice,
        sale_price: priceDiscrepancy.salePrice,
        percent_diff: priceDiscrepancy.percentDiff,
      };
    }
    if (Object.keys(meta).length > 0) payload._metadata = meta;

    try {
      await onConfirm(payload);
    } finally {
      setConfirming(false);
    }
  }, [canConfirm, confirming, newEstado, clearTipo, showTipoSelector, selectedTipoId, isCommitting, isAdmin, precioVentaStr, sellWithoutClient, selectedLeadId, selectedCotizacionId, priceDiscrepancy, onConfirm]);

  // Selected lead/cotizacion display helpers
  const selectedLead = saleContext.leads.find((l) => l.id === selectedLeadId);
  const selectedCotizacion = saleContext.cotizaciones.find((c) => c.id === selectedCotizacionId);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[var(--surface-2)] border border-[var(--border-default)] rounded-2xl max-w-lg w-full mx-4 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {/* ── Header ──────────────────────────────────────────── */}
          <div className="px-6 pt-5 pb-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[var(--text-secondary)] mb-2 leading-relaxed">
                  {clearTipo
                    ? `Vas a revertir esta unidad a ${estadoLabel.toLowerCase()}. Se liberará la tipología asignada.`
                    : showTipoSelector && !selectedTipoId
                      ? "Selecciona la tipología antes de confirmar el cambio."
                      : isCommitting
                        ? `Estás por cambiar el estado de esta unidad a ${estadoLabel.toLowerCase()}.`
                        : `Estás por revertir esta unidad a ${estadoLabel.toLowerCase()}.`}
                </p>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-2xl font-heading font-light text-white leading-none">
                    {getUnitDisplayName(unit, unitDisplayPrefix)}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-ui font-bold uppercase tracking-wider border",
                      oldSc.bg, oldSc.text, oldSc.border
                    )}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", oldSc.dot)} />
                      {oldSc.short}
                    </span>
                    <ArrowRight size={12} className="text-[var(--text-muted)] shrink-0" />
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-ui font-bold uppercase tracking-wider border",
                      newSc.bg, newSc.text, newSc.border
                    )}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", newSc.dot)} />
                      {newSc.short}
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
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-[var(--surface-3)] transition-colors text-[var(--text-muted)] hover:text-white shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* ── Tipología selector ────────────────────────────── */}
          {showTipoSelector && availTipos.length > 0 && (
            <div className="px-6 py-4 border-b border-[var(--border-subtle)]">
              <p className="text-[9px] font-ui uppercase tracking-[0.12em] text-[var(--site-primary)] mb-3 font-bold">
                Seleccionar tipología
              </p>
              <div className="space-y-2">
                {availTipos.map((tipo) => {
                  const isSelected = selectedTipoId === tipo.id;
                  return (
                    <button
                      key={tipo.id}
                      onClick={() => setSelectedTipoId(tipo.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                        isSelected
                          ? "bg-[rgba(var(--site-primary-rgb),0.08)] border-[rgba(var(--site-primary-rgb),0.4)] shadow-[0_0_12px_rgba(var(--site-primary-rgb),0.08)]"
                          : "bg-[var(--surface-1)] border-[var(--border-subtle)] hover:border-[rgba(var(--site-primary-rgb),0.25)]"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                        isSelected
                          ? "border-[var(--site-primary)] bg-[var(--site-primary)]"
                          : "border-[var(--border-default)]"
                      )}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[#141414]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white">{tipo.nombre}</p>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                          {[
                            tipo.area_m2 && `${tipo.area_m2} m²`,
                            tipo.habitaciones != null && `${tipo.habitaciones} hab`,
                            tipo.banos != null && `${tipo.banos} baños`,
                          ].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      {tipo.precio_desde != null && (
                        <span className="text-xs text-[var(--site-primary)] font-mono font-medium shrink-0">
                          {formatCurrency(tipo.precio_desde, monedaBase)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Unit details grid ────────────────────────────────── */}
          {infoFields.length > 0 && (
            <div className={cn(
              "px-6 py-4 border-b border-[var(--border-subtle)] transition-opacity",
              showTipoSelector && !selectedTipoId && "opacity-40"
            )}>
              <p className="text-[9px] font-ui uppercase tracking-[0.12em] text-[var(--text-muted)] mb-3 font-bold">
                Detalles de la unidad
              </p>
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

          {/* ── Sale fields (committing + admin only) ────────────── */}
          {isCommitting && isAdmin && (
            <div className="px-6 py-4 border-b border-[var(--border-subtle)] space-y-4">
              <p className="text-[9px] font-ui uppercase tracking-[0.12em] text-[var(--site-primary)] mb-1 font-bold">
                Datos de la venta
              </p>

              {/* Sell without client checkbox */}
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] cursor-pointer hover:border-[var(--border-default)] transition-colors">
                <input
                  type="checkbox"
                  checked={sellWithoutClient}
                  onChange={(e) => {
                    setSellWithoutClient(e.target.checked);
                    if (e.target.checked) {
                      setSelectedLeadId(null);
                      setSelectedCotizacionId(null);
                    }
                  }}
                  className="sr-only"
                />
                <div className={cn(
                  "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                  sellWithoutClient
                    ? "border-[var(--site-primary)] bg-[var(--site-primary)]"
                    : "border-[var(--border-default)]"
                )}>
                  {sellWithoutClient && <Check size={10} className="text-[#141414]" />}
                </div>
                <span className="text-[11px] text-[var(--text-secondary)]">
                  Marcar vendida sin cliente y/o cotización
                </span>
              </label>

              {/* Precio de venta */}
              <div>
                <label className="text-[9px] font-ui uppercase tracking-[0.12em] text-[var(--text-muted)] font-bold mb-1.5 flex items-center gap-1.5">
                  <DollarSign size={10} />
                  Precio de venta
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[var(--text-muted)]">
                    {monedaBase}
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={precioVentaStr}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d.]/g, "");
                      setPrecioVentaStr(val);
                    }}
                    className="input-glass text-xs w-full pl-12 font-mono text-[var(--site-primary)]"
                    placeholder="0"
                  />
                </div>
                {precioVentaStr && !isNaN(parseFloat(precioVentaStr)) && (
                  <p className="text-[10px] font-mono text-[var(--text-muted)] mt-1">
                    {formatCurrency(parseFloat(precioVentaStr), monedaBase)}
                  </p>
                )}
                {/* Price discrepancy warning */}
                {priceDiscrepancy && (
                  <div className="flex items-start gap-2 mt-2 p-2.5 bg-amber-500/8 border border-amber-500/15 rounded-xl">
                    <AlertTriangle size={12} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-medium text-amber-400 leading-snug">
                        El precio difiere de la cotización vinculada
                      </p>
                      <p className="text-[9px] text-amber-400/60 mt-0.5 font-mono">
                        Cotización: {formatCurrency(priceDiscrepancy.cotizacionPrice, monedaBase)}
                        {" → "}Venta: {formatCurrency(priceDiscrepancy.salePrice, monedaBase)}
                        {" "}({priceDiscrepancy.percentDiff > 0 ? "+" : ""}{priceDiscrepancy.percentDiff.toFixed(1)}%)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Lead selector — hidden when selling without client */}
              {!sellWithoutClient && (
                <div>
                  <label className="text-[9px] font-ui uppercase tracking-[0.12em] text-[var(--text-muted)] font-bold mb-1.5 flex items-center gap-1.5">
                    <User size={10} />
                    Cliente
                    {disponibilidadConfig?.require_lead_on_commit && (
                      <span className="text-[var(--site-primary)] text-[8px]">*</span>
                    )}
                  </label>

                  {saleContext.loading ? (
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] py-2">
                      <Loader2 size={12} className="animate-spin" />
                      Cargando clientes...
                    </div>
                  ) : (
                    <>
                      {selectedLead ? (
                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--surface-1)] border border-[rgba(var(--site-primary-rgb),0.2)]">
                          <div className="w-7 h-7 rounded-full bg-[var(--surface-3)] flex items-center justify-center shrink-0">
                            <User size={12} className="text-[var(--text-tertiary)]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white truncate">{selectedLead.nombre}</p>
                            <p className="text-[10px] text-[var(--text-muted)] truncate">{selectedLead.email}</p>
                          </div>
                          <button
                            onClick={() => setSelectedLeadId(null)}
                            className="p-1 rounded-md hover:bg-[var(--surface-3)] text-[var(--text-muted)] hover:text-white transition-colors shrink-0"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="relative">
                            <Search size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                            <input
                              type="text"
                              value={leadSearch}
                              onChange={(e) => setLeadSearch(e.target.value)}
                              placeholder="Buscar por nombre o email..."
                              className="input-glass text-xs w-full pl-9"
                            />
                          </div>
                          {filteredLeads.length > 0 ? (
                            <div className="max-h-[140px] overflow-y-auto rounded-xl border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
                              {filteredLeads.map((lead) => (
                                <button
                                  key={lead.id}
                                  onClick={() => {
                                    setSelectedLeadId(lead.id);
                                    setLeadSearch("");
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--surface-1)] transition-colors text-left"
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] text-white truncate">{lead.nombre}</p>
                                    <p className="text-[10px] text-[var(--text-muted)] truncate">{lead.email}</p>
                                  </div>
                                  <span className={cn(
                                    "text-[8px] font-ui font-bold uppercase tracking-wider shrink-0",
                                    LEAD_STATUS_COLORS[lead.status] ?? "text-[var(--text-muted)]"
                                  )}>
                                    {lead.status}
                                  </span>
                                </button>
                              ))}
                            </div>
                          ) : saleContext.loaded && leadSearch ? (
                            <p className="text-[10px] text-[var(--text-muted)] py-1">
                              No se encontraron clientes
                            </p>
                          ) : saleContext.loaded && saleContext.leads.length === 0 ? (
                            <p className="text-[10px] text-[var(--text-muted)] py-1">
                              No hay leads en este proyecto
                            </p>
                          ) : null}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Cotización selector — hidden when selling without client */}
              {!sellWithoutClient && (
                <div>
                  <label className="text-[9px] font-ui uppercase tracking-[0.12em] text-[var(--text-muted)] font-bold mb-1.5 flex items-center gap-1.5">
                    <FileText size={10} />
                    Cotización vinculada
                    {disponibilidadConfig?.require_cotizacion_on_commit && (
                      <span className="text-[var(--site-primary)] text-[8px]">*</span>
                    )}
                  </label>

                  {saleContext.loading ? (
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] py-2">
                      <Loader2 size={12} className="animate-spin" />
                      Cargando cotizaciones...
                    </div>
                  ) : saleContext.cotizaciones.length === 0 ? (
                    <p className="text-[10px] text-[var(--text-muted)] py-1">
                      No hay cotizaciones para esta unidad
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {selectedCotizacion ? (
                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--surface-1)] border border-[rgba(var(--site-primary-rgb),0.2)]">
                          <div className="w-7 h-7 rounded-lg bg-[var(--surface-3)] flex items-center justify-center shrink-0">
                            <FileText size={12} className="text-[var(--text-tertiary)]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white truncate">{selectedCotizacion.nombre}</p>
                            <p className="text-[10px] text-[var(--text-muted)]">
                              {formatDate(selectedCotizacion.created_at)}
                              {selectedCotizacion.resultado?.precio_neto != null &&
                                ` · ${formatCurrency(selectedCotizacion.resultado.precio_neto, monedaBase)}`}
                            </p>
                          </div>
                          <button
                            onClick={() => setSelectedCotizacionId(null)}
                            className="p-1 rounded-md hover:bg-[var(--surface-3)] text-[var(--text-muted)] hover:text-white transition-colors shrink-0"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="max-h-[120px] overflow-y-auto rounded-xl border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
                          {saleContext.cotizaciones.map((cot) => (
                            <button
                              key={cot.id}
                              onClick={() => setSelectedCotizacionId(cot.id)}
                              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--surface-1)] transition-colors text-left"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] text-white truncate">{cot.nombre}</p>
                                <p className="text-[10px] text-[var(--text-muted)]">
                                  {formatDate(cot.created_at)}
                                  {cot.resultado?.precio_neto != null &&
                                    ` · ${formatCurrency(cot.resultado.precio_neto, monedaBase)}`}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Warnings ─────────────────────────────────────────── */}
          <div className="px-6 py-4">
            {clearTipo && (
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
            {complementoWarning && (
              <div className="flex items-start gap-2.5 p-3 bg-amber-500/8 border border-amber-500/15 rounded-xl mb-3">
                <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-400 leading-snug">{complementoWarning}</p>
              </div>
            )}

            {/* ── Actions ──────────────────────────────────────────── */}
            <div className="flex items-center gap-3 mt-1">
              <button
                onClick={onClose}
                disabled={confirming}
                className="flex-1 px-4 py-2.5 text-[11px] font-ui uppercase tracking-wider text-[var(--text-secondary)] bg-[var(--surface-3)] border border-[var(--border-default)] rounded-xl hover:bg-[var(--surface-4)] transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={!canConfirm || confirming}
                className={cn(
                  "flex-1 px-4 py-2.5 text-[11px] font-ui uppercase tracking-wider rounded-xl transition-all border flex items-center justify-center gap-2",
                  canConfirm && !confirming
                    ? `${newSc.bg} ${newSc.text} ${newSc.border} hover:brightness-125`
                    : "opacity-40 cursor-not-allowed bg-[var(--surface-3)] text-[var(--text-muted)] border-[var(--border-subtle)]"
                )}
              >
                {confirming && <Loader2 size={12} className="animate-spin" />}
                Confirmar como {estadoLabel}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
