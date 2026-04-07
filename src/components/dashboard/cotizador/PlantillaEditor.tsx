"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Plus, Trash2, GripVertical, Copy, Sparkles, X, Star, Globe, ChevronDown, Pencil,
  Banknote, Receipt, Scale, Type, Coins, Truck, ToggleLeft, ListOrdered,
} from "lucide-react";
import { Reorder, useDragControls } from "framer-motion";
import type { CotizadorConfig, PlantillaPago, PlantillaPagoFila, PlantillaQuickDef, ReglaFecha, CargoAdicional } from "@/types";
import { NodDoDropdown } from "@/components/ui/NodDoDropdown";
import { CurrencyInput } from "@/components/dashboard/CurrencyInput";
import type { Currency } from "@/lib/currency";
import { inputClass } from "@/components/dashboard/editor-styles";
import { fontSize, gap, letterSpacing, radius, iconSize, iconColor } from "@/lib/design-tokens";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { templatePctTotal, validateTemplate, expandQuickDef } from "@/lib/cotizador/plantilla-pago";

/* ─── Helpers ─── */

function uid(): string {
  return crypto.randomUUID();
}

const DATE_RULE_OPTIONS = [
  { value: "al_reservar", label: "Al reservar" },
  { value: "meses_desde_reserva", label: "+ N meses" },
  { value: "al_avance", label: "% Avance" },
  { value: "al_completar", label: "Al completar" },
] as const;

const FRECUENCIAS = [
  { value: "mensual", label: "Mensual" },
  { value: "bimestral", label: "Bimestral" },
  { value: "trimestral", label: "Trimestral" },
] as const;

const MONEDAS = [
  { value: "COP", label: "COP" },
  { value: "USD", label: "USD" },
  { value: "MXN", label: "MXN" },
  { value: "AED", label: "AED" },
  { value: "EUR", label: "EUR" },
] as const;

function defaultFila(): PlantillaPagoFila {
  return {
    id: uid(),
    nombre: "Nueva cuota",
    tipo_valor: "porcentaje",
    valor: 5,
    regla_fecha: { tipo: "meses_desde_reserva", meses: 1 },
  };
}

function defaultTemplate(moneda: string): PlantillaPago {
  return {
    id: uid(),
    nombre: "Nuevo plan",
    filas: [],
    es_default: false,
    created_at: new Date().toISOString(),
    moneda,
    separacion_incluida_en_inicial: true,
  };
}

/** Generate a human-readable summary for a template */
function summarizeTemplate(p: PlantillaPago): string {
  const filas = p.filas;
  if (filas.length === 0) return "Sin filas";

  const parts: string[] = [];
  const pctFilas = filas.filter((f) => f.tipo_valor === "porcentaje");
  const fijoFilas = filas.filter((f) => f.tipo_valor === "fijo");
  const hasResto = filas.some((f) => f.tipo_valor === "resto");

  for (const f of fijoFilas) {
    parts.push(f.nombre || "Fijo");
  }

  if (pctFilas.length > 0) {
    const totalPct = pctFilas.reduce((s, f) => s + f.valor, 0);
    const allSameValue = pctFilas.length > 1 && pctFilas.every((f) => f.valor === pctFilas[0].valor);
    if (allSameValue && pctFilas.length > 2) {
      parts.push(`${Math.round(totalPct)}% en ${pctFilas.length} cuotas`);
    } else {
      for (const f of pctFilas) {
        parts.push(`${f.valor}% ${f.nombre || ""}`);
      }
    }
  }

  if (hasResto) {
    const totalPct = pctFilas.reduce((s, f) => s + f.valor, 0);
    const restoPct = 100 - totalPct;
    parts.push(`Entrega ${restoPct > 0 ? restoPct + "%" : ""}`);
  }

  const monedaLabel = p.moneda ? ` · ${p.moneda}` : "";
  return parts.join(" → ") + monedaLabel;
}

/* ─── Reusable sub-components ─── */

function SectionHeader({ icon: Icon, title, tooltip, children }: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  tooltip?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 pt-3 pb-1">
      <div className={cn("w-6 h-6 flex items-center justify-center rounded-lg", "bg-[rgba(var(--site-primary-rgb),0.1)]")}>
        <Icon size={iconSize.xs} className={iconColor.primary} />
      </div>
      <span className={cn("text-[var(--text-muted)] uppercase font-ui font-bold", fontSize.label, letterSpacing.wider)}>{title}</span>
      {tooltip && <InfoTooltip content={tooltip} variant="dashboard" placement="auto" />}
      {children}
      <div className="flex-1 border-t border-[var(--border-subtle)]" />
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className={cn("text-[var(--text-muted)] mt-1", fontSize.caption)}>{children}</p>;
}

function FieldLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block text-[var(--text-muted)] mb-1 uppercase", fontSize.label, letterSpacing.wider, className)}>{children}</label>
  );
}

/* ─── Quick Create Panel ─── */

function QuickCreatePanel({
  moneda,
  onConfirm,
  onCancel,
}: {
  moneda: string;
  onConfirm: (filas: PlantillaPagoFila[], quickDef: PlantillaQuickDef) => void;
  onCancel: () => void;
}) {
  const [def, setDef] = useState<PlantillaQuickDef>({
    porcentaje_inicial: 30,
    cuotas: 6,
    frecuencia: "mensual",
    incluye_separacion: true,
    separacion_monto: 5000000,
  });

  const handleGenerate = () => {
    const generated = expandQuickDef(def, "");
    onConfirm(generated.filas, def);
  };

  const pctPerCuota = def.cuotas > 0 ? +(def.porcentaje_inicial / def.cuotas).toFixed(2) : 0;
  const freqLabel = FRECUENCIAS.find((f) => f.value === def.frecuencia)?.label.toLowerCase() ?? "mensual";
  const entregaPct = 100 - def.porcentaje_inicial;

  return (
    <div className={cn("border border-[rgba(var(--site-primary-rgb),0.15)] bg-[rgba(var(--site-primary-rgb),0.03)] p-4", radius.lg, "flex flex-col", gap.relaxed)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-[var(--site-primary)]" />
          <span className={cn("text-[var(--text-secondary)] font-medium", fontSize.md)}>Creación rápida</span>
        </div>
        <button onClick={onCancel} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
          <X size={14} />
        </button>
      </div>

      <div className={cn("grid grid-cols-2", gap.relaxed)}>
        <div>
          <FieldLabel>Cuota inicial (%)</FieldLabel>
          <input
            type="number"
            value={def.porcentaje_inicial || ""}
            onChange={(e) => setDef({ ...def, porcentaje_inicial: Math.min(100, Math.max(0, Number(e.target.value))) })}
            className={cn("w-full bg-[var(--surface-3)] border border-[var(--border-default)] px-3 py-2 text-white focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]", radius.lg, fontSize.md)}
            placeholder="30" min={1} max={100}
          />
        </div>
        <div>
          <FieldLabel>Distribuir en cuotas</FieldLabel>
          <input
            type="number"
            value={def.cuotas || ""}
            onChange={(e) => setDef({ ...def, cuotas: Math.max(1, Number(e.target.value)) })}
            className={cn("w-full bg-[var(--surface-3)] border border-[var(--border-default)] px-3 py-2 text-white focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]", radius.lg, fontSize.md)}
            placeholder="6" min={1}
          />
        </div>
        <div>
          <FieldLabel>Frecuencia</FieldLabel>
          <NodDoDropdown
            variant="dashboard" size="sm"
            value={def.frecuencia}
            onChange={(val) => setDef({ ...def, frecuencia: val as PlantillaQuickDef["frecuencia"] })}
            options={FRECUENCIAS.map((f) => ({ value: f.value, label: f.label }))}
          />
        </div>
        <div>
          <label className={cn("flex items-center cursor-pointer mb-1", gap.compact)}>
            <input type="checkbox" checked={def.incluye_separacion} onChange={(e) => setDef({ ...def, incluye_separacion: e.target.checked })}
              className="w-3.5 h-3.5 rounded bg-[var(--surface-3)] border border-[var(--border-default)] accent-[var(--site-primary)]"
            />
            <span className={cn("text-[var(--text-muted)] uppercase", fontSize.label, letterSpacing.wider)}>Separación</span>
          </label>
          {def.incluye_separacion && (
            <CurrencyInput
              value={def.separacion_monto ?? ""} onChange={(v) => setDef({ ...def, separacion_monto: Number(v) || 0 })}
              currency={moneda as Currency}
              inputClassName={cn("w-full bg-[var(--surface-3)] border border-[var(--border-default)] px-3 py-2 text-white focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]", radius.lg, fontSize.md)}
              placeholder="5,000,000"
            />
          )}
        </div>
      </div>

      <div className={cn("px-4 py-2.5 border bg-[rgba(var(--site-primary-rgb),0.05)] border-[rgba(var(--site-primary-rgb),0.15)]", radius.lg)}>
        <p className={cn("text-[var(--text-secondary)]", fontSize.md)}>
          {def.incluye_separacion && def.separacion_monto ? "Separación + " : ""}
          {def.cuotas} cuotas de {pctPerCuota}% ({freqLabel}es) = {def.porcentaje_inicial}%
          {" → "}Entrega {entregaPct}%
        </p>
      </div>

      <div className={cn("flex items-center", gap.normal)}>
        <button onClick={handleGenerate}
          disabled={def.porcentaje_inicial <= 0 || def.cuotas <= 0}
          className={cn("px-4 py-2 font-ui text-[10px] font-bold uppercase tracking-[0.1em] transition-all", radius.md,
            def.porcentaje_inicial > 0 && def.cuotas > 0
              ? "bg-[var(--site-primary)] text-[var(--surface-0)] hover:brightness-110"
              : "bg-[var(--surface-3)] text-[var(--text-muted)] cursor-not-allowed",
          )}
        >Generar filas</button>
        <button onClick={onCancel}
          className={cn("px-4 py-2 font-ui text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors")}
        >Cancelar</button>
      </div>
    </div>
  );
}

/* ─── Template Card ─── */

function TemplateCard({
  plantilla,
  isSelected,
  isEditingName,
  onSelect,
  onRename,
  onStartEditing,
  onStopEditing,
}: {
  plantilla: PlantillaPago;
  isSelected: boolean;
  isEditingName: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
  onStartEditing: () => void;
  onStopEditing: () => void;
}) {
  const summary = summarizeTemplate(plantilla);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingName]);

  return (
    <div
      onClick={() => { if (!isEditingName) onSelect(); }}
      className={cn(
        "w-full text-left px-4 py-3 border transition-all flex items-center justify-between cursor-pointer",
        radius.lg,
        isSelected
          ? "border-[rgba(var(--site-primary-rgb),0.6)] bg-[rgba(var(--site-primary-rgb),0.08)]"
          : "border-[var(--border-subtle)] bg-[var(--surface-2)] hover:border-[var(--border-default)] hover:bg-[var(--surface-3)]",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {plantilla.es_default && (
            <Star size={11} className="text-[var(--site-primary)] fill-[var(--site-primary)] shrink-0" />
          )}
          {isEditingName ? (
            <input
              ref={inputRef}
              type="text"
              value={plantilla.nombre}
              onChange={(e) => onRename(e.target.value)}
              onBlur={onStopEditing}
              onKeyDown={(e) => { if (e.key === "Enter") onStopEditing(); }}
              className={cn("flex-1 bg-transparent border-b border-[rgba(var(--site-primary-rgb),0.4)] text-white font-medium focus:outline-none min-w-0 py-0.5", fontSize.md)}
              placeholder="Nombre del plan"
            />
          ) : (
            <span className={cn("font-medium truncate", fontSize.md, isSelected ? "text-white" : "text-[var(--text-secondary)]")}>
              {plantilla.nombre}
            </span>
          )}
          {plantilla.es_default && !isEditingName && (
            <span className={cn("shrink-0 px-1.5 py-0.5 font-ui font-bold uppercase", fontSize.label, letterSpacing.wider, radius.sm, "bg-[rgba(var(--site-primary-rgb),0.15)] text-[var(--site-primary)]")}>
              Default
            </span>
          )}
          {plantilla.habilitada_micrositio && !isEditingName && (
            <span title="Habilitada en micrositio"><Globe size={11} className="text-[var(--text-tertiary)] shrink-0" /></span>
          )}
        </div>
        {!isEditingName && (
          <p className={cn("text-[var(--text-muted)] mt-0.5 truncate", fontSize.caption)}>{summary}</p>
        )}
      </div>
      {!isEditingName && (
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onSelect(); onStartEditing(); }}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            title="Renombrar"
          ><Pencil size={12} /></button>
          <ChevronDown size={14} className={cn("transition-transform", isSelected ? "text-[var(--site-primary)] -rotate-90" : "text-[var(--text-muted)] rotate-[-90deg]")} />
        </div>
      )}
    </div>
  );
}

/* ─── Reorderable Row ─── */

function FilaRow({
  fila,
  onChange,
  onRemove,
  moneda,
}: {
  fila: PlantillaPagoFila;
  onChange: (updated: PlantillaPagoFila) => void;
  onRemove: () => void;
  moneda: string;
}) {
  const controls = useDragControls();
  const isResto = fila.tipo_valor === "resto";

  const dateRuleOptions = DATE_RULE_OPTIONS.map((o) => ({ value: o.value, label: o.label }));

  return (
    <Reorder.Item
      value={fila} dragListener={false} dragControls={controls}
      className={cn("bg-[var(--surface-2)] border border-[var(--border-subtle)] p-3 select-none", radius.lg, "grid grid-cols-[20px_1fr_100px_140px_28px] items-center", gap.normal)}
    >
      <button onPointerDown={(e) => { e.preventDefault(); controls.start(e); }}
        className="cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--text-tertiary)] touch-none"
      ><GripVertical size={13} /></button>

      <div className={cn("flex items-center", gap.normal, "min-w-0")}>
        <input type="text" value={fila.nombre} onChange={(e) => onChange({ ...fila, nombre: e.target.value })}
          className={cn("flex-1 bg-transparent border-none text-white focus:outline-none placeholder:text-[var(--text-muted)] min-w-0", fontSize.md)}
          placeholder="Nombre"
        />
      </div>

      <div className={cn("flex items-center", gap.compact)}>
        {isResto ? (
          <span className={cn("text-[var(--site-primary)] bg-[rgba(var(--site-primary-rgb),0.1)] px-2 py-1 font-mono", radius.sm, fontSize.label)}>Resto</span>
        ) : (
          <>
            <button
              onClick={() => onChange({ ...fila, tipo_valor: fila.tipo_valor === "porcentaje" ? "fijo" : "porcentaje", valor: 0 })}
              className={cn("shrink-0 w-6 h-6 rounded text-[10px] font-ui font-bold transition-all border",
                fila.tipo_valor === "porcentaje"
                  ? "bg-[rgba(var(--site-primary-rgb),0.15)] border-[rgba(var(--site-primary-rgb),0.3)] text-[var(--site-primary)]"
                  : "bg-[var(--surface-3)] border-[var(--border-subtle)] text-[var(--text-tertiary)]",
              )}
              title={fila.tipo_valor === "porcentaje" ? "Cambiar a monto fijo" : "Cambiar a porcentaje"}
            >{fila.tipo_valor === "porcentaje" ? "%" : "$"}</button>
            {fila.tipo_valor === "porcentaje" ? (
              <input type="number" value={fila.valor || ""} onChange={(e) => onChange({ ...fila, valor: parseFloat(e.target.value) || 0 })}
                className={cn("w-14 bg-transparent text-white focus:outline-none border-b border-transparent focus:border-[rgba(var(--site-primary-rgb),0.3)] min-w-0", fontSize.md)}
                placeholder="0" step="0.5"
              />
            ) : (
              <CurrencyInput value={fila.valor || ""} onChange={(v) => onChange({ ...fila, valor: Number(v) })} currency={moneda as Currency}
                inputClassName={cn("w-full bg-transparent text-white focus:outline-none border-b border-transparent focus:border-[rgba(var(--site-primary-rgb),0.3)] min-w-0", fontSize.md)}
              />
            )}
          </>
        )}
      </div>

      {/* Date rule */}
      <div className={cn("flex items-center", gap.compact)}>
        <NodDoDropdown variant="dashboard" size="sm"
          value={fila.regla_fecha.tipo}
          onChange={(val) => {
            const newRegla: ReglaFecha = { tipo: val as ReglaFecha["tipo"] };
            if (val === "meses_desde_reserva") newRegla.meses = fila.regla_fecha.meses ?? 1;
            if (val === "al_avance") newRegla.porcentaje_avance = fila.regla_fecha.porcentaje_avance ?? 50;
            onChange({ ...fila, regla_fecha: newRegla });
          }}
          options={dateRuleOptions}
        />
        {fila.regla_fecha.tipo === "meses_desde_reserva" && (
          <input type="number" min={0} value={fila.regla_fecha.meses ?? ""}
            onChange={(e) => onChange({ ...fila, regla_fecha: { ...fila.regla_fecha, meses: parseInt(e.target.value) || 0 } })}
            className={cn("w-10 bg-transparent text-white text-center focus:outline-none border-b border-transparent focus:border-[rgba(var(--site-primary-rgb),0.3)]", fontSize.md)}
            title="Meses desde reserva"
          />
        )}
        {fila.regla_fecha.tipo === "al_avance" && (
          <div className={cn("flex items-center", gap.compact)}>
            <input type="number" min={1} max={100} value={fila.regla_fecha.porcentaje_avance ?? ""}
              onChange={(e) => onChange({ ...fila, regla_fecha: { ...fila.regla_fecha, porcentaje_avance: parseInt(e.target.value) || 0 } })}
              className={cn("w-10 bg-transparent text-white text-center focus:outline-none border-b border-transparent focus:border-[rgba(var(--site-primary-rgb),0.3)]", fontSize.md)}
              title="Porcentaje de avance"
            />
            <span className={cn("text-[var(--text-muted)]", fontSize.label)}>%</span>
          </div>
        )}
      </div>

      <button onClick={onRemove} className="p-1 text-[var(--text-muted)] hover:text-red-400 transition-colors justify-self-center">
        <Trash2 size={13} />
      </button>
    </Reorder.Item>
  );
}

/* ─── Main PlantillaEditor ─── */

export function PlantillaEditor({
  config,
  saveConfig,
  moneda: defaultMoneda,
}: {
  config: CotizadorConfig;
  saveConfig: (c: CotizadorConfig) => void;
  moneda: string;
}) {
  const plantillas = config.plantillas_pago ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(() => plantillas[0]?.id ?? null);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);

  const selected = plantillas.find((p) => p.id === selectedId) ?? null;
  const selectedMoneda = (selected?.moneda ?? defaultMoneda ?? "COP") as Currency;

  // ── CRUD helpers ──

  const updatePlantillas = useCallback(
    (updated: PlantillaPago[]) => { saveConfig({ ...config, plantillas_pago: updated }); },
    [config, saveConfig],
  );

  const addPlantilla = useCallback(() => {
    const newP = defaultTemplate(defaultMoneda);
    updatePlantillas([...plantillas, newP]);
    setSelectedId(newP.id);
    setShowQuickCreate(false);
    setEditingNameId(newP.id);
  }, [plantillas, updatePlantillas, defaultMoneda]);

  const duplicatePlantilla = useCallback(() => {
    if (!selected) return;
    const dup: PlantillaPago = {
      ...selected,
      id: uid(),
      nombre: `${selected.nombre} (copia)`,
      es_default: false,
      habilitada_micrositio: false,
      filas: selected.filas.map((f) => ({ ...f, id: uid() })),
      created_at: new Date().toISOString(),
      quick_def: selected.quick_def ? { ...selected.quick_def } : undefined,
    };
    updatePlantillas([...plantillas, dup]);
    setSelectedId(dup.id);
  }, [selected, plantillas, updatePlantillas]);

  const removePlantilla = useCallback(() => {
    if (!selected) return;
    const updated = plantillas.filter((p) => p.id !== selected.id);
    updatePlantillas(updated);
    setSelectedId(updated[0]?.id ?? null);
  }, [selected, plantillas, updatePlantillas]);

  const updateSelected = useCallback(
    (patch: Partial<PlantillaPago>) => {
      if (!selected) return;
      updatePlantillas(plantillas.map((p) => (p.id === selected.id ? { ...p, ...patch } : p)));
    },
    [selected, plantillas, updatePlantillas],
  );

  const toggleDefault = useCallback(() => {
    if (!selected) return;
    const newDefault = !selected.es_default;
    updatePlantillas(plantillas.map((p) => ({ ...p, es_default: p.id === selected.id ? newDefault : false })));
  }, [selected, plantillas, updatePlantillas]);

  const toggleMicrositio = useCallback(() => {
    if (!selected) return;
    const newVal = !selected.habilitada_micrositio;
    updatePlantillas(plantillas.map((p) => ({ ...p, habilitada_micrositio: p.id === selected.id ? newVal : false })));
  }, [selected, plantillas, updatePlantillas]);

  // ── Fila CRUD ──

  const updateFila = useCallback((id: string, updated: PlantillaPagoFila) => {
    if (!selected) return;
    updateSelected({ filas: selected.filas.map((f) => (f.id === id ? updated : f)), quick_def: undefined });
  }, [selected, updateSelected]);

  const removeFila = useCallback((id: string) => {
    if (!selected) return;
    updateSelected({ filas: selected.filas.filter((f) => f.id !== id), quick_def: undefined });
  }, [selected, updateSelected]);

  const addFila = useCallback(() => {
    if (!selected) return;
    updateSelected({ filas: [...selected.filas, defaultFila()], quick_def: undefined });
  }, [selected, updateSelected]);

  const reorderFilas = useCallback((newOrder: PlantillaPagoFila[]) => {
    if (!selected) return;
    updateSelected({ filas: newOrder });
  }, [selected, updateSelected]);

  // ── Quick edit (regenerate from quick_def) ──

  const updateQuickDef = useCallback((patch: Partial<PlantillaQuickDef>) => {
    if (!selected?.quick_def) return;
    const newDef = { ...selected.quick_def, ...patch };
    const regenerated = expandQuickDef(newDef, selected.nombre);
    updateSelected({ filas: regenerated.filas, quick_def: newDef });
  }, [selected, updateSelected]);

  // ── Cargos adicionales CRUD ──

  const addCargo = useCallback(() => {
    if (!selected) return;
    const newCargo: CargoAdicional = { id: uid(), nombre: "", tipo: "porcentaje", valor: 0 };
    updateSelected({ cargos_adicionales: [...(selected.cargos_adicionales ?? []), newCargo] });
  }, [selected, updateSelected]);

  const updateCargo = useCallback((id: string, updated: CargoAdicional) => {
    if (!selected) return;
    updateSelected({ cargos_adicionales: (selected.cargos_adicionales ?? []).map((c) => c.id === id ? updated : c) });
  }, [selected, updateSelected]);

  const removeCargo = useCallback((id: string) => {
    if (!selected) return;
    updateSelected({ cargos_adicionales: (selected.cargos_adicionales ?? []).filter((c) => c.id !== id) });
  }, [selected, updateSelected]);

  // ── Validation ──

  const validation = selected ? validateTemplate(selected) : null;
  const pctTotal = selected ? templatePctTotal(selected) : 0;
  const hasResto = selected?.filas.some((f) => f.tipo_valor === "resto") ?? false;

  return (
    <div className={cn("flex flex-col", gap.relaxed)}>

      {/* ── Template list ──────────────────────────────────────────────── */}
      <div className={cn("flex flex-col", gap.compact)}>
        {plantillas.map((p) => (
          <TemplateCard key={p.id} plantilla={p}
            isSelected={p.id === selectedId}
            isEditingName={editingNameId === p.id}
            onSelect={() => { setSelectedId(p.id); setShowQuickCreate(false); setEditingNameId(null); }}
            onRename={(name) => updatePlantillas(plantillas.map((t) => t.id === p.id ? { ...t, nombre: name } : t))}
            onStartEditing={() => setEditingNameId(p.id)}
            onStopEditing={() => setEditingNameId(null)}
          />
        ))}

        {/* Empty state */}
        {plantillas.length === 0 && (
          <div className={cn("border-2 border-dashed border-[var(--border-default)] py-8 flex flex-col items-center justify-center", radius.xl, gap.relaxed)}>
            <p className={cn("text-[var(--text-muted)]", fontSize.md)}>Sin plantillas configuradas</p>
            <button onClick={addPlantilla}
              className={cn("px-5 py-2.5 font-ui text-[10px] font-bold uppercase tracking-[0.1em] transition-all bg-[var(--site-primary)] text-[var(--surface-0)] hover:brightness-110", radius.md)}
            ><Plus size={13} className="inline -mt-0.5 mr-1.5" />Crear plantilla</button>
          </div>
        )}

        {/* Create button */}
        {plantillas.length > 0 && (
          <button onClick={addPlantilla}
            className={cn("w-full flex items-center justify-center py-2.5 border border-dashed transition-all", radius.lg,
              "border-[var(--border-default)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text-secondary)]",
              gap.compact, fontSize.md,
            )}
          ><Plus size={14} />Nueva plantilla</button>
        )}
      </div>

      {/* ── Selected template editor ───────────────────────────────────── */}
      {selected && (
        <div className={cn("bg-[var(--surface-1)] border border-[var(--border-subtle)] p-5", radius.xl, "flex flex-col", gap.relaxed)}>

          {/* Header: toggles + actions */}
          <div className={cn("flex items-center flex-wrap", gap.relaxed)}>
            <div className="flex-1" />
            <button onClick={toggleDefault}
              className={cn("px-3 py-1.5 border transition-all", radius.md, fontSize.label, "font-ui font-bold uppercase tracking-wider",
                selected.es_default
                  ? "border-[rgba(var(--site-primary-rgb),0.6)] bg-[rgba(var(--site-primary-rgb),0.1)] text-[var(--site-primary)]"
                  : "border-[var(--border-default)] bg-[var(--surface-3)] text-[var(--text-tertiary)] hover:border-[var(--border-strong)]",
              )}
            >{selected.es_default ? "★ Default" : "Marcar default"}</button>
            <button onClick={toggleMicrositio}
              className={cn("px-3 py-1.5 border transition-all flex items-center", radius.md, fontSize.label, "font-ui font-bold uppercase tracking-wider", gap.compact,
                selected.habilitada_micrositio
                  ? "border-[rgba(var(--site-primary-rgb),0.6)] bg-[rgba(var(--site-primary-rgb),0.1)] text-[var(--site-primary)]"
                  : "border-[var(--border-default)] bg-[var(--surface-3)] text-[var(--text-tertiary)] hover:border-[var(--border-strong)]",
              )}
            ><Globe size={11} />{selected.habilitada_micrositio ? "Micrositio ✓" : "Micrositio"}</button>
            <button onClick={duplicatePlantilla} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors" title="Duplicar"><Copy size={14} /></button>
            <button onClick={removePlantilla} className="p-1.5 text-[var(--text-muted)] hover:text-red-400 transition-colors" title="Eliminar"><Trash2 size={14} /></button>
          </div>

          {/* ── Configuración general ── */}
          <SectionHeader icon={Banknote} title="Configuración general"
            tooltip="Moneda, título y tipo de entrega para esta plantilla. Cada plantilla puede tener su propia configuración independiente."
          />

          {/* Título (display name in cotización) */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Type size={iconSize.xs} className={iconColor.muted} />
              <FieldLabel className="mb-0">Título en cotización</FieldLabel>
            </div>
            <input type="text" value={selected.titulo ?? ""}
              onChange={(e) => updateSelected({ titulo: e.target.value || undefined })}
              className={cn(inputClass, fontSize.md)} placeholder="ej. Plan de Pagos 30/70"
            />
            <Hint>Aparece como encabezado en el PDF y en el micrositio.</Hint>
          </div>

          {/* Config row: moneda + tipo entrega */}
          <div className={cn("grid grid-cols-2", gap.relaxed)}>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Coins size={iconSize.xs} className={iconColor.muted} />
                <FieldLabel className="mb-0">Moneda</FieldLabel>
              </div>
              <div className="w-32">
                <NodDoDropdown variant="dashboard" size="md"
                  value={selected.moneda ?? defaultMoneda}
                  onChange={(val) => updateSelected({ moneda: val })}
                  options={MONEDAS.map((m) => ({ value: m.value, label: m.label }))}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Truck size={iconSize.xs} className={iconColor.muted} />
                <FieldLabel className="mb-0">Tipo de entrega</FieldLabel>
              </div>
              <div className="flex gap-1.5">
                {([
                  { value: null, label: "Sin config" },
                  { value: "fecha_fija" as const, label: "Fecha fija" },
                  { value: "plazo_desde_compra" as const, label: "Plazo" },
                ] as const).map((opt) => (
                  <button key={String(opt.value)} type="button"
                    onClick={() => updateSelected({ tipo_entrega: opt.value, ...(opt.value === null ? { fecha_estimada_entrega: undefined, plazo_entrega_meses: undefined } : {}) })}
                    className={cn("flex-1 px-2 py-1.5 border text-center transition-colors", radius.lg, fontSize.label,
                      (selected.tipo_entrega ?? null) === opt.value
                        ? "border-[rgba(var(--site-primary-rgb),0.6)] bg-[rgba(var(--site-primary-rgb),0.1)] text-[var(--site-primary)]"
                        : "border-[var(--border-default)] bg-[var(--surface-3)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                    )}
                  >{opt.label}</button>
                ))}
              </div>
              {selected.tipo_entrega === "fecha_fija" && (
                <input type="date" value={selected.fecha_estimada_entrega ?? ""}
                  onChange={(e) => updateSelected({ fecha_estimada_entrega: e.target.value || undefined })}
                  className={cn(inputClass, fontSize.md, "mt-2")}
                />
              )}
              {selected.tipo_entrega === "plazo_desde_compra" && (
                <div className="flex items-center gap-2 mt-2">
                  <input type="number" value={selected.plazo_entrega_meses ?? 24}
                    onChange={(e) => updateSelected({ plazo_entrega_meses: parseInt(e.target.value) || 24 })}
                    min={6} max={120} className={cn(inputClass, fontSize.md, "w-20")}
                  />
                  <span className={cn("text-[var(--text-muted)]", fontSize.caption)}>meses</span>
                </div>
              )}
            </div>
          </div>

          {/* Separación toggle */}
          <label className={cn("flex items-center cursor-pointer px-4 py-3 bg-[var(--surface-2)] border border-[var(--border-subtle)]", radius.lg, gap.relaxed)}>
            <ToggleLeft size={iconSize.sm} className={selected.separacion_incluida_en_inicial ? iconColor.primary : iconColor.muted} />
            <input type="checkbox"
              checked={selected.separacion_incluida_en_inicial ?? true}
              onChange={(e) => updateSelected({ separacion_incluida_en_inicial: e.target.checked })}
              className="w-4 h-4 rounded bg-[var(--surface-3)] border border-[var(--border-default)] accent-[var(--site-primary)]"
            />
            <div>
              <span className={cn("text-[var(--text-secondary)]", fontSize.md)}>La separación se descuenta de la cuota inicial</span>
              <p className={cn("text-[var(--text-muted)]", fontSize.caption)}>Si está activo, la separación no se suma como pago adicional.</p>
            </div>
          </label>

          {/* Quick edit bar */}
          {selected.quick_def && (
            <div className={cn("flex flex-wrap items-center px-4 py-3 border bg-[rgba(var(--site-primary-rgb),0.04)] border-[rgba(var(--site-primary-rgb),0.12)]", radius.lg, gap.relaxed)}>
              <Sparkles size={12} className="text-[var(--site-primary)] shrink-0" />
              <div className={cn("flex items-center", gap.compact)}>
                <span className={cn("text-[var(--text-muted)] uppercase", fontSize.label, letterSpacing.wider)}>Inicial</span>
                <input type="number" value={selected.quick_def.porcentaje_inicial || ""}
                  onChange={(e) => updateQuickDef({ porcentaje_inicial: Math.min(100, Math.max(0, Number(e.target.value))) })}
                  className={cn("w-12 bg-transparent text-white text-center focus:outline-none border-b border-[rgba(var(--site-primary-rgb),0.3)]", fontSize.md)}
                />
                <span className={cn("text-[var(--text-muted)]", fontSize.md)}>%</span>
              </div>
              <div className={cn("flex items-center", gap.compact)}>
                <span className={cn("text-[var(--text-muted)] uppercase", fontSize.label, letterSpacing.wider)}>en</span>
                <input type="number" value={selected.quick_def.cuotas || ""}
                  onChange={(e) => updateQuickDef({ cuotas: Math.max(1, Number(e.target.value)) })}
                  className={cn("w-10 bg-transparent text-white text-center focus:outline-none border-b border-[rgba(var(--site-primary-rgb),0.3)]", fontSize.md)}
                  min={1}
                />
                <span className={cn("text-[var(--text-muted)]", fontSize.md)}>cuotas</span>
              </div>
              <NodDoDropdown variant="dashboard" size="sm"
                value={selected.quick_def.frecuencia}
                onChange={(val) => updateQuickDef({ frecuencia: val as PlantillaQuickDef["frecuencia"] })}
                options={FRECUENCIAS.map((f) => ({ value: f.value, label: f.label }))}
              />
            </div>
          )}

          {/* ── Filas de pago ── */}
          <SectionHeader icon={ListOrdered} title="Filas de pago"
            tooltip="Define cada cuota o pago del plan. Puedes usar porcentajes, montos fijos, o 'resto' para el saldo pendiente. Arrastra para reordenar."
          />

          {/* Empty state: show quick/manual choice */}
          {selected.filas.length === 0 && !showQuickCreate && (
            <div className={cn("border-2 border-dashed border-[var(--border-default)] py-6 flex flex-col items-center justify-center", radius.lg, gap.relaxed)}>
              <div className={cn("flex items-center", gap.normal)}>
                <button onClick={() => setShowQuickCreate(true)}
                  className={cn("flex flex-col items-center justify-center px-6 py-4 border transition-all", radius.lg, gap.compact,
                    "border-[rgba(var(--site-primary-rgb),0.3)] bg-[rgba(var(--site-primary-rgb),0.06)] text-[var(--site-primary)] hover:bg-[rgba(var(--site-primary-rgb),0.12)]",
                    "w-48",
                  )}
                >
                  <Sparkles size={18} />
                  <span className={cn("font-ui font-bold uppercase", fontSize.label, letterSpacing.wider)}>Creación rápida</span>
                  <span className={cn("text-[var(--text-muted)] text-center", fontSize.caption)}>Define % inicial, cuotas y frecuencia</span>
                </button>
                <button onClick={addFila}
                  className={cn("flex flex-col items-center justify-center px-6 py-4 border transition-all", radius.lg, gap.compact,
                    "border-[var(--border-default)] bg-[var(--surface-2)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)]",
                    "w-48",
                  )}
                >
                  <Plus size={18} />
                  <span className={cn("font-ui font-bold uppercase", fontSize.label, letterSpacing.wider)}>Manual</span>
                  <span className={cn("text-[var(--text-muted)] text-center", fontSize.caption)}>Agrega filas una por una con total control</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick create panel (inline) */}
          {selected.filas.length === 0 && showQuickCreate && (
            <QuickCreatePanel
              moneda={selectedMoneda}
              onConfirm={(filas, quickDef) => {
                updateSelected({ filas, quick_def: quickDef });
                setShowQuickCreate(false);
              }}
              onCancel={() => setShowQuickCreate(false)}
            />
          )}

          {/* Filas table (when filas exist) */}
          {selected.filas.length > 0 && (
            <>
              <div className={cn("grid grid-cols-[20px_1fr_100px_140px_28px] items-center px-3", gap.normal)}>
                <span />
                <span className={cn("text-[var(--text-muted)] uppercase", fontSize.label, letterSpacing.wider, "font-ui font-bold")}>Descripción</span>
                <span className={cn("text-[var(--text-muted)] uppercase", fontSize.label, letterSpacing.wider, "font-ui font-bold")}>Valor</span>
                <span className={cn("text-[var(--text-muted)] uppercase", fontSize.label, letterSpacing.wider, "font-ui font-bold")}>Fecha</span>
                <span />
              </div>

              <Reorder.Group axis="y" values={selected.filas} onReorder={reorderFilas} className={cn("flex flex-col", gap.compact)}>
                {selected.filas.map((fila) => (
                  <FilaRow key={fila.id} fila={fila}
                    onChange={(updated) => updateFila(fila.id, updated)}
                    onRemove={() => removeFila(fila.id)}
                    moneda={selectedMoneda}
                  />
                ))}
              </Reorder.Group>

              <button onClick={addFila}
                className={cn("flex items-center text-[var(--site-primary)] hover:text-[var(--site-primary)]/80 transition-colors", gap.compact, fontSize.md)}
              ><Plus size={13} /> Agregar fila</button>

              {/* Validation bar */}
              <div className={cn("flex items-center justify-between px-4 py-2.5 border", radius.lg,
                validation?.valid
                  ? "bg-[rgba(var(--site-primary-rgb),0.05)] border-[rgba(var(--site-primary-rgb),0.15)]"
                  : "bg-red-500/5 border-red-500/15",
              )}>
                <div className={cn("flex items-center", gap.relaxed)}>
                  <span className={cn("font-mono font-medium", fontSize.md, validation?.valid ? "text-[var(--site-primary)]" : "text-red-400")}>{pctTotal}%</span>
                  <span className={cn("text-[var(--text-muted)]", fontSize.label)}>asignado{hasResto ? ` + resto (${100 - pctTotal}%)` : ""}</span>
                </div>
                {validation && !validation.valid && (
                  <span className={cn("text-red-400", fontSize.label)}>{validation.errors[0]}</span>
                )}
              </div>
            </>
          )}

          {/* ── Cargos adicionales ── */}
          <SectionHeader icon={Receipt} title="Cargos adicionales"
            tooltip="Impuestos, fees y cargos que se suman al precio total. Ej: DLD Fee 4%, Admin Fee, IVA. Se aplican sobre el precio neto de la unidad."
          />

          {(selected.cargos_adicionales ?? []).length === 0 && (
            <Hint>Sin cargos configurados. Agrega impuestos, fees o cargos administrativos.</Hint>
          )}
          {(selected.cargos_adicionales ?? []).map((cargo) => (
            <div key={cargo.id} className={cn("grid grid-cols-[1fr_100px_80px_28px] items-center", gap.normal)}>
              <input type="text" value={cargo.nombre} onChange={(e) => updateCargo(cargo.id, { ...cargo, nombre: e.target.value })}
                className={cn(inputClass, fontSize.md)} placeholder="ej. DLD Fee, Admin Fee, VAT"
              />
              <NodDoDropdown
                variant="dashboard"
                size="sm"
                value={cargo.tipo}
                onChange={(val) => updateCargo(cargo.id, { ...cargo, tipo: val as "porcentaje" | "fijo", valor: 0 })}
                options={[
                  { value: "porcentaje", label: "%" },
                  { value: "fijo", label: selectedMoneda },
                ]}
              />
              {cargo.tipo === "porcentaje" ? (
                <div className="flex items-center gap-1">
                  <input type="number" value={cargo.valor || ""} onChange={(e) => updateCargo(cargo.id, { ...cargo, valor: Number(e.target.value) })}
                    className={cn("w-full bg-[var(--surface-3)] border border-[var(--border-default)] px-2 py-1.5 text-white focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)] text-center", radius.lg, fontSize.md)}
                    placeholder="4" step="0.1"
                  />
                  <span className={cn("text-[var(--text-muted)]", fontSize.label)}>%</span>
                </div>
              ) : (
                <CurrencyInput value={cargo.valor || ""} onChange={(v) => updateCargo(cargo.id, { ...cargo, valor: Number(v) || 0 })}
                  currency={selectedMoneda}
                  inputClassName={cn("w-full bg-[var(--surface-3)] border border-[var(--border-default)] px-2 py-1.5 text-white focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]", radius.lg, fontSize.md)}
                  placeholder="0"
                />
              )}
              <button onClick={() => removeCargo(cargo.id)} className="p-1 text-[var(--text-muted)] hover:text-red-400 transition-colors justify-self-center">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          <button onClick={addCargo}
            className={cn("flex items-center text-[var(--site-primary)] hover:text-[var(--site-primary)]/80 transition-colors", gap.compact, fontSize.md)}
          ><Plus size={13} /> Agregar cargo</button>

          {/* ── Notas legales ── */}
          <SectionHeader icon={Scale} title="Notas legales"
            tooltip="Texto legal que aparece al final de la cotización (PDF y micrositio). Usa este campo para disclaimers, términos y condiciones."
          />
          <textarea value={selected.notas_legales ?? ""}
            onChange={(e) => updateSelected({ notas_legales: e.target.value || null })}
            rows={2} className={cn(inputClass, "resize-none", fontSize.md)}
            placeholder="Los precios están sujetos a cambios sin previo aviso..."
          />
          <Hint>Aparece al final del PDF de cotización y en el plan de pagos del micrositio.</Hint>
        </div>
      )}
    </div>
  );
}
