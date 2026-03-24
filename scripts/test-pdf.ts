#!/usr/bin/env node
/**
 * Test PDF Generation Script
 * Generates a test cotización PDF using Indigo Houses project data.
 * CREDENTIALS: Reads automatically from .env.local
 *
 * Usage: npx tsx --tsconfig tsconfig.scripts.json scripts/test-pdf.ts
 */

import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { calcularCotizacion } from "@/lib/cotizador/calcular";
import { generarPDF } from "@/lib/cotizador/generar-pdf";
import type { CotizadorConfig } from "@/types";
import type { EmailLocale } from "@/lib/email-i18n";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Indigo Houses project ID ──
const INDIGO_HOUSES_ID = "f70572f6-7b19-4917-968a-2370dd07e647";
const TEST_PRICE = 2450000; // 2.45M AED — realistic villa price

async function fetchImageAsBase64(
  url: string | null
): Promise<{ base64: string; format: "JPEG" | "PNG"; width?: number; height?: number } | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const uint8 = new Uint8Array(buffer);
    const isJPEG = uint8[0] === 0xff && uint8[1] === 0xd8;
    const isPNG = uint8[0] === 0x89 && uint8[1] === 0x50;

    if (!isJPEG && !isPNG) {
      const jpegBuffer = await sharp(Buffer.from(buffer))
        .resize(1200, null, { withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
      const meta = await sharp(jpegBuffer).metadata();
      return { base64: jpegBuffer.toString("base64"), format: "JPEG", width: meta.width, height: meta.height };
    }

    const resized = await sharp(Buffer.from(buffer))
      .resize(1200, null, { withoutEnlargement: true })
      .toBuffer();
    const meta = await sharp(resized).metadata();
    return {
      base64: resized.toString("base64"),
      format: isJPEG ? "JPEG" : "PNG",
      width: meta.width,
      height: meta.height,
    };
  } catch {
    return null;
  }
}

async function main() {
  console.log("Fetching Indigo Houses project data...\n");

  // 1. Fetch Indigo Houses directly
  const { data: project, error: pErr } = await supabase
    .from("proyectos")
    .select("id, nombre, constructora_nombre, constructora_logo_url, logo_url, color_primario, cotizador_config, render_principal_url, tour_360_url, whatsapp_numero, disclaimer, unidad_medida_base, idioma, moneda_base")
    .eq("id", INDIGO_HOUSES_ID)
    .single();

  if (pErr || !project) {
    console.error("Indigo Houses project not found.", pErr?.message);
    process.exit(1);
  }
  console.log(`Project: ${project.nombre}`);
  console.log(`Color: ${project.color_primario}`);
  console.log(`Currency: ${project.moneda_base}`);
  console.log(`Locale: ${project.idioma}`);

  // 2. Build Indigo Houses config (AED, Dubai-style payment plan)
  const config: CotizadorConfig = (project.cotizador_config as CotizadorConfig) ?? {
    moneda: (project.moneda_base as "COP" | "USD" | "AED") || "AED",
    separacion_incluida_en_inicial: true,
    fases: [
      { id: "booking", nombre: "Booking Fee", tipo: "fijo", valor: 50000, cuotas: 1, frecuencia: "unica" },
      { id: "down", nombre: "Down Payment", tipo: "porcentaje", valor: 35, cuotas: 1, frecuencia: "unica" },
      { id: "install", nombre: "During Construction", tipo: "porcentaje", valor: 30, cuotas: 12, frecuencia: "mensual" },
      { id: "handover", nombre: "On Handover", tipo: "resto", valor: 0, cuotas: 1, frecuencia: "unica" },
    ],
    descuentos: [],
    notas_legales: "Prices are subject to change. All areas are approximate. This document is for informational purposes only and does not constitute a binding offer.",
    pdf_cover_style: "hero",
    pdf_theme: "neutral",
  };

  // 3. Find a unit (even without price — we'll set a test price)
  const { data: units } = await supabase
    .from("unidades")
    .select("id, identificador, precio, piso, vista, habitaciones, banos, orientacion, area_construida, area_privada, area_lote, area_m2, tipologia_id, parqueaderos, depositos")
    .eq("proyecto_id", INDIGO_HOUSES_ID)
    .eq("estado", "disponible")
    .limit(1);

  if (!units?.length) {
    console.error("No available units found for Indigo Houses.");
    process.exit(1);
  }

  const unit = units[0];
  // Use test price if unit has no price
  const unitPrice = unit.precio && unit.precio > 0 ? unit.precio : TEST_PRICE;
  console.log(`\nUnit: ${unit.identificador} — Price: ${unitPrice}${unit.precio ? "" : " (test)"}`);

  // 4. Fetch tipología
  let tipologiaName: string | null = null;
  let tipologiaRenders: string[] = [];
  let tipologiaPlanoUrl: string | null = null;
  let tipologiaUbicacionPlanoUrl: string | null = null;
  let tipologiaAmenidades: string[] = [];

  if (unit.tipologia_id) {
    const { data: tipo } = await supabase
      .from("tipologias")
      .select("nombre, renders, plano_url, ubicacion_plano_url, pisos, amenidades_data")
      .eq("id", unit.tipologia_id)
      .single();

    if (tipo) {
      tipologiaName = tipo.nombre;
      tipologiaRenders = tipo.renders ?? [];
      tipologiaAmenidades = ((tipo.amenidades_data as Array<{ nombre: string }>) ?? []).map((a) => a.nombre);
      const pisos = tipo.pisos as Array<{ plano_url?: string }> | null;
      if (pisos && pisos.length > 0 && pisos[0]?.plano_url) {
        tipologiaPlanoUrl = pisos[0].plano_url;
      } else {
        tipologiaPlanoUrl = tipo.plano_url ?? null;
      }
      tipologiaUbicacionPlanoUrl = tipo.ubicacion_plano_url ?? null;
    }
  }

  console.log(`Tipología: ${tipologiaName ?? "N/A"}`);
  console.log(`Floor plan: ${tipologiaPlanoUrl ? "Yes" : "No"}`);
  console.log(`Key plan: ${tipologiaUbicacionPlanoUrl ? "Yes" : "No"}`);
  console.log(`Renders: ${tipologiaRenders.length}`);
  console.log(`Amenidades: ${tipologiaAmenidades.length}`);

  // 5. Fetch addons/complementos
  const { data: addons } = await supabase
    .from("complementos")
    .select("*")
    .eq("proyecto_id", INDIGO_HOUSES_ID)
    .eq("tipo", "addon")
    .eq("estado", "disponible")
    .limit(5);

  const addonSelections = (addons ?? []).map((a: { id: string; tipo: string; identificador: string; subtipo: string | null; precio: number | null }) => ({
    complemento_id: a.id,
    tipo: a.tipo as "addon",
    identificador: a.identificador,
    subtipo: a.subtipo,
    precio: a.precio,
    suma_al_total: true,
    es_extra: true,
  }));

  if (addonSelections.length > 0) {
    console.log(`Addons: ${addonSelections.map((a) => a.identificador).join(", ")}`);
  }

  // 6. Determine cover URL — prefer render_principal_url, then tipología renders
  const coverUrl = config.portada_url || project.render_principal_url || tipologiaRenders[0] || null;
  console.log(`\nCover URL: ${coverUrl ? "Yes" : "N/A"}`);

  // 7. Fetch images in parallel
  console.log("Fetching images...");
  const [coverImage, logoImage, projectLogoImage, planoImage, keyPlanImage] = await Promise.all([
    fetchImageAsBase64(coverUrl),
    fetchImageAsBase64(project.constructora_logo_url),
    fetchImageAsBase64(project.logo_url),
    fetchImageAsBase64(tipologiaPlanoUrl),
    fetchImageAsBase64(tipologiaUbicacionPlanoUrl),
  ]);

  console.log(`  Cover: ${coverImage ? `OK (${coverImage.width}x${coverImage.height})` : "N/A"}`);
  console.log(`  Constructora logo: ${logoImage ? "OK" : "N/A"}`);
  console.log(`  Project logo: ${projectLogoImage ? "OK" : "N/A"}`);
  console.log(`  Floor plan: ${planoImage ? "OK" : "N/A"}`);
  console.log(`  Key plan: ${keyPlanImage ? "OK" : "N/A"}`);

  // 8. Calculate cotización
  const resultado = calcularCotizacion(unitPrice, config, [], addonSelections);

  // 9. Generate PDF
  const now = new Date();
  const projectLocale: EmailLocale = (project.idioma as EmailLocale) || "en";
  const dateIntlLocale = projectLocale === "en" ? "en-US" : "es-CO";
  const fecha = now.toLocaleDateString(dateIntlLocale, { day: "numeric", month: "long", year: "numeric" });
  const refNumber = `COT-${now.getFullYear()}-TEST`;

  console.log("\nGenerating PDF...");

  const pdfBuffer = generarPDF({
    projectName: project.nombre,
    constructoraName: project.constructora_nombre,
    colorPrimario: project.color_primario || "#b8973a",
    unidadId: unit.identificador,
    tipologiaName,
    area_construida: unit.area_construida ?? null,
    area_privada: unit.area_privada ?? null,
    area_lote: unit.area_lote ?? null,
    area_m2: unit.area_m2 ?? null,
    unidad_medida: project.unidad_medida_base === "sqft" ? "sqft" : "m\u00B2",
    piso: unit.piso,
    vista: unit.vista,
    habitaciones: unit.habitaciones,
    banos: unit.banos,
    orientacion: unit.orientacion,
    parqueaderos: unit.parqueaderos ?? null,
    depositos: unit.depositos ?? null,
    resultado,
    config,
    amenidades: tipologiaAmenidades.length > 0 ? tipologiaAmenidades : undefined,
    complementos: addonSelections.length > 0 ? addonSelections : undefined,
    buyerName: "Ahmed Al Rashid",
    buyerEmail: "ahmed@example.com",
    buyerPhone: "+971 50 123 4567",
    agenteName: "Sarah Johnson",
    fecha,
    referenceNumber: refNumber,
    coverImageBase64: coverImage?.base64 ?? null,
    coverImageFormat: coverImage?.format ?? null,
    constructoraLogoBase64: logoImage?.base64 ?? null,
    constructoraLogoFormat: logoImage?.format ?? null,
    projectLogoBase64: projectLogoImage?.base64 ?? null,
    projectLogoFormat: projectLogoImage?.format ?? null,
    planoBase64: planoImage?.base64 ?? null,
    planoFormat: planoImage?.format ?? null,
    planoWidth: planoImage?.width ?? null,
    planoHeight: planoImage?.height ?? null,
    keyPlanBase64: keyPlanImage?.base64 ?? null,
    keyPlanFormat: keyPlanImage?.format ?? null,
    keyPlanWidth: keyPlanImage?.width ?? null,
    keyPlanHeight: keyPlanImage?.height ?? null,
    tour360Url: project.tour_360_url,
    whatsappNumero: project.whatsapp_numero,
    disclaimer: project.disclaimer,
    pdfSaludo: config.pdf_saludo ?? null,
    pdfDespedida: config.pdf_despedida ?? null,
    fechaEstimadaEntrega: config.fecha_estimada_entrega ?? null,
    coverStyle: config.pdf_cover_style ?? "hero",
    pdfTheme: config.pdf_theme ?? "neutral",
    pisoLabel: unit.piso != null
      ? (projectLocale === "en" ? `Floor ${unit.piso}` : `Piso ${unit.piso}`)
      : null,
    idioma: projectLocale,
  });

  // 10. Save
  const outPath = path.resolve(__dirname, "../public/test-cotizacion.pdf");
  fs.writeFileSync(outPath, pdfBuffer);

  const sizeKB = Math.round(pdfBuffer.length / 1024);
  console.log(`\nPDF generated: ${outPath}`);
  console.log(`Size: ${sizeKB} KB`);
  console.log(`Theme: ${config.pdf_theme ?? "neutral"}`);
  console.log(`Cover: ${config.pdf_cover_style ?? "hero"}`);
  console.log(`Pages: Cover + Offer${planoImage ? " + Floor Plan" : ""}${keyPlanImage ? " + Key Plan" : ""} + Info`);
  console.log("\nOpen the PDF to verify!");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
