"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TipologiaFieldsConfig } from "@/types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TipologiaQuickAdd {
  nombre: string;
  area_m2?: number;
  habitaciones?: number;
  banos?: number;
}

interface StepCrearTipologiasProps {
  tipologias: TipologiaQuickAdd[];
  onAdd: (t: TipologiaQuickAdd) => void;
  onRemove: (index: number) => void;
  fields: TipologiaFieldsConfig;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function StepCrearTipologias({
  tipologias,
  onAdd,
  onRemove,
  fields,
}: StepCrearTipologiasProps) {
  const [nombre, setNombre] = useState("");
  const [areaM2, setAreaM2] = useState("");
  const [habitaciones, setHabitaciones] = useState("");
  const [banos, setBanos] = useState("");

  function handleAdd() {
    const trimmed = nombre.trim();
    if (!trimmed) return;

    const entry: TipologiaQuickAdd = { nombre: trimmed };
    if (fields.area_m2 && areaM2) entry.area_m2 = Number(areaM2);
    if (fields.habitaciones && habitaciones)
      entry.habitaciones = Number(habitaciones);
    if (fields.banos && banos) entry.banos = Number(banos);

    onAdd(entry);
    setNombre("");
    setAreaM2("");
    setHabitaciones("");
    setBanos("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ---- Quick-add form ---- */}
      <div className="flex items-end gap-2">
        {/* Nombre */}
        <div className="flex flex-1 flex-col gap-1">
          <label className="font-ui text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">
            Nombre
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ej: Tipo A, Penthouse..."
            className="input-glass w-full text-[13px]"
          />
        </div>

        {/* Conditional number inputs */}
        {fields.area_m2 && (
          <div className="flex w-20 flex-col gap-1">
            <label className="font-ui text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">
              Área
            </label>
            <input
              type="number"
              value={areaM2}
              onChange={(e) => setAreaM2(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="m²"
              min={0}
              className="input-glass w-full text-[13px]"
            />
          </div>
        )}

        {fields.habitaciones && (
          <div className="flex w-20 flex-col gap-1">
            <label className="font-ui text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">
              Hab.
            </label>
            <input
              type="number"
              value={habitaciones}
              onChange={(e) => setHabitaciones(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Hab."
              min={0}
              className="input-glass w-full text-[13px]"
            />
          </div>
        )}

        {fields.banos && (
          <div className="flex w-20 flex-col gap-1">
            <label className="font-ui text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">
              Baños
            </label>
            <input
              type="number"
              value={banos}
              onChange={(e) => setBanos(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Baños"
              min={0}
              className="input-glass w-full text-[13px]"
            />
          </div>
        )}

        {/* Add button */}
        <button
          type="button"
          onClick={handleAdd}
          disabled={!nombre.trim()}
          className={cn(
            "flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg border transition-colors",
            nombre.trim()
              ? "bg-[rgba(var(--noddo-primary-rgb),0.1)] border-[rgba(var(--noddo-primary-rgb),0.3)] text-[var(--noddo-primary)] hover:bg-[rgba(var(--noddo-primary-rgb),0.18)]"
              : "bg-[var(--surface-1)] border-[var(--border-subtle)] text-[var(--text-muted)] cursor-not-allowed"
          )}
        >
          <Plus size={16} />
        </button>
      </div>

      {/* ---- List of added tipologías ---- */}
      <div className="flex flex-col gap-1.5">
        {tipologias.length === 0 ? (
          <p className="py-6 text-center text-[12px] text-[var(--text-tertiary)]">
            No hay tipologías aún. Agrega al menos una para facilitar la
            configuración del inventario.
          </p>
        ) : (
          tipologias.map((t, i) => (
            <div
              key={`${t.nombre}-${i}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="truncate text-[13px] font-medium text-[var(--text-primary)]">
                  {t.nombre}
                </span>

                {/* Specs */}
                <div className="flex shrink-0 items-center gap-1.5">
                  {t.area_m2 != null && (
                    <span className="font-mono text-[11px] text-[var(--text-tertiary)]">
                      {t.area_m2}m²
                    </span>
                  )}
                  {t.habitaciones != null && (
                    <span className="font-mono text-[11px] text-[var(--text-tertiary)]">
                      {t.habitaciones} hab
                    </span>
                  )}
                  {t.banos != null && (
                    <span className="font-mono text-[11px] text-[var(--text-tertiary)]">
                      {t.banos} baños
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onRemove(i)}
                className="shrink-0 rounded p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text-secondary)]"
              >
                <X size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* ---- Hint ---- */}
      <p className="font-mono text-[10px] text-[var(--text-muted)]">
        Podrás agregar más tipologías y configurar todos los detalles después
      </p>
    </div>
  );
}
