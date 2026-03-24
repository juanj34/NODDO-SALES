import type { CotizadorConfig, FaseConfig } from "@/types";
import { frecuenciaToMonths } from "./payment-rows";

/* ── Types ─────────────────────────────────────────────── */

export interface DeliveryContext {
  /** Effective delivery date */
  fechaEntrega: Date;
  /** Start date (purchase date or today) */
  fechaInicio: Date;
  /** Total months available for the payment plan */
  mesesDisponibles: number;
  /** Whether this is a dynamic (auto-calculated) context */
  isDynamic: boolean;
}

export interface PhaseAdjustment {
  faseId: string;
  originalCuotas: number;
  adjustedCuotas: number;
}

/* ── Date Parsing ──────────────────────────────────────── */

/**
 * Parse fecha_estimada_entrega, distinguishing between:
 * - ISO dates: "2028-12-15" → Date
 * - Legacy freeform text: "Q2-2028", "Diciembre 2027" → null
 */
export function parseFechaEntrega(value: string | undefined): Date | null {
  if (!value) return null;
  // ISO date format: YYYY-MM-DD
  const isoMatch = /^\d{4}-\d{2}-\d{2}$/.test(value);
  if (isoMatch) {
    const d = new Date(value + "T00:00:00");
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/* ── Month Calculation ─────────────────────────────────── */

/**
 * Calculate remaining months between two dates.
 * Returns at least 1 (never 0 or negative).
 */
export function calcularMesesRestantes(from: Date, to: Date): number {
  const yearDiff = to.getFullYear() - from.getFullYear();
  const monthDiff = to.getMonth() - from.getMonth();
  const totalMonths = yearDiff * 12 + monthDiff;
  return Math.max(1, totalMonths);
}

/* ── Delivery Context Resolution ───────────────────────── */

/**
 * Resolve delivery context from project config.
 * Returns null if tipo_entrega is not configured (legacy behavior).
 */
export function resolveDeliveryContext(
  config: CotizadorConfig,
  referenceDate?: Date,
): DeliveryContext | null {
  if (!config.tipo_entrega) return null;

  const today = referenceDate ?? new Date();

  if (config.tipo_entrega === "fecha_fija") {
    const fechaEntrega = parseFechaEntrega(config.fecha_estimada_entrega);
    if (!fechaEntrega) return null;

    return {
      fechaEntrega,
      fechaInicio: today,
      mesesDisponibles: calcularMesesRestantes(today, fechaEntrega),
      isDynamic: true,
    };
  }

  if (config.tipo_entrega === "plazo_desde_compra") {
    const plazo = config.plazo_entrega_meses ?? 24;
    const fechaEntrega = new Date(today);
    fechaEntrega.setMonth(fechaEntrega.getMonth() + plazo);

    return {
      fechaEntrega,
      fechaInicio: today,
      mesesDisponibles: plazo,
      isDynamic: true,
    };
  }

  return null;
}

/* ── Phase Adjustment ──────────────────────────────────── */

/**
 * Adjust phase cuotas to fit within available months.
 *
 * - Single-payment phases (cuotas === 1) are not touched
 * - "resto" phases (contra entrega) are not touched
 * - Multi-cuota phases are proportionally reduced if they don't fit
 */
export function adjustFasesToDelivery(
  fases: FaseConfig[],
  mesesDisponibles: number,
): { fases: FaseConfig[]; adjustments: PhaseAdjustment[] } {
  const adjustments: PhaseAdjustment[] = [];

  // Identify which phases are scalable (multi-cuota, not resto)
  const scalableIndices: number[] = [];
  let totalMonthsNeeded = 0;

  for (let i = 0; i < fases.length; i++) {
    const f = fases[i];
    if (f.tipo === "resto" || f.cuotas <= 1) continue;
    scalableIndices.push(i);
    totalMonthsNeeded += f.cuotas * frecuenciaToMonths(f.frecuencia);
  }

  // If everything fits, return unchanged
  if (totalMonthsNeeded <= mesesDisponibles) {
    return { fases, adjustments: [] };
  }

  // Proportionally reduce cuotas
  const adjusted = fases.map((f, i) => {
    if (!scalableIndices.includes(i)) return f;

    const freqMonths = frecuenciaToMonths(f.frecuencia);
    const monthsNeeded = f.cuotas * freqMonths;
    const proportion = monthsNeeded / totalMonthsNeeded;
    const allocatedMonths = Math.floor(mesesDisponibles * proportion);
    const newCuotas = Math.max(1, Math.floor(allocatedMonths / freqMonths));

    if (newCuotas !== f.cuotas) {
      adjustments.push({
        faseId: f.id,
        originalCuotas: f.cuotas,
        adjustedCuotas: newCuotas,
      });
    }

    return { ...f, cuotas: newCuotas };
  });

  return { fases: adjusted, adjustments };
}

/* ── Display Helpers ───────────────────────────────────── */

/**
 * Format a delivery date for display in PDFs and UI.
 */
export function formatDeliveryDisplay(
  context: DeliveryContext,
  tipoEntrega: "fecha_fija" | "plazo_desde_compra",
): string {
  if (tipoEntrega === "fecha_fija") {
    const month = context.fechaEntrega.toLocaleString("es", { month: "long" });
    const year = context.fechaEntrega.getFullYear();
    const cap = month.charAt(0).toUpperCase() + month.slice(1);
    return `${cap} ${year} (${context.mesesDisponibles} meses restantes)`;
  }

  return `${context.mesesDisponibles} meses desde la compra`;
}
