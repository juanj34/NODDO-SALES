import type { CotizadorConfig, EtapaPlanConfig, FaseConfig, Torre } from "@/types";

/**
 * Delivery calculator — pure calculation lib (no Date.now()/new Date()).
 *
 * Turns a torre's (or project's) delivery configuration into a concrete
 * payment plan: a separación (deducted from the cuota inicial) followed by
 * N equal monthly cuotas, where N shrinks as the delivery date approaches.
 * The lib only BUILDS `FaseConfig[]` for the existing custom_fases path in
 * calcular.ts — it never re-implements the calculation engine itself.
 *
 * Precondition: consumers must send `separacion_incluida: true` alongside the
 * built fases — the engine only deducts the separación from the porcentaje
 * fase when `separacion_incluida_en_inicial !== false`.
 */

/** Torre fields this lib consumes for per-etapa payment plan resolution. */
export type TorrePlanFields = Pick<
  Torre,
  "fecha_entrega" | "plan_pct_inicial" | "plan_separacion_tipo" | "plan_separacion_valor"
>;

export interface EtapaPlan {
  pctInicial: number; // e.g. 50
  separacionTipo: "porcentaje" | "porcentaje_inicial" | "fijo";
  separacionValor: number; // pct value (of total or of inicial) or pesos
  fechaEntrega: string | null; // ISO date
  tipoEntrega: "fecha_fija" | "plazo_desde_compra";
  plazoMeses: number | null; // for plazo_desde_compra
  fuente: "etapa" | "proyecto" | "incompleta"; // where params came from
}

export interface DeliveryPlanResult {
  cuotas: number; // N (>=0)
  separacionPesos: number; // resolved integer pesos
  inicialPesos: number; // round(total*pct/100)
  cuotaMensualPesos: number; // round((inicial-sep)/N), 0 when N===0
  financiacionPesos: number; // total - inicial
  fases: FaseConfig[]; // ready for custom_fases
  contado: boolean; // N<=0 -> inicial single payment
  separacionExcedeInicial: boolean; // UI warning: separacion >= inicial
}

/** Built-in fallbacks when neither the etapa, torre, nor the project configure a plan. */
const BUILTIN_PCT_INICIAL = 50;
const BUILTIN_SEPARACION_TIPO: "porcentaje" | "porcentaje_inicial" | "fijo" = "porcentaje";
const BUILTIN_SEPARACION_VALOR = 2.5;
const BUILTIN_TIPO_ENTREGA: "fecha_fija" | "plazo_desde_compra" = "fecha_fija";
const BUILTIN_PLAZO_MESES = 24;

/**
 * Count full calendar months from the month AFTER the quote month through
 * the delivery month, inclusive — comparing plain YYYY-MM extracted from
 * the ISO date strings. Callers pass Bogota-local dates; this function does
 * pure string/integer math, no Date object, so there is no timezone drift
 * at month boundaries.
 *
 * Examples: "2026-07-15" -> "2028-06-01" = 23. Same month or a delivery
 * month in the past never returns negative — it clamps to 0.
 */
export function monthsUntilDelivery(quoteDateISO: string, fechaEntregaISO: string): number {
  const [quoteYear, quoteMonth] = parseYearMonth(quoteDateISO);
  const [deliveryYear, deliveryMonth] = parseYearMonth(fechaEntregaISO);

  const months = (deliveryYear - quoteYear) * 12 + (deliveryMonth - quoteMonth);
  return Math.max(0, months);
}

function parseYearMonth(isoDate: string): [number, number] {
  const year = Number(isoDate.slice(0, 4));
  const month = Number(isoDate.slice(5, 7));
  return [year, month];
}

/**
 * Find the phase plan matching `etapaNombre` (unidades.etapa_nombre) in
 * `config.etapas_plan`. Returns null when there's no match, no `etapas_plan`,
 * no `etapaNombre`, or no config — never invents a plan.
 */
export function findEtapaPlan(
  etapaNombre: string | null,
  config: CotizadorConfig | null | undefined,
): EtapaPlanConfig | null {
  if (!etapaNombre || !config?.etapas_plan) return null;
  const norm = (s: string) => s.trim().toLowerCase();
  const target = norm(etapaNombre);
  if (!target) return null;
  return config.etapas_plan.find((e) => norm(e.nombre) === target) ?? null;
}

/**
 * Resolve the effective per-etapa payment plan, falling back field-by-field:
 * etapaPlan (cotizador_config.etapas_plan, matched by unidades.etapa_nombre)
 * -> torre value -> config.calc_defaults -> built-ins (and, for fechaEntrega,
 * etapaPlan -> torre -> config.fecha_estimada_entrega -> null — dates are
 * never invented).
 */
export function resolveEtapaPlan(
  etapaPlan: EtapaPlanConfig | null,
  torre: TorrePlanFields | null,
  config: CotizadorConfig | null | undefined,
): EtapaPlan {
  const calcDefaults = config?.calc_defaults;

  const pctInicial =
    etapaPlan?.pct_inicial ?? torre?.plan_pct_inicial ?? calcDefaults?.pct_inicial ?? BUILTIN_PCT_INICIAL;
  const separacionTipo =
    etapaPlan?.separacion_tipo ??
    torre?.plan_separacion_tipo ??
    calcDefaults?.separacion_tipo ??
    BUILTIN_SEPARACION_TIPO;
  const separacionValor =
    etapaPlan?.separacion_valor ??
    torre?.plan_separacion_valor ??
    calcDefaults?.separacion_valor ??
    BUILTIN_SEPARACION_VALOR;
  const fechaEntrega =
    etapaPlan?.fecha_entrega ?? torre?.fecha_entrega ?? config?.fecha_estimada_entrega ?? null;
  const tipoEntrega = etapaPlan?.tipo_entrega ?? config?.tipo_entrega ?? BUILTIN_TIPO_ENTREGA;
  const plazoMeses = etapaPlan?.plazo_meses ?? config?.plazo_entrega_meses ?? BUILTIN_PLAZO_MESES;

  // EtapaPlanConfig's plan fields (pct_inicial, separacion_tipo, separacion_valor) are
  // required, so any non-null etapaPlan always counts as a supplied plan.
  const etapaParamUsed = etapaPlan != null;

  const torreParamUsed =
    torre != null &&
    (torre.fecha_entrega != null ||
      torre.plan_pct_inicial != null ||
      torre.plan_separacion_tipo != null ||
      torre.plan_separacion_valor != null);

  // "incompleta" takes precedence over "etapa": even if the etapaPlan/torre set some
  // plan param, a fecha_fija plan with no resolvable delivery date must surface the
  // UI's block-signal — otherwise buildDeliveryPlan silently collapses to contado.
  const fuente: EtapaPlan["fuente"] =
    tipoEntrega === "fecha_fija" && !fechaEntrega
      ? "incompleta"
      : etapaParamUsed || torreParamUsed
        ? "etapa"
        : "proyecto";

  return {
    pctInicial,
    separacionTipo,
    separacionValor,
    fechaEntrega,
    tipoEntrega,
    plazoMeses,
    fuente,
  };
}

/**
 * Build the concrete payment plan for `totalPesos` under `plan`, evaluated
 * as of `quoteDateISO`. Produces a 3-phase `FaseConfig[]` — fixed separación,
 * porcentaje cuota inicial (N equal cuotas, engine deducts the separación),
 * resto financiación — ready for the existing custom_fases path.
 */
export function buildDeliveryPlan(
  totalPesos: number,
  plan: EtapaPlan,
  quoteDateISO: string,
): DeliveryPlanResult {
  const inicialPesos = Math.round(totalPesos * (plan.pctInicial / 100));
  const financiacionPesos = totalPesos - inicialPesos;

  const separacionPesos =
    plan.separacionTipo === "fijo"
      ? Math.round(plan.separacionValor)
      : plan.separacionTipo === "porcentaje_inicial"
        ? Math.round(inicialPesos * (plan.separacionValor / 100))
        : Math.round(totalPesos * (plan.separacionValor / 100));

  const rawCuotas =
    plan.tipoEntrega === "plazo_desde_compra"
      ? (plan.plazoMeses ?? BUILTIN_PLAZO_MESES)
      : plan.fechaEntrega
        ? monthsUntilDelivery(quoteDateISO, plan.fechaEntrega)
        : 0; // fecha_fija with no resolvable fecha ("incompleta") -> never invent a date; contado.

  const cuotas = Math.max(0, rawCuotas);
  const contado = cuotas <= 0;

  const cuotaMensualPesos =
    cuotas > 0 ? Math.round((inicialPesos - separacionPesos) / cuotas) : 0;

  const separacionExcedeInicial = separacionPesos >= inicialPesos;

  const fases: FaseConfig[] = [
    {
      id: "calc-separacion",
      nombre: "Separación",
      tipo: "fijo",
      valor: separacionPesos,
      cuotas: 1,
      frecuencia: "unica",
    },
    {
      id: "calc-inicial",
      nombre: "Cuota inicial",
      tipo: "porcentaje",
      valor: plan.pctInicial,
      cuotas: contado ? 1 : cuotas,
      frecuencia: contado ? "unica" : "mensual",
    },
    {
      id: "calc-financiacion",
      nombre: "Financiación",
      tipo: "resto",
      valor: 0,
      cuotas: 1,
      frecuencia: "unica",
    },
  ];

  return {
    cuotas,
    separacionPesos,
    inicialPesos,
    cuotaMensualPesos,
    financiacionPesos,
    fases,
    contado,
    separacionExcedeInicial,
  };
}
