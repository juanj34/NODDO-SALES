import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { calcularCotizacion } from "@/lib/cotizador/calcular";
import { generarPDF } from "@/lib/cotizador/generar-pdf";
import { sendCotizacionBuyer, sendCotizacionAdmin } from "@/lib/email";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";
import { getWebhookConfig, dispatchWebhook } from "@/lib/webhooks";
import type { WebhookPayload } from "@/lib/webhooks";
import type { CotizadorConfig, Unidad, Currency } from "@/types";
import { formatCurrency } from "@/lib/currency";

// Use service-role client for public endpoint (no user auth required)
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function sanitize(str: string, maxLen: number): string {
  return str.trim().slice(0, maxLen);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function fetchImageAsBase64(
  url: string | null,
): Promise<{ base64: string; format: "JPEG" | "PNG" } | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const uint8 = new Uint8Array(buffer);

    // Detect format from magic bytes
    const isJPEG = uint8[0] === 0xff && uint8[1] === 0xd8;
    const isPNG = uint8[0] === 0x89 && uint8[1] === 0x50;

    if (!isJPEG && !isPNG) {
      // Convert WebP/AVIF/other to JPEG via sharp
      const jpegBuffer = await sharp(Buffer.from(buffer))
        .resize(1200, null, { withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
      return { base64: jpegBuffer.toString("base64"), format: "JPEG" };
    }

    // Resize raster images to keep PDF small
    const resized = await sharp(Buffer.from(buffer))
      .resize(1200, null, { withoutEnlargement: true })
      .toBuffer();
    return {
      base64: resized.toString("base64"),
      format: isJPEG ? "JPEG" : "PNG",
    };
  } catch (err) {
    console.warn("[cotizaciones] Image fetch failed:", url, err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 3 cotizaciones per minute per IP (PDF generation is expensive)
    const ip = getClientIp(request);
    if (isRateLimited("cotizaciones", ip, 3, 60_000)) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta de nuevo en un momento." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { proyecto_id, unidad_id, nombre, email, telefono, utm_source, utm_medium, utm_campaign, agente_id, agente_nombre } = body;

    // Validate required fields
    if (!proyecto_id || !unidad_id || !nombre || !email) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Fetch project with cotizador config
    const { data: proyecto, error: projErr } = await supabase
      .from("proyectos")
      .select("id, nombre, constructora_nombre, constructora_logo_url, color_primario, cotizador_enabled, cotizador_config, user_id, render_principal_url, tour_360_url, whatsapp_numero, disclaimer")
      .eq("id", proyecto_id)
      .single();

    if (projErr || !proyecto) {
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    }
    if (!proyecto.cotizador_enabled || !proyecto.cotizador_config) {
      return NextResponse.json({ error: "Cotizador no habilitado" }, { status: 403 });
    }

    // Check feature flag (cotizador must be enabled in project_features)
    const { data: featureRow } = await supabase
      .from("project_features")
      .select("enabled")
      .eq("proyecto_id", proyecto_id)
      .eq("feature", "cotizador")
      .maybeSingle();
    if (featureRow && !featureRow.enabled) {
      return NextResponse.json({ error: "Cotizador no habilitado para este proyecto" }, { status: 403 });
    }

    const config = proyecto.cotizador_config as CotizadorConfig;
    const moneda = (config.moneda || "COP") as Currency;

    // Fetch unit
    const { data: unidad, error: unitErr } = await supabase
      .from("unidades")
      .select("*")
      .eq("id", unidad_id)
      .eq("proyecto_id", proyecto_id)
      .single();

    if (unitErr || !unidad) {
      return NextResponse.json({ error: "Unidad no encontrada" }, { status: 404 });
    }

    const unit = unidad as Unidad;
    if (!unit.precio) {
      return NextResponse.json({ error: "Unidad sin precio" }, { status: 400 });
    }

    // Fetch tipología name + renders
    let tipologiaName: string | null = null;
    let tipologiaRenders: string[] = [];
    if (unit.tipologia_id) {
      const { data: tipo } = await supabase
        .from("tipologias")
        .select("nombre, renders")
        .eq("id", unit.tipologia_id)
        .single();
      tipologiaName = tipo?.nombre ?? null;
      tipologiaRenders = tipo?.renders ?? [];
    }

    // Calculate quotation (server-side — source of truth)
    const resultado = calcularCotizacion(unit.precio, config, []);

    // Determine cover image URL (config override > project render > tipología render)
    const coverUrl =
      config.portada_url ||
      proyecto.render_principal_url ||
      tipologiaRenders[0] ||
      null;

    // Fetch images in parallel (with timeout, graceful degradation)
    const [coverImage, logoImage] = await Promise.all([
      fetchImageAsBase64(coverUrl),
      fetchImageAsBase64(proyecto.constructora_logo_url),
    ]);

    // Generate PDF
    const now = new Date();
    const fecha = now.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
    const cotizacionId = crypto.randomUUID();
    const refNumber = `COT-${now.getFullYear()}-${cotizacionId.slice(0, 4).toUpperCase()}`;

    const pdfBuffer = generarPDF({
      projectName: proyecto.nombre,
      constructoraName: proyecto.constructora_nombre,
      colorPrimario: proyecto.color_primario,
      unidadId: unit.identificador,
      tipologiaName,
      area: unit.area_m2,
      piso: unit.piso,
      vista: unit.vista,
      habitaciones: unit.habitaciones,
      banos: unit.banos,
      orientacion: unit.orientacion,
      parqueaderos: unit.parqueaderos,
      depositos: unit.depositos,
      resultado,
      config,
      buyerName: sanitize(nombre, 200),
      buyerEmail: sanitize(email, 320),
      buyerPhone: telefono ? sanitize(telefono, 30) : null,
      agenteName: agente_nombre ? sanitize(agente_nombre, 200) : null,
      fecha,
      referenceNumber: refNumber,
      coverImageBase64: coverImage?.base64 ?? null,
      coverImageFormat: coverImage?.format ?? null,
      constructoraLogoBase64: logoImage?.base64 ?? null,
      constructoraLogoFormat: logoImage?.format ?? null,
      tour360Url: proyecto.tour_360_url,
      whatsappNumero: proyecto.whatsapp_numero,
      disclaimer: proyecto.disclaimer,
      pdfSaludo: config.pdf_saludo ?? null,
      pdfDespedida: config.pdf_despedida ?? null,
      fechaEstimadaEntrega: config.fecha_estimada_entrega ?? null,
    });

    // Snapshot unit data
    const unidadSnapshot = {
      identificador: unit.identificador,
      tipologia: tipologiaName,
      precio: unit.precio,
      area_m2: unit.area_m2,
      piso: unit.piso,
      vista: unit.vista,
      habitaciones: unit.habitaciones,
      banos: unit.banos,
      orientacion: unit.orientacion,
    };

    // Upload PDF to Supabase Storage
    const pdfPath = `cotizaciones/${proyecto_id}/${cotizacionId}.pdf`;

    const { error: uploadErr } = await supabase.storage
      .from("uploads")
      .upload(pdfPath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    let pdfUrl: string | null = null;
    if (!uploadErr) {
      const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(pdfPath);
      pdfUrl = urlData.publicUrl;
    } else {
      console.warn("[cotizaciones] PDF upload failed:", uploadErr.message);
    }

    // Insert cotización record
    const { error: insertErr } = await supabase
      .from("cotizaciones")
      .insert({
        id: cotizacionId,
        proyecto_id,
        unidad_id,
        nombre: sanitize(nombre, 200),
        email: sanitize(email, 320),
        telefono: telefono ? sanitize(telefono, 30) : null,
        unidad_snapshot: unidadSnapshot,
        config_snapshot: config,
        resultado,
        pdf_url: pdfUrl,
        utm_source: utm_source ? sanitize(utm_source, 200) : null,
        utm_medium: utm_medium ? sanitize(utm_medium, 200) : null,
        utm_campaign: utm_campaign ? sanitize(utm_campaign, 200) : null,
        agente_id: agente_id || null,
        agente_nombre: agente_nombre ? sanitize(agente_nombre, 200) : null,
      });

    if (insertErr) {
      console.error("[cotizaciones] Insert failed:", insertErr);
      return NextResponse.json({ error: "Error al guardar cotización" }, { status: 500 });
    }

    // Dispatch cotizacion webhook (fire-and-forget)
    fireCotizacionWebhook(proyecto_id, proyecto.nombre, {
      id: cotizacionId,
      nombre: sanitize(nombre, 200),
      email: sanitize(email, 320),
      telefono: telefono ? sanitize(telefono, 30) : null,
      unidad_id,
      unidad_identificador: unit.identificador,
      precio_neto: resultado.precio_neto,
      moneda: config.moneda,
      pdf_url: pdfUrl,
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      agente_id: agente_id || null,
      agente_nombre: agente_nombre ? sanitize(agente_nombre, 200) : null,
    });

    // Also insert a lead (so existing lead pipeline works)
    const { data: leadData } = await supabase.from("leads").insert({
      proyecto_id,
      nombre: sanitize(nombre, 200),
      email: sanitize(email, 320),
      telefono: telefono ? sanitize(telefono, 30) : null,
      tipologia_interes: tipologiaName
        ? `${tipologiaName} - ${unit.identificador}`
        : unit.identificador,
      mensaje: `Cotización automática — ${unit.identificador} — ${formatCurrency(resultado.precio_neto, moneda)}`,
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
    }).select().single();

    // Dispatch lead webhook for the auto-created lead
    if (leadData) {
      fireLeadWebhookFromCotizacion(proyecto_id, proyecto.nombre, leadData);
    }

    // Send emails (async, non-blocking)
    const totalFormatted = formatCurrency(resultado.precio_neto, moneda);

    // Email to buyer with PDF
    sendCotizacionBuyer({
      buyerEmail: sanitize(email, 320),
      buyerName: sanitize(nombre, 200),
      projectName: proyecto.nombre,
      unidadId: unit.identificador,
      totalFormatted,
      pdfBuffer,
    }).catch((err) => console.error("[cotizaciones] Buyer email failed:", err));

    // Email to admin
    const { data: adminUser } = await supabase.auth.admin.getUserById(proyecto.user_id);
    if (adminUser?.user?.email) {
      sendCotizacionAdmin({
        adminEmail: adminUser.user.email,
        projectName: proyecto.nombre,
        buyerName: sanitize(nombre, 200),
        buyerEmail: sanitize(email, 320),
        buyerPhone: telefono ? sanitize(telefono, 30) : null,
        unidadId: unit.identificador,
        totalFormatted,
      }).catch((err) => console.error("[cotizaciones] Admin email failed:", err));
    }

    return NextResponse.json({ id: cotizacionId, pdf_url: pdfUrl }, { status: 201 });
  } catch (err) {
    console.error("[cotizaciones] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

/* ── Webhook helpers ── */

async function fireCotizacionWebhook(
  projectId: string,
  projectName: string,
  cotizacion: {
    id: string;
    nombre: string;
    email: string;
    telefono: string | null;
    unidad_id: string;
    unidad_identificador: string;
    precio_neto: number;
    moneda: string;
    pdf_url: string | null;
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    agente_id: string | null;
    agente_nombre: string | null;
  },
) {
  try {
    const wh = await getWebhookConfig(projectId, "cotizacion.created");
    if (!wh) return;

    const payload: WebhookPayload = {
      event: "cotizacion.created",
      timestamp: new Date().toISOString(),
      proyecto_id: projectId,
      proyecto_nombre: projectName,
      data: {
        ...cotizacion,
        created_at: new Date().toISOString(),
      },
    };
    dispatchWebhook(projectId, wh.config, payload);
  } catch (err) {
    console.error("[cotizaciones] Webhook error:", err);
  }
}

async function fireLeadWebhookFromCotizacion(
  projectId: string,
  projectName: string,
  lead: Record<string, unknown>,
) {
  try {
    const wh = await getWebhookConfig(projectId, "lead.created");
    if (!wh) return;

    const payload: WebhookPayload = {
      event: "lead.created",
      timestamp: new Date().toISOString(),
      proyecto_id: projectId,
      proyecto_nombre: projectName,
      data: {
        id: lead.id,
        nombre: lead.nombre,
        email: lead.email,
        telefono: lead.telefono ?? null,
        pais: lead.pais ?? null,
        tipologia_interes: lead.tipologia_interes ?? null,
        mensaje: lead.mensaje ?? null,
        utm_source: lead.utm_source ?? null,
        utm_medium: lead.utm_medium ?? null,
        utm_campaign: lead.utm_campaign ?? null,
        status: lead.status ?? "nuevo",
        created_at: lead.created_at,
      },
    };
    dispatchWebhook(projectId, wh.config, payload);
  } catch (err) {
    console.error("[cotizaciones] Lead webhook error:", err);
  }
}
