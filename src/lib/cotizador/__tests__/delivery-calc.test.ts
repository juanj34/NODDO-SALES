import { describe, it, expect } from "vitest";
import {
  monthsUntilDelivery,
  resolveEtapaPlan,
  findEtapaPlan,
  buildDeliveryPlan,
} from "@/lib/cotizador/delivery-calc";
import type { CotizadorConfig, EtapaPlanConfig, Torre } from "@/types";

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

describe("findEtapaPlan", () => {
  const config = baseConfig({
    etapas_plan: [
      {
        nombre: "1",
        fecha_entrega: "2028-01-01",
        pct_inicial: 30,
        separacion_tipo: "fijo",
        separacion_valor: 15_000_000,
      },
      {
        nombre: "2",
        fecha_entrega: "2029-01-01",
        pct_inicial: 50,
        separacion_tipo: "porcentaje_inicial",
        separacion_valor: 5,
      },
    ],
  });

  it("returns the matching entry by nombre", () => {
    const found = findEtapaPlan("2", config);
    expect(found).toEqual({
      nombre: "2",
      fecha_entrega: "2029-01-01",
      pct_inicial: 50,
      separacion_tipo: "porcentaje_inicial",
      separacion_valor: 5,
    });
  });

  it("returns null when nombre doesn't match any entry", () => {
    expect(findEtapaPlan("9", config)).toBeNull();
  });

  it("returns null when etapaNombre is null", () => {
    expect(findEtapaPlan(null, config)).toBeNull();
  });

  it("returns null when config has no etapas_plan", () => {
    expect(findEtapaPlan("1", baseConfig())).toBeNull();
  });

  it("returns null when config is null/undefined", () => {
    expect(findEtapaPlan("1", null)).toBeNull();
    expect(findEtapaPlan("1", undefined)).toBeNull();
  });

  it("matches regardless of surrounding whitespace or case (money-safety: a CSV/AI-imported etapa_nombre like '1 ' must still resolve its plan)", () => {
    expect(findEtapaPlan(" 1 ", config)).toEqual({
      nombre: "1",
      fecha_entrega: "2028-01-01",
      pct_inicial: 30,
      separacion_tipo: "fijo",
      separacion_valor: 15_000_000,
    });
    expect(findEtapaPlan("1", config)).toEqual({
      nombre: "1",
      fecha_entrega: "2028-01-01",
      pct_inicial: 30,
      separacion_tipo: "fijo",
      separacion_valor: 15_000_000,
    });
    expect(findEtapaPlan("9", config)).toBeNull();
  });
});

describe("resolveEtapaPlan", () => {
  it("uses etapaPlan params when set (fuente 'etapa'), highest precedence over torre/config", () => {
    const etapaPlan: EtapaPlanConfig = {
      nombre: "1",
      fecha_entrega: "2028-01-01",
      pct_inicial: 30,
      separacion_tipo: "fijo",
      separacion_valor: 15_000_000,
    };
    const t = torre({
      fecha_entrega: "2099-01-01",
      plan_pct_inicial: 99,
      plan_separacion_tipo: "porcentaje",
      plan_separacion_valor: 1,
    });
    const config = baseConfig({
      calc_defaults: { pct_inicial: 10, separacion_tipo: "fijo", separacion_valor: 1 },
    });

    const plan = resolveEtapaPlan(etapaPlan, t, config);

    expect(plan).toEqual({
      pctInicial: 30,
      separacionTipo: "fijo",
      separacionValor: 15_000_000,
      fechaEntrega: "2028-01-01",
      tipoEntrega: "fecha_fija",
      plazoMeses: 24,
      fuente: "etapa",
    });
  });

  it("uses torre params when set and etapaPlan is null (fuente 'etapa')", () => {
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

    const plan = resolveEtapaPlan(null, t, config);

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

  it("falls back to project calc_defaults + fecha_estimada_entrega when etapaPlan and torre are both null (fuente 'proyecto')", () => {
    const config = baseConfig({
      calc_defaults: { pct_inicial: 30, separacion_tipo: "fijo", separacion_valor: 1_000_000 },
      fecha_estimada_entrega: "2029-03-01",
    });

    const plan = resolveEtapaPlan(null, null, config);

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
    const plan = resolveEtapaPlan(null, null, null);

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

    const plan = resolveEtapaPlan(null, null, config);

    expect(plan.fuente).toBe("incompleta");
    expect(plan.fechaEntrega).toBeNull();
  });

  it("a phase (etapaPlan) with no fecha_entrega and no other fecha source -> fuente 'incompleta'", () => {
    const etapaPlan: EtapaPlanConfig = {
      nombre: "3",
      fecha_entrega: null,
      pct_inicial: 40,
      separacion_tipo: "porcentaje",
      separacion_valor: 3,
    };
    const config = baseConfig(); // no fecha_estimada_entrega

    const plan = resolveEtapaPlan(etapaPlan, null, config);

    expect(plan.tipoEntrega).toBe("fecha_fija");
    expect(plan.fechaEntrega).toBeNull();
    expect(plan.fuente).toBe("incompleta");
  });

  it("plazo_desde_compra mode with no plazo_entrega_meses configured falls back to 24, fuente 'proyecto'", () => {
    const config = baseConfig({ tipo_entrega: "plazo_desde_compra" });

    const plan = resolveEtapaPlan(null, null, config);

    expect(plan.tipoEntrega).toBe("plazo_desde_compra");
    expect(plan.plazoMeses).toBe(24);
    expect(plan.fuente).toBe("proyecto");
  });

  it("fuente 'incompleta' takes precedence over 'etapa': torre with plan params but no resolvable fecha (fecha_fija)", () => {
    const t = torre({ plan_pct_inicial: 40 }); // fecha_entrega null
    const config = baseConfig(); // no fecha_estimada_entrega, tipo_entrega defaults to fecha_fija

    const plan = resolveEtapaPlan(null, t, config);

    expect(plan.tipoEntrega).toBe("fecha_fija");
    expect(plan.fechaEntrega).toBeNull();
    // Must be "incompleta" (the UI's block-signal), NOT "etapa" — otherwise
    // buildDeliveryPlan silently collapses to contado without any warning.
    expect(plan.fuente).toBe("incompleta");
  });

  it("torre providing only one field (partial override) still counts as fuente 'etapa'", () => {
    const t = torre({ plan_pct_inicial: 35 });
    const config = baseConfig({ fecha_estimada_entrega: "2028-01-01" });

    const plan = resolveEtapaPlan(null, t, config);

    expect(plan.fuente).toBe("etapa");
    expect(plan.pctInicial).toBe(35);
    expect(plan.fechaEntrega).toBe("2028-01-01");
  });
});

describe("buildDeliveryPlan — reference cases (real numbers, exact assertions)", () => {
  it("Indigo Etapa 2: $675,000,000 / 50% inicial / separacion 2.5% / 23 cuotas x $13,940,217 / financiacion 50%", () => {
    const plan = resolveEtapaPlan(
      null,
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
      null,
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
      null,
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

  it("Indigo E1 (real, etapaPlan): casa $670M, etapa '1' fijo separacion 15M, fecha 2028-01-01, quote 2026-07-07 -> 18 cuotas x $10,333,333", () => {
    const etapaPlan: EtapaPlanConfig = {
      nombre: "1",
      fecha_entrega: "2028-01-01",
      pct_inicial: 30,
      separacion_tipo: "fijo",
      separacion_valor: 15_000_000,
    };
    const plan = resolveEtapaPlan(etapaPlan, null, null);

    const result = buildDeliveryPlan(670_000_000, plan, "2026-07-07");

    expect(plan.fuente).toBe("etapa");
    expect(result.cuotas).toBe(18);
    expect(result.separacionPesos).toBe(15_000_000);
    expect(result.inicialPesos).toBe(201_000_000);
    expect(result.cuotaMensualPesos).toBe(10_333_333);
    expect(result.financiacionPesos).toBe(469_000_000);
    expect(result.contado).toBe(false);
  });

  it("Indigo E2 (real, etapaPlan): casa $670M, etapa '2' porcentaje_inicial 5%, fecha 2029-01-01, quote 2026-07-07 -> 30 cuotas x $10,608,333", () => {
    const etapaPlan: EtapaPlanConfig = {
      nombre: "2",
      fecha_entrega: "2029-01-01",
      pct_inicial: 50,
      separacion_tipo: "porcentaje_inicial",
      separacion_valor: 5,
    };
    const plan = resolveEtapaPlan(etapaPlan, null, null);

    const result = buildDeliveryPlan(670_000_000, plan, "2026-07-07");

    expect(plan.fuente).toBe("etapa");
    expect(result.cuotas).toBe(30);
    expect(result.inicialPesos).toBe(335_000_000);
    expect(result.separacionPesos).toBe(16_750_000);
    expect(result.cuotaMensualPesos).toBe(10_608_333);
    expect(result.financiacionPesos).toBe(335_000_000);
    expect(result.contado).toBe(false);
  });

  it("Indigo E1/E2 resolved end-to-end via findEtapaPlan against cotizador_config.etapas_plan", () => {
    const config = baseConfig({
      etapas_plan: [
        {
          nombre: "1",
          fecha_entrega: "2028-01-01",
          pct_inicial: 30,
          separacion_tipo: "fijo",
          separacion_valor: 15_000_000,
        },
        {
          nombre: "2",
          fecha_entrega: "2029-01-01",
          pct_inicial: 50,
          separacion_tipo: "porcentaje_inicial",
          separacion_valor: 5,
        },
      ],
    });

    const plan1 = resolveEtapaPlan(findEtapaPlan("1", config), null, config);
    const result1 = buildDeliveryPlan(670_000_000, plan1, "2026-07-07");
    expect(result1.cuotas).toBe(18);
    expect(result1.separacionPesos).toBe(15_000_000);
    expect(result1.cuotaMensualPesos).toBe(10_333_333);

    const plan2 = resolveEtapaPlan(findEtapaPlan("2", config), null, config);
    const result2 = buildDeliveryPlan(670_000_000, plan2, "2026-07-07");
    expect(result2.cuotas).toBe(30);
    expect(result2.separacionPesos).toBe(16_750_000);
    expect(result2.cuotaMensualPesos).toBe(10_608_333);

    // E3: phase with no plan configured -> "incompleta", never invents a plan.
    const plan3 = resolveEtapaPlan(findEtapaPlan("3", config), null, config);
    expect(plan3.fuente).toBe("incompleta");
  });
});

describe("buildDeliveryPlan — plazo_desde_compra model", () => {
  it("N is constant (plazoMeses), independent of quote date / fecha_entrega", () => {
    const plan = resolveEtapaPlan(
      null,
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
      null,
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
    const plan = resolveEtapaPlan(null, null, null); // fuente "incompleta", fechaEntrega null

    const result = buildDeliveryPlan(100_000_000, plan, "2026-07-15");

    expect(result.cuotas).toBe(0);
    expect(result.contado).toBe(true);
    expect(result.cuotaMensualPesos).toBe(0);
  });
});

describe("buildDeliveryPlan — fijo separacion", () => {
  it("resolves a fixed-peso separacion instead of a percentage", () => {
    const plan = resolveEtapaPlan(
      null,
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
    expect(result.cuotaMensualPesos).toBe(15_833_333);
    expect(result.fases[0]).toEqual(
      { id: "calc-separacion", nombre: "Separación", tipo: "fijo", valor: 10_000_000, cuotas: 1, frecuencia: "unica" },
    );
  });
});

describe("buildDeliveryPlan — porcentaje_inicial separacion", () => {
  it("resolves separacion as a percentage of the cuota inicial (not of the total)", () => {
    const plan = resolveEtapaPlan(
      null,
      torre({
        fecha_entrega: "2027-07-01",
        plan_pct_inicial: 50,
        plan_separacion_tipo: "porcentaje_inicial",
        plan_separacion_valor: 5,
      }),
      null,
    );

    const result = buildDeliveryPlan(400_000_000, plan, "2026-07-15");

    // inicial = round(400M * 50%) = 200,000,000; separacion = round(200,000,000 * 5%) = 10,000,000
    expect(result.inicialPesos).toBe(200_000_000);
    expect(result.separacionPesos).toBe(10_000_000);
    expect(result.cuotas).toBe(12);
    expect(result.cuotaMensualPesos).toBe(15_833_333);
    expect(result.fases[0]).toEqual(
      { id: "calc-separacion", nombre: "Separación", tipo: "fijo", valor: 10_000_000, cuotas: 1, frecuencia: "unica" },
    );
  });
});

describe("buildDeliveryPlan — separacionExcedeInicial guard", () => {
  it("flags when separacion (fijo) meets or exceeds the resolved cuota inicial, but still builds", () => {
    const plan = resolveEtapaPlan(
      null,
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
