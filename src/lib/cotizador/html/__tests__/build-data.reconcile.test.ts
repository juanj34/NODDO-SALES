import { describe, it, expect } from "vitest";
import { calcularCotizacion } from "@/lib/cotizador/calcular";
import { buildCotizacionData } from "@/lib/cotizador/html/build-data";
import type { BuildCotizacionDataInput } from "@/lib/cotizador/html/types";
import type { CotizadorConfig } from "@/types";

function inputFor(resultado: ReturnType<typeof calcularCotizacion>, config: CotizadorConfig): BuildCotizacionDataInput {
  return {
    resultado, config, moneda: "COP",
    proyecto: { nombre: "P", constructoraNombre: null, colorPrimario: null, ubicacionDireccion: null,
      estadoConstruccion: "sobre_planos", logoUrl: null, constructoraLogoUrl: null, coverUrl: null,
      renders: [], planoUrl: null, whatsappNumero: null, tour360Url: null },
    unidad: { identificador: "U1", tipologiaName: null, areaConstruida: null, areaPrivada: null, areaLote: null,
      areaM2: null, unidadMedida: "m²", piso: null, vista: null, habitaciones: null, banos: null,
      orientacion: null, parqueaderos: null, depositos: null, features: {} },
    agente: { nombre: null, telefono: null, email: null, avatarUrl: null },
    buyer: { nombre: "B", email: "b@x.com", telefono: null },
    complementos: [], fechaDisplay: "—", fechaEstimadaEntrega: null, referenceNumber: "R",
    paymentPlanNombre: "Plan", notasLegales: null, idioma: "es", monedaSecundaria: null, tipoCambio: null,
  };
}

const cfg = (cargos?: CotizadorConfig["cargos_adicionales"]): CotizadorConfig => ({
  moneda: "COP", separacion_incluida_en_inicial: false, descuentos: [], notas_legales: null,
  cargos_adicionales: cargos,
  fases: [
    { id: "f1", nombre: "Inicial", tipo: "porcentaje", valor: 40, cuotas: 1, frecuencia: "unica" },
    { id: "f2", nombre: "Saldo", tipo: "resto", valor: 0, cuotas: 1, frecuencia: "unica" },
  ],
});

describe("buildCotizacionData reconciliation", () => {
  it("grandTotal == phaseSum + cargosTotal (cargos added on top of the plan)", () => {
    const config = cfg([{ id: "iva", nombre: "IVA", tipo: "porcentaje", valor: 5 }]);
    const resultado = calcularCotizacion(200_000_000, config);
    const view = buildCotizacionData(inputFor(resultado, config));
    const phaseSum = view.fases.reduce((s, f) => s + f.montoTotal, 0);
    expect(phaseSum).toBe(view.planTotal);
    expect(view.cargosTotal).toBe(10_000_000); // 5% of 200M
    expect(view.grandTotal).toBe(phaseSum + view.cargosTotal);
  });

  it("grandTotal == phaseSum when no cargos (Colombia default)", () => {
    const config = cfg();
    const resultado = calcularCotizacion(200_000_000, config);
    const view = buildCotizacionData(inputFor(resultado, config));
    const phaseSum = view.fases.reduce((s, f) => s + f.montoTotal, 0);
    expect(view.cargosTotal).toBe(0);
    expect(view.grandTotal).toBe(phaseSum);
  });
});
