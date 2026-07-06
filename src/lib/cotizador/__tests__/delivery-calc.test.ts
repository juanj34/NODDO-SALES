import { describe, it, expect } from "vitest";
import {
  monthsUntilDelivery,
  resolveEtapaPlan,
  buildDeliveryPlan,
} from "@/lib/cotizador/delivery-calc";
import type { CotizadorConfig, Torre } from "@/types";

/** Minimal Torre slice the lib actually consumes. */
type TorrePlan = Pick<
  Torre,
  "fecha_entrega" | "plan_pct_inicial" | "plan_separacion_tipo" | "plan_separacion_valor"
>;

function torre(overrides: Partial<TorrePlan>): TorrePlan {
  return {
    fecha_entrega: null,
    plan_pct_inicial: null,
    plan_separacion_tipo: null,
    plan_separacion_valor: null,
    ...overrides,
  };
}

function baseConfig(overrides: Partial<CotizadorConfig> = {}): CotizadorConfig {
  return {
    moneda: "COP",
    fases: [],
    descuentos: [],
    separacion_incluida_en_inicial: true,
    notas_legales: null,
    ...overrides,
  };
}

describe("monthsUntilDelivery", () => {
  it("counts full calendar months from the month after quote through delivery month inclusive", () => {
    expect(monthsUntilDelivery("2026-07-15", "2028-06-01")).toBe(23);
  });

  it("one month out (end of quote month to start of next month) = 1", () => {
    expect(monthsUntilDelivery("2026-07-31", "2026-08-01")).toBe(1);
  });

  it("same month as quote = 0", () => {
    expect(monthsUntilDelivery("2026-07-15", "2026-07-20")).toBe(0);
  });

  it("delivery month in the past = 0 (never negative)", () => {
    expect(monthsUntilDelivery("2026-07-15", "2026-06-01")).toBe(0);
  });

  it("year rollover: Dec quote -> Jan delivery next year = 1", () => {
    expect(monthsUntilDelivery("2026-12-10", "2027-01-05")).toBe(1);
  });
});

describe("resolveEtapaPlan", () => {
  it("uses torre params when set (fuente 'etapa')", () => {
    const t = torre({
      fecha_entrega: "2028-06-01",
      plan_pct_inicial: 50,
      plan_separacion_tipo: "porcentaje",
      plan_separacion_valor: 2.5,
    });
    const config = baseConfig({
      calc_defaults: { pct_inicial: 30, separacion_tipo: "fijo", separacion_valor: 1_000_000 },
      fecha_estimada_entrega: "2030-01-01",
    });

    const plan = resolveEtapaPlan(t, config);

    expect(plan).toEqual({
      pctInicial: 50,
      separacionTipo: "porcentaje",
      separacionValor: 2.5,
      fechaEntrega: "2028-06-01",
      tipoEntrega: "fecha_fija",
      plazoMeses: 24,
      fuente: "etapa",
    });
  });

  it("falls back to project calc_defaults + fecha_estimada_entrega when torre is null (fuente 'proyecto')", () => {
    const config = baseConfig({
      calc_defaults: { pct_inicial: 30, separacion_tipo: "fijo", separacion_valor: 1_000_000 },
      fecha_estimada_entrega: "2029-03-01",
    });

    const plan = resolveEtapaPlan(null, config);

    expect(plan).toEqual({
      pctInicial: 30,
      separacionTipo: "fijo",
      separacionValor: 1_000_000,
      fechaEntrega: "2029-03-01",
      tipoEntrega: "fecha_fija",
      plazoMeses: 24,
      fuente: "proyecto",
    });
  });

  it("falls back to built-ins when nothing is configured (fuente 'incompleta' — fecha_fija with no fecha)", () => {
    const plan = resolveEtapaPlan(null, null);

    expect(plan).toEqual({
      pctInicial: 50,
      separacionTipo: "porcentaje",
      separacionValor: 2.5,
      fechaEntrega: null,
      tipoEntrega: "fecha_fija",
      plazoMeses: 24,
      fuente: "incompleta",
    });
  });

  it("fuente is 'incompleta' when tipoEntrega is fecha_fija and no fecha resolves from anywhere", () => {
    const config = baseConfig({
      calc_defaults: { pct_inicial: 40, separacion_tipo: "porcentaje", separacion_valor: 3 },
      // no fecha_estimada_entrega
    });

    const plan = resolveEtapaPlan(null, config);

    expect(plan.fuente).toBe("incompleta");
    expect(plan.fechaEntrega).toBeNull();
  });

  it("plazo_desde_compra mode with no plazo_entrega_meses configured falls back to 24, fuente 'proyecto'", () => {
    const config = baseConfig({ tipo_entrega: "plazo_desde_compra" });

    const plan = resolveEtapaPlan(null, config);

    expect(plan.tipoEntrega).toBe("plazo_desde_compra");
    expect(plan.plazoMeses).toBe(24);
    expect(plan.fuente).toBe("proyecto");
  });

  it("torre providing only one field (partial override) still counts as fuente 'etapa'", () => {
    const t = torre({ plan_pct_inicial: 35 });
    const config = baseConfig({ fecha_estimada_entrega: "2028-01-01" });

    const plan = resolveEtapaPlan(t, config);

    expect(plan.fuente).toBe("etapa");
    expect(plan.pctInicial).toBe(35);
    expect(plan.fechaEntrega).toBe("2028-01-01");
  });
});

describe("buildDeliveryPlan — reference cases (real numbers, exact assertions)", () => {
  it("Indigo Etapa 2: $675,000,000 / 50% inicial / separacion 2.5% / 23 cuotas x $13,940,217 / financiacion 50%", () => {
    const plan = resolveEtapaPlan(
      torre({
        fecha_entrega: "2028-06-01",
        plan_pct_inicial: 50,
        plan_separacion_tipo: "porcentaje",
        plan_separacion_valor: 2.5,
      }),
      null,
    );

    const result = buildDeliveryPlan(675_000_000, plan, "2026-07-15");

    expect(result.cuotas).toBe(23);
    expect(result.separacionPesos).toBe(16_875_000);
    expect(result.inicialPesos).toBe(337_500_000);
    expect(result.cuotaMensualPesos).toBe(13_940_217);
    expect(result.financiacionPesos).toBe(337_500_000);
    expect(result.contado).toBe(false);
    expect(result.separacionExcedeInicial).toBe(false);
    expect(result.fases).toEqual([
      { id: "calc-separacion", nombre: "Separación", tipo: "fijo", valor: 16_875_000, cuotas: 1, frecuencia: "unica" },
      { id: "calc-inicial", nombre: "Cuota inicial", tipo: "porcentaje", valor: 50, cuotas: 23, frecuencia: "mensual" },
      { id: "calc-financiacion", nombre: "Financiación", tipo: "resto", valor: 0, cuotas: 1, frecuencia: "unica" },
    ]);
  });

  it("Garden: $945,000,000 / 50% inicial / separacion $23,625,000 (2.5%) / 26 cuotas x $17,264,423 / financiacion 50%", () => {
    const plan = resolveEtapaPlan(
      torre({
        fecha_entrega: "2028-09-01",
        plan_pct_inicial: 50,
        plan_separacion_tipo: "porcentaje",
        plan_separacion_valor: 2.5,
      }),
      null,
    );

    const result = buildDeliveryPlan(945_000_000, plan, "2026-07-15");

    expect(result.cuotas).toBe(26);
    expect(result.separacionPesos).toBe(23_625_000);
    expect(result.inicialPesos).toBe(472_500_000);
    expect(result.cuotaMensualPesos).toBe(17_264_423);
    expect(result.financiacionPesos).toBe(472_500_000);
    expect(result.contado).toBe(false);
  });

  it("Indigo Etapa 1 'plan 3070': same $675,000,000 total + same separacion mechanics, 30% inicial / 70% financiacion", () => {
    const plan = resolveEtapaPlan(
      torre({
        fecha_entrega: "2028-06-01",
        plan_pct_inicial: 30,
        plan_separacion_tipo: "porcentaje",
        plan_separacion_valor: 2.5,
      }),
      null,
    );

    const result = buildDeliveryPlan(675_000_000, plan, "2026-07-15");

    expect(result.cuotas).toBe(23);
    expect(result.separacionPesos).toBe(16_875_000);
    expect(result.inicialPesos).toBe(202_500_000);
    expect(result.cuotaMensualPesos).toBe(8_070_652);
    expect(result.financiacionPesos).toBe(472_500_000);
    expect(result.contado).toBe(false);
    expect(result.fases[1]).toEqual(
      { id: "calc-inicial", nombre: "Cuota inicial", tipo: "porcentaje", valor: 30, cuotas: 23, frecuencia: "mensual" },
    );
  });
});

describe("buildDeliveryPlan — plazo_desde_compra model", () => {
  it("N is constant (plazoMeses), independent of quote date / fecha_entrega", () => {
    const plan = resolveEtapaPlan(
      null,
      baseConfig({
        tipo_entrega: "plazo_desde_compra",
        plazo_entrega_meses: 36,
        calc_defaults: { pct_inicial: 50, separacion_tipo: "porcentaje", separacion_valor: 2.5 },
      }),
    );

    const result = buildDeliveryPlan(500_000_000, plan, "2026-07-15");

    expect(result.cuotas).toBe(36);
    expect(result.contado).toBe(false);
    expect(result.fases[1].cuotas).toBe(36);
  });
});

describe("buildDeliveryPlan — contado (N<=0)", () => {
  it("delivery date this month or in the past collapses to a single inicial payment", () => {
    const plan = resolveEtapaPlan(
      torre({
        fecha_entrega: "2026-05-01",
        plan_pct_inicial: 50,
        plan_separacion_tipo: "porcentaje",
        plan_separacion_valor: 2.5,
      }),
      null,
    );

    const result = buildDeliveryPlan(500_000_000, plan, "2026-07-15");

    expect(result.cuotas).toBe(0);
    expect(result.contado).toBe(true);
    expect(result.cuotaMensualPesos).toBe(0);
    expect(result.inicialPesos).toBe(250_000_000);
    expect(result.separacionPesos).toBe(12_500_000);
    expect(result.fases).toEqual([
      { id: "calc-separacion", nombre: "Separación", tipo: "fijo", valor: 12_500_000, cuotas: 1, frecuencia: "unica" },
      { id: "calc-inicial", nombre: "Cuota inicial", tipo: "porcentaje", valor: 50, cuotas: 1, frecuencia: "unica" },
      { id: "calc-financiacion", nombre: "Financiación", tipo: "resto", valor: 0, cuotas: 1, frecuencia: "unica" },
    ]);
  });

  it("fecha_fija plan with no fechaEntrega resolvable (incompleta) is treated as contado rather than throwing", () => {
    const plan = resolveEtapaPlan(null, null); // fuente "incompleta", fechaEntrega null

    const result = buildDeliveryPlan(100_000_000, plan, "2026-07-15");

    expect(result.cuotas).toBe(0);
    expect(result.contado).toBe(true);
    expect(result.cuotaMensualPesos).toBe(0);
  });
});

describe("buildDeliveryPlan — fijo separacion", () => {
  it("resolves a fixed-peso separacion instead of a percentage", () => {
    const plan = resolveEtapaPlan(
      torre({
        fecha_entrega: "2027-07-01",
        plan_pct_inicial: 50,
        plan_separacion_tipo: "fijo",
        plan_separacion_valor: 10_000_000,
      }),
      null,
    );

    const result = buildDeliveryPlan(400_000_000, plan, "2026-07-15");

    expect(result.separacionPesos).toBe(10_000_000);
    expect(result.inicialPesos).toBe(200_000_000);
    expect(result.cuotas).toBe(12);
    expect(result.cuotaMensualPesos).toBe(Math.round((200_000_000 - 10_000_000) / 12));
    expect(result.fases[0]).toEqual(
      { id: "calc-separacion", nombre: "Separación", tipo: "fijo", valor: 10_000_000, cuotas: 1, frecuencia: "unica" },
    );
  });
});

describe("buildDeliveryPlan — separacionExcedeInicial guard", () => {
  it("flags when separacion (fijo) meets or exceeds the resolved cuota inicial, but still builds", () => {
    const plan = resolveEtapaPlan(
      torre({
        fecha_entrega: "2027-07-01",
        plan_pct_inicial: 10,
        plan_separacion_tipo: "fijo",
        plan_separacion_valor: 50_000_000,
      }),
      null,
    );

    const result = buildDeliveryPlan(400_000_000, plan, "2026-07-15");

    // inicialPesos = round(400_000_000 * 10 / 100) = 40_000_000; separacion 50_000_000 >= inicial
    expect(result.inicialPesos).toBe(40_000_000);
    expect(result.separacionPesos).toBe(50_000_000);
    expect(result.separacionExcedeInicial).toBe(true);
    expect(result.fases).toHaveLength(3);
  });
});
