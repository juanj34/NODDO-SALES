"use client";

export const dynamic = "force-dynamic";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
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
  ChevronUp,
  ArrowUpDown,
  Loader2,
  AlertTriangle,
  CheckSquare,
  Square,
  MinusSquare,
  Package,
  Building2,
  TrendingUp,
  MessageSquare,
  Car,
  Warehouse,
  Settings,
  RotateCcw,
  Home,
  MapPin,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";
import { useTranslation } from "@/i18n";
import { useToast } from "@/components/dashboard/Toast";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { Unidad, Tipologia, Torre, Fachada, Orientacion, Vista, Complemento, ComplementoMode, Currency, UnidadTipologia, InventoryColumnConfig, TipoTipologia, CustomColumnDef } from "@/types";
import { getInventoryColumns, getDefaultColumns, getHybridInventoryColumns, resolveColumnsForTipologia, INVENTORY_COLUMN_KEYS, getPrimaryArea, generateColumnKey, getVisibleCustomColumns } from "@/lib/inventory-columns";
import { ComplementosSection } from "@/components/dashboard/ComplementosSection";
import { FileUploader } from "@/components/dashboard/FileUploader";
import { CurrencyInput } from "@/components/dashboard/CurrencyInput";
import { SmartImportModal } from "@/components/dashboard/SmartImportModal";
import { InventoryAssistant } from "@/components/dashboard/InventoryAssistant";
import { NodDoDropdown } from "@/components/ui/NodDoDropdown";
import { UNIT_STATUS_COLORS } from "@/lib/status-colors";
import { useBackgroundSave } from "@/hooks/useBackgroundSave";
import { Badge } from "@/components/ui";
import { PageHeader } from "@/components/dashboard/base/PageHeader";
import { InfoTooltip } from "@/components/ui/InfoTooltip";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EstadoUnidad = Unidad["estado"];

interface UnitFormData {
  identificador: string;
  tipologia_id: string;
  fachada_id: string;
  piso: string;
  lote: string;
  etapa_nombre: string;
  area_m2: string;
  area_construida: string;
  area_privada: string;
  area_lote: string;
  precio: string;
  estado: EstadoUnidad;
  habitaciones: string;
  banos: string;
  parqueaderos: string;
  depositos: string;
  orientacion_id: string;
  vista_id: string;
  notas: string;
  plano_url: string;
  precio_venta: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ESTADOS: { value: EstadoUnidad; label: string }[] = [
  { value: "disponible", label: "Disponible" },
  { value: "proximamente", label: "Próximamente" },
  { value: "separado", label: "Separado" },
  { value: "reservada", label: "Reservada" },
  { value: "vendida", label: "Vendida" },
];

const EMPTY_FORM: UnitFormData = {
  identificador: "",
  tipologia_id: "",
  fachada_id: "",
  piso: "",
  lote: "",
  etapa_nombre: "",
  area_m2: "",
  area_construida: "",
  area_privada: "",
  area_lote: "",
  precio: "",
  estado: "disponible",
  habitaciones: "",
  banos: "",
  parqueaderos: "",
  depositos: "",
  orientacion_id: "",
  vista_id: "",
  notas: "",
  plano_url: "",
  precio_venta: "",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function EstadoBadge({ estado }: { estado: EstadoUnidad }) {
  const colors = UNIT_STATUS_COLORS[estado];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border",
        colors.bg,
        colors.text,
        colors.border
      )}
    >
      {estado.charAt(0).toUpperCase() + estado.slice(1)}
    </span>
  );
}

function MobileUnitCard({
  unit,
  tipologias,
  columns,
  isTipologiaPricing,
  isMultiTipo,
  unitTipos,
  onStatusChange,
  onEdit,
  onDelete,
}: {
  unit: Unidad;
  tipologias: Tipologia[];
  columns: InventoryColumnConfig;
  isTipologiaPricing?: boolean;
  isMultiTipo?: boolean;
  unitTipos?: Tipologia[];
  onStatusChange: (unitId: string, estado: EstadoUnidad) => void;
  onEdit: (unitId: string) => void;
  onDelete: (unitId: string) => void;
}) {
  const tipo = tipologias.find((t) => t.id === unit.tipologia_id);
  const displayPrice = (() => {
    // Sold with final negotiated price → show that
    if (unit.estado === "vendida" && unit.precio_venta != null) return unit.precio_venta;
    // Tipología-based pricing → unit price takes priority when set
    if (isTipologiaPricing) {
      if (unit.precio != null) return unit.precio;
      if (unit.tipologia_id) {
        const confirmed = tipologias.find(t => t.id === unit.tipologia_id);
        return confirmed?.precio_desde ?? null;
      }
      if (isMultiTipo && unitTipos && unitTipos.length > 0) {
        const prices = unitTipos.map(t => t.precio_desde).filter((p): p is number => p != null);
        return prices.length > 0 ? Math.min(...prices) : null;
      }
      return tipo?.precio_desde ?? null;
    }
    // Unit-level pricing
    if (isMultiTipo && !unit.tipologia_id) return null;
    return unit.precio ?? null;
  })();
  const displayArea = getPrimaryArea(unit, columns);
  const showPrice = displayPrice != null;
  const isLocked = ["vendida", "reservada", "separado"].includes(unit.estado);
  const hideSpecs = isMultiTipo && !unit.tipologia_id;
  return (
    <div className="p-3.5 bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl space-y-2.5">
      {/* Row 1: ID + current badge */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white">{unit.identificador}</span>
        <EstadoBadge estado={unit.estado} />
      </div>
      {/* Row 2: Details */}
      <div className="flex items-center gap-2 text-[11px] text-[var(--text-tertiary)] flex-wrap">
        {isMultiTipo ? (
          unitTipos && unitTipos.length > 0 ? (
            isLocked && unit.tipologia_id ? (
              (() => {
                const confirmedTipo = unitTipos.find((t) => t.id === unit.tipologia_id) ?? tipologias.find((t) => t.id === unit.tipologia_id);
                return confirmedTipo ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium border bg-[rgba(var(--site-primary-rgb),0.15)] border-[var(--site-primary)] text-[var(--site-primary)]">
                    {confirmedTipo.nombre}
                  </span>
                ) : null;
              })()
            ) : (
              unitTipos.map((tp) => (
                <span
                  key={tp.id}
                  className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium border bg-[var(--surface-3)] border-[var(--border-subtle)] text-[var(--text-tertiary)]"
                >
                  {tp.nombre}
                </span>
              ))
            )
          ) : (
            <span className="text-[var(--text-muted)] text-[10px]">Sin tipologías</span>
          )
        ) : (
          tipo && <span>{tipo.nombre}</span>
        )}
        {unit.piso != null && <span>· Piso {unit.piso}</span>}
        {!hideSpecs && displayArea != null && <span>· {displayArea} m²</span>}
        {!hideSpecs && unit.habitaciones != null && <span>· {unit.habitaciones} hab</span>}
      </div>
      {/* Row 3: Price */}
      {showPrice && (
        <p className="text-xs text-[var(--text-secondary)] font-medium">
          {formatCurrency(displayPrice!, "COP", {})}
        </p>
      )}
      {/* Row 4: Status pills + actions */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1 flex-wrap">
          {ESTADOS.map((e) => {
            const sc = UNIT_STATUS_COLORS[e.value];
            const isActive = unit.estado === e.value;
            return (
              <button
                key={e.value}
                onClick={() => onStatusChange(unit.id, e.value)}
                className={cn(
                  "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border",
                  isActive
                    ? `${sc.bg} ${sc.text} ${sc.border}`
                    : "bg-transparent text-[var(--text-muted)] border-transparent hover:bg-[var(--surface-3)] hover:text-[var(--text-tertiary)]"
                )}
              >
                {sc.short}
              </button>
            );
          })}
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
// InlineMultiTipo — interactive multi-tipología cell for table rows
// ---------------------------------------------------------------------------

function InlineMultiTipo({
  unit,
  unitTipos,
  allTipologias,
  onToggleAvailable,
}: {
  unit: Unidad;
  unitTipos: Tipologia[];
  allTipologias: Tipologia[];
  onToggleAvailable: (tipoId: string, add: boolean) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Units with committed states (vendida, reservada, separado) are locked —
  // they must keep their single confirmed tipología and can't be edited.
  const isLocked = ["vendida", "reservada", "separado"].includes(unit.estado);

  useEffect(() => {
    if (!showPicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPicker]);

  const availableIds = new Set(unitTipos.map((t) => t.id));

  // Locked state: show only the confirmed tipología as a static badge
  if (isLocked) {
    const confirmedTipo = unit.tipologia_id
      ? unitTipos.find((t) => t.id === unit.tipologia_id) ?? allTipologias.find((t) => t.id === unit.tipologia_id)
      : null;
    return (
      <div className="flex flex-wrap gap-1 items-center">
        {confirmedTipo ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border bg-[rgba(var(--site-primary-rgb),0.15)] border-[var(--site-primary)] text-[var(--site-primary)]">
            <Check size={8} className="mr-0.5" />
            {confirmedTipo.nombre}
          </span>
        ) : (
          <span className="text-[var(--text-muted)] text-[10px]">—</span>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={pickerRef}>
      <div className="flex flex-wrap gap-1 items-center">
        {unitTipos.length > 0 ? unitTipos.map((tp) => (
          <span
            key={tp.id}
            className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border bg-[var(--surface-3)] border-[var(--border-subtle)] text-[var(--text-tertiary)]"
          >
            {tp.nombre}
          </span>
        )) : (
          <span className="text-[var(--text-muted)] text-[10px]">Sin tipologías</span>
        )}
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className="inline-flex items-center justify-center w-5 h-5 rounded-md text-[var(--text-muted)] hover:text-[var(--site-primary)] hover:bg-[rgba(var(--site-primary-rgb),0.1)] transition-all border border-transparent hover:border-[rgba(var(--site-primary-rgb),0.2)]"
          title="Editar tipologías disponibles"
        >
          <Plus size={10} />
        </button>
      </div>

      {/* Picker popover */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="absolute z-50 top-full mt-1 left-0 min-w-[180px] p-1.5 rounded-xl bg-[rgba(26,26,29,0.95)] border border-[var(--border-default)] shadow-[0_8px_40px_rgba(0,0,0,0.5)]"
            style={{ backdropFilter: "blur(32px)" }}
          >
            <p className="px-2 py-1 text-[9px] text-[var(--text-muted)] uppercase tracking-wider font-bold">
              Tipologías disponibles
            </p>
            {allTipologias.map((tp) => {
              const isAvailable = availableIds.has(tp.id);
              return (
                <button
                  key={tp.id}
                  type="button"
                  onClick={() => {
                    onToggleAvailable(tp.id, !isAvailable);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] font-mono transition-all text-left",
                    isAvailable
                      ? "bg-[rgba(var(--site-primary-rgb),0.1)] text-[var(--site-primary)]"
                      : "text-[var(--text-tertiary)] hover:bg-[var(--surface-3)] hover:text-[var(--text-secondary)]"
                  )}
                >
                  <span className="w-3 shrink-0">
                    {isAvailable && <Check size={10} className="text-[var(--site-primary)]" />}
                  </span>
                  {tp.nombre}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Unit Form (Inline Create / Edit)
// ---------------------------------------------------------------------------

function UnitForm({
  initial,
  tipologias,
  fachadas,
  orientaciones,
  vistas,
  onSubmit,
  onCancel,
  submitting,
  currency,
  columns,
  projectId,
  isLoteBased = false,
  isMultiTipo = false,
  isTipologiaPricing = false,
  unitTipoIds = [],
  onMultiTipoChange,
  existingEtapas = [],
  customColumns = [],
  customFieldValues = {},
}: {
  initial: UnitFormData;
  tipologias: Tipologia[];
  fachadas: Fachada[];
  orientaciones: Orientacion[];
  vistas: Vista[];
  onSubmit: (data: UnitFormData & { available_tipologia_ids?: string[]; custom_fields?: Record<string, unknown> }) => void;
  onCancel: () => void;
  submitting: boolean;
  currency: Currency;
  columns: InventoryColumnConfig;
  projectId: string;
  isLoteBased?: boolean;
  isMultiTipo?: boolean;
  isTipologiaPricing?: boolean;
  unitTipoIds?: string[];
  onMultiTipoChange?: (ids: string[]) => void;
  existingEtapas?: string[];
  customColumns?: CustomColumnDef[];
  customFieldValues?: Record<string, unknown>;
}) {
  const { t } = useTranslation("editor");
  const { t: tTooltips } = useTranslation("tooltips");
  const [form, setForm] = useState<UnitFormData>(initial);
  const [selectedTipoIds, setSelectedTipoIds] = useState<string[]>(unitTipoIds);
  const [customFields, setCustomFields] = useState<Record<string, unknown>>(customFieldValues);

  const set = (field: keyof UnitFormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const setCustomField = (key: string, value: unknown) =>
    setCustomFields((prev) => ({ ...prev, [key]: value }));

  // Show floor plan uploader for commercial tipologías or units without a tipología
  const selectedTipo = tipologias.find((t) => t.id === form.tipologia_id);
  const showPlanoUploader = selectedTipo?.tipo_tipologia === "local_comercial" || !form.tipologia_id;

  const toggleTipoId = (id: string) => {
    setSelectedTipoIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      onMultiTipoChange?.(next);
      return next;
    });
  };

  const handleSubmit = () => {
    const customFieldsPayload = customColumns.length > 0 ? { custom_fields: customFields } : {};
    if (isMultiTipo) {
      onSubmit({ ...form, available_tipologia_ids: selectedTipoIds, ...customFieldsPayload });
    } else {
      onSubmit({ ...form, ...customFieldsPayload });
    }
  };

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
            <label className={labelClass}>
              {t("inventario.fields.identifier")}
              <InfoTooltip content={tTooltips("inventario.identificador.short")} variant="dashboard" />
            </label>
            <input
              type="text"
              value={form.identificador}
              onChange={(e) => set("identificador", e.target.value)}
              placeholder={isLoteBased ? "Lote 1" : "Apto 101"}
              className={inputClass}
            />
          </div>
          {isMultiTipo ? (
            <div className="md:col-span-2">
              <label className={labelClass}>Tipologías disponibles</label>
              <div className="flex flex-wrap gap-1.5 min-h-[38px] p-2 bg-[var(--surface-3)] border border-[var(--border-default)] rounded-[0.625rem]">
                {tipologias.map((tp) => (
                  <button
                    key={tp.id}
                    type="button"
                    onClick={() => toggleTipoId(tp.id)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all border",
                      selectedTipoIds.includes(tp.id)
                        ? "bg-[rgba(var(--site-primary-rgb),0.15)] border-[var(--site-primary)] text-[var(--site-primary)]"
                        : "bg-[var(--surface-2)] border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:border-[var(--border-default)] hover:text-[var(--text-secondary)]"
                    )}
                  >
                    {tp.nombre}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className={labelClass}>{t("inventario.fields.typology")}</label>
              <NodDoDropdown
                variant="form"
                size="lg"
                value={form.tipologia_id}
                onChange={(val) => {
                  set("tipologia_id", val);
                  // Auto-fill fields from tipología data
                  const tipo = tipologias.find((t) => t.id === val);
                  if (tipo) {
                    setForm((prev) => ({
                      ...prev,
                      tipologia_id: val,
                      area_m2: prev.area_m2 || (tipo.area_m2 ? String(tipo.area_m2) : ""),
                      area_construida: prev.area_construida || (tipo.area_construida ? String(tipo.area_construida) : ""),
                      area_privada: prev.area_privada || (tipo.area_privada ? String(tipo.area_privada) : ""),
                      area_lote: prev.area_lote || (tipo.area_lote ? String(tipo.area_lote) : ""),
                      habitaciones: prev.habitaciones || (tipo.habitaciones ? String(tipo.habitaciones) : ""),
                      banos: prev.banos || (tipo.banos ? String(tipo.banos) : ""),
                      parqueaderos: prev.parqueaderos || (tipo.parqueaderos ? String(tipo.parqueaderos) : ""),
                      depositos: prev.depositos || (tipo.depositos ? String(tipo.depositos) : ""),
                      precio: prev.precio || (tipo.precio_desde ? String(tipo.precio_desde) : ""),
                    }));
                  }
                }}
                placeholder={t("inventario.noTypology")}
                options={[
                  { value: "", label: t("inventario.noTypology") },
                  ...tipologias.map((tp) => ({ value: tp.id, label: tp.nombre })),
                ]}
              />
            </div>
          )}
          {!isLoteBased && fachadas.length > 0 && (
            <div>
              <label className={labelClass}>{t("inventario.fields.fachada")}</label>
              <NodDoDropdown
                variant="form"
                size="lg"
                value={form.fachada_id}
                onChange={(val) => set("fachada_id", val)}
                placeholder={t("inventario.allFachadas")}
                options={[
                  { value: "", label: t("inventario.allFachadas") },
                  ...fachadas.map((f) => ({ value: f.id, label: f.nombre })),
                ]}
              />
            </div>
          )}
          {columns.piso && (
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
          )}
          {columns.lote && (
            <div>
              <label className={labelClass}>Lote</label>
              <input
                type="text"
                value={form.lote}
                onChange={(e) => set("lote", e.target.value)}
                placeholder="A-12"
                className={inputClass}
              />
            </div>
          )}
          {columns.etapa && (
            <div>
              <label className={labelClass}>Etapa</label>
              <input
                type="text"
                list="etapa-suggestions"
                value={form.etapa_nombre}
                onChange={(e) => set("etapa_nombre", e.target.value)}
                placeholder="Etapa 1"
                className={inputClass}
              />
              {existingEtapas.length > 0 && (
                <datalist id="etapa-suggestions">
                  {existingEtapas.map((e) => (
                    <option key={e} value={e} />
                  ))}
                </datalist>
              )}
            </div>
          )}
          {columns.area_m2 && (
            <div>
              <label className={labelClass}>{t("inventario.columns.area")}</label>
              <input
                type="number"
                value={form.area_m2}
                onChange={(e) => set("area_m2", e.target.value)}
                placeholder="65"
                className={inputClass}
              />
            </div>
          )}
          {columns.area_construida && (
            <div>
              <label className={labelClass}>{t("inventario.columns.areaConstruida")}</label>
              <input
                type="number"
                value={form.area_construida}
                onChange={(e) => set("area_construida", e.target.value)}
                placeholder="85"
                className={inputClass}
              />
            </div>
          )}
          {columns.area_privada && (
            <div>
              <label className={labelClass}>{t("inventario.columns.areaPrivada")}</label>
              <input
                type="number"
                value={form.area_privada}
                onChange={(e) => set("area_privada", e.target.value)}
                placeholder="65"
                className={inputClass}
              />
            </div>
          )}
          {columns.area_lote && (
            <div>
              <label className={labelClass}>{t("inventario.columns.areaLote")}</label>
              <input
                type="number"
                value={form.area_lote}
                onChange={(e) => set("area_lote", e.target.value)}
                placeholder="120"
                className={inputClass}
              />
            </div>
          )}
          <div>
            <label className={labelClass}>
              {t("inventario.fields.price")}
              {isTipologiaPricing && (
                <span className="ml-1 text-[9px] text-[var(--text-muted)] font-normal normal-case tracking-normal">
                  ({t("inventario.fields.priceOverride") ?? "opcional — sobreescribe tipología"})
                </span>
              )}
            </label>
            <CurrencyInput
              value={form.precio}
              onChange={(v) => set("precio", v)}
              currency={currency}
              placeholder={isTipologiaPricing ? t("inventario.fields.priceFromTipologia") ?? "Desde tipología" : "350,000,000"}
              inputClassName={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              {t("inventario.fields.state")}
              <InfoTooltip content={tTooltips("inventario.estado.short")} variant="dashboard" />
            </label>
            <NodDoDropdown
              variant="form"
              size="lg"
              value={form.estado}
              onChange={(val) => set("estado", val)}
              options={ESTADOS.map((e) => ({ value: e.value, label: e.label }))}
            />
          </div>
          {form.estado === "vendida" && (
            <div>
              <label className={labelClass}>
                Precio de venta
                <InfoTooltip content={tTooltips("inventario.precioVenta.short")} variant="dashboard" />
              </label>
              <CurrencyInput
                value={form.precio_venta}
                onChange={(v) => set("precio_venta", v)}
                currency={currency}
                placeholder="Precio negociado"
                inputClassName={inputClass}
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Precio final negociado
              </p>
            </div>
          )}
          {columns.habitaciones && (
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
          )}
          {columns.banos && (
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
          )}
          {columns.parqueaderos && (
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
          )}
          {columns.depositos && (
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
          )}
          {columns.orientacion && (
            <div>
              <label className={labelClass}>
                {t("inventario.fields.orientation")}
                <InfoTooltip content={tTooltips("inventario.orientacion.short")} variant="dashboard" />
              </label>
              <NodDoDropdown
                variant="form"
                size="lg"
                value={form.orientacion_id}
                onChange={(val) => set("orientacion_id", val)}
                placeholder={t("inventario.selectOrientation")}
                options={[
                  { value: "", label: t("inventario.selectOrientation") },
                  ...orientaciones.map((o) => ({ value: o.id, label: o.nombre })),
                ]}
              />
            </div>
          )}
          {columns.vista && (
            <div>
              <label className={labelClass}>
                {t("inventario.fields.view")}
                <InfoTooltip content={tTooltips("inventario.vista.short")} variant="dashboard" />
              </label>
              <NodDoDropdown
                variant="form"
                size="lg"
                value={form.vista_id}
                onChange={(val) => set("vista_id", val)}
                placeholder={t("inventario.selectView")}
                options={[
                  { value: "", label: t("inventario.selectView") },
                  ...vistas.map((v) => ({ value: v.id, label: v.nombre })),
                ]}
              />
            </div>
          )}
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
          {/* Per-unit floor plan (commercial / untyped units) */}
          {showPlanoUploader && (
            <div className="md:col-span-2">
              <label className={labelClass}>{t("inventario.unitFloorPlan")}</label>
              <FileUploader
                onUpload={(url) => set("plano_url", url)}
                currentUrl={form.plano_url || null}
                folder={`proyectos/${projectId}/planos-unidades`}
                label={t("inventario.unitFloorPlan")}
                accept="image/*"
              />
            </div>
          )}
          {/* Custom columns */}
          {customColumns.map((col) => (
            <div key={col.id}>
              <label className={labelClass}>{col.label}</label>
              {col.type === "text" && (
                <input
                  type="text"
                  value={(customFields[col.key] as string) ?? ""}
                  onChange={(e) => setCustomField(col.key, e.target.value)}
                  className={inputClass}
                />
              )}
              {col.type === "number" && (
                <input
                  type="number"
                  value={(customFields[col.key] as string) ?? ""}
                  onChange={(e) => setCustomField(col.key, e.target.value ? parseFloat(e.target.value) : "")}
                  className={inputClass}
                />
              )}
              {col.type === "date" && (
                <input
                  type="date"
                  value={(customFields[col.key] as string) ?? ""}
                  onChange={(e) => setCustomField(col.key, e.target.value)}
                  className={inputClass}
                />
              )}
              {col.type === "select" && (
                <NodDoDropdown
                  variant="form"
                  size="lg"
                  value={(customFields[col.key] as string) ?? ""}
                  onChange={(val) => setCustomField(col.key, val)}
                  placeholder={`Seleccionar ${col.label}`}
                  options={[
                    { value: "", label: "—" },
                    ...(col.options ?? []).map((opt) => ({ value: opt, label: opt })),
                  ]}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSubmit}
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

  const ESTADO_FILTER_OPTIONS: { value: EstadoUnidad; label: string }[] = [
    { value: "disponible", label: "Disponible" },
    { value: "proximamente", label: "Próximamente" },
    { value: "separado", label: "Separado" },
    { value: "reservada", label: "Reservada" },
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
                    <span className={cn("w-2 h-2 rounded-full", UNIT_STATUS_COLORS[e.value].dot)} />
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
            {adjustType === "fixed" ? (
              <CurrencyInput
                value={adjustValue}
                onChange={setAdjustValue}
                currency={moneda}
                inputClassName={inputClass + " flex-1"}
                className="flex-1"
              />
            ) : (
              <input
                type="number"
                value={adjustValue}
                onChange={(e) => setAdjustValue(e.target.value)}
                placeholder="5"
                className={inputClass + " flex-1"}
              />
            )}
            <span className="text-sm text-[var(--text-tertiary)]">
              {adjustType === "percentage" ? "%" : ""}
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
                          <td className="py-1.5 px-3 text-right text-[var(--text-secondary)]">{formatCurrency(item.precio, moneda, {})}</td>
                          <td className="py-1.5 px-3 text-right text-white">{formatCurrency(newP, moneda, {})}</td>
                          <td className={cn("py-1.5 px-3 text-right", diff > 0 ? "text-green-400" : "text-red-400")}>
                            {diff > 0 ? "+" : ""}{formatCurrency(diff, moneda, {})}
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

// AIChatModal removed — now using InventoryAssistant component from @/components/dashboard/InventoryAssistant

// ---------------------------------------------------------------------------
// Column Setup Wizard (first-time setup)
// ---------------------------------------------------------------------------

function ColumnSetupWizard({
  tipoProyecto,
  onSave,
}: {
  tipoProyecto: "apartamentos" | "casas" | "hibrido" | "lotes";
  onSave: (config: InventoryColumnConfig) => Promise<void> | void;
}) {
  const { t } = useTranslation("editor");
  const [config, setConfig] = useState<InventoryColumnConfig>(
    () => getDefaultColumns(tipoProyecto)
  );
  const [saving, setSaving] = useState(false);

  const handleToggle = (key: keyof InventoryColumnConfig) => {
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(config);
    } finally {
      setSaving(false);
    }
  };

  const activeCount = Object.values(config).filter(Boolean).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 max-w-lg mx-auto"
    >
      <div className="p-3 bg-[rgba(var(--site-primary-rgb),0.1)] rounded-xl mb-5">
        <Settings size={24} className="text-[var(--site-primary)]" />
      </div>

      <h2 className="font-heading font-light text-2xl text-white mb-2 text-center">
        {t("inventario.setupWizard.title")}
      </h2>
      <p className="text-xs text-[var(--text-tertiary)] text-center mb-8 max-w-sm leading-relaxed">
        {t("inventario.setupWizard.description")}
      </p>

      <div className="w-full grid grid-cols-2 gap-2 mb-8">
        {INVENTORY_COLUMN_KEYS.map(({ key, labelKey }) => {
          const isOn = config[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleToggle(key)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all text-left text-xs",
                isOn
                  ? "bg-[rgba(var(--site-primary-rgb),0.08)] border-[rgba(var(--site-primary-rgb),0.3)] text-white"
                  : "bg-[var(--surface-1)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--border-default)]"
              )}
            >
              <div
                className={cn(
                  "w-4 h-4 rounded-[4px] border-2 flex items-center justify-center shrink-0 transition-all",
                  isOn
                    ? "bg-[var(--site-primary)] border-[var(--site-primary)]"
                    : "border-[var(--border-default)]"
                )}
              >
                {isOn && (
                  <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-black">
                    <path d="M2 6l3 3 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              {t(labelKey)}
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-[var(--text-muted)] mb-4">
        {activeCount} {t("inventario.setupWizard.columnsSelected")}
      </p>

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-warm px-8 py-2.5 text-xs font-ui font-bold uppercase tracking-[0.1em]"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : t("inventario.setupWizard.save")}
      </button>
    </motion.div>
  );
}

// Columns Config Modal
// ---------------------------------------------------------------------------

const CUSTOM_COL_TYPES = [
  { value: "text" as const, label: "Texto" },
  { value: "number" as const, label: "Número" },
  { value: "date" as const, label: "Fecha" },
  { value: "select" as const, label: "Selección" },
];

function ColumnsConfigModal({
  tipoProyecto,
  currentConfig,
  currentConfigMicrosite,
  customColumns,
  onSave,
  onSaveCustomColumns,
  onClose,
}: {
  tipoProyecto: "apartamentos" | "casas" | "hibrido" | "lotes";
  currentConfig: InventoryColumnConfig | null;
  currentConfigMicrosite: InventoryColumnConfig | null;
  customColumns: CustomColumnDef[];
  onSave: (config: InventoryColumnConfig | null, configMicrosite: InventoryColumnConfig | null) => void;
  onSaveCustomColumns: (cols: CustomColumnDef[]) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation("editor");
  const [activeTab, setActiveTab] = useState<"editor" | "microsite" | "custom">("editor");

  const [localConfig, setLocalConfig] = useState<InventoryColumnConfig>(
    () => getInventoryColumns(tipoProyecto, currentConfig)
  );
  const [localConfigMicrosite, setLocalConfigMicrosite] = useState<InventoryColumnConfig>(
    () => getInventoryColumns(tipoProyecto, currentConfigMicrosite)
  );
  const [localCustomCols, setLocalCustomCols] = useState<CustomColumnDef[]>(customColumns);

  // New column form
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<CustomColumnDef["type"]>("text");
  const [newOptions, setNewOptions] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const isCustom = currentConfig !== null;
  const isCustomMicrosite = currentConfigMicrosite !== null;

  const handleToggle = (key: keyof InventoryColumnConfig) => {
    if (activeTab === "editor") {
      setLocalConfig((prev) => ({ ...prev, [key]: !prev[key] }));
    } else {
      setLocalConfigMicrosite((prev) => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const handleReset = () => {
    if (activeTab === "editor") {
      setLocalConfig(getDefaultColumns(tipoProyecto));
      onSave(null, localConfigMicrosite);
    } else {
      setLocalConfigMicrosite(getDefaultColumns(tipoProyecto));
      onSave(localConfig, null);
    }
    onClose();
  };

  const handleApply = () => {
    onSave(localConfig, localConfigMicrosite);
    onSaveCustomColumns(localCustomCols);
    onClose();
  };

  const handleAddCustomCol = () => {
    if (!newLabel.trim()) return;
    const key = generateColumnKey(newLabel.trim());
    if (!key || localCustomCols.some((c) => c.key === key)) return;
    const col: CustomColumnDef = {
      id: crypto.randomUUID(),
      key,
      label: newLabel.trim(),
      type: newType,
      options: newType === "select" ? newOptions.split(",").map((o) => o.trim()).filter(Boolean) : undefined,
      show_in_editor: true,
      show_in_microsite: false,
      orden: localCustomCols.length,
    };
    setLocalCustomCols((prev) => [...prev, col]);
    setNewLabel("");
    setNewType("text");
    setNewOptions("");
    setShowAddForm(false);
  };

  const handleDeleteCustomCol = (id: string) => {
    setLocalCustomCols((prev) => prev.filter((c) => c.id !== id));
  };

  const handleToggleCustomColVisibility = (id: string, field: "show_in_editor" | "show_in_microsite") => {
    setLocalCustomCols((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: !c[field] } : c))
    );
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
        className="bg-[var(--surface-2)] border border-[var(--border-default)] rounded-2xl w-full max-w-lg shadow-2xl max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[rgba(var(--site-primary-rgb),0.1)] rounded-lg">
              <Settings size={18} className="text-[var(--site-primary)]" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">{t("general.project.columnsTitle")}</h3>
              <p className="text-[10px] text-[var(--text-tertiary)]">{t("general.project.columnsDescription")}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--surface-3)] rounded-lg transition-colors">
            <X size={16} className="text-[var(--text-tertiary)]" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 mx-6 mt-4 p-1 bg-[var(--surface-3)] rounded-lg">
          {([
            { id: "editor" as const, label: t("config.columns.tabs.editor") },
            { id: "microsite" as const, label: t("config.columns.tabs.microsite") },
            { id: "custom" as const, label: "Personalizadas" },
          ]).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 px-3 py-1.5 rounded-md transition-all font-ui text-[10px] font-bold uppercase tracking-[0.08em]",
                  isActive
                    ? "bg-[var(--site-primary)] text-[var(--surface-0)] shadow-sm"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab !== "custom" ? (
            <div className="grid grid-cols-2 gap-2">
              {INVENTORY_COLUMN_KEYS.map(({ key, labelKey }) => {
                const isOn = activeTab === "editor" ? localConfig[key] : localConfigMicrosite[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleToggle(key)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all text-left text-xs",
                      isOn
                        ? "bg-[rgba(var(--site-primary-rgb),0.08)] border-[rgba(var(--site-primary-rgb),0.3)] text-white"
                        : "bg-[var(--surface-1)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--border-default)]"
                    )}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded-[4px] border-2 flex items-center justify-center shrink-0 transition-all",
                        isOn
                          ? "bg-[var(--site-primary)] border-[var(--site-primary)]"
                          : "border-[var(--border-default)]"
                      )}
                    >
                      {isOn && (
                        <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-black">
                          <path d="M2 6l3 3 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    {t(labelKey)}
                  </button>
                );
              })}
            </div>
          ) : (
            /* Custom columns tab */
            <div className="space-y-3">
              {localCustomCols.length === 0 && !showAddForm && (
                <p className="text-xs text-[var(--text-muted)] text-center py-4">
                  No hay columnas personalizadas. Agrega una para empezar.
                </p>
              )}
              {localCustomCols.map((col) => (
                <div
                  key={col.id}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white font-medium truncate">{col.label}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {CUSTOM_COL_TYPES.find((ct) => ct.value === col.type)?.label ?? col.type}
                      {col.type === "select" && col.options?.length ? ` · ${col.options.join(", ")}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleCustomColVisibility(col.id, "show_in_editor")}
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all border",
                      col.show_in_editor
                        ? "bg-[rgba(var(--site-primary-rgb),0.1)] border-[rgba(var(--site-primary-rgb),0.3)] text-[var(--site-primary)]"
                        : "bg-transparent border-[var(--border-subtle)] text-[var(--text-muted)]"
                    )}
                    title="Mostrar en editor"
                  >
                    Editor
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleCustomColVisibility(col.id, "show_in_microsite")}
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all border",
                      col.show_in_microsite
                        ? "bg-[rgba(var(--site-primary-rgb),0.1)] border-[rgba(var(--site-primary-rgb),0.3)] text-[var(--site-primary)]"
                        : "bg-transparent border-[var(--border-subtle)] text-[var(--text-muted)]"
                    )}
                    title="Mostrar en micrositio"
                  >
                    Micro
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCustomCol(col.id)}
                    className="p-1 hover:bg-red-500/10 rounded transition-colors text-[var(--text-muted)] hover:text-red-400"
                    title="Eliminar columna"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}

              {/* Add form */}
              {showAddForm ? (
                <div className="p-3 rounded-lg bg-[var(--surface-3)] border border-[var(--border-default)] space-y-2.5">
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Nombre de la columna"
                    className={inputClass}
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    {CUSTOM_COL_TYPES.map((ct) => (
                      <button
                        key={ct.value}
                        type="button"
                        onClick={() => setNewType(ct.value)}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all border",
                          newType === ct.value
                            ? "bg-[rgba(var(--site-primary-rgb),0.15)] border-[var(--site-primary)] text-[var(--site-primary)]"
                            : "bg-[var(--surface-2)] border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:border-[var(--border-default)]"
                        )}
                      >
                        {ct.label}
                      </button>
                    ))}
                  </div>
                  {newType === "select" && (
                    <input
                      type="text"
                      value={newOptions}
                      onChange={(e) => setNewOptions(e.target.value)}
                      placeholder="Opciones separadas por coma: básico, premium, lujo"
                      className={inputClass}
                    />
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddCustomCol}
                      disabled={!newLabel.trim()}
                      className={btnPrimary}
                    >
                      <Plus size={12} />
                      Agregar
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddForm(false); setNewLabel(""); setNewType("text"); setNewOptions(""); }}
                      className={btnSecondary}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-1.5 w-full px-3 py-2 rounded-lg border border-dashed border-[var(--border-default)] text-xs text-[var(--text-tertiary)] hover:text-[var(--site-primary)] hover:border-[var(--site-primary)] transition-all"
                >
                  <Plus size={12} />
                  Agregar columna personalizada
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-[var(--border-subtle)]">
          {activeTab !== "custom" && (activeTab === "editor" ? isCustom : isCustomMicrosite) ? (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 text-[10px] text-[var(--text-tertiary)] hover:text-[var(--site-primary)] transition-colors"
            >
              <RotateCcw size={11} />
              {t("general.project.columnsReset")}
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-3">
            <button onClick={onClose} className={btnSecondary}>
              {t("inventario.cancel")}
            </button>
            <button onClick={handleApply} className={btnPrimary}>
              <Check size={14} />
              {t("inventario.save")}
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
  const { project, refresh, projectId, updateLocal } = useEditorProject();
  const { saveUnidad, saveEntity } = useBackgroundSave(projectId);
  const { t } = useTranslation("editor");
  const { t: tTooltips } = useTranslation("tooltips");
  const toast = useToast();
  const isMobile = useMediaQuery("(max-width: 767px)");

  // --- UI state ---
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTipologia, setFilterTipologia] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [filterEtapa, setFilterEtapa] = useState("");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkEstado, setBulkEstado] = useState<EstadoUnidad>("disponible");
  const [bulkTorreId, setBulkTorreId] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);

  // --- Form state ---
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const formLoading = false; // Forms close instantly with optimistic saves

  // --- Mobile ---
  const [showMobileActions, setShowMobileActions] = useState(false);

  // --- Modals ---
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPriceAdjust, setShowPriceAdjust] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
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
  const orientaciones: Orientacion[] = useMemo(() => project.orientaciones || [], [project.orientaciones]);
  const vistas: Vista[] = useMemo(() => project.vistas || [], [project.vistas]);
  const torres: Torre[] = useMemo(() => project.torres || [], [project.torres]);
  const isMultiTorre = torres.length > 1;

  // --- Multi-tipología / casas mode ---
  const tipologiaMode = project.tipologia_mode ?? "fija";
  const tipoProyecto = project.tipo_proyecto ?? "hibrido";
  const isMultiTipo = tipologiaMode === "multiple";
  const isTipologiaPricing = project.precio_source === "tipologia";
  const isCasas = tipoProyecto === "casas";
  const isLotes = tipoProyecto === "lotes";
  const isHibrido = tipoProyecto === "hibrido";

  // --- Tipo tabs (hybrid projects) ---
  const [activeTipoTab, setActiveTipoTab] = useState<TipoTipologia | null>(null);
  const showTipoTabs = isHibrido;

  const availableTipoTabs = useMemo(() => {
    if (!showTipoTabs) return [] as TipoTipologia[];
    const types = new Set(tipologias.map(t => t.tipo_tipologia).filter((v): v is TipoTipologia => !!v));
    return (["apartamento", "casa", "lote", "local_comercial"] as TipoTipologia[]).filter(tipo => types.has(tipo));
  }, [showTipoTabs, tipologias]);

  useEffect(() => {
    if (showTipoTabs && availableTipoTabs.length > 0 && !activeTipoTab) {
      setActiveTipoTab(availableTipoTabs[0]);
    }
  }, [showTipoTabs, availableTipoTabs, activeTipoTab]);

  // Tipología IDs matching the active tipo tab (for filtering)
  const tipoTabTipologiaIds = useMemo(() => {
    if (!showTipoTabs || !activeTipoTab) return null;
    return new Set(tipologias.filter(t => t.tipo_tipologia === activeTipoTab).map(t => t.id));
  }, [showTipoTabs, activeTipoTab, tipologias]);

  const isLoteBased = isHibrido
    ? (activeTipoTab === "casa" || activeTipoTab === "lote")
    : (isCasas || isLotes);

  const columns = useMemo(() => {
    if (showTipoTabs && activeTipoTab) {
      return resolveColumnsForTipologia(activeTipoTab, project.tipo_proyecto ?? "hibrido", project.inventory_columns, project.inventory_columns_by_type);
    }
    return getInventoryColumns(project.tipo_proyecto ?? "hibrido", project.inventory_columns);
  }, [showTipoTabs, activeTipoTab, project.tipo_proyecto, project.inventory_columns, project.inventory_columns_by_type]);
  const uniqueEtapas = useMemo(() => {
    if (!columns.etapa) return [];
    const set = new Set(
      unidades.map((u) => u.etapa_nombre).filter((e): e is string => !!e)
    );
    return [...set].sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
  }, [unidades, columns.etapa]);
  const unidadTipologias: UnidadTipologia[] = useMemo(() => project.unidad_tipologias ?? [], [project.unidad_tipologias]);

  const getUnitTipologias = useCallback((unitId: string) => {
    const tipoIds = unidadTipologias.filter(ut => ut.unidad_id === unitId).map(ut => ut.tipologia_id);
    return tipologias.filter(t => tipoIds.includes(t.id));
  }, [unidadTipologias, tipologias]);

  // --- Tipología required modal (for multi-tipo estado changes) ---
  const [tipologiaRequiredModal, setTipologiaRequiredModal] = useState<{
    unitId: string;
    newEstado: EstadoUnidad;
    availableTipos: Tipologia[];
  } | null>(null);

  // --- Bulk multi-tipología assignment ---
  const [bulkMultiTipoIds, setBulkMultiTipoIds] = useState<string[]>([]);
  const bulkMultiTipoLoading = false; // Optimistic — clears selection instantly

  // --- Complemento modes & counts ---
  const hasParqueaderos = (project.parqueaderos_mode as ComplementoMode) === "inventario_incluido" || (project.parqueaderos_mode as ComplementoMode) === "inventario_separado";
  const hasDepositos = (project.depositos_mode as ComplementoMode) === "inventario_incluido" || (project.depositos_mode as ComplementoMode) === "inventario_separado";
  const hasComplementos = hasParqueaderos || hasDepositos;
  const complementos = useMemo(() => (project.complementos || []) as Array<{ tipo: string }>, [project.complementos]);
  const parqCount = useMemo(() => complementos.filter((c) => c.tipo === "parqueadero").length, [complementos]);
  const depoCount = useMemo(() => complementos.filter((c) => c.tipo === "deposito").length, [complementos]);

  // --- Filtering (includes torre filter) ---
  const filteredUnidades = useMemo(() => {
    return unidades.filter((u) => {
      // Hybrid tipo tab filter
      if (tipoTabTipologiaIds && u.tipologia_id && !tipoTabTipologiaIds.has(u.tipologia_id)) return false;
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
      if (filterEtapa && u.etapa_nombre !== filterEtapa) return false;
      if (
        searchQuery &&
        !u.identificador.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
  }, [unidades, filterTipologia, filterEstado, filterEtapa, searchQuery, isMultiTorre, activeTorreId, tipoTabTipologiaIds]);

  // --- Sorting ---
  const toggleSort = useCallback((field: string) => {
    if (sortField === field) {
      // Same field, toggle direction
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      // New field, set it and reset to asc
      setSortField(field);
      setSortDir("asc");
    }
  }, [sortField]);

  const sortedUnidades = useMemo(() => {
    if (!sortField) return filteredUnidades;
    const ESTADO_ORDER: Record<string, number> = { disponible: 0, proximamente: 1, separado: 2, reservada: 3, vendida: 4 };
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filteredUnidades].sort((a, b) => {
      let va: string | number | null = null;
      let vb: string | number | null = null;
      switch (sortField) {
        case "identificador": va = a.identificador; vb = b.identificador; break;
        case "tipologia": {
          const ta = tipologias.find(t => t.id === a.tipologia_id);
          const tb = tipologias.find(t => t.id === b.tipologia_id);
          va = ta?.nombre ?? ""; vb = tb?.nombre ?? ""; break;
        }
        case "piso": va = a.piso ?? ""; vb = b.piso ?? ""; break;
        case "lote": va = a.lote ?? ""; vb = b.lote ?? ""; break;
        case "etapa": va = a.etapa_nombre ?? ""; vb = b.etapa_nombre ?? ""; break;
        case "area_m2": va = a.area_m2 ?? 0; vb = b.area_m2 ?? 0; break;
        case "area_construida": va = a.area_construida ?? 0; vb = b.area_construida ?? 0; break;
        case "area_privada": va = a.area_privada ?? 0; vb = b.area_privada ?? 0; break;
        case "area_lote": va = a.area_lote ?? 0; vb = b.area_lote ?? 0; break;
        case "precio": va = a.precio ?? 0; vb = b.precio ?? 0; break;
        case "estado": va = ESTADO_ORDER[a.estado] ?? 99; vb = ESTADO_ORDER[b.estado] ?? 99; break;
        case "habitaciones": va = a.habitaciones ?? 0; vb = b.habitaciones ?? 0; break;
        case "banos": va = a.banos ?? 0; vb = b.banos ?? 0; break;
        case "parqueaderos": va = a.parqueaderos ?? 0; vb = b.parqueaderos ?? 0; break;
        case "depositos": va = a.depositos ?? 0; vb = b.depositos ?? 0; break;
        default:
          // Handle custom columns: sortField = "custom_<key>"
          if (sortField.startsWith("custom_")) {
            const cfKey = sortField.slice(7);
            const cfa = (a.custom_fields as Record<string, unknown> | undefined)?.[cfKey];
            const cfb = (b.custom_fields as Record<string, unknown> | undefined)?.[cfKey];
            va = (cfa as string | number) ?? null;
            vb = (cfb as string | number) ?? null;
            break;
          }
          return 0;
      }
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      // Natural sort for identifiers (e.g. "1", "3", "10")
      const na = Number(va), nb = Number(vb);
      if (!isNaN(na) && !isNaN(nb)) return (na - nb) * dir;
      return String(va).localeCompare(String(vb), "es", { numeric: true }) * dir;
    });
  }, [filteredUnidades, sortField, sortDir, tipologias]);

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
    (data: UnitFormData & { available_tipologia_ids?: string[]; custom_fields?: Record<string, unknown> }) => {
      const payload: Record<string, unknown> = {
        proyecto_id: projectId,
        identificador: data.identificador,
        tipologia_id: data.tipologia_id || null,
        piso: data.piso ? parseInt(data.piso) : null,
        lote: data.lote || null,
        etapa_nombre: data.etapa_nombre || null,
        area_m2: data.area_m2 ? parseFloat(data.area_m2) : null,
        area_construida: data.area_construida ? parseFloat(data.area_construida) : null,
        area_privada: data.area_privada ? parseFloat(data.area_privada) : null,
        area_lote: data.area_lote ? parseFloat(data.area_lote) : null,
        precio: data.precio ? parseFloat(data.precio) : null,
        estado: data.estado,
        habitaciones: data.habitaciones ? parseInt(data.habitaciones) : null,
        banos: data.banos ? parseInt(data.banos) : null,
        parqueaderos: data.parqueaderos ? parseInt(data.parqueaderos) : null,
        depositos: data.depositos ? parseInt(data.depositos) : null,
        orientacion_id: data.orientacion_id || null,
        vista_id: data.vista_id || null,
        notas: data.notas || null,
        plano_url: data.plano_url || null,
        fachada_id: data.fachada_id || null,
        torre_id: isMultiTorre && activeTorreId && activeTorreId !== "__none__" ? activeTorreId : null,
      };
      if (data.available_tipologia_ids !== undefined) {
        payload.available_tipologia_ids = data.available_tipologia_ids;
      }
      if (data.custom_fields && Object.keys(data.custom_fields).length > 0) {
        payload.custom_fields = data.custom_fields;
      }

      // Close form immediately — fire-and-forget
      setShowCreateForm(false);

      fetch("/api/unidades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("Error creating unit");
          refresh().catch(() => {});
        })
        .catch(() => {
          toast.error(t("inventario.createUnitError"));
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toast is stable
    [projectId, refresh, isMultiTorre, activeTorreId]
  );

  const handleUpdate = useCallback(
    (id: string, data: UnitFormData & { available_tipologia_ids?: string[]; custom_fields?: Record<string, unknown> }) => {
      const currentUnit = unidades.find((u) => u.id === id);
      const payload: Record<string, unknown> = {
        identificador: data.identificador,
        tipologia_id: data.tipologia_id || null,
        piso: data.piso ? parseInt(data.piso) : null,
        lote: data.lote || null,
        etapa_nombre: data.etapa_nombre || null,
        area_m2: data.area_m2 ? parseFloat(data.area_m2) : null,
        area_construida: data.area_construida ? parseFloat(data.area_construida) : null,
        area_privada: data.area_privada ? parseFloat(data.area_privada) : null,
        area_lote: data.area_lote ? parseFloat(data.area_lote) : null,
        precio: data.precio ? parseFloat(data.precio) : null,
        habitaciones: data.habitaciones ? parseInt(data.habitaciones) : null,
        banos: data.banos ? parseInt(data.banos) : null,
        parqueaderos: data.parqueaderos ? parseInt(data.parqueaderos) : null,
        depositos: data.depositos ? parseInt(data.depositos) : null,
        orientacion_id: data.orientacion_id || null,
        vista_id: data.vista_id || null,
        notas: data.notas || null,
        plano_url: data.plano_url || null,
        fachada_id: data.fachada_id || null,
      };
      // Only send estado if it actually changed
      if (data.estado !== currentUnit?.estado) {
        payload.estado = data.estado;
      }
      // Include precio_venta only for vendida units (negotiated price)
      if (data.estado === "vendida" && data.precio_venta) {
        payload.precio_venta = parseFloat(data.precio_venta);
      }
      if (data.available_tipologia_ids !== undefined) {
        payload.available_tipologia_ids = data.available_tipologia_ids;
      }
      if (data.custom_fields) {
        payload.custom_fields = data.custom_fields;
      }

      // Optimistic update — close form and update cache immediately
      setEditingId(null);
      saveUnidad({
        unidadId: id,
        payload,
        optimisticUpdate: (prev) => ({
          ...prev,
          unidades: prev.unidades.map((u) =>
            u.id === id
              ? {
                  ...u,
                  ...payload,
                  // Ensure numeric fields are properly typed
                  area_m2: payload.area_m2 as number | null,
                  precio: payload.precio as number | null,
                  precio_venta: payload.precio_venta as number | null ?? u.precio_venta,
                }
              : u
          ),
        }),
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toast is stable
    [unidades, saveUnidad]
  );

  const handleDelete = useCallback(
    (id: string) => {
      setDeleteConfirm(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      saveEntity({
        url: `/api/unidades/${id}`,
        method: "DELETE",
        optimisticUpdate: (prev) => ({
          ...prev,
          unidades: prev.unidades.filter((u) => u.id !== id),
        }),
      });
    },
    [saveEntity]
  );

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return;
    const idsToDelete = new Set(selectedIds);
    setBulkDeleteConfirm(false);
    setSelectedIds(new Set());
    toast.success(t("inventario.bulkDeleteSuccess", { count: idsToDelete.size }));
    saveEntity({
      url: "/api/unidades/bulk",
      method: "DELETE",
      payload: { ids: Array.from(idsToDelete), proyecto_id: projectId },
      optimisticUpdate: (prev) => ({
        ...prev,
        unidades: prev.unidades.filter((u) => !idsToDelete.has(u.id)),
      }),
    });
  }, [selectedIds, projectId, toast, saveEntity]);

  // Check if units have complementos assigned (for warning dialog)
  const parqMode = project.parqueaderos_mode as ComplementoMode;
  const depoMode = project.depositos_mode as ComplementoMode;
  const parqInventory = parqMode === "inventario_incluido" || parqMode === "inventario_separado";
  const depoInventory = depoMode === "inventario_incluido" || depoMode === "inventario_separado";
  const hasInventoryModes = parqInventory || depoInventory;

  const [vendidaWarningMessage, setVendidaWarningMessage] = useState<string>("");

  const checkComplementosBeforeEstado = useCallback(
    (unitIds: string[], newEstado: string, proceed: () => void) => {
      if (!hasInventoryModes || newEstado !== "vendida") {
        proceed();
        return;
      }
      const allComplementos = project.complementos || [];
      const missingParts: string[] = [];

      for (const uid of unitIds) {
        const unit = unidades.find((u) => u.id === uid);
        if (!unit) continue;
        const tip = tipologias.find((t) => t.id === unit.tipologia_id);
        const expectedParq = unit.parqueaderos ?? tip?.parqueaderos ?? 0;
        const expectedDepo = unit.depositos ?? tip?.depositos ?? 0;
        const assigned = allComplementos.filter((c) => c.unidad_id === uid);
        const assignedParq = assigned.filter((c) => c.tipo === "parqueadero").length;
        const assignedDepo = assigned.filter((c) => c.tipo === "deposito").length;

        if (parqInventory && assignedParq < expectedParq) {
          const diff = expectedParq - assignedParq;
          missingParts.push(`${unit.identificador}: faltan ${diff} parqueadero(s)`);
        }
        if (depoInventory && assignedDepo < expectedDepo) {
          const diff = expectedDepo - assignedDepo;
          missingParts.push(`${unit.identificador}: faltan ${diff} depósito(s)`);
        }
      }

      if (missingParts.length > 0) {
        setVendidaWarningMessage(missingParts.join("\n"));
        setVendidaWarning({ callback: proceed });
      } else {
        proceed();
      }
    },
    [hasInventoryModes, parqInventory, depoInventory, project.complementos, unidades, tipologias]
  );

  const handleBulkStatusChange = useCallback(() => {
    if (selectedIds.size === 0) return;
    // Multi-tipo: check if any selected unit lacks a confirmed tipología when changing to a committed state
    if (isMultiTipo && ["separado", "reservada", "vendida"].includes(bulkEstado)) {
      const unitsWithoutTipo = Array.from(selectedIds)
        .map(id => unidades.find(u => u.id === id))
        .filter((u): u is Unidad => !!u && !u.tipologia_id);
      if (unitsWithoutTipo.length > 0) {
        toast.error(t("inventario.unitsWithoutTypology", { count: unitsWithoutTipo.length, estado: bulkEstado }));
        return;
      }
    }
    const doBulk = () => {
      const ids = Array.from(selectedIds);
      // Optimistic: update all units immediately
      updateLocal((prev) => ({
        ...prev,
        unidades: prev.unidades.map((u) =>
          ids.includes(u.id) ? { ...u, estado: bulkEstado } : u
        ),
      }));
      setSelectedIds(new Set());
      // Fire API calls in background
      saveEntity({
        url: `/api/unidades/bulk-update`,
        method: "PUT",
        payload: {
          proyecto_id: projectId,
          changes: ids.map((uid) => ({ id: uid, updates: { estado: bulkEstado } })),
        },
        optimisticUpdate: (prev) => prev, // Already applied above
      });
    };
    checkComplementosBeforeEstado(Array.from(selectedIds), bulkEstado, doBulk);
  }, [selectedIds, bulkEstado, toast, checkComplementosBeforeEstado, isMultiTipo, unidades, updateLocal, saveEntity, projectId]);

  const handleBulkTorreChange = useCallback(() => {
    if (selectedIds.size === 0 || !bulkTorreId) return;
    const newTorreId = bulkTorreId === "__none__" ? null : bulkTorreId;
    const ids = Array.from(selectedIds);
    // Optimistic update
    updateLocal((prev) => ({
      ...prev,
      unidades: prev.unidades.map((u) =>
        ids.includes(u.id) ? { ...u, torre_id: newTorreId } : u
      ),
    }));
    setSelectedIds(new Set());
    // Fire in background
    saveEntity({
      url: `/api/unidades/bulk-update`,
      method: "PUT",
      payload: {
        proyecto_id: projectId,
        changes: ids.map((id) => ({ id, updates: { torre_id: newTorreId } })),
      },
      optimisticUpdate: (prev) => prev,
    });
  }, [selectedIds, bulkTorreId, updateLocal, saveEntity, projectId]);

  const handleInlineUpdate = useCallback(
    (unitId: string, field: string, value: string | null) => {
      // Optimistic local update for immediate UI feedback
      const parsedValue = field === "precio_venta" ? (value ? parseFloat(value) : null) : value;
      if (field !== "estado") {
        updateLocal((prev) => ({
          ...prev,
          unidades: prev.unidades.map((u) =>
            u.id === unitId ? { ...u, [field]: parsedValue } : u
          ),
        }));
      }
      const doUpdate = () => {
        saveUnidad({
          unidadId: unitId,
          payload: { [field]: field === "precio_venta" ? parsedValue : value },
          optimisticUpdate: (prev) => ({
            ...prev,
            unidades: prev.unidades.map((u) =>
              u.id === unitId ? { ...u, [field]: parsedValue } : u
            ),
          }),
        });
      };
      if (field === "estado" && value && isMultiTipo) {
        const needsConfirmation = ["separado", "reservada", "vendida"].includes(value);
        const unit = unidades.find(u => u.id === unitId);
        if (needsConfirmation && unit && !unit.tipologia_id) {
          const tipos = getUnitTipologias(unitId);
          setTipologiaRequiredModal({
            unitId,
            newEstado: value as EstadoUnidad,
            availableTipos: tipos.length > 0 ? tipos : tipologias,
          });
          return;
        }
      }
      if (field === "estado" && value) {
        // For estado changes, optimistic update happens inside the complementos check callback
        checkComplementosBeforeEstado([unitId], value, () => {
          updateLocal((prev) => ({
            ...prev,
            unidades: prev.unidades.map((u) =>
              u.id === unitId ? { ...u, estado: value as EstadoUnidad } : u
            ),
          }));
          doUpdate();
        });
      } else {
        doUpdate();
      }
    },
    [toast, checkComplementosBeforeEstado, isMultiTipo, unidades, getUnitTipologias, tipologias, updateLocal, saveUnidad]
  );

  const handleBulkTipologiaChange = useCallback(async () => {
    if (selectedIds.size === 0 || !bulkTipologiaId) return;
    // Filter out committed units
    const eligibleIds = Array.from(selectedIds).filter(id => {
      const u = unidades.find(un => un.id === id);
      return u && !["vendida", "reservada", "separado"].includes(u.estado);
    });
    if (eligibleIds.length === 0) {
      toast.error(t("inventario.cannotModifyTypology"));
      return;
    }
    const newTipId = bulkTipologiaId === "__none__" ? null : bulkTipologiaId;
    // Optimistic update
    updateLocal((prev) => ({
      ...prev,
      unidades: prev.unidades.map((u) =>
        eligibleIds.includes(u.id) ? { ...u, tipologia_id: newTipId } : u
      ),
    }));
    setSelectedIds(new Set());
    saveEntity({
      url: `/api/unidades/bulk-update`,
      method: "PUT",
      payload: {
        proyecto_id: projectId,
        changes: eligibleIds.map((id) => ({ id, updates: { tipologia_id: newTipId } })),
      },
      optimisticUpdate: (prev) => prev,
    });
  }, [selectedIds, bulkTipologiaId, toast, unidades, updateLocal, saveEntity, projectId]);

  const handleBulkFachadaChange = useCallback(() => {
    if (selectedIds.size === 0 || !bulkFachadaId) return;
    const newFacId = bulkFachadaId === "__none__" ? null : bulkFachadaId;
    const ids = Array.from(selectedIds);
    // Optimistic update
    updateLocal((prev) => ({
      ...prev,
      unidades: prev.unidades.map((u) =>
        ids.includes(u.id) ? { ...u, fachada_id: newFacId } : u
      ),
    }));
    setSelectedIds(new Set());
    saveEntity({
      url: `/api/unidades/bulk-update`,
      method: "PUT",
      payload: {
        proyecto_id: projectId,
        changes: ids.map((id) => ({ id, updates: { fachada_id: newFacId } })),
      },
      optimisticUpdate: (prev) => prev,
    });
  }, [selectedIds, bulkFachadaId, updateLocal, saveEntity, projectId]);

  const handleImportDone = useCallback(async () => {
    setShowImportModal(false);
    try {
      await refresh();
    } catch { /* ignore */ }
  }, [refresh]);

  // Save inventory column config
  const handleSaveColumns = useCallback((config: InventoryColumnConfig | null, configMicrosite: InventoryColumnConfig | null) => {
    saveEntity({
      url: `/api/proyectos/${projectId}`,
      payload: {
        inventory_columns: config,
        inventory_columns_microsite: configMicrosite,
      },
      optimisticUpdate: (prev) => ({
        ...prev,
        inventory_columns: config,
        inventory_columns_microsite: configMicrosite,
      }),
    });
  }, [projectId, saveEntity]);

  // Save custom columns config
  const handleSaveCustomColumns = useCallback((cols: CustomColumnDef[]) => {
    saveEntity({
      url: `/api/proyectos/${projectId}`,
      payload: { custom_columns: cols },
      optimisticUpdate: (prev) => ({
        ...prev,
        custom_columns: cols,
      }),
    });
  }, [projectId, saveEntity]);

  // Visible custom columns for the editor
  const editorCustomCols = useMemo(
    () => getVisibleCustomColumns(project.custom_columns, "editor"),
    [project.custom_columns]
  );

  // Inline update for custom fields
  const handleInlineCustomFieldUpdate = useCallback(
    (unitId: string, key: string, value: unknown) => {
      const unit = unidades.find((u) => u.id === unitId);
      const existing = (unit?.custom_fields as Record<string, unknown>) ?? {};
      const merged = { ...existing, [key]: value };
      saveUnidad({
        unidadId: unitId,
        payload: { custom_fields: merged },
        optimisticUpdate: (prev) => ({
          ...prev,
          unidades: prev.unidades.map((u) =>
            u.id === unitId ? { ...u, custom_fields: merged } : u
          ),
        }),
      });
    },
    [unidades, saveUnidad]
  );

  // Toggle a single tipología on/off for a unit (multi-tipo mode)
  const handleToggleUnitTipo = useCallback((unitId: string, tipoId: string, add: boolean) => {
    // Block changes on committed units (vendida, reservada, separado)
    const targetUnit = unidades.find(u => u.id === unitId);
    if (targetUnit && ["vendida", "reservada", "separado"].includes(targetUnit.estado)) return;
    // Optimistic update
    updateLocal((prev) => {
      const existingUT = prev.unidad_tipologias ?? [];
      const newUT = add
        ? [...existingUT, { id: crypto.randomUUID(), proyecto_id: projectId, unidad_id: unitId, tipologia_id: tipoId, created_at: new Date().toISOString() }]
        : existingUT.filter((ut) => !(ut.unidad_id === unitId && ut.tipologia_id === tipoId));
      // If removing the confirmed tipología, clear it
      const newUnidades = !add
        ? prev.unidades.map((u) => u.id === unitId && u.tipologia_id === tipoId ? { ...u, tipologia_id: null } : u)
        : prev.unidades;
      return { ...prev, unidad_tipologias: newUT, unidades: newUnidades };
    });
    // Fire-and-forget API calls
    const exec = async () => {
      if (add) {
        await fetch("/api/unidad-tipologias", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ proyecto_id: projectId, unidad_ids: [unitId], tipologia_ids: [tipoId] }),
        });
      } else {
        await fetch("/api/unidad-tipologias", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ proyecto_id: projectId, unidad_ids: [unitId], tipologia_ids: [tipoId] }),
        });
        // If we removed the confirmed tipología, clear it
        const unit = unidades.find((u) => u.id === unitId);
        if (unit?.tipologia_id === tipoId) {
          await fetch(`/api/unidades/${unitId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tipologia_id: null }),
          });
        }
      }
      refresh().catch(() => {});
    };
    exec().catch(() => toast.error(t("inventario.updateTypologyError")));
  }, [projectId, unidades, updateLocal, refresh, toast]);

  // Handle confirming tipología in the required modal (multi-tipo mode)
  const handleTipologiaRequiredConfirm = useCallback((tipoId: string) => {
    if (!tipologiaRequiredModal) return;
    const { unitId, newEstado } = tipologiaRequiredModal;
    // Optimistic update + close modal immediately
    updateLocal((prev) => ({
      ...prev,
      unidades: prev.unidades.map((u) =>
        u.id === unitId ? { ...u, tipologia_id: tipoId, estado: newEstado } : u
      ),
    }));
    setTipologiaRequiredModal(null);
    // Fire-and-forget: set tipología then estado
    (async () => {
      await fetch(`/api/unidades/${unitId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipologia_id: tipoId }),
      });
      await fetch(`/api/unidades/${unitId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: newEstado }),
      });
      refresh().catch(() => {});
    })().catch(() => toast.error(t("inventario.confirmTypologyError")));
  }, [tipologiaRequiredModal, updateLocal, refresh, toast]);

  // Bulk assign tipologías in multi-tipo mode
  const handleBulkMultiTipoAssign = useCallback(() => {
    if (selectedIds.size === 0 || bulkMultiTipoIds.length === 0) return;
    // Filter out committed units (vendida, reservada, separado)
    const eligibleIds = Array.from(selectedIds).filter(id => {
      const u = unidades.find(un => un.id === id);
      return u && !["vendida", "reservada", "separado"].includes(u.estado);
    });
    if (eligibleIds.length === 0) {
      toast.error(t("inventario.cannotModifyTypology"));
      return;
    }
    // Optimistic: add new unidad_tipologias entries and clear selection
    const newEntries = eligibleIds.flatMap((uid) =>
      bulkMultiTipoIds.map((tid) => ({
        id: crypto.randomUUID(),
        proyecto_id: projectId,
        unidad_id: uid,
        tipologia_id: tid,
        created_at: new Date().toISOString(),
      }))
    );
    updateLocal((prev) => {
      const existing = prev.unidad_tipologias ?? [];
      // Avoid duplicates
      const existingKeys = new Set(existing.map((ut) => `${ut.unidad_id}:${ut.tipologia_id}`));
      const toAdd = newEntries.filter((e) => !existingKeys.has(`${e.unidad_id}:${e.tipologia_id}`));
      return { ...prev, unidad_tipologias: [...existing, ...toAdd] };
    });
    setBulkMultiTipoIds([]);
    setSelectedIds(new Set());
    // Fire-and-forget
    fetch("/api/unidad-tipologias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        proyecto_id: projectId,
        unidad_ids: eligibleIds,
        tipologia_ids: bulkMultiTipoIds,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error assigning tipologías");
        refresh().catch(() => {});
      })
      .catch(() => toast.error(t("inventario.assignTypologyError")));
  }, [selectedIds, bulkMultiTipoIds, projectId, updateLocal, refresh, toast, unidades]);

  // --- Build edit form initial data ---
  const getEditFormData = (u: Unidad): UnitFormData => ({
    identificador: u.identificador,
    tipologia_id: u.tipologia_id || "",
    fachada_id: u.fachada_id || "",
    piso: u.piso != null ? String(u.piso) : "",
    lote: u.lote || "",
    etapa_nombre: u.etapa_nombre || "",
    area_m2: u.area_m2 != null ? String(u.area_m2) : "",
    area_construida: u.area_construida != null ? String(u.area_construida) : "",
    area_privada: u.area_privada != null ? String(u.area_privada) : "",
    area_lote: u.area_lote != null ? String(u.area_lote) : "",
    precio: u.precio != null ? String(u.precio) : "",
    estado: u.estado,
    habitaciones: u.habitaciones != null ? String(u.habitaciones) : "",
    banos: u.banos != null ? String(u.banos) : "",
    parqueaderos: u.parqueaderos != null ? String(u.parqueaderos) : "",
    depositos: u.depositos != null ? String(u.depositos) : "",
    orientacion_id: u.orientacion_id || "",
    vista_id: u.vista_id || "",
    notas: u.notas || "",
    plano_url: u.plano_url || "",
    precio_venta: u.precio_venta != null ? String(u.precio_venta) : "",
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
    const s = { disponible: 0, proximamente: 0, separado: 0, reservada: 0, vendida: 0 };
    for (const u of statsUnidades) {
      s[u.estado]++;
    }
    return s;
  }, [statsUnidades]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Standardized header */}
      <PageHeader
        icon={Package}
        title={t("inventario.title")}
        description={<>{t("inventario.description")} <InfoTooltip content={tTooltips("inventario.concepto.short")} variant="dashboard" /></>}
        className="mb-0"
        actions={
          <div className="flex items-center gap-2">
          {!isMobile && (
            <>
              <button
                onClick={() => {
                  setShowCreateForm(true);
                  setEditingId(null);
                }}
                className={btnPrimary}
              >
                <Plus size={14} />
                {t("inventario.newUnit")}
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className={btnSecondary}
              >
                <Upload size={14} />
                {t("inventario.import")}
              </button>
              <button
                onClick={() => setShowAIChat(true)}
                className={btnPrimary}
              >
                <Sparkles size={14} />
                {t("inventario.aiChat")}
              </button>
              <button
                onClick={() => setShowColumnsModal(true)}
                className={btnSecondary}
                title={t("general.project.columnsTitle")}
              >
                <Settings size={14} />
              </button>
            </>
          )}
          {isMobile && (
            <>
              <button
                onClick={() => setShowAIChat(true)}
                className={btnPrimary}
              >
                <Sparkles size={14} />
              </button>
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
                      className="absolute right-0 top-full mt-1 w-52 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-xl shadow-2xl z-20 overflow-hidden"
                    >
                      <button onClick={() => { setShowImportModal(true); setShowMobileActions(false); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-3)] transition-colors">
                        <Upload size={13} className="text-[var(--site-primary)]" /> {t("inventario.import")}
                      </button>
                      {!isTipologiaPricing && (
                        <button onClick={() => { setShowPriceAdjust(true); setShowMobileActions(false); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-3)] transition-colors">
                          <TrendingUp size={13} className="text-[var(--site-primary)]" /> {t("inventario.priceAdjust")}
                        </button>
                      )}
                      <div className="border-t border-[var(--border-subtle)]" />
                      <button onClick={() => { setShowColumnsModal(true); setShowMobileActions(false); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-3)] transition-colors">
                        <Settings size={13} className="text-[var(--site-primary)]" /> {t("general.project.columnsTitle")}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
        }
      />

      {/* Column setup wizard — shown on first visit when no columns configured */}
      {project.inventory_columns === null && unidades.length === 0 ? (
        <ColumnSetupWizard
          tipoProyecto={tipoProyecto}
          onSave={async (config) => {
            try {
              const res = await fetch(`/api/proyectos/${projectId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ inventory_columns: config }),
              });
              if (res.ok) await refresh();
            } catch { /* ignore */ }
          }}
        />
      ) : (<>

      {/* Tipo tabs — shown for hybrid projects or when commercial tipologías exist */}
      {showTipoTabs && availableTipoTabs.length > 1 && (
        <div className="flex items-center gap-1 p-1 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)]">
          {availableTipoTabs.map((tipo) => {
            const Icon = tipo === "apartamento" ? Building2 : tipo === "casa" ? Home : tipo === "local_comercial" ? Store : MapPin;
            const label = tipo === "apartamento" ? t("inventario.tabApartamentos") : tipo === "casa" ? t("inventario.tabCasas") : tipo === "local_comercial" ? t("inventario.tabLocales") : t("inventario.tabLotes");
            const count = unidades.filter(u => {
              if (!u.tipologia_id) return false;
              return tipologias.some(t => t.id === u.tipologia_id && t.tipo_tipologia === tipo);
            }).length;
            return (
              <button
                key={tipo}
                onClick={() => setActiveTipoTab(tipo)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                  activeTipoTab === tipo
                    ? "bg-[rgba(var(--site-primary-rgb),0.12)] text-[var(--site-primary)] shadow-sm"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                )}
              >
                <Icon size={15} />
                {label}
                <span className="text-[11px] text-[var(--text-muted)]">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Inventory type tabs — shown when complemento modes are enabled */}
      {hasComplementos && (
        <div className="flex items-center gap-1 p-1 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)]">
          <button
            onClick={() => setActiveInventoryTab("unidades")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
              activeInventoryTab === "unidades"
                ? "bg-[var(--surface-3)] text-white shadow-sm"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
            )}
          >
            <Package size={15} />
            {t("inventario.title")}
            <span className="text-[11px] text-[var(--text-muted)]">{unidades.length}</span>
          </button>
          {hasParqueaderos && (
            <button
              onClick={() => setActiveInventoryTab("parqueadero")}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                activeInventoryTab === "parqueadero"
                  ? "bg-[var(--surface-3)] text-white shadow-sm"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
              )}
            >
              <Car size={15} />
              Parqueaderos
              <span className="text-[11px] text-[var(--text-muted)]">{parqCount}</span>
            </button>
          )}
          {hasDepositos && (
            <button
              onClick={() => setActiveInventoryTab("deposito")}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                activeInventoryTab === "deposito"
                  ? "bg-[var(--surface-3)] text-white shadow-sm"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
              )}
            >
              <Warehouse size={15} />
              Depósitos
              <span className="text-[11px] text-[var(--text-muted)]">{depoCount}</span>
            </button>
          )}
        </div>
      )}

      {/* Unidades content — only shown when unidades tab is active */}
      {activeInventoryTab === "unidades" && (<>

      {/* Torre tabs + Filters — single row */}
      <div className="flex items-center gap-3 flex-wrap">
        {isMultiTorre && (
          <div className="flex items-center gap-1 p-1 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] overflow-x-auto scrollbar-thin shrink-0">
            <button
              onClick={() => setActiveTorreId(null)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0",
                activeTorreId === null
                  ? "bg-[var(--surface-3)] text-white shadow-sm"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
              )}
            >
              {t("inventario.all")}
              <span className="text-[11px] text-[var(--text-muted)]">{unidades.length}</span>
            </button>
            {torres.map((torre) => {
              const count = unidades.filter((u) => u.torre_id === torre.id).length;
              return (
                <button
                  key={torre.id}
                  onClick={() => setActiveTorreId(torre.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0",
                    activeTorreId === torre.id
                      ? "bg-[var(--surface-3)] text-white shadow-sm"
                      : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                  )}
                >
                  {torre.nombre}
                  <span className="text-[11px] text-[var(--text-muted)]">{count}</span>
                </button>
              );
            })}
            {unidades.some((u) => !u.torre_id) && (
              <button
                onClick={() => setActiveTorreId("__none__")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0",
                  activeTorreId === "__none__"
                    ? "bg-[var(--surface-3)] text-white shadow-sm"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                )}
              >
                {t("inventario.noTower")}
                <span className="text-[11px] text-[var(--text-muted)]">
                  {unidades.filter((u) => !u.torre_id).length}
                </span>
              </button>
            )}
          </div>
        )}

        <div className={cn("flex items-center gap-2.5", !isMultiTorre && "flex-1")}>
          <div className="relative flex-1 min-w-0 sm:min-w-[200px] sm:max-w-[280px]">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("inventario.searchPlaceholder")}
              className={inputClass + " pl-10 py-2 text-sm"}
            />
          </div>
          <NodDoDropdown
            variant="dashboard"
            size="sm"
            value={filterTipologia}
            onChange={(val) => setFilterTipologia(val)}
            options={[
              { value: "", label: t("inventario.allTypologies") },
              ...(tipoTabTipologiaIds
                ? tipologias.filter(tp => tipoTabTipologiaIds.has(tp.id))
                : tipologias
              ).map((tp) => ({ value: tp.id, label: tp.nombre })),
            ]}
            className="w-44"
          />
          <NodDoDropdown
            variant="dashboard"
            size="sm"
            value={filterEstado}
            onChange={(val) => setFilterEstado(val)}
            options={[
              { value: "", label: t("inventario.allStates") },
              ...ESTADOS.map((e) => ({ value: e.value, label: e.label, metadata: { dot: UNIT_STATUS_COLORS[e.value].dot } })),
            ]}
            renderOption={(option) => (
              <span className="flex items-center gap-1.5">
                {option.metadata?.dot ? (
                  <span className={cn("w-2 h-2 rounded-full", option.metadata.dot as string)} />
                ) : null}
                <span>{option.label}</span>
              </span>
            )}
            renderSelected={(option) => (
              <span className="flex items-center gap-1.5">
                {option.metadata?.dot ? (
                  <span className={cn("w-2 h-2 rounded-full", option.metadata.dot as string)} />
                ) : null}
                <span>{option.label}</span>
              </span>
            )}
            className="w-40"
          />
          {columns.etapa && uniqueEtapas.length > 1 && (
            <NodDoDropdown
              variant="dashboard"
              size="sm"
              value={filterEtapa}
              onChange={(val) => setFilterEtapa(val)}
              options={[
                { value: "", label: t("inventario.allEtapas") },
                ...uniqueEtapas.map((e) => ({ value: e, label: e })),
              ]}
              className="w-40"
            />
          )}
        </div>

        {/* Stats pills - moved to right side */}
        <div className="hidden lg:flex items-center gap-2 ml-auto">
          {ESTADOS.map((e) => (
            <div
              key={e.value}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]"
            >
              <span className={cn("w-2 h-2 rounded-full shrink-0", UNIT_STATUS_COLORS[e.value].dot)} />
              <span className="text-[11px] text-[var(--text-tertiary)]">{e.label}</span>
              <span className="text-xs font-medium text-white tabular-nums">{stats[e.value]}</span>
            </div>
          ))}
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
            orientaciones={orientaciones}
            vistas={vistas}
            onSubmit={handleCreate}
            onCancel={() => setShowCreateForm(false)}
            submitting={formLoading}
            currency={(project?.moneda_base as Currency) || "COP"}
            columns={columns}
            projectId={projectId}
            isLoteBased={isLoteBased}
            isMultiTipo={isMultiTipo}
            isTipologiaPricing={isTipologiaPricing}
            existingEtapas={uniqueEtapas}
            customColumns={editorCustomCols}
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
                <NodDoDropdown
                  variant="dashboard"
                  size="sm"
                  value={bulkEstado}
                  onChange={(val) => setBulkEstado(val as EstadoUnidad)}
                  options={ESTADOS.map((e) => ({ value: e.value, label: e.label }))}
                  className="w-36"
                />
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
                    <NodDoDropdown
                      variant="dashboard"
                      size="sm"
                      value={bulkTorreId}
                      onChange={(val) => setBulkTorreId(val)}
                      placeholder={t("inventario.selectTower")}
                      options={[
                        { value: "", label: t("inventario.selectTower") },
                        ...torres.map((torre) => ({ value: torre.id, label: torre.nombre })),
                        { value: "__none__", label: t("inventario.noTower") },
                      ]}
                      className="w-40"
                    />
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
                <NodDoDropdown
                  variant="dashboard"
                  size="sm"
                  value={bulkTipologiaId}
                  onChange={(val) => setBulkTipologiaId(val)}
                  placeholder={t("inventario.selectTypology")}
                  options={[
                    { value: "", label: t("inventario.selectTypology") },
                    ...tipologiasForDropdown.map((tp) => ({ value: tp.id, label: tp.nombre })),
                    { value: "__none__", label: "—" },
                  ]}
                  className="w-36"
                />
                <button
                  onClick={handleBulkTipologiaChange}
                  disabled={bulkLoading || !bulkTipologiaId}
                  className={btnPrimary}
                >
                  {t("inventario.assign")}
                </button>

                {fachadas.length > 0 && !isLoteBased && (
                  <>
                    <div className="w-px h-5 bg-[var(--border-subtle)] mx-1" />
                    <span className="text-xs text-[var(--text-tertiary)]">{t("inventario.bulkFachada")}</span>
                    <NodDoDropdown
                      variant="dashboard"
                      size="sm"
                      value={bulkFachadaId}
                      onChange={(val) => setBulkFachadaId(val)}
                      placeholder={t("inventario.selectFachada")}
                      options={[
                        { value: "", label: t("inventario.selectFachada") },
                        ...fachadas.map((f) => ({ value: f.id, label: f.nombre })),
                        { value: "__none__", label: "—" },
                      ]}
                      className="w-36"
                    />
                    <button
                      onClick={handleBulkFachadaChange}
                      disabled={bulkLoading || !bulkFachadaId}
                      className={btnPrimary}
                    >
                      {t("inventario.assign")}
                    </button>
                  </>
                )}

                {isMultiTipo && (
                  <>
                    <div className="w-px h-5 bg-[var(--border-subtle)] mx-1" />
                    <span className="text-xs text-[var(--text-tertiary)]">Asignar tipologías</span>
                    <div className="flex flex-wrap gap-1">
                      {tipologiasForDropdown.map((tp) => (
                        <button
                          key={tp.id}
                          onClick={() => setBulkMultiTipoIds((prev) =>
                            prev.includes(tp.id) ? prev.filter(x => x !== tp.id) : [...prev, tp.id]
                          )}
                          className={cn(
                            "px-2 py-0.5 rounded-md text-[10px] font-medium transition-all border",
                            bulkMultiTipoIds.includes(tp.id)
                              ? "bg-[rgba(var(--site-primary-rgb),0.15)] border-[var(--site-primary)] text-[var(--site-primary)]"
                              : "bg-[var(--surface-3)] border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:border-[var(--border-default)]"
                          )}
                        >
                          {tp.nombre}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleBulkMultiTipoAssign}
                      disabled={bulkMultiTipoLoading || bulkMultiTipoIds.length === 0}
                      className={btnPrimary}
                    >
                      {bulkMultiTipoLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : null}
                      {t("inventario.assign")}
                    </button>
                  </>
                )}

                <div className="w-px h-5 bg-[var(--border-subtle)] mx-1" />
                <button
                  onClick={() => setBulkDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium hover:bg-red-500/20 hover:border-red-500/30 transition-all"
                >
                  <Trash2 size={13} />
                  Eliminar ({selectedIds.size})
                </button>

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
          {sortedUnidades.length === 0 ? (
            <div className="py-12 text-center text-[var(--text-muted)] text-sm">
              {unidades.length === 0
                ? t("inventario.noUnits")
                : t("inventario.noUnitsFiltered")}
            </div>
          ) : (
            sortedUnidades.map((unit) =>
              editingId === unit.id ? (
                <UnitForm
                  key={unit.id}
                  initial={getEditFormData(unit)}
                  tipologias={tipologiasForDropdown}
                  fachadas={fachadas}
                  orientaciones={orientaciones}
                  vistas={vistas}
                  onSubmit={(data) => handleUpdate(unit.id, data)}
                  onCancel={() => setEditingId(null)}
                  submitting={formLoading}
                  currency={(project?.moneda_base as Currency) || "COP"}
                  columns={columns}
                  projectId={projectId}
                  isLoteBased={isLoteBased}
                  isMultiTipo={isMultiTipo}
                  isTipologiaPricing={isTipologiaPricing}
                  unitTipoIds={isMultiTipo ? getUnitTipologias(unit.id).map(t => t.id) : []}
                  existingEtapas={uniqueEtapas}
                  customColumns={editorCustomCols}
                  customFieldValues={(unit.custom_fields as Record<string, unknown>) ?? {}}
                />
              ) : (
                <MobileUnitCard
                  key={unit.id}
                  unit={unit}
                  tipologias={tipologiasForDropdown}
                  columns={columns}
                  isTipologiaPricing={isTipologiaPricing}
                  isMultiTipo={isMultiTipo}
                  unitTipos={isMultiTipo ? getUnitTipologias(unit.id) : []}
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
                  <th className="text-left py-2 px-4 w-10">
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
                  {(() => {
                    const thBase = "text-left py-2 px-4 font-ui font-bold text-[10px] uppercase tracking-wider";
                    const sortIcon = (field: string) => {
                      if (sortField !== field) return <ArrowUpDown size={10} className="opacity-0 group-hover/th:opacity-100 transition-opacity" />;
                      return sortDir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />;
                    };
                    const thClass = (field: string) => cn(thBase, "cursor-pointer select-none group/th hover:text-[var(--text-secondary)] transition-colors", sortField === field ? "text-[var(--site-primary)]" : "text-[var(--text-tertiary)]");
                    return (
                      <>
                        <th className={thClass("identificador")} onClick={() => toggleSort("identificador")}>
                          <span className="inline-flex items-center gap-1">{t("inventario.fields.identifier")} {sortIcon("identificador")}</span>
                        </th>
                        <th className={thClass("tipologia")} onClick={() => toggleSort("tipologia")}>
                          <span className="inline-flex items-center gap-1">{isMultiTipo ? "TIPOLOGÍAS" : t("inventario.fields.typology")} {sortIcon("tipologia")}</span>
                        </th>
                      </>
                    );
                  })()}
                  {!isLoteBased && fachadas.length > 0 && (
                    <th className="text-left py-2 px-4 text-[var(--text-tertiary)] font-ui font-bold text-[10px] uppercase tracking-wider">
                      {t("inventario.fields.fachada")}
                    </th>
                  )}
                  {columns.piso && (
                    <th className={cn("text-left py-2 px-4 font-ui font-bold text-[10px] uppercase tracking-wider cursor-pointer select-none group/th hover:text-[var(--text-secondary)] transition-colors", sortField === "piso" ? "text-[var(--site-primary)]" : "text-[var(--text-tertiary)]")} onClick={() => toggleSort("piso")}>
                      <span className="inline-flex items-center gap-1">{t("inventario.fields.floor")} {sortField === "piso" ? (sortDir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />) : <ArrowUpDown size={10} className="opacity-0 group-hover/th:opacity-100 transition-opacity" />}</span>
                    </th>
                  )}
                  {columns.lote && (
                    <th className={cn("text-left py-2 px-4 font-ui font-bold text-[10px] uppercase tracking-wider cursor-pointer select-none group/th hover:text-[var(--text-secondary)] transition-colors", sortField === "lote" ? "text-[var(--site-primary)]" : "text-[var(--text-tertiary)]")} onClick={() => toggleSort("lote")}>
                      <span className="inline-flex items-center gap-1">LOTE {sortField === "lote" ? (sortDir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />) : <ArrowUpDown size={10} className="opacity-0 group-hover/th:opacity-100 transition-opacity" />}</span>
                    </th>
                  )}
                  {columns.etapa && (
                    <th className={cn("text-left py-2 px-4 font-ui font-bold text-[10px] uppercase tracking-wider cursor-pointer select-none group/th hover:text-[var(--text-secondary)] transition-colors", sortField === "etapa" ? "text-[var(--site-primary)]" : "text-[var(--text-tertiary)]")} onClick={() => toggleSort("etapa")}>
                      <span className="inline-flex items-center gap-1">ETAPA {sortField === "etapa" ? (sortDir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />) : <ArrowUpDown size={10} className="opacity-0 group-hover/th:opacity-100 transition-opacity" />}</span>
                    </th>
                  )}
                  {columns.area_m2 && (
                    <th className={cn("text-left py-2 px-4 font-ui font-bold text-[10px] uppercase tracking-wider cursor-pointer select-none group/th hover:text-[var(--text-secondary)] transition-colors", sortField === "area_m2" ? "text-[var(--site-primary)]" : "text-[var(--text-tertiary)]")} onClick={() => toggleSort("area_m2")}>
                      <span className="inline-flex items-center gap-1">{t("inventario.columns.area")} {sortField === "area_m2" ? (sortDir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />) : <ArrowUpDown size={10} className="opacity-0 group-hover/th:opacity-100 transition-opacity" />}</span>
                    </th>
                  )}
                  {columns.area_construida && (
                    <th className={cn("text-left py-2 px-4 font-ui font-bold text-[10px] uppercase tracking-wider cursor-pointer select-none group/th hover:text-[var(--text-secondary)] transition-colors", sortField === "area_construida" ? "text-[var(--site-primary)]" : "text-[var(--text-tertiary)]")} onClick={() => toggleSort("area_construida")}>
                      <span className="inline-flex items-center gap-1">{t("inventario.columns.areaConstruida")} {sortField === "area_construida" ? (sortDir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />) : <ArrowUpDown size={10} className="opacity-0 group-hover/th:opacity-100 transition-opacity" />}</span>
                    </th>
                  )}
                  {columns.area_privada && (
                    <th className={cn("text-left py-2 px-4 font-ui font-bold text-[10px] uppercase tracking-wider cursor-pointer select-none group/th hover:text-[var(--text-secondary)] transition-colors", sortField === "area_privada" ? "text-[var(--site-primary)]" : "text-[var(--text-tertiary)]")} onClick={() => toggleSort("area_privada")}>
                      <span className="inline-flex items-center gap-1">{t("inventario.columns.areaPrivada")} {sortField === "area_privada" ? (sortDir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />) : <ArrowUpDown size={10} className="opacity-0 group-hover/th:opacity-100 transition-opacity" />}</span>
                    </th>
                  )}
                  {columns.area_lote && (
                    <th className={cn("text-left py-2 px-4 font-ui font-bold text-[10px] uppercase tracking-wider cursor-pointer select-none group/th hover:text-[var(--text-secondary)] transition-colors", sortField === "area_lote" ? "text-[var(--site-primary)]" : "text-[var(--text-tertiary)]")} onClick={() => toggleSort("area_lote")}>
                      <span className="inline-flex items-center gap-1">{t("inventario.columns.areaLote")} {sortField === "area_lote" ? (sortDir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />) : <ArrowUpDown size={10} className="opacity-0 group-hover/th:opacity-100 transition-opacity" />}</span>
                    </th>
                  )}
                  <th className={cn("text-left py-2 px-4 font-ui font-bold text-[10px] uppercase tracking-wider cursor-pointer select-none group/th hover:text-[var(--text-secondary)] transition-colors", sortField === "precio" ? "text-[var(--site-primary)]" : "text-[var(--text-tertiary)]")} onClick={() => toggleSort("precio")}>
                    <span className="inline-flex items-center gap-1">{t("inventario.fields.price")} {sortField === "precio" ? (sortDir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />) : <ArrowUpDown size={10} className="opacity-0 group-hover/th:opacity-100 transition-opacity" />}</span>
                  </th>
                  <th className={cn("text-left py-2 px-4 font-ui font-bold text-[10px] uppercase tracking-wider cursor-pointer select-none group/th hover:text-[var(--text-secondary)] transition-colors", sortField === "estado" ? "text-[var(--site-primary)]" : "text-[var(--text-tertiary)]")} onClick={() => toggleSort("estado")}>
                    <span className="inline-flex items-center gap-1">{t("inventario.fields.state")} {sortField === "estado" ? (sortDir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />) : <ArrowUpDown size={10} className="opacity-0 group-hover/th:opacity-100 transition-opacity" />}</span>
                  </th>
                  {columns.habitaciones && (
                    <th className={cn("text-left py-2 px-4 font-ui font-bold text-[10px] uppercase tracking-wider cursor-pointer select-none group/th hover:text-[var(--text-secondary)] transition-colors", sortField === "habitaciones" ? "text-[var(--site-primary)]" : "text-[var(--text-tertiary)]")} onClick={() => toggleSort("habitaciones")}>
                      <span className="inline-flex items-center gap-1">{t("inventario.fields.bedrooms")} {sortField === "habitaciones" ? (sortDir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />) : <ArrowUpDown size={10} className="opacity-0 group-hover/th:opacity-100 transition-opacity" />}</span>
                    </th>
                  )}
                  {columns.banos && (
                    <th className={cn("text-left py-2 px-4 font-ui font-bold text-[10px] uppercase tracking-wider cursor-pointer select-none group/th hover:text-[var(--text-secondary)] transition-colors", sortField === "banos" ? "text-[var(--site-primary)]" : "text-[var(--text-tertiary)]")} onClick={() => toggleSort("banos")}>
                      <span className="inline-flex items-center gap-1">{t("inventario.fields.bathrooms")} {sortField === "banos" ? (sortDir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />) : <ArrowUpDown size={10} className="opacity-0 group-hover/th:opacity-100 transition-opacity" />}</span>
                    </th>
                  )}
                  {columns.parqueaderos && (
                    <th className={cn("text-left py-2 px-4 font-ui font-bold text-[10px] uppercase tracking-wider cursor-pointer select-none group/th hover:text-[var(--text-secondary)] transition-colors", sortField === "parqueaderos" ? "text-[var(--site-primary)]" : "text-[var(--text-tertiary)]")} onClick={() => toggleSort("parqueaderos")}>
                      <span className="inline-flex items-center gap-1">{t("inventario.fields.parking")} {sortField === "parqueaderos" ? (sortDir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />) : <ArrowUpDown size={10} className="opacity-0 group-hover/th:opacity-100 transition-opacity" />}</span>
                    </th>
                  )}
                  {columns.depositos && (
                    <th className={cn("text-left py-2 px-4 font-ui font-bold text-[10px] uppercase tracking-wider cursor-pointer select-none group/th hover:text-[var(--text-secondary)] transition-colors", sortField === "depositos" ? "text-[var(--site-primary)]" : "text-[var(--text-tertiary)]")} onClick={() => toggleSort("depositos")}>
                      <span className="inline-flex items-center gap-1">{t("inventario.fields.storage")} {sortField === "depositos" ? (sortDir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />) : <ArrowUpDown size={10} className="opacity-0 group-hover/th:opacity-100 transition-opacity" />}</span>
                    </th>
                  )}
                  {columns.orientacion && (
                    <th className={cn("text-left py-2 px-4 font-ui font-bold text-[10px] uppercase tracking-wider cursor-pointer select-none group/th hover:text-[var(--text-secondary)] transition-colors", sortField === "orientacion" ? "text-[var(--site-primary)]" : "text-[var(--text-tertiary)]")} onClick={() => toggleSort("orientacion")}>
                      <span className="inline-flex items-center gap-1">{t("inventario.fields.orientation")} {sortField === "orientacion" ? (sortDir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />) : <ArrowUpDown size={10} className="opacity-0 group-hover/th:opacity-100 transition-opacity" />}</span>
                    </th>
                  )}
                  {columns.vista && (
                    <th className={cn("text-left py-2 px-4 font-ui font-bold text-[10px] uppercase tracking-wider cursor-pointer select-none group/th hover:text-[var(--text-secondary)] transition-colors", sortField === "vista" ? "text-[var(--site-primary)]" : "text-[var(--text-tertiary)]")} onClick={() => toggleSort("vista")}>
                      <span className="inline-flex items-center gap-1">{t("inventario.fields.view")} {sortField === "vista" ? (sortDir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />) : <ArrowUpDown size={10} className="opacity-0 group-hover/th:opacity-100 transition-opacity" />}</span>
                    </th>
                  )}
                  {editorCustomCols.map((cc) => (
                    <th
                      key={cc.key}
                      className={cn("text-left py-2 px-4 font-ui font-bold text-[10px] uppercase tracking-wider cursor-pointer select-none group/th hover:text-[var(--text-secondary)] transition-colors", sortField === `custom_${cc.key}` ? "text-[var(--site-primary)]" : "text-[var(--text-tertiary)]")}
                      onClick={() => toggleSort(`custom_${cc.key}`)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {cc.label}
                        {sortField === `custom_${cc.key}` ? (sortDir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />) : <ArrowUpDown size={10} className="opacity-0 group-hover/th:opacity-100 transition-opacity" />}
                      </span>
                    </th>
                  ))}
                  <th className="text-right py-2 px-4 text-[var(--text-tertiary)] font-ui font-bold text-[10px] uppercase tracking-wider">

                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedUnidades.length === 0 ? (
                  <tr>
                    <td
                      colSpan={99}
                      className="py-16 text-center text-[var(--text-muted)] text-sm"
                    >
                      {unidades.length === 0
                        ? t("inventario.noUnits")
                        : t("inventario.noUnitsFiltered")}
                    </td>
                  </tr>
                ) : (
                  sortedUnidades.map((unit) => {
                    const unitTipos = isMultiTipo ? getUnitTipologias(unit.id) : [];

                    const confirmedTipo = unit.tipologia_id ? tipologias.find(t => t.id === unit.tipologia_id) : null;
                    const moneda = (project?.moneda_base as Currency) || "COP";

                    return (
                    <motion.tr
                      key={unit.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-[var(--border-subtle)] hover:bg-[var(--surface-2)] transition-colors group"
                    >
                      {editingId === unit.id ? (
                        <td colSpan={99} className="p-4">
                          <UnitForm
                            initial={getEditFormData(unit)}
                            tipologias={tipologiasForDropdown}
                            fachadas={fachadas}
                            orientaciones={orientaciones}
                            vistas={vistas}
                            onSubmit={(data) => handleUpdate(unit.id, data)}
                            onCancel={() => setEditingId(null)}
                            submitting={formLoading}
                            currency={moneda}
                            columns={columns}
                            projectId={projectId}
                            isLoteBased={isLoteBased}
                            isMultiTipo={isMultiTipo}
                            isTipologiaPricing={isTipologiaPricing}
                            unitTipoIds={unitTipos.map(t => t.id)}
                            existingEtapas={uniqueEtapas}
                            customColumns={editorCustomCols}
                            customFieldValues={(unit.custom_fields as Record<string, unknown>) ?? {}}
                          />
                        </td>
                      ) : (
                        <>
                          <td className="py-2 px-4">
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
                          <td className="py-2 px-4 text-white font-medium">
                            {unit.identificador}
                          </td>
                          <td className="py-2 px-4">
                            {isMultiTipo ? (
                              <InlineMultiTipo
                                unit={unit}
                                unitTipos={unitTipos}
                                allTipologias={tipologiasForDropdown}
                                onToggleAvailable={(tipoId, add) => handleToggleUnitTipo(unit.id, tipoId, add)}
                              />
                            ) : (
                              <NodDoDropdown
                                variant="table"
                                size="sm"
                                value={unit.tipologia_id || ""}
                                onChange={(val) => handleInlineUpdate(unit.id, "tipologia_id", val || null)}
                                disabled={["vendida", "reservada", "separado"].includes(unit.estado)}
                                options={[
                                  { value: "", label: "—" },
                                  ...tipologiasForDropdown.map((tp) => ({ value: tp.id, label: tp.nombre })),
                                ]}
                              />
                            )}
                          </td>
                          {!isLoteBased && fachadas.length > 0 && (
                            <td className="py-2 px-4">
                              <NodDoDropdown
                                variant="table"
                                size="sm"
                                value={unit.fachada_id || ""}
                                onChange={(val) => handleInlineUpdate(unit.id, "fachada_id", val || null)}
                                options={[
                                  { value: "", label: "—" },
                                  ...fachadas.map((f) => ({ value: f.id, label: f.nombre })),
                                ]}
                              />
                            </td>
                          )}
                          {columns.piso && (
                            <td className="py-2 px-4 text-[var(--text-secondary)]">
                              {unit.piso ?? "-"}
                            </td>
                          )}
                          {columns.lote && (
                            <td className="py-2 px-4 text-[var(--text-secondary)]">
                              {unit.lote || "-"}
                            </td>
                          )}
                          {columns.etapa && (
                            <td className="py-2 px-4 text-[var(--text-secondary)]">
                              {unit.etapa_nombre || "-"}
                            </td>
                          )}
                          {columns.area_m2 && (
                            <td className="py-2 px-4 text-[var(--text-secondary)]">
                              {isMultiTipo && !unit.tipologia_id
                                ? "-"
                                : unit.area_m2 != null
                                  ? `${unit.area_m2} m²`
                                  : confirmedTipo?.area_m2 != null
                                    ? `${confirmedTipo.area_m2} m²`
                                    : "-"
                              }
                            </td>
                          )}
                          {columns.area_construida && (
                            <td className="py-2 px-4 text-[var(--text-secondary)]">
                              {unit.area_construida != null ? `${unit.area_construida} m²` : "-"}
                            </td>
                          )}
                          {columns.area_privada && (
                            <td className="py-2 px-4 text-[var(--text-secondary)]">
                              {unit.area_privada != null ? `${unit.area_privada} m²` : "-"}
                            </td>
                          )}
                          {columns.area_lote && (
                            <td className="py-2 px-4 text-[var(--text-secondary)]">
                              {unit.area_lote != null ? `${unit.area_lote} m²` : "-"}
                            </td>
                          )}
                          <td className="py-2 px-4 text-[var(--text-secondary)]">
                            {(() => {
                              // Sold with final negotiated price → show that
                              if (unit.estado === "vendida" && unit.precio_venta != null) {
                                return formatCurrency(unit.precio_venta, moneda, {});
                              }
                              // Tipología-based pricing — unit price takes priority
                              if (isTipologiaPricing) {
                                if (unit.precio != null) {
                                  return formatCurrency(unit.precio, moneda, {});
                                }
                                if (unit.tipologia_id) {
                                  const confirmed = tipologias.find(tp => tp.id === unit.tipologia_id);
                                  return confirmed?.precio_desde
                                    ? formatCurrency(confirmed.precio_desde, moneda, {})
                                    : "-";
                                }
                                if (isMultiTipo && unitTipos.length > 0) {
                                  const prices = unitTipos.map(t => t.precio_desde).filter((p): p is number => p != null);
                                  return prices.length > 0
                                    ? formatCurrency(Math.min(...prices), moneda, {})
                                    : "-";
                                }
                                return "-";
                              }
                              // Unit-level pricing
                              if (isMultiTipo && !unit.tipologia_id) {
                                return "-";
                              }
                              return unit.precio != null
                                ? formatCurrency(unit.precio, moneda, {})
                                : "-";
                            })()}
                          </td>
                          <td className="py-2 px-4">
                            <EstadoBadge estado={unit.estado} />
                          </td>
                          {columns.habitaciones && (
                            <td className="py-2 px-4 text-[var(--text-secondary)]">
                              {isMultiTipo && !unit.tipologia_id
                                ? "-"
                                : unit.habitaciones ?? confirmedTipo?.habitaciones ?? "-"
                              }
                            </td>
                          )}
                          {columns.banos && (
                            <td className="py-2 px-4 text-[var(--text-secondary)]">
                              {isMultiTipo && !unit.tipologia_id
                                ? "-"
                                : unit.banos ?? confirmedTipo?.banos ?? "-"
                              }
                            </td>
                          )}
                          {columns.parqueaderos && (
                            <td className="py-2 px-4 text-[var(--text-secondary)]">
                              {unit.parqueaderos ?? "-"}
                            </td>
                          )}
                          {columns.depositos && (
                            <td className="py-2 px-4 text-[var(--text-secondary)]">
                              {unit.depositos ?? "-"}
                            </td>
                          )}
                          {columns.orientacion && (
                            <td className="py-2 px-4">
                              <NodDoDropdown
                                variant="table"
                                size="sm"
                                value={unit.orientacion_id || ""}
                                onChange={(val) => handleInlineUpdate(unit.id, "orientacion_id", val || null)}
                                options={[
                                  { value: "", label: "—" },
                                  ...orientaciones.map((o) => ({ value: o.id, label: o.nombre })),
                                ]}
                              />
                            </td>
                          )}
                          {columns.vista && (
                            <td className="py-2 px-4">
                              <NodDoDropdown
                                variant="table"
                                size="sm"
                                value={unit.vista_id || ""}
                                onChange={(val) => handleInlineUpdate(unit.id, "vista_id", val || null)}
                                options={[
                                  { value: "", label: "—" },
                                  ...vistas.map((v) => ({ value: v.id, label: v.nombre })),
                                ]}
                              />
                            </td>
                          )}
                          {editorCustomCols.map((cc) => {
                            const cf = (unit.custom_fields as Record<string, unknown>) ?? {};
                            const val = cf[cc.key];
                            return (
                              <td key={cc.key} className="py-2 px-4">
                                {cc.type === "select" ? (
                                  <NodDoDropdown
                                    variant="table"
                                    size="sm"
                                    value={(val as string) ?? ""}
                                    onChange={(v) => handleInlineCustomFieldUpdate(unit.id, cc.key, v || null)}
                                    options={[
                                      { value: "", label: "—" },
                                      ...(cc.options ?? []).map((o) => ({ value: o, label: o })),
                                    ]}
                                  />
                                ) : cc.type === "number" ? (
                                  <input
                                    type="number"
                                    defaultValue={val != null ? String(val) : ""}
                                    onBlur={(e) => {
                                      const nv = e.target.value ? parseFloat(e.target.value) : null;
                                      if (nv !== val) handleInlineCustomFieldUpdate(unit.id, cc.key, nv);
                                    }}
                                    className="w-16 bg-transparent text-[var(--text-secondary)] text-sm border-b border-transparent hover:border-[var(--border-default)] focus:border-[var(--site-primary)] outline-none transition-colors px-0 py-0.5"
                                  />
                                ) : cc.type === "date" ? (
                                  <input
                                    type="date"
                                    defaultValue={(val as string) ?? ""}
                                    onChange={(e) => handleInlineCustomFieldUpdate(unit.id, cc.key, e.target.value || null)}
                                    className="bg-transparent text-[var(--text-secondary)] text-sm border-b border-transparent hover:border-[var(--border-default)] focus:border-[var(--site-primary)] outline-none transition-colors px-0 py-0.5"
                                  />
                                ) : (
                                  <input
                                    type="text"
                                    defaultValue={(val as string) ?? ""}
                                    onBlur={(e) => {
                                      if (e.target.value !== (val ?? "")) handleInlineCustomFieldUpdate(unit.id, cc.key, e.target.value || null);
                                    }}
                                    className="w-20 bg-transparent text-[var(--text-secondary)] text-sm border-b border-transparent hover:border-[var(--border-default)] focus:border-[var(--site-primary)] outline-none transition-colors px-0 py-0.5"
                                  />
                                )}
                              </td>
                            );
                          })}
                          <td className="py-2 px-4">
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
                    );
                  })
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
            title="Complementos pendientes de asignar"
            message={`${vendidaWarningMessage}\n\n¿Deseas marcar como vendida de todas formas? Los complementos se pueden asignar después.`}
            onConfirm={() => {
              vendidaWarning.callback();
              setVendidaWarning(null);
              setVendidaWarningMessage("");
            }}
            onCancel={() => { setVendidaWarning(null); setVendidaWarningMessage(""); }}
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
        {bulkDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => !bulkDeleting && setBulkDeleteConfirm(false)}
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
                <h3 className="text-sm font-medium text-white">
                  Eliminar {selectedIds.size} unidad{selectedIds.size !== 1 ? "es" : ""}
                </h3>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-2">
                Esta acción eliminará permanentemente {selectedIds.size === 1 ? "la unidad seleccionada" : `las ${selectedIds.size} unidades seleccionadas`} junto con todos sus datos asociados (complementos, historial de estados, etc.).
              </p>
              <p className="text-sm text-red-400/80 mb-6">
                Esta acción no se puede deshacer.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setBulkDeleteConfirm(false)}
                  disabled={bulkDeleting}
                  className={btnSecondary}
                >
                  {t("inventario.cancel")}
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-500/80 text-white rounded-lg text-xs font-medium hover:bg-red-500 transition-all disabled:opacity-50"
                >
                  {bulkDeleting ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Trash2 size={12} />
                  )}
                  Eliminar {selectedIds.size} unidad{selectedIds.size !== 1 ? "es" : ""}
                </button>
              </div>
            </motion.div>
          </motion.div>
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
            customColumns={project.custom_columns ?? []}
            tipoProyecto={tipoProyecto}
            tipologiaMode={tipologiaMode}
            inventoryColumns={project.inventory_columns ?? null}
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
            onDone={() => {
              setShowPriceAdjust(false);
              refresh().catch(() => {});
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAIChat && (
          <InventoryAssistant
            unidades={unidades}
            tipologias={tipologias}
            fachadas={fachadas}
            torres={torres}
            projectId={projectId}
            tipoProyecto={tipoProyecto}
            tipologiaMode={tipologiaMode}
            unidadTipologias={unidadTipologias}
            customColumns={(project.custom_columns ?? []).map((c: CustomColumnDef) => ({ key: c.key, label: c.label, type: c.type, options: c.options }))}
            onClose={() => setShowAIChat(false)}
            onDone={(appliedChanges) => {
              // Update local state immediately so the table reflects changes
              if (appliedChanges && appliedChanges.length > 0) {
                updateLocal((prev) => ({
                  ...prev,
                  unidades: (prev.unidades || []).map((u) => {
                    const change = appliedChanges.find((c) => c.id === u.id);
                    if (!change) return u;
                    return { ...u, ...change.updates };
                  }),
                }));
              }
              // Also refresh in background for full data consistency
              refresh();
            }}
          />
        )}
      </AnimatePresence>

      {/* Columns config modal */}
      <AnimatePresence>
        {showColumnsModal && (
          <ColumnsConfigModal
            tipoProyecto={tipoProyecto}
            currentConfig={project.inventory_columns ?? null}
            currentConfigMicrosite={(project as any).inventory_columns_microsite ?? null}
            customColumns={project.custom_columns ?? []}
            onSave={handleSaveColumns}
            onSaveCustomColumns={handleSaveCustomColumns}
            onClose={() => setShowColumnsModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Tipología required modal — shown when multi-tipo unit needs a confirmed tipología for estado change */}
      <AnimatePresence>
        {tipologiaRequiredModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setTipologiaRequiredModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--surface-2)] border border-[var(--border-default)] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[rgba(var(--site-primary-rgb),0.1)] rounded-lg">
                  <AlertTriangle size={18} className="text-[var(--site-primary)]" />
                </div>
                <h3 className="text-sm font-medium text-white">Tipología requerida</h3>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Para cambiar el estado a <strong>{tipologiaRequiredModal.newEstado}</strong>, debes confirmar una tipología para esta unidad.
              </p>
              <div className="space-y-2 mb-6">
                {tipologiaRequiredModal.availableTipos.map((tp) => (
                  <button
                    key={tp.id}
                    onClick={() => handleTipologiaRequiredConfirm(tp.id)}
                    className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-[var(--surface-3)] border border-[var(--border-subtle)] hover:border-[var(--site-primary)] transition-all text-left group"
                  >
                    <div>
                      <p className="text-xs font-medium text-white">{tp.nombre}</p>
                      <p className="text-[10px] text-[var(--text-tertiary)]">
                        {(() => { const a = getPrimaryArea(tp, columns); return a != null ? `${a} m²` : ""; })()}
                        {tp.habitaciones != null ? ` · ${tp.habitaciones} hab` : ""}
                        {tp.precio_desde != null ? ` · ${formatCurrency(tp.precio_desde, (project?.moneda_base as Currency) || "COP", {})}` : ""}
                      </p>
                    </div>
                    <Check size={14} className="text-[var(--site-primary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-end">
                <button onClick={() => setTipologiaRequiredModal(null)} className={btnSecondary}>
                  {t("inventario.cancel")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </>)}
    </motion.div>
  );
}
