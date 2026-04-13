import type { FaseConfig, QuickQuoteParams } from "@/types";

/**
 * Build a 3-phase FaseConfig[] from simple quick quote parameters.
 *
 *   Phase 1 — Separación   (porcentaje, 1 cuota)
 *   Phase 2 — Cuotas       (porcentaje, N cuotas at frequency)
 *   Phase 3 — Financiación (porcentaje, 1 cuota at delivery)
 */
export function buildQuickQuoteFases(params: QuickQuoteParams): FaseConfig[] {
  const cuotasPct = 100 - params.separacion_pct - params.financiacion_pct;
  const fases: FaseConfig[] = [];

  if (params.separacion_pct > 0) {
    fases.push({
      id: "qq-separacion",
      nombre: "Separación",
      tipo: "porcentaje",
      valor: params.separacion_pct,
      cuotas: 1,
      frecuencia: "unica",
    });
  }

  if (cuotasPct > 0 && params.cuotas > 0) {
    fases.push({
      id: "qq-cuotas",
      nombre: "Cuotas",
      tipo: "porcentaje",
      valor: cuotasPct,
      cuotas: params.cuotas,
      frecuencia: params.frecuencia,
    });
  }

  if (params.financiacion_pct > 0) {
    fases.push({
      id: "qq-financiacion",
      nombre: "Financiación",
      tipo: "porcentaje",
      valor: params.financiacion_pct,
      cuotas: 1,
      frecuencia: "unica",
    });
  }

  return fases;
}

/**
 * Suggest the number of cuotas based on remaining months until delivery.
 * Returns at least 1.
 */
export function suggestCuotasFromDelivery(
  mesesDisponibles: number,
  frecuencia: "mensual" | "bimestral" | "trimestral",
): number {
  const freqMonths = frecuencia === "mensual" ? 1
    : frecuencia === "bimestral" ? 2 : 3;
  return Math.max(1, Math.floor(mesesDisponibles / freqMonths));
}

/** Validate quick quote params — returns error messages (empty = valid). */
export function validateQuickQuoteParams(params: QuickQuoteParams): string[] {
  const errors: string[] = [];
  if (params.separacion_pct < 0 || params.separacion_pct > 100) {
    errors.push("Separación debe ser entre 0 y 100");
  }
  if (params.financiacion_pct < 0 || params.financiacion_pct > 100) {
    errors.push("Financiación debe ser entre 0 y 100");
  }
  if (params.separacion_pct + params.financiacion_pct > 100) {
    errors.push("Separación + financiación no puede exceder 100%");
  }
  if (params.cuotas < 1) {
    errors.push("Debe tener al menos 1 cuota");
  }
  return errors;
}
