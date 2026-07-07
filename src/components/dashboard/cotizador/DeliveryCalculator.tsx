"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CalendarClock, Percent, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";
import type { Currency } from "@/lib/currency";
import { CurrencyInput } from "@/components/dashboard/CurrencyInput";
import { resolveEtapaPlan, buildDeliveryPlan } from "@/lib/cotizador/delivery-calc";
import type { EtapaPlan } from "@/lib/cotizador/delivery-calc";
import type { CotizadorConfig, EtapaPlanConfig, FaseConfig, Torre } from "@/types";

/* ── Props ─────────────────────────────────────────────── */

interface DeliveryCalculatorProps {
  /** Effective total incl. complementos (from CotizadorTool). */
  totalPesos: number;
  /** Resolved from the selected unidad.etapa_nombre via findEtapaPlan (null → torre/project fallback). */
  etapaPlan: EtapaPlanConfig | null;
  /** Resolved from the selected unidad.torre_id (null → project-level fallback). */
  torre: Torre | null;
  config: CotizadorConfig | null | undefined;
  /** Emitted whenever the computed plan changes (skipped when the etapa is incompleta). */
  onFasesChange: (
    fases: FaseConfig[],
    meta: { planOrigen: "calculadora"; cuotas: number; contado: boolean },
  ) => void;
  currency: string;
}

/* ── Helpers ───────────────────────────────────────────── */

const MESES_ABBR = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

/** ISO date "2028-06-01" → "jun-2028" (pure string math, no TZ drift). */
function formatMesAnio(iso: string | null): string {
  if (!iso) return "—";
  const year = iso.slice(0, 4);
  const month = Number(iso.slice(5, 7));
  if (!/^\d{4}$/.test(year) || month < 1 || month > 12) return iso;
  return `${MESES_ABBR[month - 1]}-${year}`;
}

/** Today in America/Bogota as YYYY-MM-DD (stable per component lifetime). */
function bogotaTodayISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
}

/** Stable signature of the resolved defaults — resets overrides when the etapa/plan changes. */
function planSignature(plan: EtapaPlan): string {
  return [
    plan.pctInicial,
    plan.separacionTipo,
    plan.separacionValor,
    plan.fechaEntrega,
    plan.tipoEntrega,
    plan.plazoMeses,
    plan.fuente,
  ].join("|");
}

/* ── Component ─────────────────────────────────────────── */

export function DeliveryCalculator({
  totalPesos,
  etapaPlan,
  torre,
  config,
  onFasesChange,
  currency,
}: DeliveryCalculatorProps) {
  const cur = currency as Currency;
  const fmt = (n: number) => formatCurrency(n, cur, {});

  // Quote date = today in Bogota, computed once for this component's lifetime.
  const [quoteDateISO] = useState(bogotaTodayISO);

  // Resolved per-etapa plan (defaults, before overrides).
  const resolvedPlan = useMemo(() => resolveEtapaPlan(etapaPlan, torre, config), [etapaPlan, torre, config]);
  const signature = planSignature(resolvedPlan);

  // Visible overrides — null means "use the resolved default".
  const [pctInicialOverride, setPctInicialOverride] = useState<number | null>(null);
  const [sepTipoOverride, setSepTipoOverride] = useState<"porcentaje" | "fijo" | null>(null);
  const [sepValorOverride, setSepValorOverride] = useState<number | null>(null);

  // Reset overrides when the underlying plan changes (e.g. different unit/etapa selected).
  // Render-phase reset (React's "adjust state on prop change" pattern) — no effect, so it
  // never triggers a cascading post-commit re-render.
  const [prevSignature, setPrevSignature] = useState(signature);
  if (signature !== prevSignature) {
    setPrevSignature(signature);
    setPctInicialOverride(null);
    setSepTipoOverride(null);
    setSepValorOverride(null);
  }

  const negociado =
    pctInicialOverride !== null || sepTipoOverride !== null || sepValorOverride !== null;

  const effectivePctInicial = pctInicialOverride ?? resolvedPlan.pctInicial;
  const effectiveSepTipo = sepTipoOverride ?? resolvedPlan.separacionTipo;
  const effectiveSepValor = sepValorOverride ?? resolvedPlan.separacionValor;

  const effectivePlan: EtapaPlan = useMemo(
    () => ({
      ...resolvedPlan,
      pctInicial: effectivePctInicial,
      separacionTipo: effectiveSepTipo,
      separacionValor: effectiveSepValor,
    }),
    [resolvedPlan, effectivePctInicial, effectiveSepTipo, effectiveSepValor],
  );

  const result = useMemo(
    () => buildDeliveryPlan(totalPesos, effectivePlan, quoteDateISO),
    [totalPesos, effectivePlan, quoteDateISO],
  );

  const incompleta = resolvedPlan.fuente === "incompleta";

  // Emit whenever the computed plan changes. A ref holds the latest callback so the
  // effect never depends on onFasesChange's identity (no loop if the parent inlines it).
  const onFasesChangeRef = useRef(onFasesChange);
  useEffect(() => {
    onFasesChangeRef.current = onFasesChange;
  });
  useEffect(() => {
    if (incompleta || totalPesos <= 0) return;
    onFasesChangeRef.current(result.fases, {
      planOrigen: "calculadora",
      cuotas: result.cuotas,
      contado: result.contado,
    });
  }, [result, incompleta, totalPesos]);

  /* ── Blocking notice: etapa without a delivery date ── */
  if (incompleta) {
    return (
      <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-5">
        <SectionLabel />
        <div className="mt-3 flex items-start gap-3 px-4 py-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200/90 leading-relaxed">
            Esta etapa no tiene fecha de entrega configurada — defínela en Torres/Etapas.
          </p>
        </div>
      </div>
    );
  }

  const etapaNombre = torre?.nombre ?? "Proyecto";
  const financiacionPct = Math.max(0, 100 - effectivePctInicial);
  const sepPctLabel =
    effectiveSepTipo === "porcentaje" ? `${effectiveSepValor}%` : "monto fijo";

  return (
    <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <SectionLabel />
        {negociado && (
          <span className="text-[8px] font-ui font-bold uppercase tracking-wider text-[var(--site-primary)] bg-[rgba(var(--site-primary-rgb),0.1)] border border-[rgba(var(--site-primary-rgb),0.25)] px-1.5 py-0.5 rounded">
            Negociado
          </span>
        )}
      </div>

      {/* Etapa summary */}
      <div className="flex items-center gap-2 flex-wrap px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]">
        <CalendarClock size={13} className="text-[var(--site-primary)] shrink-0" />
        <span className="text-xs text-[var(--text-primary)] font-medium">{etapaNombre}</span>
        {resolvedPlan.tipoEntrega === "fecha_fija" && (
          <>
            <span className="text-[var(--text-muted)]">·</span>
            <span className="text-xs text-[var(--text-secondary)]">
              entrega <span className="font-mono">{formatMesAnio(resolvedPlan.fechaEntrega)}</span>
            </span>
          </>
        )}
        <span className="text-[var(--text-muted)]">·</span>
        <span className="text-xs text-[var(--text-secondary)]">
          {result.contado ? (
            "de contado (pago único)"
          ) : (
            <>
              <span className="font-mono text-[var(--text-primary)]">{result.cuotas}</span> cuotas restantes
            </>
          )}
        </span>
      </div>

      {/* Computed plan rows */}
      <div className="space-y-2">
        <PlanRow
          label="Separación"
          hint={sepPctLabel}
          amount={fmt(result.separacionPesos)}
        />
        <PlanRow
          label="Cuota inicial"
          hint={`${effectivePctInicial}%`}
          amount={fmt(result.inicialPesos)}
          sub={
            result.contado
              ? "pago único"
              : `${result.cuotas} cuotas × ${fmt(result.cuotaMensualPesos)} (después de separación)`
          }
          emphasis
        />
        <PlanRow
          label="Financiación"
          hint={`${financiacionPct}%`}
          amount={fmt(result.financiacionPesos)}
        />
      </div>

      {/* Separación exceeds inicial warning */}
      {result.separacionExcedeInicial && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <AlertTriangle size={12} className="text-amber-400 shrink-0 mt-0.5" />
          <span className="text-[11px] text-amber-200/90 leading-relaxed">
            La separación es mayor o igual a la cuota inicial — revisa el % inicial o el valor de la separación.
          </span>
        </div>
      )}

      {/* Overrides */}
      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[var(--border-subtle)]">
        {/* % inicial */}
        <div>
          <label className="flex items-center gap-1.5 text-[9px] font-ui font-bold uppercase tracking-[0.14em] text-[var(--text-muted)] mb-1.5">
            <Percent size={10} className="text-[var(--site-primary)] opacity-70" />
            % Inicial
          </label>
          <input
            type="number"
            value={effectivePctInicial}
            onChange={(e) => {
              const v = e.target.value;
              setPctInicialOverride(v === "" ? 0 : Math.max(0, Math.min(100, Number(v))));
            }}
            className="input-glass w-full text-sm font-mono"
            min={0}
            max={100}
          />
        </div>

        {/* Separación tipo + valor */}
        <div>
          <label className="text-[9px] font-ui font-bold uppercase tracking-[0.14em] text-[var(--text-muted)] mb-1.5 block">
            Separación
          </label>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                const nextTipo = effectiveSepTipo === "porcentaje" ? "fijo" : "porcentaje";
                setSepTipoOverride(nextTipo);
                // Reset the value to a sensible default for the new tipo.
                setSepValorOverride(nextTipo === "porcentaje" ? 2.5 : result.separacionPesos);
              }}
              className={cn(
                "shrink-0 w-8 h-9 rounded-lg text-xs font-ui font-bold transition-all border",
                effectiveSepTipo === "porcentaje"
                  ? "bg-[rgba(var(--site-primary-rgb),0.15)] border-[rgba(var(--site-primary-rgb),0.3)] text-[var(--site-primary)]"
                  : "bg-[var(--surface-3)] border-[var(--border-subtle)] text-[var(--text-tertiary)]",
              )}
              title={effectiveSepTipo === "porcentaje" ? "Cambiar a monto fijo" : "Cambiar a porcentaje"}
            >
              {effectiveSepTipo === "porcentaje" ? "%" : "$"}
            </button>
            {effectiveSepTipo === "porcentaje" ? (
              <input
                type="number"
                value={effectiveSepValor}
                onChange={(e) => {
                  const v = e.target.value;
                  setSepValorOverride(v === "" ? 0 : Math.max(0, Number(v)));
                }}
                className="input-glass w-full text-sm font-mono"
                min={0}
                step={0.1}
              />
            ) : (
              <CurrencyInput
                value={effectiveSepValor || ""}
                onChange={(v) => setSepValorOverride(v ? Number(v) : 0)}
                currency={cur}
                inputClassName="input-glass w-full text-sm font-mono"
                placeholder="0"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────── */

function SectionLabel() {
  return (
    <span className="flex items-center gap-2 text-[9px] font-ui font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
      <Sparkles size={12} className="text-[var(--site-primary)]" />
      Calculadora de entrega
    </span>
  );
}

function PlanRow({
  label,
  hint,
  amount,
  sub,
  emphasis,
}: {
  label: string;
  hint: string;
  amount: string;
  sub?: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 px-4 py-2.5 rounded-lg border",
        emphasis
          ? "bg-[rgba(var(--site-primary-rgb),0.06)] border-[rgba(var(--site-primary-rgb),0.18)]"
          : "bg-[var(--surface-2)] border-[var(--border-subtle)]",
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--text-secondary)]">{label}</span>
          <span className="text-[10px] font-mono text-[var(--text-tertiary)]">{hint}</span>
        </div>
        {sub && <span className="block text-[10px] font-mono text-[var(--text-tertiary)] mt-0.5">{sub}</span>}
      </div>
      <span
        className={cn(
          "font-mono text-sm font-medium shrink-0",
          emphasis ? "text-[var(--site-primary)]" : "text-[var(--text-primary)]",
        )}
      >
        {amount}
      </span>
    </div>
  );
}
