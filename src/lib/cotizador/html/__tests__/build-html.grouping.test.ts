import { describe, it, expect } from "vitest";
import { calcularCotizacion } from "@/lib/cotizador/calcular";
import { buildCotizacionData } from "@/lib/cotizador/html/build-data";
import { buildCotizacionHtml } from "@/lib/cotizador/html/build-html";
import type { BuildCotizacionDataInput } from "@/lib/cotizador/html/types";
import type { CotizadorConfig, FaseConfig } from "@/types";
import { formatCurrency } from "@/lib/currency";

/**
 * Reference case (Índigo Etapa 2, per the delivery-calculator design spec):
 * $675,000,000 · inicial 50% · separación $16,875,000 (2.5%) · 23 cuotas × $13,940,217 ·
 * financiación 50%. This is the exact 3-fase shape `buildDeliveryPlan` emits
 * (delivery-calc.test.ts), so it doubles as the "calculadora" shape fixture here.
 */
const calcFases: FaseConfig[] = [
  { id: "calc-separacion", nombre: "Separación", tipo: "fijo", valor: 16_875_000, cuotas: 1, frecuencia: "unica" },
  { id: "calc-inicial", nombre: "Cuota inicial", tipo: "porcentaje", valor: 50, cuotas: 23, frecuencia: "mensual" },
  { id: "calc-financiacion", nombre: "Financiación", tipo: "resto", valor: 0, cuotas: 1, frecuencia: "unica" },
];

function baseConfig(overrides: Partial<CotizadorConfig> = {}): CotizadorConfig {
  return {
    moneda: "COP",
    separacion_incluida_en_inicial: true,
    descuentos: [],
    notas_legales: "Cotización indicativa.\nValores sujetos a confirmación.",
    fases: calcFases,
    ...overrides,
  };
}

function baseInput(
  config: CotizadorConfig,
  overrides: Partial<BuildCotizacionDataInput> = {},
): BuildCotizacionDataInput {
  const resultado = calcularCotizacion(675_000_000, config);
  return {
    resultado,
    config,
    moneda: "COP",
    proyecto: {
      nombre: "Índigo Etapa 2", constructoraNombre: null, colorPrimario: "#b8973a",
      ubicacionDireccion: null, estadoConstruccion: "sobre_planos", logoUrl: null,
      constructoraLogoUrl: null, coverUrl: null, renders: [], planoUrl: null,
      whatsappNumero: null, tour360Url: null,
    },
    unidad: {
      identificador: "Apto 501", tipologiaName: null, areaConstruida: null, areaPrivada: null,
      areaLote: null, areaM2: null, unidadMedida: "m²", piso: null, vista: null,
      habitaciones: null, banos: null, orientacion: null, parqueaderos: null, depositos: null,
      features: {},
    },
    agente: { nombre: null, telefono: null, email: null, avatarUrl: null },
    buyer: { nombre: "Comprador Test", email: "c@x.com", telefono: null },
    complementos: [],
    fechaDisplay: "15 de julio de 2026",
    fechaEstimadaEntrega: null,
    referenceNumber: "COT-2026-XX",
    paymentPlanNombre: "Plan de Pagos",
    notasLegales: config.notas_legales,
    idioma: "es",
    monedaSecundaria: null,
    tipoCambio: null,
    ...overrides,
  };
}

describe("agrupar_inicial — grouped cuota inicial rendering", () => {
  it("defaults to false and renders the flat 3-row plan unchanged when unset", () => {
    const config = baseConfig();
    const view = buildCotizacionData(baseInput(config));
    expect(view.agruparInicial).toBe(false);

    const html = buildCotizacionHtml(view);
    const rowCount = (html.match(/data-fase-row/g) || []).length;
    expect(rowCount).toBe(3);
    expect(html).not.toContain("data-group-header");
    expect(html).not.toContain("data-group-sub");
  });

  it("flag ON + matching shape groups Separación + Cuota inicial under a summed header, indented sub-rows, then Financiación as a normal row", () => {
    const config = baseConfig();
    const view = buildCotizacionData(baseInput(config, { agrupar_inicial: true }));
    expect(view.agruparInicial).toBe(true);

    const html = buildCotizacionHtml(view);

    // Header: Hamilton pcts summed (3% + 47% = 50%), amount summed (separación + inicial-net = 337,500,000)
    expect(html).toContain("data-group-header");
    expect(html).toContain("CUOTA INICIAL (50%)");
    expect(html).toContain(formatCurrency(337_500_000, "COP"));

    // Two indented sub-rows: Separación amount, then "N cuotas mensuales de $X"
    expect((html.match(/data-group-sub/g) || []).length).toBe(2);
    expect(html).toContain("Separación");
    expect(html).toContain(formatCurrency(16_875_000, "COP"));
    expect(html).toContain("23 cuotas mensuales de");
    expect(html).toContain(formatCurrency(13_940_217, "COP"));

    // Financiación remains a normal fase row (the ONLY data-fase-row left)
    const rowCount = (html.match(/data-fase-row/g) || []).length;
    expect(rowCount).toBe(1);
    expect(html).toContain("Financiación");
    expect(html).toContain(formatCurrency(337_500_000, "COP"));
  });

  it("flag ON but fase shape doesn't match (template plan) falls back to flat rendering", () => {
    const config = baseConfig({
      fases: [
        { id: "f1", nombre: "Cuota inicial", tipo: "porcentaje", valor: 30, cuotas: 1, frecuencia: "unica" },
        { id: "f2", nombre: "Saldo", tipo: "resto", valor: 0, cuotas: 1, frecuencia: "unica" },
      ],
    });
    const view = buildCotizacionData(baseInput(config, { agrupar_inicial: true }));
    const html = buildCotizacionHtml(view);
    expect(html).not.toContain("data-group-header");
    const rowCount = (html.match(/data-fase-row/g) || []).length;
    expect(rowCount).toBe(2);
  });

  it("flag ON with matching NAMES but wrong TIPOS (Separación porcentaje instead of fijo) falls back to flat rendering", () => {
    // The calculator always emits Separación as tipo:"fijo" + Cuota inicial as
    // tipo:"porcentaje" (delivery-calc.ts). Name-only matching would group this
    // impostor shape; the detection must require name AND tipo.
    const config = baseConfig({
      fases: [
        { id: "s1", nombre: "Separación", tipo: "porcentaje", valor: 2.5, cuotas: 1, frecuencia: "unica" },
        { id: "s2", nombre: "Cuota inicial", tipo: "porcentaje", valor: 47.5, cuotas: 23, frecuencia: "mensual" },
        { id: "s3", nombre: "Financiación", tipo: "resto", valor: 0, cuotas: 1, frecuencia: "unica" },
      ],
    });
    const view = buildCotizacionData(baseInput(config, { agrupar_inicial: true }));
    expect(view.fases[0].tipo).toBe("porcentaje");
    expect(view.fases[1].tipo).toBe("porcentaje");

    const html = buildCotizacionHtml(view);
    expect(html).not.toContain("data-group-header");
    expect(html).not.toContain("data-group-sub");
    const rowCount = (html.match(/data-fase-row/g) || []).length;
    expect(rowCount).toBe(3);
  });

  it("exposes each fase's tipo on the view (fijo/porcentaje/resto from the engine)", () => {
    const config = baseConfig();
    const view = buildCotizacionData(baseInput(config));
    expect(view.fases.map((f) => f.tipo)).toEqual(["fijo", "porcentaje", "resto"]);
  });

  it("EN locale renders the grouped block with English header and sub-row labels", () => {
    const config = baseConfig();
    const view = buildCotizacionData(baseInput(config, { agrupar_inicial: true, idioma: "en" }));
    const html = buildCotizacionHtml(view);

    expect(html).toContain("data-group-header");
    expect(html).toContain("INITIAL PAYMENT (50%)");
    expect(html).toContain("Down payment");
    expect(html).toContain("23 monthly installments of");
    expect(html).not.toContain("cuotas mensuales de");
    expect(html).toContain(formatCurrency(337_500_000, "COP"));
    expect(html).toContain(formatCurrency(13_940_217, "COP"));
  });

  it("non-integer pct plan: the group header equals the SUM of the sub-fases' Hamilton pcts (documented ±1 drift vs rounding the combined pct)", () => {
    // 675M · separación fija $16,200,000 (exact 2.4%) · inicial 32.5% · resto.
    // Exact fractions: 2.4 / 30.1 / 67.5 → Hamilton hands the single missing
    // point to financiación (largest remainder .5) → displayed 2 / 30 / 68.
    // Header = 2 + 30 = 32%, while rounding the combined exact 32.5% directly
    // would give 33%. Accepted tradeoff: the header must reconcile with the
    // whole displayed vector (32 + 68 = 100); money is unaffected.
    const config = baseConfig({
      fases: [
        { id: "calc-separacion", nombre: "Separación", tipo: "fijo", valor: 16_200_000, cuotas: 1, frecuencia: "unica" },
        { id: "calc-inicial", nombre: "Cuota inicial", tipo: "porcentaje", valor: 32.5, cuotas: 23, frecuencia: "mensual" },
        { id: "calc-financiacion", nombre: "Financiación", tipo: "resto", valor: 0, cuotas: 1, frecuencia: "unica" },
      ],
    });
    const view = buildCotizacionData(baseInput(config, { agrupar_inicial: true }));
    expect(view.fases.map((f) => f.porcentaje)).toEqual([2, 30, 68]);

    const html = buildCotizacionHtml(view);
    expect(html).toContain("CUOTA INICIAL (32%)"); // sum of sub-pcts, NOT round(32.5)=33
    expect(html).not.toContain("CUOTA INICIAL (33%)");
    // Whole displayed vector still reconciles to 100.
    expect(view.fases[0].porcentaje + view.fases[1].porcentaje + view.fases[2].porcentaje).toBe(100);
  });
});

describe("extras band", () => {
  it("renders only the non-empty extras rows with the expected labels", () => {
    const config = baseConfig({ leasing_nota: "No", parqueaderos_label: "Privados" });
    const view = buildCotizacionData(baseInput(config));
    expect(view.leasingNota).toBe("No");
    expect(view.parqueaderosLabel).toBe("Privados");
    expect(view.acabadosNota).toBeNull();
    expect(view.bonosNota).toBeNull();

    const html = buildCotizacionHtml(view);
    expect(html).toContain("data-extras");
    expect(html).toContain("Leasing");
    expect(html).toContain("Parqueadero(s)");
    expect(html).not.toContain("Acabados");
    expect(html).not.toContain("Bonos y/o descuentos");
  });

  it("renders all four rows when all four config values are set", () => {
    const config = baseConfig({
      leasing_nota: "No aplica",
      parqueaderos_label: "Privados",
      acabados_nota: "Porcelanato Corona 60x60",
      bonos_nota: "Bono de escrituración incluido",
    });
    const view = buildCotizacionData(baseInput(config));
    const html = buildCotizacionHtml(view);
    expect(html).toContain("data-extras");
    expect(html).toContain("Leasing");
    expect(html).toContain("No aplica");
    expect(html).toContain("Parqueadero(s)");
    expect(html).toContain("Privados");
    expect(html).toContain("Acabados");
    expect(html).toContain("Porcelanato Corona 60x60");
    expect(html).toContain("Bonos y/o descuentos");
    expect(html).toContain("Bono de escrituración incluido");
  });

  it("omits the extras section entirely when no extras are configured", () => {
    const config = baseConfig();
    const view = buildCotizacionData(baseInput(config));
    const html = buildCotizacionHtml(view);
    expect(html).not.toContain("data-extras");
  });

  it("treats a blank/whitespace-only extra value as absent", () => {
    const config = baseConfig({ leasing_nota: "   " });
    const view = buildCotizacionData(baseInput(config));
    expect(view.leasingNota).toBeNull();
  });

  it("extras band never splits across pages (.extras declares page-break-inside:avoid)", () => {
    const config = baseConfig({ leasing_nota: "No" });
    const view = buildCotizacionData(baseInput(config));
    const html = buildCotizacionHtml(view);
    expect(html).toMatch(/\.extras\{[^}]*page-break-inside:avoid;?[^}]*\}/);
  });
});

describe("vigencia line", () => {
  it("prints the vigencia sentence above the legal notice when vigencia_dias is set", () => {
    const config = baseConfig({ vigencia_dias: 30 });
    const view = buildCotizacionData(baseInput(config));
    expect(view.vigenciaDias).toBe(30);

    const html = buildCotizacionHtml(view);
    const expected = `Esta cotización tiene vigencia de 30 días calendario a partir de su expedición (${view.fechaDisplay}).`;
    expect(html).toContain(expected);

    const vigenciaIdx = html.indexOf("tiene vigencia de 30 días");
    const legalIdx = html.indexOf("AVISO LEGAL");
    expect(vigenciaIdx).toBeGreaterThan(-1);
    expect(legalIdx).toBeGreaterThan(-1);
    expect(vigenciaIdx).toBeLessThan(legalIdx);
  });

  it("omits the vigencia line when vigencia_dias is not set", () => {
    const config = baseConfig();
    const view = buildCotizacionData(baseInput(config));
    expect(view.vigenciaDias).toBeNull();
    const html = buildCotizacionHtml(view);
    expect(html).not.toContain("tiene vigencia de");
  });
});

describe("legal notes preserve line breaks", () => {
  it(".legal CSS declares white-space:pre-line", () => {
    const config = baseConfig();
    const view = buildCotizacionData(baseInput(config));
    const html = buildCotizacionHtml(view);
    expect(html).toMatch(/\.legal\{[^}]*white-space:pre-line;?[^}]*\}/);
  });
});
