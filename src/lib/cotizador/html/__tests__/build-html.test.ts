import { describe, it, expect } from "vitest";
import { calcularCotizacion } from "@/lib/cotizador/calcular";
import { buildCotizacionData } from "@/lib/cotizador/html/build-data";
import { buildCotizacionHtml } from "@/lib/cotizador/html/build-html";
import type { BuildCotizacionDataInput } from "@/lib/cotizador/html/types";
import type { CotizadorConfig } from "@/types";
import { formatCurrency } from "@/lib/currency";

const config: CotizadorConfig = {
  moneda: "COP",
  separacion_incluida_en_inicial: false,
  descuentos: [],
  notas_legales: "Cotización indicativa. Valores sujetos a confirmación.",
  cargos_adicionales: [{ id: "admin", nombre: "Gastos de escrituración", tipo: "fijo", valor: 5_000_000 }],
  fases: [
    { id: "f1", nombre: "Cuota inicial", tipo: "porcentaje", valor: 30, cuotas: 1, frecuencia: "unica" },
    { id: "f2", nombre: "Cuotas", tipo: "porcentaje", valor: 30, cuotas: 18, frecuencia: "mensual" },
    { id: "f3", nombre: "Saldo a la entrega", tipo: "resto", valor: 0, cuotas: 1, frecuencia: "unica" },
  ],
};

function makeView(price = 300_000_000) {
  const resultado = calcularCotizacion(price, config);
  const input: BuildCotizacionDataInput = {
    resultado,
    config,
    moneda: "COP",
    proyecto: {
      nombre: "Hito 18", constructoraNombre: "Constructora Demo", colorPrimario: "#b8973a",
      ubicacionDireccion: "Calle 18 #45-10", estadoConstruccion: "sobre_planos",
      logoUrl: "https://cdn.noddo.io/p/logo.png", constructoraLogoUrl: null,
      coverUrl: "https://cdn.noddo.io/p/cover.jpg",
      renders: ["https://cdn.noddo.io/p/r1.jpg"], planoUrl: "https://cdn.noddo.io/p/plano.jpg",
      whatsappNumero: "+573001112233", tour360Url: null,
    },
    unidad: {
      identificador: "Apto 1203", tipologiaName: "Tipología A", areaConstruida: 78, areaPrivada: 70,
      areaLote: null, areaM2: 78, unidadMedida: "m²", piso: 12, vista: "Ciudad",
      habitaciones: 3, banos: 2, orientacion: "Nororiente", parqueaderos: 1, depositos: 1,
      features: { tiene_terraza: true },
    },
    agente: { nombre: "Ana Pérez", telefono: "+573009998877", email: "ana@x.com", avatarUrl: null },
    buyer: { nombre: "Juan Comprador", email: "juan@cliente.com", telefono: "+573004445566" },
    complementos: [],
    fechaDisplay: "26 de junio de 2026", fechaEstimadaEntrega: "Diciembre 2028",
    referenceNumber: "COT-2026-AB12", paymentPlanNombre: "Plan 30/30/40",
    notasLegales: config.notas_legales, idioma: "es", monedaSecundaria: null, tipoCambio: null,
  };
  return { view: buildCotizacionData(input), resultado };
}

describe("buildCotizacionHtml", () => {
  it("emits a self-contained HTML document with inlined brand fonts", () => {
    const { view } = makeView();
    const html = buildCotizacionHtml(view);
    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(html).toContain("@font-face");
    expect(html).toContain("data:font/ttf;base64,");
    // No external stylesheet/script refs
    expect(html).not.toContain("<link rel=\"stylesheet\"");
    expect(html).not.toContain("<script");
  });

  it("makes the payment table page-break safe for any number of cuotas", () => {
    const { view } = makeView();
    expect(view.fases[1].cuotas).toBe(18); // long plan
    const html = buildCotizacionHtml(view);
    // Rows never split mid-row; header repeats on each page
    expect(html).toContain("page-break-inside:avoid");
    expect(html).toContain("display:table-header-group");
    // One <tr> per phase row is present
    const rowCount = (html.match(/data-fase-row/g) || []).length;
    expect(rowCount).toBe(view.fases.length);
  });

  it("shows the grand total = plan total + cargos", () => {
    const { view, resultado } = makeView();
    const planTotal = resultado.precio_total ?? resultado.precio_neto;
    const cargosTotal = resultado.cargos_total ?? 0;
    expect(cargosTotal).toBe(5_000_000);
    const html = buildCotizacionHtml(view);
    expect(html).toContain(formatCurrency(planTotal + cargosTotal, "COP")); // grand total rendered
    expect(html).toContain("Gastos de escrituración"); // cargo itemized
  });

  it("honors precio_negociado (renders the negotiated price, not a list price)", () => {
    const { view } = makeView(270_000_000);
    expect(view.precioBase).toBe(270_000_000);
    const html = buildCotizacionHtml(view);
    expect(html).toContain(formatCurrency(270_000_000, "COP"));
  });

  it("escapes user-controlled text (no raw injection)", () => {
    const { view } = makeView();
    view.buyerNombre = "<script>alert(1)</script>";
    const html = buildCotizacionHtml(view);
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
