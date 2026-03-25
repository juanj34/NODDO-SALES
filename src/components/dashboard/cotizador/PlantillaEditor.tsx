"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Plus, Trash2, GripVertical, Copy } from "lucide-react";
import { Reorder, useDragControls } from "framer-motion";
import type { CotizadorConfig, PlantillaPago, PlantillaPagoFila, ReglaFecha } from "@/types";
import { NodDoDropdown } from "@/components/ui/NodDoDropdown";
import { CurrencyInput } from "@/components/dashboard/CurrencyInput";
import type { Currency } from "@/lib/currency";
import { fontSize, gap, letterSpacing, radius } from "@/lib/design-tokens";
import { templatePctTotal, validateTemplate } from "@/lib/cotizador/plantilla-pago";

/* ─── Helpers ─── */

function uid(): string {
  return crypto.randomUUID();
}

const DATE_RULE_OPTIONS = [
  { value: "al_reservar", label: "Al reservar" },
  { value: "meses_desde_reserva", label: "+ N meses" },
  { value: "al_completar", label: "Al completar" },
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

function defaultTemplate(): PlantillaPago {
  return {
    id: uid(),
    nombre: "Nuevo plan",
    filas: [
      { id: uid(), nombre: "Reserva", tipo_valor: "porcentaje", valor: 10, regla_fecha: { tipo: "al_reservar" } },
      { id: uid(), nombre: "Cuota 1", tipo_valor: "porcentaje", valor: 10, regla_fecha: { tipo: "meses_desde_reserva", meses: 1 } },
      { id: uid(), nombre: "Entrega", tipo_valor: "resto", valor: 0, regla_fecha: { tipo: "al_completar" } },
    ],
    es_default: false,
    created_at: new Date().toISOString(),
  };
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

  return (
    <Reorder.Item
      value={fila}
      dragListener={false}
      dragControls={controls}
      className={cn(
        "bg-[var(--surface-2)] border border-[var(--border-subtle)] p-3 select-none",
        radius.lg,
        "grid grid-cols-[20px_1fr_100px_120px_28px] items-center",
        gap.normal,
      )}
    >
      {/* Drag handle */}
      <button
        onPointerDown={(e) => { e.preventDefault(); controls.start(e); }}
        className="cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--text-tertiary)] touch-none"
      >
        <GripVertical size={13} />
      </button>

      {/* Name + value */}
      <div className={cn("flex items-center", gap.normal, "min-w-0")}>
        <input
          type="text"
          value={fila.nombre}
          onChange={(e) => onChange({ ...fila, nombre: e.target.value })}
          className={cn(
            "flex-1 bg-transparent border-none text-white focus:outline-none placeholder:text-[var(--text-muted)] min-w-0",
            fontSize.md,
          )}
          placeholder="Nombre"
        />
      </div>

      {/* Type + value */}
      <div className={cn("flex items-center", gap.compact)}>
        {isResto ? (
          <span className={cn("text-[var(--site-primary)] bg-[rgba(var(--site-primary-rgb),0.1)] px-2 py-1 font-mono", radius.sm, fontSize.label)}>
            Resto
          </span>
        ) : (
          <>
            <button
              onClick={() =>
                onChange({
                  ...fila,
                  tipo_valor: fila.tipo_valor === "porcentaje" ? "fijo" : "porcentaje",
                  valor: 0,
                })
              }
              className={cn(
                "shrink-0 w-6 h-6 rounded text-[10px] font-ui font-bold transition-all border",
                fila.tipo_valor === "porcentaje"
                  ? "bg-[rgba(var(--site-primary-rgb),0.15)] border-[rgba(var(--site-primary-rgb),0.3)] text-[var(--site-primary)]"
                  : "bg-[var(--surface-3)] border-[var(--border-subtle)] text-[var(--text-tertiary)]",
              )}
              title={fila.tipo_valor === "porcentaje" ? "Cambiar a monto fijo" : "Cambiar a porcentaje"}
            >
              {fila.tipo_valor === "porcentaje" ? "%" : "$"}
            </button>
            {fila.tipo_valor === "porcentaje" ? (
              <input
                type="number"
                value={fila.valor || ""}
                onChange={(e) => onChange({ ...fila, valor: parseFloat(e.target.value) || 0 })}
                className={cn(
                  "w-14 bg-transparent text-white focus:outline-none border-b border-transparent focus:border-[rgba(var(--site-primary-rgb),0.3)] min-w-0",
                  fontSize.md,
                )}
                placeholder="0"
                step="0.5"
              />
            ) : (
              <CurrencyInput
                value={fila.valor || ""}
                onChange={(v) => onChange({ ...fila, valor: Number(v) })}
                currency={moneda as Currency}
                inputClassName={cn(
                  "w-full bg-transparent text-white focus:outline-none border-b border-transparent focus:border-[rgba(var(--site-primary-rgb),0.3)] min-w-0",
                  fontSize.md,
                )}
              />
            )}
          </>
        )}
      </div>

      {/* Date rule */}
      <div className={cn("flex items-center", gap.compact)}>
        <NodDoDropdown
          variant="dashboard"
          size="sm"
          value={fila.regla_fecha.tipo}
          onChange={(val) => {
            const newRegla: ReglaFecha = { tipo: val as ReglaFecha["tipo"] };
            if (val === "meses_desde_reserva") newRegla.meses = fila.regla_fecha.meses ?? 1;
            onChange({ ...fila, regla_fecha: newRegla });
          }}
          options={DATE_RULE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        />
        {fila.regla_fecha.tipo === "meses_desde_reserva" && (
          <input
            type="number"
            min={0}
            value={fila.regla_fecha.meses ?? ""}
            onChange={(e) =>
              onChange({
                ...fila,
                regla_fecha: { ...fila.regla_fecha, meses: parseInt(e.target.value) || 0 },
              })
            }
            className={cn(
              "w-10 bg-transparent text-white text-center focus:outline-none border-b border-transparent focus:border-[rgba(var(--site-primary-rgb),0.3)]",
              fontSize.md,
            )}
            title="Meses desde reserva"
          />
        )}
      </div>

      {/* Delete */}
      <button
        onClick={onRemove}
        className="p-1 text-[var(--text-muted)] hover:text-red-400 transition-colors justify-self-center"
      >
        <Trash2 size={13} />
      </button>
    </Reorder.Item>
  );
}

/* ─── Main PlantillaEditor ─── */

export function PlantillaEditor({
  config,
  saveConfig,
  moneda,
}: {
  config: CotizadorConfig;
  saveConfig: (c: CotizadorConfig) => void;
  moneda: string;
}) {
  const plantillas = config.plantillas_pago ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(
    () => plantillas[0]?.id ?? null,
  );

  const selected = plantillas.find((p) => p.id === selectedId) ?? null;

  // ── CRUD helpers ──

  const updatePlantillas = useCallback(
    (updated: PlantillaPago[]) => {
      saveConfig({ ...config, plantillas_pago: updated });
    },
    [config, saveConfig],
  );

  const addPlantilla = useCallback(() => {
    const newP = defaultTemplate();
    const updated = [...plantillas, newP];
    updatePlantillas(updated);
    setSelectedId(newP.id);
  }, [plantillas, updatePlantillas]);

  const duplicatePlantilla = useCallback(() => {
    if (!selected) return;
    const dup: PlantillaPago = {
      ...selected,
      id: uid(),
      nombre: `${selected.nombre} (copia)`,
      es_default: false,
      filas: selected.filas.map((f) => ({ ...f, id: uid() })),
      created_at: new Date().toISOString(),
    };
    const updated = [...plantillas, dup];
    updatePlantillas(updated);
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
      updatePlantillas(
        plantillas.map((p) => (p.id === selected.id ? { ...p, ...patch } : p)),
      );
    },
    [selected, plantillas, updatePlantillas],
  );

  const toggleDefault = useCallback(() => {
    if (!selected) return;
    const newDefault = !selected.es_default;
    updatePlantillas(
      plantillas.map((p) => ({
        ...p,
        es_default: p.id === selected.id ? newDefault : false,
      })),
    );
  }, [selected, plantillas, updatePlantillas]);

  // ── Fila CRUD ──

  const updateFila = useCallback(
    (id: string, updated: PlantillaPagoFila) => {
      if (!selected) return;
      updateSelected({
        filas: selected.filas.map((f) => (f.id === id ? updated : f)),
      });
    },
    [selected, updateSelected],
  );

  const removeFila = useCallback(
    (id: string) => {
      if (!selected) return;
      updateSelected({ filas: selected.filas.filter((f) => f.id !== id) });
    },
    [selected, updateSelected],
  );

  const addFila = useCallback(() => {
    if (!selected) return;
    updateSelected({ filas: [...selected.filas, defaultFila()] });
  }, [selected, updateSelected]);

  const reorderFilas = useCallback(
    (newOrder: PlantillaPagoFila[]) => {
      if (!selected) return;
      updateSelected({ filas: newOrder });
    },
    [selected, updateSelected],
  );

  // ── Validation ──

  const validation = selected ? validateTemplate(selected) : null;
  const pctTotal = selected ? templatePctTotal(selected) : 0;
  const hasResto = selected?.filas.some((f) => f.tipo_valor === "resto") ?? false;

  return (
    <div className={cn("flex flex-col", gap.relaxed)}>
      {/* Template tabs */}
      <div className={cn("flex items-center flex-wrap", gap.normal)}>
        {plantillas.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedId(p.id)}
            className={cn(
              "px-3 py-1.5 border text-center transition-all",
              radius.md, fontSize.label, "font-ui font-bold uppercase tracking-wider",
              p.id === selectedId
                ? "border-[rgba(var(--site-primary-rgb),0.6)] bg-[rgba(var(--site-primary-rgb),0.1)] text-[var(--site-primary)]"
                : "border-[var(--border-default)] bg-[var(--surface-3)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]",
              p.es_default && "ring-1 ring-[rgba(var(--site-primary-rgb),0.3)]",
            )}
          >
            {p.nombre}
            {p.es_default && <span className="ml-1 text-[8px] opacity-60">★</span>}
          </button>
        ))}
        <button
          onClick={addPlantilla}
          className={cn(
            "flex items-center text-[var(--site-primary)] hover:text-[var(--site-primary)]/80 transition-colors",
            gap.compact, fontSize.md,
          )}
        >
          <Plus size={13} /> Nueva plantilla
        </button>
      </div>

      {/* Selected template editor */}
      {selected && (
        <div className={cn("bg-[var(--surface-1)] border border-[var(--border-subtle)] p-5", radius.xl, "flex flex-col", gap.relaxed)}>
          {/* Header: name + default + actions */}
          <div className={cn("flex items-center flex-wrap", gap.relaxed)}>
            <input
              type="text"
              value={selected.nombre}
              onChange={(e) => updateSelected({ nombre: e.target.value })}
              className={cn(
                "flex-1 bg-transparent border-none font-medium text-white focus:outline-none placeholder:text-[var(--text-muted)] min-w-[200px]",
                fontSize.md,
              )}
              placeholder="Nombre del plan"
            />
            <button
              onClick={toggleDefault}
              className={cn(
                "px-3 py-1.5 border transition-all",
                radius.md, fontSize.label, "font-ui font-bold uppercase tracking-wider",
                selected.es_default
                  ? "border-[rgba(var(--site-primary-rgb),0.6)] bg-[rgba(var(--site-primary-rgb),0.1)] text-[var(--site-primary)]"
                  : "border-[var(--border-default)] bg-[var(--surface-3)] text-[var(--text-tertiary)] hover:border-[var(--border-strong)]",
              )}
            >
              {selected.es_default ? "★ Default" : "Marcar default"}
            </button>
            <button
              onClick={duplicatePlantilla}
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              title="Duplicar plantilla"
            >
              <Copy size={14} />
            </button>
            <button
              onClick={removePlantilla}
              className="p-1.5 text-[var(--text-muted)] hover:text-red-400 transition-colors"
              title="Eliminar plantilla"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* Column headers */}
          <div className={cn(
            "grid grid-cols-[20px_1fr_100px_120px_28px] items-center px-3",
            gap.normal,
          )}>
            <span />
            <span className={cn("text-[var(--text-muted)] uppercase", fontSize.label, letterSpacing.wider, "font-ui font-bold")}>Descripción</span>
            <span className={cn("text-[var(--text-muted)] uppercase", fontSize.label, letterSpacing.wider, "font-ui font-bold")}>Valor</span>
            <span className={cn("text-[var(--text-muted)] uppercase", fontSize.label, letterSpacing.wider, "font-ui font-bold")}>Fecha</span>
            <span />
          </div>

          {/* Rows */}
          <Reorder.Group
            axis="y"
            values={selected.filas}
            onReorder={reorderFilas}
            className={cn("flex flex-col", gap.compact)}
          >
            {selected.filas.map((fila) => (
              <FilaRow
                key={fila.id}
                fila={fila}
                onChange={(updated) => updateFila(fila.id, updated)}
                onRemove={() => removeFila(fila.id)}
                moneda={moneda}
              />
            ))}
          </Reorder.Group>

          {/* Add row */}
          <button
            onClick={addFila}
            className={cn(
              "flex items-center text-[var(--site-primary)] hover:text-[var(--site-primary)]/80 transition-colors",
              gap.compact, fontSize.md,
            )}
          >
            <Plus size={13} /> Agregar fila
          </button>

          {/* Validation bar */}
          <div className={cn(
            "flex items-center justify-between px-4 py-2.5 border",
            radius.lg,
            validation?.valid
              ? "bg-[rgba(var(--site-primary-rgb),0.05)] border-[rgba(var(--site-primary-rgb),0.15)]"
              : "bg-red-500/5 border-red-500/15",
          )}>
            <div className={cn("flex items-center", gap.relaxed)}>
              <span className={cn("font-mono font-medium", fontSize.md, validation?.valid ? "text-[var(--site-primary)]" : "text-red-400")}>
                {pctTotal}%
              </span>
              <span className={cn("text-[var(--text-muted)]", fontSize.label)}>
                asignado{hasResto ? ` + resto (${100 - pctTotal}%)` : ""}
              </span>
            </div>
            {validation && !validation.valid && (
              <span className={cn("text-red-400", fontSize.label)}>
                {validation.errors[0]}
              </span>
            )}
          </div>
        </div>
      )}

      {plantillas.length === 0 && (
        <p className={cn("text-[var(--text-muted)] py-3", fontSize.md)}>
          Sin plantillas configuradas. Crea una para definir planes de pago flexibles.
        </p>
      )}
    </div>
  );
}
