import { describe, it, expect } from "vitest";
import { calcularCotizacion } from "@/lib/cotizador/calcular";
import { buildCotizacionData } from "@/lib/cotizador/html/build-data";
import type { BuildCotizacionDataInput } from "@/lib/cotizador/html/types";
import type { CotizadorConfig } from "@/types";

const config: CotizadorConfig = {
  moneda: "COP",
  separacion_incluida_en_inicial: false,
  descuentos: [],
  notas_legales: "Cotización indicativa. Valores sujetos a confirmación.",
  fases: [
    { id: "f1", nombre: "Cuota inicial", tipo: "porcentaje", valor: 30, cuotas: 1, frecuencia: "unica" },
    { id: "f2", nombre: "Cuotas", tipo: "porcentaje", valor: 30, cuotas: 6, frecuencia: "mensual" },
    { id: "f3", nombre: "Saldo a la entrega", tipo: "resto", valor: 0, cuotas: 1, frecuencia: "unica" },
  ],
};

function baseInput(overrides: Partial<BuildCotizacionDataInput> = {}): BuildCotizacionDataInput {
  const resultado = calcularCotizacion(300_000_000, config);
  return {
    resultado,
    config,
    moneda: "COP",
    proyecto: {
      nombre: "Hito 18",
      constructoraNombre: "Constructora Demo",
      colorPrimario: "#b8973a",
      ubicacionDireccion: "Calle 18 #45-10, Medellín",
      estadoConstruccion: "sobre_planos",
      logoUrl: "https://cdn.noddo.io/p/logo.png",
      constructoraLogoUrl: null,
      coverUrl: "https://cdn.noddo.io/p/render-cover.jpg",
      renders: ["https://cdn.noddo.io/p/render-1.jpg", "https://cdn.noddo.io/p/render-2.jpg"],
      planoUrl: "https://cdn.noddo.io/p/plano-a.jpg",
      whatsappNumero: "+573001112233",
      tour360Url: null,
    },
    unidad: {
      identificador: "Apto 1203",
      tipologiaName: "Tipología A",
      areaConstruida: 78,
      areaPrivada: 70,
      areaLote: null,
      areaM2: 78,
      unidadMedida: "m²",
      piso: 12,
      vista: "Ciudad",
      habitaciones: 3,
      banos: 2,
      orientacion: "Nororiente",
      parqueaderos: 1,
      depositos: 1,
      features: { tiene_terraza: true, tiene_jacuzzi: false },
    },
    agente: { nombre: "Ana Pérez", telefono: "+573009998877", email: "ana@constructora.com", avatarUrl: null },
    buyer: { nombre: "Juan Comprador", email: "juan@cliente.com", telefono: "+573004445566" },
    complementos: [],
    fechaDisplay: "26 de junio de 2026",
    fechaEstimadaEntrega: "Diciembre 2028",
    referenceNumber: "COT-2026-AB12",
    paymentPlanNombre: "Plan 30/30/40",
    notasLegales: config.notas_legales,
    idioma: "es",
    monedaSecundaria: null,
    tipoCambio: null,
    ...overrides,
  };
}

describe("buildCotizacionData", () => {
  it("normalizes a quote into a flat CotizacionView", () => {
    const view = buildCotizacionData(baseInput());
    expect(view.proyectoNombre).toBe("Hito 18");
    expect(view.unidadId).toBe("Apto 1203");
    expect(view.tipologiaName).toBe("Tipología A");
    expect(view.referenceNumber).toBe("COT-2026-AB12");
    expect(view.fases.length).toBe(3);
    // The 6-cuota phase keeps its cuotas count + per-cuota amount for the table
    expect(view.fases[1].cuotas).toBe(6);
    expect(view.fases[1].montoPorCuota).toBeGreaterThan(0);
  });

  it("grand total = plan total + cargos and equals the phase sum + cargos", () => {
    // Add a 2% cargo to prove it is summed into the grand total but NOT into the phases
    const cfgWithCargo: CotizadorConfig = {
      ...config,
      cargos_adicionales: [{ id: "iva", nombre: "IVA", tipo: "porcentaje", valor: 2 }],
    };
    const resultado = calcularCotizacion(300_000_000, cfgWithCargo);
    const view = buildCotizacionData(baseInput({ resultado, config: cfgWithCargo }));

    const planTotal = resultado.precio_total ?? resultado.precio_neto; // phases sum to this
    const cargosTotal = resultado.cargos_total ?? 0;
    const phaseSum = view.fases.reduce((s, f) => s + f.montoTotal, 0);

    expect(cargosTotal).toBeGreaterThan(0);
    expect(phaseSum).toBe(planTotal);                      // phases reconcile to the plan total
    expect(view.planTotal).toBe(planTotal);
    expect(view.cargosTotal).toBe(cargosTotal);
    expect(view.grandTotal).toBe(planTotal + cargosTotal); // grand total includes cargos
  });

  it("honors precio_negociado (consumes the already-priced resultado, never re-prices)", () => {
    // Caller negotiated 270M; calcular.ts was called with 270M (per correctness plan)
    const negotiated = calcularCotizacion(270_000_000, config);
    const view = buildCotizacionData(baseInput({ resultado: negotiated }));
    expect(view.precioBase).toBe(270_000_000);
    expect(view.planTotal).toBe(270_000_000);
  });
});
