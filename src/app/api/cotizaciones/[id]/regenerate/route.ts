import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-context";
import { createClient } from "@supabase/supabase-js";
import { generateCotizacionPdf, getCotizacionSignedUrl } from "@/lib/cotizador/generate";
import { buildInputFromDbRows } from "@/lib/cotizador/html/from-db";
import type { CotizadorConfig, ResultadoCotizacion, Currency } from "@/types";
import type { EmailLocale } from "@/lib/email-i18n";

// PDF generation is CPU- and memory-heavy; raise above the Vercel default.
export const runtime = "nodejs";
export const maxDuration = 60;

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext();
    if (!auth?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const { user } = auth;

    const { id } = await params;
    const supabase = getServiceClient();

    // Fetch cotización with project data
    const { data: cotizacion, error } = await supabase
      .from("cotizaciones")
      .select(`
        *,
        proyectos(
          id, nombre, constructora_nombre, constructora_logo_url, logo_url, color_primario,
          cotizador_config, user_id, render_principal_url, tour_360_url,
          whatsapp_numero, disclaimer, unidad_medida_base, idioma, ubicacion_direccion,
          estado_construccion
        )
      `)
      .eq("id", id)
      .single();

    if (error || !cotizacion) {
      return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 });
    }

    // Verify user owns the project
    if (cotizacion.proyectos.user_id !== user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // FAITHFUL REISSUE: render from the STORED snapshot + STORED resultado.
    // Never re-price against the project's current config (that would be a new
    // quote, not a regenerate). config_snapshot is the issued config; fall back
    // to the project's current config only for legacy rows with no snapshot.
    // The persist route folds plan_origen (and precio_negociado) into the
    // snapshot JSONB, so a regenerated calculator-mode PDF keeps the grouped
    // "Cuota inicial" layout of the originally issued document.
    const config = (cotizacion.config_snapshot ?? cotizacion.proyectos.cotizador_config) as CotizadorConfig & {
      plan_origen?: "calculadora" | "plantilla";
    };
    const resultado = cotizacion.resultado as ResultadoCotizacion; // issued numbers
    const snapshot = (cotizacion.unidad_snapshot ?? {}) as Record<string, unknown>;
    const moneda = (config.moneda || "COP") as Currency;

    // Refresh layout/branding assets (renders + floor plan) from the tipología.
    let tipologiaRenders: string[] = [];
    let tipologiaPlanoUrl: string | null = null;
    if (cotizacion.unidad_id) {
      const { data: unidad } = await supabase
        .from("unidades")
        .select("tipologia_id")
        .eq("id", cotizacion.unidad_id)
        .single();

      if (unidad?.tipologia_id) {
        const { data: tipo } = await supabase
          .from("tipologias")
          .select("renders, plano_url, pisos")
          .eq("id", unidad.tipologia_id)
          .single();
        tipologiaRenders = tipo?.renders ?? [];
        const pisos = tipo?.pisos as Array<{ plano_url?: string }> | null;
        if (pisos && pisos.length > 0 && pisos[0]?.plano_url) {
          tipologiaPlanoUrl = pisos[0].plano_url;
        } else {
          tipologiaPlanoUrl = tipo?.plano_url ?? null;
        }
      }
    }

    const coverUrl =
      config.portada_url ||
      cotizacion.proyectos.render_principal_url ||
      tipologiaRenders[0] ||
      null;

    const now = new Date();
    const projectLocale: EmailLocale = (cotizacion.proyectos.idioma as EmailLocale) || "es";
    const dateIntlLocale = projectLocale === "en" ? "en-US" : "es-CO";
    const fecha = now.toLocaleDateString(dateIntlLocale, { day: "numeric", month: "long", year: "numeric" });
    const refNumber = `COT-${now.getFullYear()}-${id.slice(0, 4).toUpperCase()}`;

    const input = buildInputFromDbRows({
      resultado,
      config,
      moneda,
      proyecto: {
        nombre: cotizacion.proyectos.nombre,
        constructora_nombre: cotizacion.proyectos.constructora_nombre,
        color_primario: cotizacion.proyectos.color_primario,
        ubicacion_direccion: cotizacion.proyectos.ubicacion_direccion ?? null,
        estado_construccion: cotizacion.proyectos.estado_construccion ?? "sobre_planos",
        logo_url: config.pdf_logo_proyecto_url || cotizacion.proyectos.logo_url,
        constructora_logo_url: config.pdf_logo_constructora_url || cotizacion.proyectos.constructora_logo_url,
        cover_url: coverUrl,
        renders: tipologiaRenders,
        plano_url: tipologiaPlanoUrl,
        whatsapp_numero: cotizacion.proyectos.whatsapp_numero,
        tour_360_url: cotizacion.proyectos.tour_360_url,
      },
      unidadSnapshot: snapshot,
      unidadMedida: cotizacion.proyectos.unidad_medida_base === "sqft" ? "sqft" : "m²",
      agente: {
        nombre: cotizacion.agente_nombre ?? null,
        telefono: cotizacion.agente_telefono ?? null,
        email: null,
        avatarUrl: cotizacion.agente_avatar_url ?? null,
      },
      buyer: { nombre: cotizacion.nombre, email: cotizacion.email, telefono: cotizacion.telefono ?? null },
      complementos: [],
      fechaDisplay: fecha,
      fechaEstimadaEntrega: config.fecha_estimada_entrega ?? null,
      referenceNumber: refNumber,
      paymentPlanNombre: config.payment_plan_nombre ?? (projectLocale === "en" ? "Payment Plan" : "Plan de Pagos"),
      idioma: projectLocale,
      monedaSecundaria: null,
      tipoCambio: null,
      agrupar_inicial: config.plan_origen === "calculadora",
    });

    // Explicit agent action → fail-loud (a worker outage surfaces as a 502).
    const { pdfPath } = await generateCotizacionPdf(
      supabase, cotizacion.proyecto_id, id, input, /* failSoft */ false,
    );

    // Persist only the new PDF path — do NOT overwrite resultado / config_snapshot
    // (the issued record is the legal copy of what the buyer was quoted).
    await supabase.from("cotizaciones").update({ pdf_url: pdfPath }).eq("id", id);

    const signedUrl = pdfPath ? await getCotizacionSignedUrl(supabase, pdfPath) : null;
    return NextResponse.json({ success: true, pdf_url: signedUrl });
  } catch (err) {
    console.error("[regenerate cotizacion] Error:", err);
    const message = err instanceof Error ? err.message : "Error al regenerar PDF";
    // Render-worker failures → 502 so the dashboard shows "worker down", not a generic error.
    const isWorkerError = /render worker|COTIZADOR_RENDER_URL|RENDER_SHARED_SECRET/i.test(message);
    return NextResponse.json(
      { error: isWorkerError ? "El servicio de generación de PDF no está disponible." : "Error al regenerar PDF" },
      { status: isWorkerError ? 502 : 500 },
    );
  }
}
