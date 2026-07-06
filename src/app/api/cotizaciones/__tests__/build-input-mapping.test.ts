import { describe, it, expect } from "vitest";
import { buildInputFromDbRows } from "@/lib/cotizador/html/from-db";
import { calcularCotizacion } from "@/lib/cotizador/calcular";
import type { CotizadorConfig } from "@/types";

const config: CotizadorConfig = {
  moneda: "COP", separacion_incluida_en_inicial: false, descuentos: [], notas_legales: "Legal X",
  fases: [
    { id: "f1", nombre: "Inicial", tipo: "porcentaje", valor: 30, cuotas: 1, frecuencia: "unica" },
    { id: "f2", nombre: "Saldo", tipo: "resto", valor: 0, cuotas: 1, frecuencia: "unica" },
  ],
};

describe("buildInputFromDbRows", () => {
  it("maps project + unit snapshot + resultado into BuildCotizacionDataInput", () => {
    const resultado = calcularCotizacion(250_000_000, config);
    const input = buildInputFromDbRows({
      resultado, config, moneda: "COP",
      proyecto: {
        nombre: "Garden Houses", constructora_nombre: "Demo SAS", color_primario: "#2e5d4a",
        ubicacion_direccion: "Vereda X", estado_construccion: "en_construccion",
        logo_url: "https://x/logo.png", constructora_logo_url: null,
        cover_url: "https://x/cover.jpg", renders: ["https://x/r1.jpg"], plano_url: "https://x/plano.jpg",
        whatsapp_numero: "+57300", tour_360_url: null,
      },
      unidadSnapshot: {
        identificador: "Casa 4", tipologia: "Tipo B", area_construida: 120, area_privada: 110,
        area_lote: 200, area_m2: 120, piso: null, vista: "Bosque", habitaciones: 4, banos: 3,
        orientacion: "Sur", tiene_terraza: true,
      },
      unidadMedida: "m²",
      agente: { nombre: "Carlos", telefono: "+57301", email: "c@x.com", avatarUrl: null },
      buyer: { nombre: "Marta", email: "m@x.com", telefono: "+57302" },
      complementos: [],
      fechaDisplay: "26 de junio de 2026", fechaEstimadaEntrega: "2028", referenceNumber: "COT-1",
      paymentPlanNombre: "Plan", idioma: "es", monedaSecundaria: null, tipoCambio: null,
    });

    expect(input.proyecto.nombre).toBe("Garden Houses");
    expect(input.proyecto.colorPrimario).toBe("#2e5d4a");
    expect(input.unidad.identificador).toBe("Casa 4");
    expect(input.unidad.features.tiene_terraza).toBe(true);
    expect(input.notasLegales).toBe("Legal X");
    expect(input.resultado.precio_base).toBe(250_000_000);
    // Not requested → grouped-PDF flag stays off downstream
    expect(input.agrupar_inicial).toBeUndefined();
  });

  it("threads agrupar_inicial through to the build input (persist/preview/regenerate routes set it from plan_origen)", () => {
    const resultado = calcularCotizacion(250_000_000, config);
    const input = buildInputFromDbRows({
      resultado, config, moneda: "COP",
      proyecto: {
        nombre: "P", constructora_nombre: null, color_primario: null,
        ubicacion_direccion: null, estado_construccion: "sobre_planos",
        logo_url: null, constructora_logo_url: null,
        cover_url: null, renders: [], plano_url: null,
        whatsapp_numero: null, tour_360_url: null,
      },
      unidadSnapshot: { identificador: "U1" },
      unidadMedida: "m²",
      agente: { nombre: null, telefono: null, email: null, avatarUrl: null },
      buyer: { nombre: "B", email: "b@x.com", telefono: null },
      complementos: [],
      fechaDisplay: "—", fechaEstimadaEntrega: null, referenceNumber: "R",
      paymentPlanNombre: "Plan", idioma: "es", monedaSecundaria: null, tipoCambio: null,
      agrupar_inicial: true,
    });

    expect(input.agrupar_inicial).toBe(true);
  });
});
