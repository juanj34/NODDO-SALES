import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-context";
import { createClient } from "@supabase/supabase-js";
import { sendCotizacionBuyer } from "@/lib/email";
import { formatCurrency } from "@/lib/currency";
import type { Currency, EmailConfig } from "@/types";

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

    // Fetch cotización with full project data for branded email
    const { data: cotizacion, error } = await supabase
      .from("cotizaciones")
      .select("*, proyectos(nombre, slug, subdomain, custom_domain, domain_verified, user_id, idioma, email_config, logo_url, constructora_logo_url, constructora_nombre, color_primario, whatsapp_numero, tour_360_url, brochure_url)")
      .eq("id", id)
      .single();

    if (error || !cotizacion) {
      return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 });
    }

    // Verify user owns the project
    if (cotizacion.proyectos.user_id !== user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Download existing PDF
    if (!cotizacion.pdf_url) {
      return NextResponse.json({ error: "PDF no disponible" }, { status: 400 });
    }

    const pdfRes = await fetch(cotizacion.pdf_url);
    if (!pdfRes.ok) {
      return NextResponse.json({ error: "PDF no disponible" }, { status: 500 });
    }
    const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());

    // Format total
    const moneda = (cotizacion.config_snapshot?.moneda || "COP") as Currency;
    const totalFormatted = formatCurrency(cotizacion.resultado.precio_neto, moneda);
    const p = cotizacion.proyectos;
    const emailCfg = p.email_config as EmailConfig | null;

    // Build microsite URL
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "noddo.io";
    const micrositeUrl = p.custom_domain && p.domain_verified
      ? `https://${p.custom_domain}`
      : `https://${p.subdomain || p.slug}.${rootDomain}`;

    // Fetch recursos for attachments if needed
    let recursosForEmail: { id: string; nombre: string; url: string }[] | undefined;
    if (emailCfg?.adjuntos_recurso_ids?.length) {
      const { data: recRows } = await supabase
        .from("recursos")
        .select("id, nombre, url")
        .in("id", emailCfg.adjuntos_recurso_ids)
        .eq("proyecto_id", cotizacion.proyecto_id);
      if (recRows) recursosForEmail = recRows;
    }

    // Resend email (project's language)
    await sendCotizacionBuyer({
      buyerEmail: cotizacion.email,
      buyerName: cotizacion.nombre,
      projectName: p.nombre,
      unidadId: cotizacion.unidad_snapshot.identificador,
      totalFormatted,
      tipologiaName: cotizacion.unidad_snapshot.tipologia || null,
      areaM2: cotizacion.unidad_snapshot.area_m2 || null,
      habitaciones: cotizacion.unidad_snapshot.habitaciones || null,
      banos: cotizacion.unidad_snapshot.banos || null,
      pdfBuffer,
      locale: p.idioma || "es",
      emailConfig: emailCfg,
      projectSlug: p.slug,
      projectLogoUrl: p.logo_url,
      constructoraLogoUrl: p.constructora_logo_url,
      constructoraNombre: p.constructora_nombre,
      colorPrimario: p.color_primario,
      whatsappNumero: p.whatsapp_numero,
      tour360Url: p.tour_360_url,
      brochureUrl: p.brochure_url,
      micrositeUrl,
      recursos: recursosForEmail,
      agentName: cotizacion.agente_nombre || null,
      agentPhone: cotizacion.agente_telefono || null,
      agentEmail: null,
      agentAvatarUrl: cotizacion.agente_avatar_url || null,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[resend cotizacion] Error:", err);
    return NextResponse.json({ error: "Error al reenviar email" }, { status: 500 });
  }
}
