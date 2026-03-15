"use client";

export const dynamic = "force-dynamic";

import { useState, useMemo, useCallback, useRef } from "react";
import { useEditorProject } from "@/hooks/useEditorProject";
import {
  inputClass,
  labelClass,
  btnPrimary,
  btnSecondary,
  btnDanger,
} from "@/components/dashboard/editor-styles";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Pencil,
  X,
  Check,
  Search,
  Upload,
  Sparkles,
  ChevronDown,
  Loader2,
  AlertTriangle,
  CheckSquare,
  Square,
  MinusSquare,
  Package,
  Building2,
  TrendingUp,
  MessageSquare,
  Send,
  Car,
  Warehouse,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";
import { useTranslation } from "@/i18n";
import { useToast } from "@/components/dashboard/Toast";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { Unidad, Tipologia, Torre, Fachada, Complemento, ComplementoMode, Currency } from "@/types";
import { ComplementosSection } from "@/components/dashboard/ComplementosSection";
import { SmartImportModal } from "@/components/dashboard/SmartImportModal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EstadoUnidad = Unidad["estado"];

interface UnitFormData {
  identificador: string;
  tipologia_id: string;
  fachada_id: string;
  piso: string;
  area_m2: string;
  precio: string;
  estado: EstadoUnidad;
  habitaciones: string;
  banos: string;
  parqueaderos: string;
  depositos: string;
  orientacion: string;
  vista: string;
  notas: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ESTADOS: { value: EstadoUnidad; label: string }[] = [
  { value: "disponible", label: "Disponible" },
  { value: "separado", label: "Separado" },
  { value: "reservada", label: "Reservada" },
  { value: "vendida", label: "Vendida" },
];

const ESTADO_COLORS: Record<EstadoUnidad, string> = {
  disponible: "bg-green-500/20 text-green-400 border-green-500/30",
  separado: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  reservada: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  vendida: "bg-red-500/20 text-red-400 border-red-500/30",
};

const EMPTY_FORM: UnitFormData = {
  identificador: "",
  tipologia_id: "",
  fachada_id: "",
  piso: "",
  area_m2: "",
  precio: "",
  estado: "disponible",
  habitaciones: "",
  banos: "",
  parqueaderos: "",
  depositos: "",
  orientacion: "",
  vista: "",
  notas: "",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function EstadoBadge({ estado }: { estado: EstadoUnidad }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${ESTADO_COLORS[estado]}`}
    >
      {estado.charAt(0).toUpperCase() + estado.slice(1)}
    </span>
  );
}

const ESTADO_DOT_BG: Record<EstadoUnidad, string> = {
  disponible: "bg-green-500",
  separado: "bg-yellow-500",
  reservada: "bg-orange-500",
  vendida: "bg-red-500",
};

function MobileUnitCard({
  unit,
  tipologias,
  onStatusChange,
  onEdit,
  onDelete,
}: {
  unit: Unidad;
  tipologias: Tipologia[];
  onStatusChange: (unitId: string, estado: EstadoUnidad) => void;
  onEdit: (unitId: string) => void;
  onDelete: (unitId: string) => void;
}) {
  const tipo = tipologias.find((t) => t.id === unit.tipologia_id);
  return (
    <div className="p-3.5 bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl space-y-2.5">
      {/* Row 1: ID + current badge */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white">{unit.identificador}</span>
        <EstadoBadge estado={unit.estado} />
      </div>
      {/* Row 2: Details */}
      <div className="flex items-center gap-2 text-[11px] text-[var(--text-tertiary)] flex-wrap">
        {tipo && <span>{tipo.nombre}</span>}
        {unit.piso != null && <span>· Piso {unit.piso}</span>}
        {unit.area_m2 != null && <span>· {unit.area_m2} m²</span>}
        {unit.habitaciones != null && <span>· {unit.habitaciones} hab</span>}
      </div>
      {/* Row 3: Price */}
      {unit.precio != null && (
        <p className="text-xs text-[var(--text-secondary)] font-medium">
          {unit.precio ? formatCurrency(unit.precio, "COP", { compact: true }) : "-"}
        </p>
      )}
      {/* Row 4: Status dots + actions */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5">
          {ESTADOS.map((e) => (
            <button
              key={e.value}
              onClick={() => onStatusChange(unit.id, e.value)}
              title={e.label}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                unit.estado === e.value
                  ? `${ESTADO_DOT_BG[e.value]} ring-2 ring-offset-2 ring-offset-[var(--surface-2)] ring-current scale-110`
                  : `${ESTADO_DOT_BG[e.value]}/25 hover:${ESTADO_DOT_BG[e.value]}/50`
              )}
            >
              <span
                className={cn(
                  "w-3 h-3 rounded-full",
                  unit.estado === e.value ? "bg-white" : ESTADO_DOT_BG[e.value]
                )}
              />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(unit.id)}
            className="p-2 hover:bg-[var(--surface-3)] rounded-lg transition-colors text-[var(--text-tertiary)] hover:text-white"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(unit.id)}
            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-[var(--text-muted)] hover:text-red-400"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation("editor");
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--surface-2)] border border-[var(--border-default)] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-500/10 rounded-lg">
            <AlertTriangle size={18} className="text-red-400" />
          </div>
          <h3 className="text-sm font-medium text-white">{title}</h3>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-6">{message}</p>
        <div className="flex items-center justify-end gap-3">
          <button onClick={onCancel} className={btnSecondary}>
            {t("inventario.cancel")}
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-500/80 text-white rounded-lg text-xs font-medium hover:bg-red-500 transition-all"
          >
            <Trash2 size={12} />
            {t("galeria.delete")}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Unit Form (Inline Create / Edit)
// ---------------------------------------------------------------------------

function UnitForm({
  initial,
  tipologias,
  fachadas,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial: UnitFormData;
  tipologias: Tipologia[];
  fachadas: Fachada[];
  onSubmit: (data: UnitFormData) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const { t } = useTranslation("editor");
  const [form, setForm] = useState<UnitFormData>(initial);

  const set = (field: keyof UnitFormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="p-5 bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className={labelClass}>{t("inventario.fields.identifier")}</label>
            <input
              type="text"
              value={form.identificador}
              onChange={(e) => set("identificador", e.target.value)}
              placeholder="Apto 101"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t("inventario.fields.typology")}</label>
            <select
              value={form.tipologia_id}
              onChange={(e) => set("tipologia_id", e.target.value)}
              className={inputClass}
            >
              <option value="" className="bg-[var(--surface-2)]">
                {t("inventario.noTypology")}
              </option>
              {tipologias.map((t) => (
                <option key={t.id} value={t.id} className="bg-[var(--surface-2)]">
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>
          {fachadas.length > 0 && (
            <div>
              <label className={labelClass}>{t("inventario.fields.fachada")}</label>
              <select
                value={form.fachada_id}
                onChange={(e) => set("fachada_id", e.target.value)}
                className={inputClass}
              >
                <option value="" className="bg-[var(--surface-2)]">
                  {t("inventario.allFachadas")}
                </option>
                {fachadas.map((f) => (
                  <option key={f.id} value={f.id} className="bg-[var(--surface-2)]">
                    {f.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className={labelClass}>{t("inventario.fields.floor")}</label>
            <input
              type="number"
              value={form.piso}
              onChange={(e) => set("piso", e.target.value)}
              placeholder="1"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t("inventario.fields.area")}</label>
            <input
              type="number"
              value={form.area_m2}
              onChange={(e) => set("area_m2", e.target.value)}
              placeholder="65"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t("inventario.fields.price")}</label>
            <input
              type="number"
              value={form.precio}
              onChange={(e) => set("precio", e.target.value)}
              placeholder="350000000"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t("inventario.fields.state")}</label>
            <select
              value={form.estado}
              onChange={(e) => set("estado", e.target.value)}
              className={inputClass}
            >
              {ESTADOS.map((e) => (
                <option
                  key={e.value}
                  value={e.value}
                  className="bg-[var(--surface-2)]"
                >
                  {e.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>{t("inventario.fields.bedrooms")}</label>
            <input
              type="number"
              value={form.habitaciones}
              onChange={(e) => set("habitaciones", e.target.value)}
              placeholder="3"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t("inventario.fields.bathrooms")}</label>
            <input
              type="number"
              value={form.banos}
              onChange={(e) => set("banos", e.target.value)}
              placeholder="2"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t("inventario.fields.parking")}</label>
            <input
              type="number"
              value={form.parqueaderos}
              onChange={(e) => set("parqueaderos", e.target.value)}
              placeholder="1"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t("inventario.fields.storage")}</label>
            <input
              type="number"
              value={form.depositos}
              onChange={(e) => set("depositos", e.target.value)}
              placeholder="1"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t("inventario.fields.orientation")}</label>
            <input
              type="text"
              value={form.orientacion}
              onChange={(e) => set("orientacion", e.target.value)}
              placeholder="Norte"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t("inventario.fields.view")}</label>
            <input
              type="text"
              value={form.vista}
              onChange={(e) => set("vista", e.target.value)}
              placeholder="Exterior"
              className={inputClass}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>{t("inventario.fields.notes")}</label>
            <input
              type="text"
              value={form.notas}
              onChange={(e) => set("notas", e.target.value)}
              placeholder="Observaciones adicionales"
              className={inputClass}
            />
          </div>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => onSubmit(form)}
            disabled={!form.identificador.trim() || submitting}
            className={btnPrimary}
          >
            {submitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
            {submitting ? t("general.saving") : t("inventario.save")}
          </button>
          <button onClick={onCancel} className={btnSecondary}>
            <X size={14} />
            {t("inventario.cancel")}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Price Adjust Modal
// ---------------------------------------------------------------------------

type InventoryTab = "unidades" | "parqueadero" | "deposito";

function PriceAdjustModal({
  unidades,
  complementos,
  selectedIds,
  activeInventoryTab,
  hasParqueaderos,
  hasDepositos,
  moneda,
  onClose,
  onDone,
}: {
  unidades: Unidad[];
  complementos: Complemento[];
  selectedIds: Set<string>;
  activeInventoryTab: InventoryTab;
  hasParqueaderos: boolean;
  hasDepositos: boolean;
  moneda: Currency;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t } = useTranslation("editor");
  const hasComplementos = hasParqueaderos || hasDepositos;

  // --- State ---
  const [useSelected, setUseSelected] = useState(selectedIds.size > 0);
  const [targetType, setTargetType] = useState<InventoryTab>(activeInventoryTab);
  const [includeEstados, setIncludeEstados] = useState<Set<EstadoUnidad>>(new Set(["disponible"]));
  const [adjustType, setAdjustType] = useState<"percentage" | "fixed">("percentage");
  const [adjustValue, setAdjustValue] = useState("");
  const [applying, setApplying] = useState(false);

  const toggleEstado = (estado: EstadoUnidad) => {
    setIncludeEstados((prev) => {
      const next = new Set(prev);
      if (next.has(estado)) {
        if (next.size > 1) next.delete(estado); // keep at least one
      } else {
        next.add(estado);
      }
      return next;
    });
  };

  // --- Affected items (unified: unidades or complementos) ---
  const affectedItems = useMemo(() => {
    if (useSelected && selectedIds.size > 0) {
      return unidades
        .filter((u) => selectedIds.has(u.id) && u.precio != null)
        .map((u) => ({ id: u.id, identificador: u.identificador, precio: u.precio!, type: "unidad" as const }));
    }
    if (targetType === "unidades") {
      return unidades
        .filter((u) => includeEstados.has(u.estado) && u.precio != null)
        .map((u) => ({ id: u.id, identificador: u.identificador, precio: u.precio!, type: "unidad" as const }));
    }
    return complementos
      .filter((c) => c.tipo === targetType && includeEstados.has(c.estado) && c.precio != null)
      .map((c) => ({ id: c.id, identificador: c.identificador, precio: c.precio!, type: "complemento" as const }));
  }, [unidades, complementos, selectedIds, useSelected, targetType, includeEstados]);

  const numValue = parseFloat(adjustValue) || 0;

  const computeNewPrice = (precio: number) => {
    if (adjustType === "percentage") {
      return Math.round(precio * (1 + numValue / 100));
    }
    return Math.round(precio + numValue);
  };

  const handleApply = async () => {
    if (affectedItems.length === 0 || numValue === 0) return;
    setApplying(true);
    try {
      const promises = affectedItems.map((item) => {
        const endpoint = item.type === "unidad"
          ? `/api/unidades/${item.id}`
          : `/api/complementos/${item.id}`;
        return fetch(endpoint, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ precio: computeNewPrice(item.precio) }),
        });
      });
      await Promise.all(promises);
      onDone();
    } catch {
      // Price batch apply error - handled silently since onDone refreshes
    } finally {
      setApplying(false);
    }
  };

  const ESTADO_FILTER_OPTIONS: { value: EstadoUnidad; label: string; dot: string }[] = [
    { value: "disponible", label: "Disponible", dot: "bg-green-500" },
    { value: "separado", label: "Separado", dot: "bg-yellow-500" },
    { value: "reservada", label: "Reservada", dot: "bg-orange-500" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--surface-2)] border border-[var(--border-default)] rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[rgba(var(--site-primary-rgb),0.1)] rounded-lg">
              <TrendingUp size={18} className="text-[var(--site-primary)]" />
            </div>
            <h3 className="text-sm font-medium text-white">{t("inventario.priceAdjustTitle")}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--surface-3)] rounded-lg transition-colors">
            <X size={16} className="text-[var(--text-tertiary)]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Selected items toggle */}
          {selectedIds.size > 0 && (
            <label className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-lg bg-[rgba(var(--site-primary-rgb),0.05)] border border-[rgba(var(--site-primary-rgb),0.15)]">
              <input
                type="checkbox"
                checked={useSelected}
                onChange={(e) => setUseSelected(e.target.checked)}
                className="accent-[var(--site-primary)] w-3.5 h-3.5"
              />
              <span className="text-xs text-[var(--text-secondary)]">
                {t("inventario.applyToSelected", { n: String(selectedIds.size) })}
              </span>
            </label>
          )}

          {/* Target type — only shown when complementos exist and not using selected */}
          {hasComplementos && !useSelected && (
            <div className="space-y-2">
              <p className="font-ui text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-bold">{t("inventario.applyTo")}</p>
              <div className="flex gap-1 p-1 bg-[var(--surface-1)] rounded-lg border border-[var(--border-subtle)]">
                <button
                  onClick={() => setTargetType("unidades")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all flex-1 justify-center",
                    targetType === "unidades"
                      ? "bg-[var(--surface-3)] text-white shadow-sm"
                      : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                  )}
                >
                  <Package size={12} />
                  Unidades
                </button>
                {hasParqueaderos && (
                  <button
                    onClick={() => setTargetType("parqueadero")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all flex-1 justify-center",
                      targetType === "parqueadero"
                        ? "bg-[var(--surface-3)] text-white shadow-sm"
                        : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                    )}
                  >
                    <Car size={12} />
                    Parqueaderos
                  </button>
                )}
                {hasDepositos && (
                  <button
                    onClick={() => setTargetType("deposito")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all flex-1 justify-center",
                      targetType === "deposito"
                        ? "bg-[var(--surface-3)] text-white shadow-sm"
                        : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                    )}
                  >
                    <Warehouse size={12} />
                    Depósitos
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Estado filter — hidden when using selected */}
          {!useSelected && (
            <div className="space-y-2">
              <p className="font-ui text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-bold">
                {t("inventario.includeEstados")}
              </p>
              <div className="flex items-center gap-3">
                {ESTADO_FILTER_OPTIONS.map((e) => (
                  <label key={e.value} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeEstados.has(e.value)}
                      onChange={() => toggleEstado(e.value)}
                      className="accent-[var(--site-primary)] w-3.5 h-3.5"
                    />
                    <span className={cn("w-2 h-2 rounded-full", e.dot)} />
                    <span className="text-xs text-[var(--text-secondary)]">{e.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Adjust type */}
          <div className="space-y-2">
            <p className="font-ui text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-bold">{t("inventario.adjustType")}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setAdjustType("percentage")}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-medium transition-all",
                  adjustType === "percentage"
                    ? "bg-[var(--surface-3)] text-white shadow-sm"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                )}
              >
                {t("inventario.percentage")}
              </button>
              <button
                onClick={() => setAdjustType("fixed")}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-medium transition-all",
                  adjustType === "fixed"
                    ? "bg-[var(--surface-3)] text-white shadow-sm"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                )}
              >
                {t("inventario.fixedAmount")}
              </button>
            </div>
          </div>

          {/* Value input */}
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={adjustValue}
              onChange={(e) => setAdjustValue(e.target.value)}
              placeholder={adjustType === "percentage" ? "5" : "10000000"}
              className={inputClass + " flex-1"}
            />
            <span className="text-sm text-[var(--text-tertiary)]">
              {adjustType === "percentage" ? "%" : moneda}
            </span>
          </div>

          {/* Preview */}
          {numValue !== 0 && affectedItems.length > 0 && (
            <div className="space-y-2">
              <p className="font-ui text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-bold">{t("inventario.preview")}</p>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-[var(--border-subtle)]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-default)]">
                      <th className="text-left py-2 px-3 text-[var(--text-tertiary)] font-normal">ID</th>
                      <th className="text-right py-2 px-3 text-[var(--text-tertiary)] font-normal">Actual</th>
                      <th className="text-right py-2 px-3 text-[var(--text-tertiary)] font-normal">Nuevo</th>
                      <th className="text-right py-2 px-3 text-[var(--text-tertiary)] font-normal">Dif.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {affectedItems.slice(0, 20).map((item) => {
                      const newP = computeNewPrice(item.precio);
                      const diff = newP - item.precio;
                      return (
                        <tr key={item.id} className="border-b border-[var(--border-subtle)]">
                          <td className="py-1.5 px-3 text-white">{item.identificador}</td>
                          <td className="py-1.5 px-3 text-right text-[var(--text-secondary)]">{formatCurrency(item.precio, moneda, { compact: true })}</td>
                          <td className="py-1.5 px-3 text-right text-white">{formatCurrency(newP, moneda, { compact: true })}</td>
                          <td className={cn("py-1.5 px-3 text-right", diff > 0 ? "text-green-400" : "text-red-400")}>
                            {diff > 0 ? "+" : ""}{formatCurrency(diff, moneda, { compact: true })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {affectedItems.length > 20 && (
                  <p className="text-[10px] text-[var(--text-muted)] text-center py-2">
                    +{affectedItems.length - 20} más...
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-[var(--border-subtle)]">
          <button onClick={onClose} className={btnSecondary}>
            {t("inventario.cancel")}
          </button>
          <button
            onClick={handleApply}
            disabled={applying || numValue === 0 || affectedItems.length === 0}
            className={btnPrimary}
          >
            {applying ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
            {applying
              ? t("inventario.applying")
              : t("inventario.applyToN", { n: String(affectedItems.length) })}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// AI Chat Modal
// ---------------------------------------------------------------------------

interface AIChatMessage {
  role: "user" | "assistant";
  content: string;
  changes?: Array<{ id: string; updates: Record<string, unknown>; identificador: string }>;
}

function AIChatModal({
  unidades,
  tipologias,
  fachadas,
  onClose,
  onDone,
}: {
  unidades: Unidad[];
  tipologias: Tipologia[];
  fachadas: Fachada[];
  onClose: () => void;
  onDone: () => void;
}) {
  const { t } = useTranslation("editor");
  const [messages, setMessages] = useState<AIChatMessage[]>([
    { role: "assistant", content: t("inventario.aiChatWelcome") },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [applyingChanges, setApplyingChanges] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/modify-units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          unidades: unidades.map((u) => ({
            id: u.id,
            identificador: u.identificador,
            tipologia_id: u.tipologia_id,
            fachada_id: u.fachada_id,
            piso: u.piso,
            area_m2: u.area_m2,
            precio: u.precio,
            estado: u.estado,
            habitaciones: u.habitaciones,
            banos: u.banos,
            parqueaderos: u.parqueaderos,
            depositos: u.depositos,
          })),
          tipologias: tipologias.map((tp) => ({ id: tp.id, nombre: tp.nombre })),
          fachadas: fachadas.map((f) => ({ id: f.id, nombre: f.nombre })),
        }),
      });
      if (!res.ok) throw new Error("Error");
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.summary || "Cambios listos.",
          changes: data.changes,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error al procesar la solicitud. Intenta de nuevo." },
      ]);
    } finally {
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  const handleApplyChanges = async (changes: AIChatMessage["changes"]) => {
    if (!changes || changes.length === 0) return;
    setApplyingChanges(true);
    try {
      const promises = changes.map((c) =>
        fetch(`/api/unidades/${c.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(c.updates),
        })
      );
      await Promise.all(promises);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: t("inventario.aiApplied", { n: String(changes.length) }) },
      ]);
      onDone();
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error al aplicar los cambios." },
      ]);
    } finally {
      setApplyingChanges(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--surface-2)] border border-[var(--border-default)] rounded-2xl w-full max-w-2xl h-[70vh] flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <MessageSquare size={18} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">{t("inventario.aiChatTitle")}</h3>
              <p className="text-xs text-[var(--text-tertiary)]">
                {unidades.length} unidades
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--surface-3)] rounded-lg transition-colors">
            <X size={16} className="text-[var(--text-tertiary)]" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-xl px-4 py-2.5 text-xs",
                  msg.role === "user"
                    ? "bg-[rgba(var(--site-primary-rgb),0.15)] text-white"
                    : "bg-[var(--surface-3)] text-[var(--text-secondary)]"
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.changes && msg.changes.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="max-h-32 overflow-y-auto rounded border border-[var(--border-subtle)]">
                      <table className="w-full text-[10px]">
                        <thead>
                          <tr className="border-b border-[var(--border-default)]">
                            <th className="text-left py-1 px-2 text-[var(--text-tertiary)] font-normal">ID</th>
                            <th className="text-left py-1 px-2 text-[var(--text-tertiary)] font-normal">Cambios</th>
                          </tr>
                        </thead>
                        <tbody>
                          {msg.changes.slice(0, 10).map((c, ci) => (
                            <tr key={ci} className="border-b border-[var(--border-subtle)]">
                              <td className="py-1 px-2 text-white">{c.identificador}</td>
                              <td className="py-1 px-2 text-[var(--text-secondary)]">
                                {Object.entries(c.updates).map(([k, v]) => `${k}: ${v}`).join(", ")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {msg.changes.length > 10 && (
                        <p className="text-[10px] text-[var(--text-muted)] text-center py-1">
                          +{msg.changes.length - 10} más
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleApplyChanges(msg.changes)}
                      disabled={applyingChanges}
                      className={btnPrimary}
                    >
                      {applyingChanges ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Check size={12} />
                      )}
                      {t("inventario.aiConfirmApply", { n: String(msg.changes.length) })}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[var(--surface-3)] rounded-xl px-4 py-2.5">
                <Loader2 size={14} className="animate-spin text-purple-400" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={t("inventario.aiChatPlaceholder")}
              className={inputClass + " flex-1"}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className={btnPrimary}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function InventarioPage() {
  const { project, refresh, projectId } = useEditorProject();
  const { t } = useTranslation("editor");
  const toast = useToast();
  const isMobile = useMediaQuery("(max-width: 767px)");

  // --- UI state ---
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTipologia, setFilterTipologia] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkEstado, setBulkEstado] = useState<EstadoUnidad>("disponible");
  const [bulkTorreId, setBulkTorreId] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);

  // --- Form state ---
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // --- Mobile ---
  const [showMobileActions, setShowMobileActions] = useState(false);

  // --- Modals ---
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPriceAdjust, setShowPriceAdjust] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [vendidaWarning, setVendidaWarning] = useState<{ callback: () => void } | null>(null);

  // --- Bulk tipología/fachada ---
  const [bulkTipologiaId, setBulkTipologiaId] = useState("");
  const [bulkFachadaId, setBulkFachadaId] = useState("");

  // --- Torre state ---
  const [activeTorreId, setActiveTorreId] = useState<string | null>(null);

  // --- Inventory tab (unidades vs parqueaderos vs depositos) ---
  const [activeInventoryTab, setActiveInventoryTab] = useState<InventoryTab>("unidades");

  // --- Data ---
  const unidades = useMemo(() => project.unidades || [], [project.unidades]);
  const tipologias = useMemo(() => project.tipologias || [], [project.tipologias]);
  const fachadas: Fachada[] = useMemo(() => project.fachadas || [], [project.fachadas]);
  const torres: Torre[] = useMemo(() => project.torres || [], [project.torres]);
  const isMultiTorre = torres.length > 1;

  // --- Complemento modes & counts ---
  const hasParqueaderos = (project.parqueaderos_mode as ComplementoMode) !== "sin_inventario";
  const hasDepositos = (project.depositos_mode as ComplementoMode) !== "sin_inventario";
  const hasComplementos = hasParqueaderos || hasDepositos;
  const complementos = useMemo(() => (project.complementos || []) as Array<{ tipo: string }>, [project.complementos]);
  const parqCount = useMemo(() => complementos.filter((c) => c.tipo === "parqueadero").length, [complementos]);
  const depoCount = useMemo(() => complementos.filter((c) => c.tipo === "deposito").length, [complementos]);

  // --- Filtering (includes torre filter) ---
  const filteredUnidades = useMemo(() => {
    return unidades.filter((u) => {
      // Torre filter (when multi-torre is active)
      if (isMultiTorre) {
        if (activeTorreId === "__none__") {
          if (u.torre_id) return false;
        } else if (activeTorreId) {
          if (u.torre_id !== activeTorreId) return false;
        }
      }
      if (filterTipologia && u.tipologia_id !== filterTipologia) return false;
      if (filterEstado && u.estado !== filterEstado) return false;
      if (
        searchQuery &&
        !u.identificador.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
  }, [unidades, filterTipologia, filterEstado, searchQuery, isMultiTorre, activeTorreId]);

  // --- Selection helpers ---
  const allFilteredSelected =
    filteredUnidades.length > 0 &&
    filteredUnidades.every((u) => selectedIds.has(u.id));
  const someFilteredSelected =
    filteredUnidades.some((u) => selectedIds.has(u.id)) &&
    !allFilteredSelected;

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredUnidades.map((u) => u.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // --- CRUD handlers ---
  const handleCreate = useCallback(
    async (data: UnitFormData) => {
      setFormLoading(true);
      try {
        const res = await fetch("/api/unidades", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            proyecto_id: projectId,
            identificador: data.identificador,
            tipologia_id: data.tipologia_id || null,
            piso: data.piso ? parseInt(data.piso) : null,
            area_m2: data.area_m2 ? parseFloat(data.area_m2) : null,
            precio: data.precio ? parseFloat(data.precio) : null,
            estado: data.estado,
            habitaciones: data.habitaciones
              ? parseInt(data.habitaciones)
              : null,
            banos: data.banos ? parseInt(data.banos) : null,
            parqueaderos: data.parqueaderos ? parseInt(data.parqueaderos) : null,
            depositos: data.depositos ? parseInt(data.depositos) : null,
            orientacion: data.orientacion || null,
            vista: data.vista || null,
            notas: data.notas || null,
            fachada_id: data.fachada_id || null,
            torre_id: isMultiTorre && activeTorreId && activeTorreId !== "__none__" ? activeTorreId : null,
          }),
        });
        if (!res.ok) throw new Error("Error creating unit");
        setShowCreateForm(false);
        await refresh();
      } catch {
        toast.error("Error al crear unidad");
      } finally {
        setFormLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toast is stable
    [projectId, refresh, isMultiTorre, activeTorreId]
  );

  const handleUpdate = useCallback(
    async (id: string, data: UnitFormData) => {
      setFormLoading(true);
      try {
        const res = await fetch(`/api/unidades/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identificador: data.identificador,
            tipologia_id: data.tipologia_id || null,
            piso: data.piso ? parseInt(data.piso) : null,
            area_m2: data.area_m2 ? parseFloat(data.area_m2) : null,
            precio: data.precio ? parseFloat(data.precio) : null,
            estado: data.estado,
            habitaciones: data.habitaciones
              ? parseInt(data.habitaciones)
              : null,
            banos: data.banos ? parseInt(data.banos) : null,
            parqueaderos: data.parqueaderos ? parseInt(data.parqueaderos) : null,
            depositos: data.depositos ? parseInt(data.depositos) : null,
            orientacion: data.orientacion || null,
            vista: data.vista || null,
            notas: data.notas || null,
            fachada_id: data.fachada_id || null,
          }),
        });
        if (!res.ok) throw new Error("Error updating unit");
        setEditingId(null);
        await refresh();
      } catch {
        toast.error("Error al actualizar unidad");
      } finally {
        setFormLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toast is stable
    [refresh]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/unidades/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Error deleting unit");
        setDeleteConfirm(null);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        await refresh();
      } catch {
        toast.error("Error al eliminar unidad");
      }
    },
    [refresh, toast]
  );

  // Check if units have complementos assigned (for warning dialog)
  const hasInventoryModes = (project.parqueaderos_mode as ComplementoMode) !== "sin_inventario" ||
    (project.depositos_mode as ComplementoMode) !== "sin_inventario";

  const checkComplementosBeforeEstado = useCallback(
    (unitIds: string[], newEstado: string, proceed: () => void) => {
      if (!hasInventoryModes || !["vendida", "separado", "reservada"].includes(newEstado)) {
        proceed();
        return;
      }
      const complementos = project.complementos || [];
      const unitsWithout = unitIds.filter(
        (uid) => !complementos.some((c) => c.unidad_id === uid)
      );
      if (unitsWithout.length > 0) {
        setVendidaWarning({ callback: proceed });
      } else {
        proceed();
      }
    },
    [hasInventoryModes, project.complementos]
  );

  const handleBulkStatusChange = useCallback(async () => {
    if (selectedIds.size === 0) return;
    const doBulk = async () => {
      setBulkLoading(true);
      try {
        const promises = Array.from(selectedIds).map((uid) =>
          fetch(`/api/unidades/${uid}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ estado: bulkEstado }),
          })
        );
        await Promise.all(promises);
        setSelectedIds(new Set());
        await refresh();
      } catch {
        toast.error("Error al cambiar estado");
      } finally {
        setBulkLoading(false);
      }
    };
    checkComplementosBeforeEstado(Array.from(selectedIds), bulkEstado, doBulk);
  }, [selectedIds, bulkEstado, refresh, toast, checkComplementosBeforeEstado]);

  const handleBulkTorreChange = useCallback(async () => {
    if (selectedIds.size === 0 || !bulkTorreId) return;
    setBulkLoading(true);
    try {
      const newTorreId = bulkTorreId === "__none__" ? null : bulkTorreId;
      const promises = Array.from(selectedIds).map((id) =>
        fetch(`/api/unidades/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ torre_id: newTorreId }),
        })
      );
      await Promise.all(promises);
      setSelectedIds(new Set());
      await refresh();
    } catch {
      toast.error("Error al asignar torre");
    } finally {
      setBulkLoading(false);
    }
  }, [selectedIds, bulkTorreId, refresh, toast]);

  const handleInlineUpdate = useCallback(
    async (unitId: string, field: string, value: string | null) => {
      const doUpdate = async () => {
        try {
          await fetch(`/api/unidades/${unitId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ [field]: value }),
          });
          await refresh();
        } catch {
          toast.error("Error al actualizar");
        }
      };
      if (field === "estado" && value) {
        checkComplementosBeforeEstado([unitId], value, doUpdate);
      } else {
        doUpdate();
      }
    },
    [refresh, toast, checkComplementosBeforeEstado]
  );

  const handleBulkTipologiaChange = useCallback(async () => {
    if (selectedIds.size === 0 || !bulkTipologiaId) return;
    setBulkLoading(true);
    try {
      const newTipId = bulkTipologiaId === "__none__" ? null : bulkTipologiaId;
      const promises = Array.from(selectedIds).map((id) =>
        fetch(`/api/unidades/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tipologia_id: newTipId }),
        })
      );
      await Promise.all(promises);
      setSelectedIds(new Set());
      await refresh();
    } catch {
      toast.error("Error al asignar tipología");
    } finally {
      setBulkLoading(false);
    }
  }, [selectedIds, bulkTipologiaId, refresh, toast]);

  const handleBulkFachadaChange = useCallback(async () => {
    if (selectedIds.size === 0 || !bulkFachadaId) return;
    setBulkLoading(true);
    try {
      const newFacId = bulkFachadaId === "__none__" ? null : bulkFachadaId;
      const promises = Array.from(selectedIds).map((id) =>
        fetch(`/api/unidades/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fachada_id: newFacId }),
        })
      );
      await Promise.all(promises);
      setSelectedIds(new Set());
      await refresh();
    } catch {
      toast.error("Error al asignar fachada");
    } finally {
      setBulkLoading(false);
    }
  }, [selectedIds, bulkFachadaId, refresh, toast]);

  const handleImportDone = useCallback(async () => {
    setShowImportModal(false);
    await refresh();
  }, [refresh]);

  // --- Build edit form initial data ---
  const getEditFormData = (u: Unidad): UnitFormData => ({
    identificador: u.identificador,
    tipologia_id: u.tipologia_id || "",
    fachada_id: u.fachada_id || "",
    piso: u.piso != null ? String(u.piso) : "",
    area_m2: u.area_m2 != null ? String(u.area_m2) : "",
    precio: u.precio != null ? String(u.precio) : "",
    estado: u.estado,
    habitaciones: u.habitaciones != null ? String(u.habitaciones) : "",
    banos: u.banos != null ? String(u.banos) : "",
    parqueaderos: u.parqueaderos != null ? String(u.parqueaderos) : "",
    depositos: u.depositos != null ? String(u.depositos) : "",
    orientacion: u.orientacion || "",
    vista: u.vista || "",
    notas: u.notas || "",
  });

  // --- Tipologias filtered by active torre for the form dropdown ---
  const tipologiasForDropdown = useMemo(() => {
    if (!isMultiTorre || !activeTorreId) return tipologias;
    if (activeTorreId === "__none__") return tipologias.filter(t => !t.torre_ids?.length);
    // Show tipologias for the active torre + those with no torre assigned
    return tipologias.filter(t => t.torre_ids?.includes(activeTorreId) || !t.torre_ids?.length);
  }, [tipologias, isMultiTorre, activeTorreId]);

  // --- Auto-prefix identifier for new units ---
  const createFormInitial = useMemo((): UnitFormData => {
    if (isMultiTorre && activeTorreId && activeTorreId !== "__none__") {
      const activeTorre = torres.find(t => t.id === activeTorreId);
      const prefix = activeTorre?.prefijo ? `${activeTorre.prefijo}-` : "";
      return { ...EMPTY_FORM, identificador: prefix };
    }
    return EMPTY_FORM;
  }, [isMultiTorre, activeTorreId, torres]);

  // --- Stats (scoped to active torre when multi-torre) ---
  const statsUnidades = useMemo(() => {
    if (!isMultiTorre) return unidades;
    if (activeTorreId === "__none__") return unidades.filter((u) => !u.torre_id);
    if (activeTorreId) return unidades.filter((u) => u.torre_id === activeTorreId);
    return unidades;
  }, [unidades, isMultiTorre, activeTorreId]);

  const stats = useMemo(() => {
    const s = { disponible: 0, separado: 0, reservada: 0, vendida: 0 };
    for (const u of statsUnidades) {
      s[u.estado]++;
    }
    return s;
  }, [statsUnidades]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Compact header: icon + title + stats pills + actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 mr-auto">
          <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
            <Package size={15} className="text-[var(--site-primary)]" />
          </div>
          <h2 className="text-base font-light text-white whitespace-nowrap">
            {t("inventario.title")}
          </h2>
        </div>

        {/* Inline stats pills */}
        <div className="flex items-center gap-2 order-3 sm:order-none w-full sm:w-auto">
          {ESTADOS.map((e) => (
            <div
              key={e.value}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]"
            >
              <span className={cn("w-2 h-2 rounded-full shrink-0", ESTADO_DOT_BG[e.value])} />
              <span className="text-[10px] text-[var(--text-tertiary)] hidden sm:inline">{e.label}</span>
              <span className="text-xs font-medium text-white">{stats[e.value]}</span>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {!isMobile && (
            <>
              <button
                onClick={() => setShowImportModal(true)}
                className={btnSecondary}
              >
                <Upload size={14} />
                {t("inventario.import")}
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowToolsMenu((p) => !p)}
                  className={btnSecondary}
                >
                  <Sparkles size={14} />
                  {t("inventario.tools")}
                  <ChevronDown size={12} className={cn("transition-transform", showToolsMenu && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {showToolsMenu && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setShowToolsMenu(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-1 w-52 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.4)] z-30 overflow-hidden"
                      >
                        <button
                          onClick={() => { setShowPriceAdjust(true); setShowToolsMenu(false); }}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-3)] hover:text-white transition-colors"
                        >
                          <TrendingUp size={13} className="text-[var(--site-primary)]" />
                          {t("inventario.priceAdjust")}
                        </button>
                        <button
                          onClick={() => { setShowAIChat(true); setShowToolsMenu(false); }}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-3)] hover:text-white transition-colors"
                        >
                          <MessageSquare size={13} className="text-[var(--site-primary)]" />
                          {t("inventario.aiChat")}
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
          <button
            onClick={() => {
              setShowCreateForm(true);
              setEditingId(null);
            }}
            className={btnPrimary}
          >
            <Plus size={14} />
            {isMobile ? t("inventario.newUnit").split(" ").pop() : t("inventario.newUnit")}
          </button>
          {isMobile && (
            <div className="relative">
              <button
                onClick={() => setShowMobileActions((p) => !p)}
                className={btnSecondary}
              >
                <ChevronDown size={14} />
              </button>
              <AnimatePresence>
                {showMobileActions && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute right-0 top-full mt-1 w-52 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-xl shadow-2xl z-30 overflow-hidden"
                  >
                    <button onClick={() => { setShowImportModal(true); setShowMobileActions(false); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-3)] transition-colors">
                      <Upload size={13} className="text-[var(--site-primary)]" /> {t("inventario.import")}
                    </button>
                    <button onClick={() => { setShowPriceAdjust(true); setShowMobileActions(false); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-3)] transition-colors">
                      <TrendingUp size={13} className="text-[var(--site-primary)]" /> {t("inventario.priceAdjust")}
                    </button>
                    <button onClick={() => { setShowAIChat(true); setShowMobileActions(false); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-3)] transition-colors">
                      <MessageSquare size={13} className="text-[var(--site-primary)]" /> {t("inventario.aiChat")}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Inventory type tabs — shown when complemento modes are enabled */}
      {hasComplementos && (
        <div className="flex items-center gap-1 p-1 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)]">
          <button
            onClick={() => setActiveInventoryTab("unidades")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all",
              activeInventoryTab === "unidades"
                ? "bg-[var(--surface-3)] text-white shadow-sm"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
            )}
          >
            <Package size={14} />
            {t("inventario.title")}
            <span className="text-[10px] text-[var(--text-muted)]">{unidades.length}</span>
          </button>
          {hasParqueaderos && (
            <button
              onClick={() => setActiveInventoryTab("parqueadero")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all",
                activeInventoryTab === "parqueadero"
                  ? "bg-[var(--surface-3)] text-white shadow-sm"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
              )}
            >
              <Car size={14} />
              Parqueaderos
              <span className="text-[10px] text-[var(--text-muted)]">{parqCount}</span>
            </button>
          )}
          {hasDepositos && (
            <button
              onClick={() => setActiveInventoryTab("deposito")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all",
                activeInventoryTab === "deposito"
                  ? "bg-[var(--surface-3)] text-white shadow-sm"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
              )}
            >
              <Warehouse size={14} />
              Depósitos
              <span className="text-[10px] text-[var(--text-muted)]">{depoCount}</span>
            </button>
          )}
        </div>
      )}

      {/* Unidades content — only shown when unidades tab is active */}
      {activeInventoryTab === "unidades" && (<>

      {/* Torre tabs + Filters — single row */}
      <div className="flex items-center gap-3 flex-wrap">
        {isMultiTorre && (
          <div className="flex items-center gap-0.5 p-0.5 bg-[var(--surface-1)] rounded-lg border border-[var(--border-subtle)] overflow-x-auto scrollbar-thin shrink-0">
            <button
              onClick={() => setActiveTorreId(null)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all whitespace-nowrap shrink-0",
                activeTorreId === null
                  ? "bg-[var(--surface-3)] text-white shadow-sm"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
              )}
            >
              {t("inventario.all")}
              <span className="text-[10px] text-[var(--text-muted)]">{unidades.length}</span>
            </button>
            {torres.map((torre) => {
              const count = unidades.filter((u) => u.torre_id === torre.id).length;
              return (
                <button
                  key={torre.id}
                  onClick={() => setActiveTorreId(torre.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all whitespace-nowrap shrink-0",
                    activeTorreId === torre.id
                      ? "bg-[var(--surface-3)] text-white shadow-sm"
                      : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                  )}
                >
                  {torre.nombre}
                  <span className="text-[10px] text-[var(--text-muted)]">{count}</span>
                </button>
              );
            })}
            {unidades.some((u) => !u.torre_id) && (
              <button
                onClick={() => setActiveTorreId("__none__")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all whitespace-nowrap shrink-0",
                  activeTorreId === "__none__"
                    ? "bg-[var(--surface-3)] text-white shadow-sm"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                )}
              >
                {t("inventario.noTower")}
                <span className="text-[10px] text-[var(--text-muted)]">
                  {unidades.filter((u) => !u.torre_id).length}
                </span>
              </button>
            )}
          </div>
        )}

        <div className={cn("flex items-center gap-2", !isMultiTorre && "flex-1")}>
          <div className="relative flex-1 min-w-0 sm:min-w-[180px] sm:max-w-[240px]">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("inventario.searchPlaceholder")}
              className={inputClass + " pl-8 py-1.5 text-xs"}
            />
          </div>
          <div className="relative">
            <select
              value={filterTipologia}
              onChange={(e) => setFilterTipologia(e.target.value)}
              className={inputClass + " w-36 appearance-none pr-7 py-1.5 text-xs"}
            >
              <option value="" className="bg-[var(--surface-2)]">
                {t("inventario.allTypologies")}
              </option>
              {tipologias.map((t) => (
                <option key={t.id} value={t.id} className="bg-[var(--surface-2)]">
                  {t.nombre}
                </option>
              ))}
            </select>
            <ChevronDown
              size={12}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
            />
          </div>
          <div className="relative">
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className={inputClass + " w-32 appearance-none pr-7 py-1.5 text-xs"}
            >
              <option value="" className="bg-[var(--surface-2)]">
                {t("inventario.allStates")}
              </option>
              {ESTADOS.map((e) => (
                <option key={e.value} value={e.value} className="bg-[var(--surface-2)]">
                  {e.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={12}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showCreateForm && (
          <UnitForm
            key={activeTorreId ?? "all"}
            initial={createFormInitial}
            tipologias={tipologiasForDropdown}
            fachadas={fachadas}
            onSubmit={handleCreate}
            onCancel={() => setShowCreateForm(false)}
            submitting={formLoading}
          />
        )}
      </AnimatePresence>

      {/* Bulk actions */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 p-3 bg-[rgba(var(--site-primary-rgb),0.05)] border border-[rgba(var(--site-primary-rgb),0.2)] rounded-xl">
              <span className="text-xs text-[var(--site-primary)]">
                {selectedIds.size} seleccionada
                {selectedIds.size !== 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-2 ml-auto flex-wrap">
                <span className="text-xs text-[var(--text-tertiary)]">{t("inventario.bulkState")}</span>
                <div className="relative">
                  <select
                    value={bulkEstado}
                    onChange={(e) =>
                      setBulkEstado(e.target.value as EstadoUnidad)
                    }
                    className={inputClass + " w-36 appearance-none pr-8 py-1.5"}
                  >
                    {ESTADOS.map((e) => (
                      <option
                        key={e.value}
                        value={e.value}
                        className="bg-[var(--surface-2)]"
                      >
                        {e.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
                  />
                </div>
                <button
                  onClick={handleBulkStatusChange}
                  disabled={bulkLoading}
                  className={btnPrimary}
                >
                  {bulkLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  Aplicar
                </button>

                {isMultiTorre && (
                  <>
                    <div className="w-px h-5 bg-[var(--border-subtle)] mx-1" />
                    <span className="text-xs text-[var(--text-tertiary)]">{t("inventario.bulkMoveTo")}</span>
                    <div className="relative">
                      <select
                        value={bulkTorreId}
                        onChange={(e) => setBulkTorreId(e.target.value)}
                        className={inputClass + " w-40 appearance-none pr-8 py-1.5"}
                      >
                        <option value="" className="bg-[var(--surface-2)]">
                          {t("inventario.selectTower")}
                        </option>
                        {torres.map((torre) => (
                          <option key={torre.id} value={torre.id} className="bg-[var(--surface-2)]">
                            {torre.nombre}
                          </option>
                        ))}
                        <option value="__none__" className="bg-[var(--surface-2)]">
                          {t("inventario.noTower")}
                        </option>
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
                      />
                    </div>
                    <button
                      onClick={handleBulkTorreChange}
                      disabled={bulkLoading || !bulkTorreId}
                      className={btnPrimary}
                    >
                      {bulkLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Building2 size={14} />
                      )}
                      Mover
                    </button>
                  </>
                )}

                {/* Bulk tipología */}
                <div className="w-px h-5 bg-[var(--border-subtle)] mx-1" />
                <span className="text-xs text-[var(--text-tertiary)]">{t("inventario.bulkTypology")}</span>
                <div className="relative">
                  <select
                    value={bulkTipologiaId}
                    onChange={(e) => setBulkTipologiaId(e.target.value)}
                    className={inputClass + " w-36 appearance-none pr-8 py-1.5"}
                  >
                    <option value="" className="bg-[var(--surface-2)]">
                      {t("inventario.selectTypology")}
                    </option>
                    {tipologiasForDropdown.map((tp) => (
                      <option key={tp.id} value={tp.id} className="bg-[var(--surface-2)]">
                        {tp.nombre}
                      </option>
                    ))}
                    <option value="__none__" className="bg-[var(--surface-2)]">—</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
                  />
                </div>
                <button
                  onClick={handleBulkTipologiaChange}
                  disabled={bulkLoading || !bulkTipologiaId}
                  className={btnPrimary}
                >
                  {t("inventario.assign")}
                </button>

                {fachadas.length > 0 && (
                  <>
                    <div className="w-px h-5 bg-[var(--border-subtle)] mx-1" />
                    <span className="text-xs text-[var(--text-tertiary)]">{t("inventario.bulkFachada")}</span>
                    <div className="relative">
                      <select
                        value={bulkFachadaId}
                        onChange={(e) => setBulkFachadaId(e.target.value)}
                        className={inputClass + " w-36 appearance-none pr-8 py-1.5"}
                      >
                        <option value="" className="bg-[var(--surface-2)]">
                          {t("inventario.selectFachada")}
                        </option>
                        {fachadas.map((f) => (
                          <option key={f.id} value={f.id} className="bg-[var(--surface-2)]">
                            {f.nombre}
                          </option>
                        ))}
                        <option value="__none__" className="bg-[var(--surface-2)]">—</option>
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
                      />
                    </div>
                    <button
                      onClick={handleBulkFachadaChange}
                      disabled={bulkLoading || !bulkFachadaId}
                      className={btnPrimary}
                    >
                      {t("inventario.assign")}
                    </button>
                  </>
                )}

                <button
                  onClick={() => setSelectedIds(new Set())}
                  className={btnSecondary}
                >
                  <X size={14} />
                  Deseleccionar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unit list — Mobile cards / Desktop table */}
      {isMobile ? (
        /* ── MOBILE CARD VIEW ── */
        <div className="space-y-2.5">
          {filteredUnidades.length === 0 ? (
            <div className="py-12 text-center text-[var(--text-muted)] text-sm">
              {unidades.length === 0
                ? t("inventario.noUnits")
                : t("inventario.noUnitsFiltered")}
            </div>
          ) : (
            filteredUnidades.map((unit) =>
              editingId === unit.id ? (
                <UnitForm
                  key={unit.id}
                  initial={getEditFormData(unit)}
                  tipologias={tipologiasForDropdown}
                  fachadas={fachadas}
                  onSubmit={(data) => handleUpdate(unit.id, data)}
                  onCancel={() => setEditingId(null)}
                  submitting={formLoading}
                />
              ) : (
                <MobileUnitCard
                  key={unit.id}
                  unit={unit}
                  tipologias={tipologiasForDropdown}
                  onStatusChange={(unitId, estado) => handleInlineUpdate(unitId, "estado", estado)}
                  onEdit={(unitId) => {
                    setEditingId(unitId);
                    setShowCreateForm(false);
                  }}
                  onDelete={(unitId) => setDeleteConfirm(unitId)}
                />
              )
            )
          )}
        </div>
      ) : (
        /* ── DESKTOP TABLE VIEW ── */
        <div className="bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-default)]">
                  <th className="text-left py-3 px-4 w-10">
                    <button
                      onClick={toggleSelectAll}
                      className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                    >
                      {allFilteredSelected ? (
                        <CheckSquare size={16} className="text-[var(--site-primary)]" />
                      ) : someFilteredSelected ? (
                        <MinusSquare size={16} className="text-[rgba(var(--site-primary-rgb),0.6)]" />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 text-[var(--text-tertiary)] font-ui font-bold text-[10px] uppercase tracking-wider">
                    {t("inventario.fields.identifier")}
                  </th>
                  <th className="text-left py-3 px-4 text-[var(--text-tertiary)] font-ui font-bold text-[10px] uppercase tracking-wider">
                    {t("inventario.fields.typology")}
                  </th>
                  {fachadas.length > 0 && (
                    <th className="text-left py-3 px-4 text-[var(--text-tertiary)] font-ui font-bold text-[10px] uppercase tracking-wider">
                      {t("inventario.fields.fachada")}
                    </th>
                  )}
                  <th className="text-left py-3 px-4 text-[var(--text-tertiary)] font-ui font-bold text-[10px] uppercase tracking-wider">
                    {t("inventario.fields.floor")}
                  </th>
                  <th className="text-left py-3 px-4 text-[var(--text-tertiary)] font-ui font-bold text-[10px] uppercase tracking-wider">
                    {t("inventario.fields.area")}
                  </th>
                  <th className="text-left py-3 px-4 text-[var(--text-tertiary)] font-ui font-bold text-[10px] uppercase tracking-wider">
                    {t("inventario.fields.price")}
                  </th>
                  <th className="text-left py-3 px-4 text-[var(--text-tertiary)] font-ui font-bold text-[10px] uppercase tracking-wider">
                    {t("inventario.fields.state")}
                  </th>
                  <th className="text-left py-3 px-4 text-[var(--text-tertiary)] font-ui font-bold text-[10px] uppercase tracking-wider">
                    {t("inventario.fields.bedrooms")}
                  </th>
                  <th className="text-left py-3 px-4 text-[var(--text-tertiary)] font-ui font-bold text-[10px] uppercase tracking-wider">
                    {t("inventario.fields.bathrooms")}
                  </th>
                  <th className="text-left py-3 px-4 text-[var(--text-tertiary)] font-ui font-bold text-[10px] uppercase tracking-wider">
                    {t("inventario.fields.parking")}
                  </th>
                  <th className="text-left py-3 px-4 text-[var(--text-tertiary)] font-ui font-bold text-[10px] uppercase tracking-wider">
                    {t("inventario.fields.storage")}
                  </th>
                  <th className="text-right py-3 px-4 text-[var(--text-tertiary)] font-ui font-bold text-[10px] uppercase tracking-wider">

                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUnidades.length === 0 ? (
                  <tr>
                    <td
                      colSpan={fachadas.length > 0 ? 13 : 12}
                      className="py-16 text-center text-[var(--text-muted)] text-sm"
                    >
                      {unidades.length === 0
                        ? t("inventario.noUnits")
                        : t("inventario.noUnitsFiltered")}
                    </td>
                  </tr>
                ) : (
                  filteredUnidades.map((unit) => (
                    <motion.tr
                      key={unit.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-[var(--border-subtle)] hover:bg-[var(--surface-2)] transition-colors group"
                    >
                      {editingId === unit.id ? (
                        <td colSpan={fachadas.length > 0 ? 13 : 12} className="p-4">
                          <UnitForm
                            initial={getEditFormData(unit)}
                            tipologias={tipologiasForDropdown}
                            fachadas={fachadas}
                            onSubmit={(data) => handleUpdate(unit.id, data)}
                            onCancel={() => setEditingId(null)}
                            submitting={formLoading}
                          />
                        </td>
                      ) : (
                        <>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => toggleSelect(unit.id)}
                              className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                            >
                              {selectedIds.has(unit.id) ? (
                                <CheckSquare
                                  size={16}
                                  className="text-[var(--site-primary)]"
                                />
                              ) : (
                                <Square size={16} />
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-white font-medium">
                            {unit.identificador}
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={unit.tipologia_id || ""}
                              onChange={(e) => handleInlineUpdate(unit.id, "tipologia_id", e.target.value || null)}
                              className="bg-transparent text-xs text-[var(--text-secondary)] hover:text-white cursor-pointer focus:outline-none border-none appearance-none"
                            >
                              <option value="" className="bg-[var(--surface-2)]">—</option>
                              {tipologiasForDropdown.map((tp) => (
                                <option key={tp.id} value={tp.id} className="bg-[var(--surface-2)]">
                                  {tp.nombre}
                                </option>
                              ))}
                            </select>
                          </td>
                          {fachadas.length > 0 && (
                            <td className="py-3 px-4">
                              <select
                                value={unit.fachada_id || ""}
                                onChange={(e) => handleInlineUpdate(unit.id, "fachada_id", e.target.value || null)}
                                className="bg-transparent text-xs text-[var(--text-secondary)] hover:text-white cursor-pointer focus:outline-none border-none appearance-none"
                              >
                                <option value="" className="bg-[var(--surface-2)]">—</option>
                                {fachadas.map((f) => (
                                  <option key={f.id} value={f.id} className="bg-[var(--surface-2)]">
                                    {f.nombre}
                                  </option>
                                ))}
                              </select>
                            </td>
                          )}
                          <td className="py-3 px-4 text-[var(--text-secondary)]">
                            {unit.piso ?? "-"}
                          </td>
                          <td className="py-3 px-4 text-[var(--text-secondary)]">
                            {unit.area_m2 != null ? `${unit.area_m2} m²` : "-"}
                          </td>
                          <td className="py-3 px-4 text-[var(--text-secondary)]">
                            {unit.precio ? formatCurrency(unit.precio, "COP", { compact: true }) : "-"}
                          </td>
                          <td className="py-3 px-4">
                            <EstadoBadge estado={unit.estado} />
                          </td>
                          <td className="py-3 px-4 text-[var(--text-secondary)]">
                            {unit.habitaciones ?? "-"}
                          </td>
                          <td className="py-3 px-4 text-[var(--text-secondary)]">
                            {unit.banos ?? "-"}
                          </td>
                          <td className="py-3 px-4 text-[var(--text-secondary)]">
                            {unit.parqueaderos ?? "-"}
                          </td>
                          <td className="py-3 px-4 text-[var(--text-secondary)]">
                            {unit.depositos ?? "-"}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setEditingId(unit.id);
                                  setShowCreateForm(false);
                                }}
                                className="p-1.5 hover:bg-[var(--surface-2)] rounded-lg transition-colors text-[var(--text-tertiary)] hover:text-white"
                                title="Editar"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(unit.id)}
                                className={btnDanger}
                                title="Eliminar"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      </>)}

      {/* Complementos content — shown when parqueadero or deposito tab is active */}
      {activeInventoryTab !== "unidades" && (
        <ComplementosSection
          project={project}
          onRefresh={refresh}
          parqueaderosMode={project.parqueaderos_mode as ComplementoMode}
          depositosMode={project.depositos_mode as ComplementoMode}
          fixedTab={activeInventoryTab}
        />
      )}

      {/* Modals */}
      {/* Warning: selling without complementos */}
      <AnimatePresence>
        {vendidaWarning && (
          <ConfirmDialog
            title="Sin complementos asignados"
            message="Esta unidad no tiene parqueadero o depósito asignado. ¿Deseas continuar de todas formas? Los complementos se pueden asignar después."
            onConfirm={() => {
              vendidaWarning.callback();
              setVendidaWarning(null);
            }}
            onCancel={() => setVendidaWarning(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirm && (
          <ConfirmDialog
            title={t("inventario.deleteUnit")}
            message={t("inventario.deleteConfirm")}
            onConfirm={() => handleDelete(deleteConfirm)}
            onCancel={() => setDeleteConfirm(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showImportModal && (
          <SmartImportModal
            tipologias={tipologias}
            torres={torres}
            fachadas={fachadas}
            proyectoId={projectId}
            activeTorreId={activeTorreId}
            onClose={() => setShowImportModal(false)}
            onDone={handleImportDone}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPriceAdjust && (
          <PriceAdjustModal
            unidades={unidades}
            complementos={(project.complementos || []) as Complemento[]}
            selectedIds={selectedIds}
            activeInventoryTab={activeInventoryTab}
            hasParqueaderos={hasParqueaderos}
            hasDepositos={hasDepositos}
            moneda={project.moneda_base || "COP"}
            onClose={() => setShowPriceAdjust(false)}
            onDone={async () => {
              setShowPriceAdjust(false);
              await refresh();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAIChat && (
          <AIChatModal
            unidades={unidades}
            tipologias={tipologias}
            fachadas={fachadas}
            onClose={() => setShowAIChat(false)}
            onDone={async () => {
              await refresh();
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
