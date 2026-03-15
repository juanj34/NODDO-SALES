import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-context";
import { createClient } from "@supabase/supabase-js";
import { calcularCotizacion } from "@/lib/cotizador/calcular";
import { generarPDF } from "@/lib/cotizador/generar-pdf";
import type { CotizadorConfig, Currency } from "@/types";
import sharp from "sharp";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function fetchImageAsBase64(
  url: string | null,
): Promise<{ base64: string; format: "JPEG" | "PNG" } | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
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
      return { base64: jpegBuffer.toString("base64"), format: "JPEG" };
    }

    const resized = await sharp(Buffer.from(buffer))
      .resize(1200, null, { withoutEnlargement: true })
      .toBuffer();
    return {
      base64: resized.toString("base64"),
      format: isJPEG ? "JPEG" : "PNG",
    };
  } catch {
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await getAuthContext(request);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getServiceClient();

    // Fetch cotización with project data
    const { data: cotizacion, error } = await supabase
      .from("cotizaciones")
      .select(`
        *,
        proyectos(
          id, nombre, constructora_nombre, constructora_logo_url, color_primario,
          cotizador_config, user_id, render_principal_url, tour_360_url,
          whatsapp_numero, disclaimer
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

    // Use CURRENT config from project (not snapshot)
    const config = cotizacion.proyectos.cotizador_config as CotizadorConfig;
    const moneda = (config.moneda || "COP") as Currency;
    const snapshot = cotizacion.unidad_snapshot;

    // Recalculate with current config
    const resultado = calcularCotizacion(snapshot.precio, config, []);

    // Fetch tipología renders
    let tipologiaRenders: string[] = [];
    if (cotizacion.unidad_id) {
      const { data: unidad } = await supabase
        .from("unidades")
        .select("tipologia_id")
        .eq("id", cotizacion.unidad_id)
        .single();

      if (unidad?.tipologia_id) {
        const { data: tipo } = await supabase
          .from("tipologias")
          .select("renders")
          .eq("id", unidad.tipologia_id)
          .single();
        tipologiaRenders = tipo?.renders ?? [];
      }
    }

    // Determine cover URL
    const coverUrl =
      config.portada_url ||
      cotizacion.proyectos.render_principal_url ||
      tipologiaRenders[0] ||
      null;

    // Fetch images
    const [coverImage, logoImage] = await Promise.all([
      fetchImageAsBase64(coverUrl),
      fetchImageAsBase64(cotizacion.proyectos.constructora_logo_url),
    ]);

    // Regenerate PDF
    const now = new Date();
    const fecha = now.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
    const refNumber = `COT-${now.getFullYear()}-${id.slice(0, 4).toUpperCase()}`;

    const pdfBuffer = generarPDF({
      projectName: cotizacion.proyectos.nombre,
      constructoraName: cotizacion.proyectos.constructora_nombre,
      colorPrimario: cotizacion.proyectos.color_primario,
      unidadId: snapshot.identificador,
      tipologiaName: snapshot.tipologia,
      area: snapshot.area_m2,
      piso: snapshot.piso,
      vista: snapshot.vista,
      habitaciones: snapshot.habitaciones,
      banos: snapshot.banos,
      orientacion: snapshot.orientacion,
      parqueaderos: null,
      depositos: null,
      resultado,
      config,
      buyerName: cotizacion.nombre,
      buyerEmail: cotizacion.email,
      buyerPhone: cotizacion.telefono,
      agenteName: cotizacion.agente_nombre,
      fecha,
      referenceNumber: refNumber,
      coverImageBase64: coverImage?.base64 ?? null,
      coverImageFormat: coverImage?.format ?? null,
      constructoraLogoBase64: logoImage?.base64 ?? null,
      constructoraLogoFormat: logoImage?.format ?? null,
      tour360Url: cotizacion.proyectos.tour_360_url,
      whatsappNumero: cotizacion.proyectos.whatsapp_numero,
      disclaimer: cotizacion.proyectos.disclaimer,
      pdfSaludo: config.pdf_saludo ?? null,
      pdfDespedida: config.pdf_despedida ?? null,
      fechaEstimadaEntrega: config.fecha_estimada_entrega ?? null,
    });

    // Upload new PDF
    const pdfPath = `cotizaciones/${cotizacion.proyecto_id}/${id}.pdf`;

    const { error: uploadErr } = await supabase.storage
      .from("uploads")
      .upload(pdfPath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true, // Overwrite existing
      });

    let pdfUrl: string | null = null;
    if (!uploadErr) {
      const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(pdfPath);
      pdfUrl = urlData.publicUrl;
    }

    // Update cotización record with new PDF URL and updated resultado
    await supabase
      .from("cotizaciones")
      .update({
        pdf_url: pdfUrl,
        resultado,
        config_snapshot: config, // Update config snapshot to current
      })
      .eq("id", id);

    return NextResponse.json({ success: true, pdf_url: pdfUrl });
  } catch (err) {
    console.error("[regenerate cotizacion] Error:", err);
    return NextResponse.json({ error: "Error al regenerar PDF" }, { status: 500 });
  }
}
