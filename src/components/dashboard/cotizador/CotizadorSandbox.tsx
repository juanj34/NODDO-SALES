"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useEditorProject } from "@/hooks/useEditorProject";
import {
  inputClass,
  labelClass,
} from "@/components/dashboard/editor-styles";
import { cn } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import type { CotizadorConfig, ImpuestoConfig } from "@/types";
import { NodDoDropdown } from "@/components/ui/NodDoDropdown";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import type { Currency } from "@/lib/currency";
import { CurrencyInput } from "@/components/dashboard/CurrencyInput";
import tooltips from "@/i18n/locales/es/tooltips";
import { fontSize, gap, letterSpacing, radius } from "@/lib/design-tokens";

/* ─── Helpers ─── */

function uid(): string {
  return crypto.randomUUID();
}

const MONEDAS = [
  { value: "COP", label: "COP" },
  { value: "USD", label: "USD" },
  { value: "MXN", label: "MXN" },
  { value: "AED", label: "AED" },
  { value: "EUR", label: "EUR" },
] as const;

const DEFAULT_CONFIG: CotizadorConfig = {
  moneda: "COP",
  fases: [],
  descuentos: [],
  separacion_incluida_en_inicial: true,
  notas_legales: null,
};

/* ─── CotizadorSandbox (Project-level financial settings) ─── */

export function CotizadorSandbox({ hidePdfOptions: _hidePdfOptions }: { hidePdfOptions?: boolean } = {}) {
  const { project, save } = useEditorProject();

  const [config, setConfig] = useState<CotizadorConfig>(() => {
    return project.cotizador_config ?? DEFAULT_CONFIG;
  });

  const moneda = (config.moneda || "COP") as Currency;

  // Auto-save debounce
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveConfig = useCallback((newConfig: CotizadorConfig) => {
    setConfig(newConfig);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      save({ cotizador_config: newConfig });
    }, 1500);
  }, [save]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // Impuesto handlers
  const addImpuesto = useCallback(() => {
    const newImp: ImpuestoConfig = { id: uid(), nombre: "", porcentaje: 0 };
    saveConfig({ ...config, impuestos: [...(config.impuestos ?? []), newImp] });
  }, [config, saveConfig]);

  const updateImpuesto = useCallback((id: string, updated: ImpuestoConfig) => {
    saveConfig({ ...config, impuestos: (config.impuestos ?? []).map((i) => i.id === id ? updated : i) });
  }, [config, saveConfig]);

  const removeImpuesto = useCallback((id: string) => {
    saveConfig({ ...config, impuestos: (config.impuestos ?? []).filter((i) => i.id !== id) });
  }, [config, saveConfig]);

  return (
    <div className={cn("flex flex-col max-w-2xl", gap.spacious)}>
      {/* Moneda */}
      <div>
        <label className={cn(labelClass, "flex items-center", gap.normal)}>
          Moneda
          <InfoTooltip
            content={tooltips.cotizador.moneda.long}
            variant="dashboard"
            placement="auto"
          />
        </label>
        <div className="w-32">
          <NodDoDropdown
            variant="dashboard"
            size="md"
            value={config.moneda}
            onChange={(val) => saveConfig({ ...config, moneda: val })}
            options={MONEDAS.map((m) => ({ value: m.value, label: m.label }))}
          />
        </div>
      </div>

      {/* Separación toggle */}
      <div className={cn("bg-[var(--surface-1)] border border-[var(--border-subtle)] p-4", radius.xl)}>
        <label className={cn("flex items-center cursor-pointer", gap.relaxed)}>
          <input
            type="checkbox"
            checked={config.separacion_incluida_en_inicial}
            onChange={(e) => saveConfig({ ...config, separacion_incluida_en_inicial: e.target.checked })}
            className="w-4 h-4 rounded bg-[var(--surface-3)] border border-[var(--border-default)] accent-[var(--site-primary)]"
          />
          <span className={cn("text-[var(--text-secondary)] flex items-center", fontSize.md, gap.normal)}>
            La separación se descuenta de la cuota inicial
            <InfoTooltip
              content={tooltips.cotizador.separacionIncluida.long}
              variant="dashboard"
              placement="auto"
            />
          </span>
        </label>
        <p className={cn("text-[var(--text-muted)] mt-2 ml-[28px]", fontSize.caption)}>
          Si un plan tiene 30% cuota inicial y $5M de separación, el 30% incluye los $5M. Sin esto, la separación se suma aparte.
        </p>
      </div>

      {/* Impuestos / Taxes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className={labelClass}>Impuestos / Fees</label>
          <button
            onClick={addImpuesto}
            className={cn("flex items-center text-[var(--site-primary)] hover:text-[var(--site-primary)]/80 transition-colors", gap.compact, fontSize.md)}
          >
            <Plus size={13} /> Agregar impuesto
          </button>
        </div>
        <div className={cn("flex flex-col", gap.relaxed)}>
          {(config.impuestos ?? []).length === 0 && (
            <p className={cn("text-[var(--text-muted)] py-3", fontSize.md)}>Sin impuestos configurados (ej. DLD Fee 4%, Registration Tax 2%)</p>
          )}
          {(config.impuestos ?? []).map((imp) => (
            <div
              key={imp.id}
              className={cn("bg-[var(--surface-2)] border border-[var(--border-subtle)] p-4", radius.xl)}
            >
              <div className={cn("grid grid-cols-1 sm:grid-cols-[1fr_100px_auto]", gap.relaxed, "items-end")}>
                <div>
                  <label className={cn("block text-[var(--text-muted)] mb-1 uppercase", fontSize.label, letterSpacing.wider)}>Nombre</label>
                  <input
                    type="text"
                    value={imp.nombre}
                    onChange={(e) => updateImpuesto(imp.id, { ...imp, nombre: e.target.value })}
                    className={cn(inputClass, fontSize.md)}
                    placeholder="ej. DLD Fee, Registration Tax, VAT"
                  />
                </div>
                <div>
                  <label className={cn("block text-[var(--text-muted)] mb-1 uppercase", fontSize.label, letterSpacing.wider)}>%</label>
                  <input
                    type="number"
                    value={imp.porcentaje || ""}
                    onChange={(e) => updateImpuesto(imp.id, { ...imp, porcentaje: Number(e.target.value) })}
                    className={cn("w-full bg-[var(--surface-3)] border border-[var(--border-default)] px-3 py-2 text-white focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]", radius.lg, fontSize.md)}
                    placeholder="4"
                    step="0.1"
                  />
                </div>
                <button
                  onClick={() => removeImpuesto(imp.id)}
                  className="p-2 text-[var(--text-muted)] hover:text-red-400 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Admin fee */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className={labelClass}>Admin Fee</label>
        </div>
        <div className={cn("bg-[var(--surface-2)] border border-[var(--border-subtle)] p-4", radius.xl)}>
          <div className={cn("grid grid-cols-1 sm:grid-cols-2", gap.relaxed)}>
            <div>
              <label className={cn("block text-[var(--text-muted)] mb-1 uppercase", fontSize.label, letterSpacing.wider)}>
                Monto ({config.moneda})
              </label>
              <CurrencyInput
                value={config.admin_fee ?? ""}
                onChange={(v) => saveConfig({ ...config, admin_fee: Number(v) || undefined })}
                currency={moneda as Currency}
                inputClassName={cn("w-full bg-[var(--surface-3)] border border-[var(--border-default)] px-3 py-2 text-white focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)]", radius.lg, fontSize.md)}
                placeholder="0"
              />
            </div>
            <div>
              <label className={cn("block text-[var(--text-muted)] mb-1 uppercase", fontSize.label, letterSpacing.wider)}>
                Etiqueta
              </label>
              <input
                type="text"
                value={config.admin_fee_label ?? ""}
                onChange={(e) => saveConfig({ ...config, admin_fee_label: e.target.value || undefined })}
                className={cn(inputClass, fontSize.md)}
                placeholder="Admin Fee"
              />
            </div>
          </div>
          <p className={cn("text-[var(--text-muted)] mt-2", fontSize.caption)}>
            Cargo fijo adicional (ej. Admin Fee en Dubai). Se muestra como línea separada en la cotización.
          </p>
        </div>
      </div>

      {/* Tipo de entrega */}
      <div>
        <label className={cn(labelClass, "mb-2")}>Tipo de entrega</label>
        <div className="flex gap-2 mb-2">
          {([
            { value: null, label: "Sin configurar" },
            { value: "fecha_fija" as const, label: "Fecha fija" },
            { value: "plazo_desde_compra" as const, label: "Plazo desde compra" },
          ] as const).map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => saveConfig({
                ...config,
                tipo_entrega: opt.value,
                ...(opt.value === null ? { fecha_estimada_entrega: undefined, plazo_entrega_meses: undefined } : {}),
              })}
              className={cn(
                "flex-1 px-2 py-1.5 border text-center transition-colors",
                radius.lg, fontSize.label,
                (config.tipo_entrega ?? null) === opt.value
                  ? "border-[rgba(var(--site-primary-rgb),0.6)] bg-[rgba(var(--site-primary-rgb),0.1)] text-[var(--site-primary)]"
                  : "border-[var(--border-default)] bg-[var(--surface-3)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {config.tipo_entrega === "fecha_fija" && (
          <div>
            <label className={cn("block text-[var(--text-muted)] mb-1 uppercase", fontSize.label, letterSpacing.wider)}>
              Fecha de entrega
            </label>
            <input
              type="date"
              value={config.fecha_estimada_entrega ?? ""}
              onChange={(e) => saveConfig({ ...config, fecha_estimada_entrega: e.target.value || undefined })}
              className={cn(inputClass, fontSize.md)}
            />
            <p className={cn("text-[var(--text-muted)] mt-1", fontSize.caption)}>
              Las cuotas se ajustan según meses restantes
            </p>
          </div>
        )}
        {config.tipo_entrega === "plazo_desde_compra" && (
          <div>
            <label className={cn("block text-[var(--text-muted)] mb-1 uppercase", fontSize.label, letterSpacing.wider)}>
              Plazo de entrega (meses)
            </label>
            <input
              type="number"
              value={config.plazo_entrega_meses ?? 24}
              onChange={(e) => saveConfig({ ...config, plazo_entrega_meses: parseInt(e.target.value) || 24 })}
              min={6}
              max={120}
              className={cn(inputClass, fontSize.md, "w-32")}
            />
            <p className={cn("text-[var(--text-muted)] mt-1", fontSize.caption)}>
              Plan de pagos desde fecha de cotización + plazo
            </p>
          </div>
        )}
      </div>

      {/* Notas legales */}
      <div>
        <label className={cn(labelClass, "flex items-center", gap.normal)}>
          Notas legales (aparecen en el PDF)
          <InfoTooltip
            content={tooltips.cotizador.notasLegales.long}
            variant="dashboard"
            placement="auto"
          />
        </label>
        <textarea
          value={config.notas_legales ?? ""}
          onChange={(e) => saveConfig({ ...config, notas_legales: e.target.value || null })}
          rows={3}
          className={cn(inputClass, "resize-none", fontSize.md)}
          placeholder="Los precios están sujetos a cambios sin previo aviso..."
        />
      </div>
    </div>
  );
}
