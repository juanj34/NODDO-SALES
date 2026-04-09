/**
 * Test: render CotizacionDocument with comprehensive mock data
 *
 * Run: npx tsx scripts/test-react-pdf.ts
 */
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { registerFonts } from "../src/lib/cotizador/pdf-react/fonts";
import { CotizacionDocument } from "../src/lib/cotizador/pdf-react/document";
import type { PDFData } from "../src/lib/cotizador/generar-pdf";
import * as fs from "fs";
import sharp from "sharp";

// Fetch an image from URL and return as base64 JPEG
async function fetchImageBase64(url: string): Promise<{ base64: string; format: "JPEG" }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const arrayBuf = await res.arrayBuffer();
  const buf = await sharp(Buffer.from(arrayBuf)).jpeg({ quality: 85 }).toBuffer();
  return { base64: buf.toString("base64"), format: "JPEG" as const };
}

// Generate a solid color placeholder image
async function generatePlaceholder(w: number, h: number, bg: { r: number; g: number; b: number }): Promise<{ base64: string; format: "JPEG" }> {
  const buf = await sharp({ create: { width: w, height: h, channels: 3, background: bg } }).jpeg({ quality: 80 }).toBuffer();
  return { base64: buf.toString("base64"), format: "JPEG" as const };
}

async function buildMockData(): Promise<PDFData> {
  console.log("  Fetching cover image from Unsplash...");
  const cover = await fetchImageBase64("https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&fit=crop");
  console.log("  Generating floor plan placeholder...");
  const plano = await generatePlaceholder(800, 600, { r: 245, g: 243, b: 240 });

  return {
  projectName: "Indigo Houses",
  constructoraName: "Grupo Inmobiliario Altus",
  colorPrimario: "#b8973a",
  unidadId: "T2-301",
  tipologiaName: "Tipo M1 — 3 Habitaciones",
  area_construida: 95,
  area_privada: 78,
  area_lote: null,
  area_m2: 95,
  unidad_medida: "m²",
  piso: 3,
  vista: "Exterior — Parque",
  habitaciones: 3,
  banos: 2,
  orientacion: "Norte",
  parqueaderos: 1,
  depositos: 1,
  tiene_terraza: true,
  tiene_jardin: false,
  tiene_bbq: true,
  tiene_jacuzzi: false,
  tiene_piscina: false,
  tiene_cuarto_servicio: true,
  tiene_estudio: false,
  tiene_chimenea: false,
  tiene_doble_altura: false,
  tiene_rooftop: false,
  estadoConstruccion: "en_construccion",
  ubicacionDireccion: "Cra 43A #1Sur-100, El Poblado, Medellín",
  amoblado: false,
  resultado: {
    precio_base: 450000000,
    descuentos_aplicados: [
      { nombre: "Descuento lanzamiento", monto: 15000000 },
      { nombre: "Pago de contado 5%", monto: 22500000 },
    ],
    precio_neto: 412500000,
    fases: [
      { nombre: "Separación", porcentaje: 5, monto_total: 22625000, cuotas: 1, frecuencia: "unica", monto_por_cuota: 22625000, fecha: "15/04/2026" },
      { nombre: "Cuota inicial", porcentaje: 25, monto_total: 113125000, cuotas: 18, frecuencia: "mensual", monto_por_cuota: 6284722, fecha: "15/05/2026" },
      { nombre: "Cuota al 50% constructivo", porcentaje: 10, monto_total: 45250000, cuotas: 1, frecuencia: "unica", monto_por_cuota: 45250000, condicion_hito: "Al 50% de avance" },
      { nombre: "Entrega", porcentaje: 60, monto_total: 271500000, cuotas: 1, frecuencia: "unica", monto_por_cuota: 271500000, fecha: "01/12/2027" },
    ],
    complementos: [
      { complemento_id: "c1", tipo: "parqueadero", identificador: "P-15", subtipo: "Cubierto", precio: 35000000, suma_al_total: true },
      { complemento_id: "c2", tipo: "parqueadero", identificador: "P-16", subtipo: "Cubierto", precio: 35000000, suma_al_total: true, es_extra: true, precio_negociado: 32000000 },
      { complemento_id: "c3", tipo: "deposito", identificador: "D-08", subtipo: null, precio: 12000000, suma_al_total: true },
      { complemento_id: "c4", tipo: "addon", identificador: "Closet vestier", subtipo: "Madera roble", precio: 8500000, suma_al_total: true },
    ],
    complementos_total: 87500000,
    precio_total: 500000000,
    cargos_aplicados: [
      { nombre: "Escrituración", monto: 5000000, tipo: "porcentaje", porcentaje: 1 },
    ],
    cargos_total: 5000000,
  },
  config: {
    moneda: "COP",
    fases: [],
    descuentos: [],
    separacion_incluida_en_inicial: true,
    notas_legales: "Precios sujetos a cambios sin previo aviso. Las áreas y acabados pueden variar según disponibilidad.",
  },
  buyerName: "Juan Jaramillo Restrepo",
  buyerEmail: "juan.jaramillo@email.com",
  buyerPhone: "+57 300 123 4567",
  agenteName: "María Fernanda López",
  agentePhone: "+57 310 555 9876",
  agenteEmail: "mflopez@altus.com.co",
  fecha: "8 de abril de 2026",
  referenceNumber: "COT-2026-A1B2C3",
  coverImageBase64: cover.base64,
  coverImageFormat: cover.format,
  constructoraLogoBase64: null,
  constructoraLogoFormat: null,
  projectLogoBase64: null,
  projectLogoFormat: null,
  planoBase64: plano.base64,
  planoFormat: plano.format,
  planoWidth: 800,
  planoHeight: 600,
  tour360Url: "https://matterport.com/tour/example",
  whatsappNumero: "+57 300 999 8888",
  disclaimer: "Esta cotización tiene validez de 15 días calendario a partir de la fecha de emisión.",
  complementos: [
    { complemento_id: "c1", tipo: "parqueadero", identificador: "P-15", subtipo: "Cubierto", precio: 35000000, suma_al_total: true },
    { complemento_id: "c2", tipo: "parqueadero", identificador: "P-16", subtipo: "Cubierto", precio: 35000000, suma_al_total: true, es_extra: true, precio_negociado: 32000000 },
    { complemento_id: "c3", tipo: "deposito", identificador: "D-08", subtipo: null, precio: 12000000, suma_al_total: true },
    { complemento_id: "c4", tipo: "addon", identificador: "Closet vestier", subtipo: "Madera roble", precio: 8500000, suma_al_total: true },
  ],
  pdfSaludo: "Estimado(a) {name}, es un placer presentarle esta oferta exclusiva para el proyecto {project}. Hemos preparado un plan financiero a su medida con condiciones preferenciales.",
  pdfDespedida: "Quedamos atentos a sus comentarios. Será un gusto acompañarle en este proceso.",
  fechaEstimadaEntrega: "Diciembre 2027",
  coverStyle: "hero",
  pdfTheme: "dark",
  idioma: "es",
  paymentPlanNombre: "Plan Preferencial — 18 Meses",
  monedaSecundaria: "USD",
  tipoCambio: 0.00025,
  };
}

async function main() {
  console.log("Building mock data (generating test cover image)...");
  const mockData = await buildMockData();

  console.log("Registering fonts...");
  registerFonts();

  console.log("Creating CotizacionDocument...");
  const element = React.createElement(CotizacionDocument, { data: mockData });

  console.log("Rendering to buffer...");
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(element as any);
    console.log(`Success! Buffer size: ${buffer.byteLength} bytes`);
    const outFile = `test-cotizacion-${Date.now()}.pdf`;
    fs.writeFileSync(outFile, Buffer.from(buffer));
    console.log(`Written to ${outFile}`);
  } catch (err) {
    console.error("RENDER FAILED:", err);
    process.exit(1);
  }
}

main();
