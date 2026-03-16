import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { calcularCotizacion, buildPrecioBaseComplementos } from "@/lib/cotizador/calcular";
import { generarPDF } from "@/lib/cotizador/generar-pdf";
import { sendCotizacionBuyer, sendCotizacionAdmin, getUserLocale } from "@/lib/email";
import type { EmailLocale } from "@/lib/email-i18n";
import { isRateLimited, apiLimiter } from "@/lib/rate-limit";
import { getWebhookConfig, dispatchWebhook } from "@/lib/webhooks";
import type { WebhookPayload } from "@/lib/webhooks";
import type { CotizadorConfig, FaseConfig, Unidad, Currency, ComplementoSeleccion } from "@/types";
import { formatCurrency } from "@/lib/currency";
import { logActivity } from "@/lib/activity-logger";
import { getAuthContext } from "@/lib/auth-context";

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

/* ── GET /api/cotizaciones - List cotizaciones with filters ── */
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const { role, adminUserId, supabase } = auth;

    const url = new URL(request.url);
    const proyectoId = url.searchParams.get("proyecto_id");
    const search = url.searchParams.get("search");
    const dateFrom = url.searchParams.get("date_from");
    const dateTo = url.searchParams.get("date_to");
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);

    // Build query
    let query = supabase
      .from("cotizaciones")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    // Filter by admin's projects (or all if no filter)
    if (proyectoId) {
      query = query.eq("proyecto_id", proyectoId);
    } else {
      // Only show cotizaciones from user's projects
      const { data: userProjects } = await supabase
        .from("proyectos")
        .select("id")
        .eq(role === "admin" ? "user_id" : "id", role === "admin" ? adminUserId : "");

      if (userProjects && userProjects.length > 0) {
        const projectIds = userProjects.map((p: { id: string }) => p.id);
        query = query.in("proyecto_id", projectIds);
      } else {
        // No projects, return empty
        return NextResponse.json({ cotizaciones: [], total: 0, stats: {} });
      }
    }

    // Search filter
    if (search) {
      const s = search.toLowerCase();
      query = query.or(`nombre.ilike.%${s}%,email.ilike.%${s}%,unidad_snapshot->>identificador.ilike.%${s}%`);
    }

    // Date filters
    if (dateFrom) {
      query = query.gte("created_at", dateFrom);
    }
    if (dateTo) {
      query = query.lte("created_at", dateTo);
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: cotizaciones, error, count } = await query;

    if (error) {
      console.error("[GET cotizaciones] Error:", error);
      return NextResponse.json({ error: "Error al obtener cotizaciones" }, { status: 500 });
    }

    // Calculate stats (last 30 days + total value)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stats = {
      total: count || 0,
      thisMonth: cotizaciones?.filter((c: { created_at: string }) => new Date(c.created_at) >= thirtyDaysAgo).length || 0,
      totalValue: cotizaciones?.reduce((sum: number, c: { resultado?: { precio_neto?: number } }) => sum + (c.resultado?.precio_neto || 0), 0) || 0,
    };

    return NextResponse.json({
      cotizaciones: cotizaciones || [],
      total: count || 0,
      stats,
    });
  } catch (err) {
    console.error("[GET cotizaciones] Error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
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
    // Rate limit: PDF generation is expensive
    if (await isRateLimited(request, apiLimiter)) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta de nuevo en un momento." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      proyecto_id, unidad_id, nombre, email, telefono,
      utm_source, utm_medium, utm_campaign, agente_id, agente_nombre,
      // Multi-tipología: buyer-selected tipología (for lots without confirmed tipologia_id)
      tipologia_id: selectedTipologiaId,
      // Sandbox fields
      custom_fases,
      descuentos_seleccionados,
      complemento_ids,
      complemento_selections,
      precio_base_parqueaderos,
      precio_base_depositos,
      separacion_incluida,
    } = body as {
      proyecto_id: string;
      unidad_id: string;
      nombre: string;
      email: string;
      telefono?: string;
      utm_source?: string;
      utm_medium?: string;
      utm_campaign?: string;
      agente_id?: string;
      agente_nombre?: string;
      tipologia_id?: string;
      custom_fases?: FaseConfig[];
      descuentos_seleccionados?: string[];
      complemento_ids?: string[];
      complemento_selections?: { complemento_id: string; es_extra: boolean; precio_negociado?: number }[];
      precio_base_parqueaderos?: number;
      precio_base_depositos?: number;
      separacion_incluida?: boolean;
    };

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
      .select("id, nombre, constructora_nombre, constructora_logo_url, color_primario, cotizador_enabled, cotizador_config, user_id, render_principal_url, tour_360_url, whatsapp_numero, disclaimer, parqueaderos_mode, depositos_mode, parqueaderos_precio_base, depositos_precio_base, idioma, tipo_proyecto, precio_source")
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
    const isTipologiaPricing = proyecto.precio_source === "tipologia";

    // Fetch tipología name + renders (use buyer-selected tipología for multi-tipo lots)
    const effectiveTipologiaId = unit.tipologia_id || selectedTipologiaId || null;
    let tipologiaName: string | null = null;
    let tipologiaRenders: string[] = [];
    if (effectiveTipologiaId) {
      const { data: tipo } = await supabase
        .from("tipologias")
        .select("nombre, renders, area_m2, area_construida, area_privada, area_lote, precio_desde, habitaciones, banos")
        .eq("id", effectiveTipologiaId)
        .single();
      tipologiaName = tipo?.nombre ?? null;
      tipologiaRenders = tipo?.renders ?? [];

      // Tipología pricing: price comes from tipología, not from unit
      if (isTipologiaPricing && tipo?.precio_desde != null) {
        unit.precio = tipo.precio_desde;
      }

      // For multi-tipo lots without confirmed tipología, override unit specs from tipología
      if (!isTipologiaPricing && !unit.tipologia_id && selectedTipologiaId && tipo) {
        if (tipo.area_m2 !== null) unit.area_m2 = tipo.area_m2;
        if (tipo.area_construida !== null) unit.area_construida = tipo.area_construida;
        if (tipo.area_privada !== null) unit.area_privada = tipo.area_privada;
        if (tipo.area_lote !== null) unit.area_lote = tipo.area_lote;
        if (tipo.precio_desde !== null) {
          // For lotes: sum terrain + construction prices when both exist
          if (proyecto.tipo_proyecto === "lotes" && unit.precio) {
            unit.precio = unit.precio + tipo.precio_desde;
          } else {
            unit.precio = tipo.precio_desde;
          }
        }
        if (tipo.habitaciones !== null) unit.habitaciones = tipo.habitaciones;
        if (tipo.banos !== null) unit.banos = tipo.banos;
      }
    }

    if (!unit.precio) {
      return NextResponse.json({ error: "Unidad sin precio" }, { status: 400 });
    }

    // Build effective config (custom phases override project defaults)
    const effectiveConfig: CotizadorConfig = custom_fases
      ? { ...config, fases: custom_fases }
      : config;

    if (separacion_incluida !== undefined) {
      effectiveConfig.separacion_incluida_en_inicial = separacion_incluida;
    }

    // Fetch selected complementos from DB
    let complementoSelecciones: ComplementoSeleccion[] = [];
    const compIds = complemento_ids ?? complemento_selections?.map((s) => s.complemento_id) ?? [];
    if (compIds.length > 0) {
      const { data: compRows } = await supabase
        .from("complementos")
        .select("id, tipo, identificador, subtipo, precio")
        .in("id", compIds)
        .eq("proyecto_id", proyecto_id);

      if (compRows) {
        complementoSelecciones = compRows.map((c: { id: string; tipo: string; identificador: string; subtipo: string | null; precio: number | null }) => {
          // Check if new format (complemento_selections) was provided
          const sel = complemento_selections?.find((s) => s.complemento_id === c.id);
          if (sel) {
            // New format: respect es_extra and precio_negociado
            return {
              complemento_id: c.id,
              tipo: c.tipo as "parqueadero" | "deposito",
              identificador: c.identificador,
              subtipo: c.subtipo,
              precio: sel.es_extra ? (sel.precio_negociado ?? c.precio) : null,
              suma_al_total: sel.es_extra,
              es_extra: sel.es_extra,
              precio_negociado: sel.precio_negociado,
            };
          }
          // Legacy format: use mode-based logic
          const mode = c.tipo === "parqueadero"
            ? proyecto.parqueaderos_mode
            : proyecto.depositos_mode;
          return {
            complemento_id: c.id,
            tipo: c.tipo as "parqueadero" | "deposito",
            identificador: c.identificador,
            subtipo: c.subtipo,
            precio: mode === "inventario_separado" ? c.precio : null,
            suma_al_total: mode === "inventario_separado",
          };
        });
      }
    }

    // Add virtual precio_base complementos
    if (proyecto.parqueaderos_mode === "precio_base" && precio_base_parqueaderos && precio_base_parqueaderos > 0) {
      complementoSelecciones.push(...buildPrecioBaseComplementos(
        precio_base_parqueaderos, proyecto.parqueaderos_precio_base ?? 0, 0, null
      ));
    }
    if (proyecto.depositos_mode === "precio_base" && precio_base_depositos && precio_base_depositos > 0) {
      complementoSelecciones.push(...buildPrecioBaseComplementos(
        0, null, precio_base_depositos, proyecto.depositos_precio_base ?? 0
      ));
    }

    // Re-check precio after potential tipología override
    if (!unit.precio) {
      return NextResponse.json({ error: "Unidad sin precio" }, { status: 400 });
    }
    const precioFinal = unit.precio;

    // Calculate quotation (server-side — source of truth)
    const resultado = calcularCotizacion(
      precioFinal,
      effectiveConfig,
      descuentos_seleccionados || [],
      complementoSelecciones,
    );

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
    const projectLocale: EmailLocale = (proyecto.idioma as EmailLocale) || "es";
    const dateIntlLocale = projectLocale === "en" ? "en-US" : "es-CO";
    const fecha = now.toLocaleDateString(dateIntlLocale, { day: "numeric", month: "long", year: "numeric" });
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
      config: effectiveConfig,
      complementos: complementoSelecciones.length > 0 ? complementoSelecciones : undefined,
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
      idioma: projectLocale,
    });

    // Snapshot unit data
    const unidadSnapshot: Record<string, unknown> = {
      identificador: unit.identificador,
      tipologia: tipologiaName,
      precio: unit.precio,
      area_m2: unit.area_m2,
      area_construida: unit.area_construida,
      area_privada: unit.area_privada,
      area_lote: unit.area_lote,
      piso: unit.piso,
      vista: unit.vista,
      habitaciones: unit.habitaciones,
      banos: unit.banos,
      orientacion: unit.orientacion,
      lote: unit.lote,
      etapa_nombre: unit.etapa_nombre,
    };
    // Track if tipología was buyer-selected (not pre-assigned)
    if (!unit.tipologia_id && selectedTipologiaId) {
      unidadSnapshot.tipologia_seleccionada_por_comprador = true;
      unidadSnapshot.tipologia_id_seleccionada = selectedTipologiaId;
    }
    if (complementoSelecciones.length > 0) {
      unidadSnapshot.complementos = complementoSelecciones;
    }

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
        config_snapshot: effectiveConfig,
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
      precio_neto: resultado.precio_total ?? resultado.precio_neto,
      moneda: effectiveConfig.moneda,
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
    const totalFormatted = formatCurrency(resultado.precio_total ?? resultado.precio_neto, moneda);

    // Email to buyer with PDF (project's language)
    sendCotizacionBuyer({
      buyerEmail: sanitize(email, 320),
      buyerName: sanitize(nombre, 200),
      projectName: proyecto.nombre,
      unidadId: unit.identificador,
      totalFormatted,
      pdfBuffer,
      locale: projectLocale,
    }).catch((err) => console.error("[cotizaciones] Buyer email failed:", err));

    // Email to admin (admin's language)
    const { data: adminUser } = await supabase.auth.admin.getUserById(proyecto.user_id);
    if (adminUser?.user?.email) {
      const adminLocale = await getUserLocale(supabase, proyecto.user_id);
      sendCotizacionAdmin({
        adminEmail: adminUser.user.email,
        projectName: proyecto.nombre,
        buyerName: sanitize(nombre, 200),
        buyerEmail: sanitize(email, 320),
        buyerPhone: telefono ? sanitize(telefono, 30) : null,
        unidadId: unit.identificador,
        totalFormatted,
        locale: adminLocale,
      }).catch((err) => console.error("[cotizaciones] Admin email failed:", err));
    }

    // Log cotización activity (fire-and-forget)
    logActivity({
      userId: proyecto.user_id, userEmail: sanitize(email, 320), userRole: "admin",
      proyectoId: proyecto_id, proyectoNombre: proyecto.nombre,
      actionType: "cotizacion.create", actionCategory: "cotizacion",
      metadata: { buyerName: sanitize(nombre, 200), email: sanitize(email, 320), unidad: unit.identificador },
      entityType: "cotizacion", entityId: cotizacionId,
    });

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
