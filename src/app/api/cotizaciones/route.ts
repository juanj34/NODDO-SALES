import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { calcularCotizacion, buildPrecioBaseComplementos } from "@/lib/cotizador/calcular";
import { resolveDeliveryContext, formatDeliveryDisplay } from "@/lib/cotizador/delivery";
import { generateCotizacionPdf, getCotizacionSignedUrl } from "@/lib/cotizador/generate";
import { buildInputFromDbRows } from "@/lib/cotizador/html/from-db";
import { sendCotizacionBuyer, sendCotizacionAdmin, getUserLocale } from "@/lib/email";
import type { EmailLocale } from "@/lib/email-i18n";
import { isRateLimited, apiLimiter } from "@/lib/rate-limit";
import { getWebhookConfig, dispatchWebhook } from "@/lib/webhooks";
import type { WebhookPayload } from "@/lib/webhooks";
import type { CotizadorConfig, FaseConfig, DescuentoConfig, Unidad, Currency, ComplementoSeleccion, EmailConfig, QuickQuoteParams } from "@/types";
import { buildQuickQuoteFases, validateQuickQuoteParams } from "@/lib/cotizador/quick-quote";
import { formatCurrency } from "@/lib/currency";
import { logActivity } from "@/lib/activity-logger";
import { getAuthContext } from "@/lib/auth-context";
import { requireFeature, PlanFeatureError } from "@/lib/plan-guard";

// PDF/image generation is CPU- and memory-heavy; raise above the Vercel default.
export const runtime = "nodejs";
export const maxDuration = 60;

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

    // pdf_url is now a PRIVATE object PATH — mint a short-lived signed URL per row
    // so the dashboard can download it (the client cannot read a private path).
    const serviceClient = getServiceClient();
    const withSigned = await Promise.all(
      (cotizaciones ?? []).map(async (c: { pdf_url: string | null }) => ({
        ...c,
        pdf_url: c.pdf_url ? await getCotizacionSignedUrl(serviceClient, c.pdf_url) : null,
      })),
    );

    return NextResponse.json({
      cotizaciones: withSigned,
      total: count || 0,
      stats,
    });
  } catch (err) {
    console.error("[GET cotizaciones] Error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
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
    const proyecto_id_check = body?.proyecto_id;

    // Plan gate: cotizador requires Pro plan
    if (proyecto_id_check) {
      const serviceClient = getServiceClient();
      try {
        await requireFeature(serviceClient, proyecto_id_check, "cotizador");
      } catch (err) {
        if (err instanceof PlanFeatureError) {
          return NextResponse.json({ error: err.message }, { status: 403 });
        }
        throw err;
      }
    }

    const {
      proyecto_id, unidad_id, nombre, email, telefono,
      utm_source, utm_medium, utm_campaign, agente_id, agente_nombre,
      // Multi-tipología: buyer-selected tipología (for lots without confirmed tipologia_id)
      tipologia_id: selectedTipologiaId,
      // Sandbox fields
      custom_fases,
      quick_quote,
      custom_descuentos,
      complemento_ids,
      complemento_selections,
      precio_base_parqueaderos,
      precio_base_depositos,
      separacion_incluida,
      payment_plan_nombre,
      admin_fee,
      amoblado,
      // Per-cotización overrides
      idioma,
      moneda_secundaria,
      tipo_cambio,
      // Negotiated unit price + calculator-mode metadata (parity with /preview)
      precio_negociado,
      plan_origen,
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
      quick_quote?: QuickQuoteParams;
      custom_descuentos?: DescuentoConfig[];
      complemento_ids?: string[];
      complemento_selections?: { complemento_id: string; es_extra: boolean; precio_negociado?: number }[];
      precio_base_parqueaderos?: number;
      precio_base_depositos?: number;
      separacion_incluida?: boolean;
      payment_plan_nombre?: string;
      admin_fee?: number;
      amoblado?: boolean;
      idioma?: "es" | "en";
      moneda_secundaria?: Currency | null;
      tipo_cambio?: number | null;
      precio_negociado?: number;
      plan_origen?: "calculadora" | "plantilla";
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
      .select("id, nombre, slug, subdomain, custom_domain, domain_verified, constructora_nombre, constructora_logo_url, logo_url, color_primario, cotizador_enabled, cotizador_config, email_config, user_id, render_principal_url, tour_360_url, brochure_url, whatsapp_numero, disclaimer, parqueaderos_mode, depositos_mode, parqueaderos_precio_base, depositos_precio_base, idioma, tipo_proyecto, precio_source, unidad_medida_base, estado_construccion, politica_amoblado, ubicacion_direccion")
      .eq("id", proyecto_id)
      .single();

    if (projErr || !proyecto) {
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    }
    if (!proyecto.cotizador_enabled || !proyecto.cotizador_config) {
      return NextResponse.json({ error: "Cotizador no habilitado" }, { status: 403 });
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
    let tipologiaPlanoUrl: string | null = null;
    let tieneJacuzzi = false;
    let tienePiscina = false;
    let tieneBbq = false;
    let tieneTerraza = false;
    let tieneJardin = false;
    let tieneCuartoServicio = false;
    let tieneEstudio = false;
    let tieneChimenea = false;
    let tieneDobleAltura = false;
    let tieneRooftop = false;
    if (effectiveTipologiaId) {
      const { data: tipo } = await supabase
        .from("tipologias")
        .select("nombre, renders, area_m2, area_construida, area_privada, area_lote, precio_desde, habitaciones, banos, plano_url, ubicacion_plano_url, pisos, tiene_jacuzzi, tiene_piscina, tiene_bbq, tiene_terraza, tiene_jardin, tiene_cuarto_servicio, tiene_estudio, tiene_chimenea, tiene_doble_altura, tiene_rooftop")
        .eq("id", effectiveTipologiaId)
        .single();
      tipologiaName = tipo?.nombre ?? null;
      tipologiaRenders = tipo?.renders ?? [];
      tieneJacuzzi = tipo?.tiene_jacuzzi ?? false;
      tienePiscina = tipo?.tiene_piscina ?? false;
      tieneBbq = tipo?.tiene_bbq ?? false;
      tieneTerraza = tipo?.tiene_terraza ?? false;
      tieneJardin = tipo?.tiene_jardin ?? false;
      tieneCuartoServicio = tipo?.tiene_cuarto_servicio ?? false;
      tieneEstudio = tipo?.tiene_estudio ?? false;
      tieneChimenea = tipo?.tiene_chimenea ?? false;
      tieneDobleAltura = tipo?.tiene_doble_altura ?? false;
      tieneRooftop = tipo?.tiene_rooftop ?? false;
      // Floor plan: prefer multi-floor first piso, fallback to single plano_url
      const pisos = tipo?.pisos as Array<{ plano_url?: string }> | null;
      if (pisos && pisos.length > 0 && pisos[0]?.plano_url) {
        tipologiaPlanoUrl = pisos[0].plano_url;
      } else {
        tipologiaPlanoUrl = tipo?.plano_url ?? null;
      }

      // Tipología pricing: price comes from tipología, not from unit
      if (isTipologiaPricing && tipo?.precio_desde != null) {
        unit.precio = tipo.precio_desde;
      }

      // Fallback: fill missing unit specs from tipología data
      if (tipo) {
        if (unit.area_m2 == null && tipo.area_m2 !== null) unit.area_m2 = tipo.area_m2;
        if (unit.area_construida == null && tipo.area_construida !== null) unit.area_construida = tipo.area_construida;
        if (unit.area_privada == null && tipo.area_privada !== null) unit.area_privada = tipo.area_privada;
        if (unit.area_lote == null && tipo.area_lote !== null) unit.area_lote = tipo.area_lote;
        if (unit.habitaciones == null && tipo.habitaciones !== null) unit.habitaciones = tipo.habitaciones;
        if (unit.banos == null && tipo.banos !== null) unit.banos = tipo.banos;
      }

      // For multi-tipo lots without confirmed tipología, also override price
      if (!isTipologiaPricing && !unit.tipologia_id && selectedTipologiaId && tipo) {
        if (tipo.precio_desde !== null) {
          // For lotes: sum terrain + construction prices when both exist
          if (proyecto.tipo_proyecto === "lotes" && unit.precio) {
            unit.precio = unit.precio + tipo.precio_desde;
          } else {
            unit.precio = tipo.precio_desde;
          }
        }
      }
    }

    // Apply negotiated price override — parity with /api/cotizaciones/preview.
    // Ignore invalid values (non-number, NaN/Infinity, zero/negative) rather than 500ing.
    const precioNegociadoValido =
      typeof precio_negociado === "number" && Number.isFinite(precio_negociado) && precio_negociado > 0
        ? precio_negociado
        : null;
    if (precioNegociadoValido != null) {
      unit.precio = precioNegociadoValido;
    }

    // Optional calculator-mode metadata (analytics/debug) — ignore anything else.
    const planOrigenValido: "calculadora" | "plantilla" | null =
      plan_origen === "calculadora" || plan_origen === "plantilla" ? plan_origen : null;

    if (!unit.precio) {
      return NextResponse.json({ error: "Unidad sin precio" }, { status: 400 });
    }

    // Build effective config (quick_quote > custom_fases > project defaults)
    let effectiveConfig: CotizadorConfig;
    if (quick_quote) {
      const qqErrors = validateQuickQuoteParams(quick_quote);
      if (qqErrors.length > 0) {
        return NextResponse.json({ error: qqErrors[0] }, { status: 400 });
      }
      effectiveConfig = {
        ...config,
        fases: buildQuickQuoteFases(quick_quote),
        separacion_incluida_en_inicial: false,
      };
    } else if (custom_fases) {
      effectiveConfig = { ...config, fases: custom_fases };
    } else {
      effectiveConfig = config;
    }

    if (separacion_incluida !== undefined) {
      effectiveConfig.separacion_incluida_en_inicial = separacion_incluida;
    }
    if (payment_plan_nombre !== undefined) {
      effectiveConfig.payment_plan_nombre = payment_plan_nombre;
    }
    if (admin_fee !== undefined) {
      effectiveConfig.admin_fee = admin_fee;
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
              tipo: c.tipo as "parqueadero" | "deposito" | "addon",
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
            tipo: c.tipo as "parqueadero" | "deposito" | "addon",
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

    // Resolve delivery context for dynamic payment plans
    const deliveryContext = resolveDeliveryContext(effectiveConfig);

    // Calculate quotation (server-side — source of truth)
    const resultado = calcularCotizacion(
      precioFinal,
      effectiveConfig,
      custom_descuentos || [],
      complementoSelecciones,
      deliveryContext,
    );

    // Determine cover image URL (config override > project render > tipología render)
    const coverUrl =
      config.portada_url ||
      proyecto.render_principal_url ||
      tipologiaRenders[0] ||
      null;

    // Images are referenced by absolute URL in the HTML and fetched by the
    // Chromium worker at render time — no app-side base64 fetch needed.

    // Fetch agent profile if agent_id provided
    let agenteNombreCompleto = agente_nombre ? sanitize(agente_nombre, 200) : null;
    let agenteTelefono: string | null = null;
    let agenteEmail: string | null = null;
    let agenteAvatarUrl: string | null = null;

    if (agente_id) {
      const { data: agentProfile } = await supabase
        .from("user_profiles")
        .select("nombre, apellido, telefono, avatar_url")
        .eq("user_id", agente_id)
        .maybeSingle();

      if (agentProfile) {
        const fullName = [agentProfile.nombre, agentProfile.apellido].filter(Boolean).join(" ");
        if (fullName) agenteNombreCompleto = fullName;
        agenteTelefono = agentProfile.telefono;
        agenteAvatarUrl = agentProfile.avatar_url;
      }

      // Get agent email from auth
      const { data: agentUser } = await supabase.auth.admin.getUserById(agente_id);
      if (agentUser?.user?.email) {
        agenteEmail = agentUser.user.email;
      }
    }

    // Generate PDF
    const now = new Date();
    const projectLocale: EmailLocale = idioma || (proyecto.idioma as EmailLocale) || "es";
    const dateIntlLocale = projectLocale === "en" ? "en-US" : "es-CO";
    const fecha = now.toLocaleDateString(dateIntlLocale, { day: "numeric", month: "long", year: "numeric" });
    const cotizacionId = crypto.randomUUID();
    const refNumber = `COT-${now.getFullYear()}-${cotizacionId.slice(0, 4).toUpperCase()}`;

    // Snapshot unit data (built before render so it can also feed the HTML builder)
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
      parqueaderos: unit.parqueaderos,
      depositos: unit.depositos,
      lote: unit.lote,
      etapa_nombre: unit.etapa_nombre,
      tiene_jacuzzi: tieneJacuzzi || undefined,
      tiene_piscina: tienePiscina || undefined,
      tiene_bbq: tieneBbq || undefined,
      tiene_terraza: tieneTerraza || undefined,
      tiene_jardin: tieneJardin || undefined,
      tiene_cuarto_servicio: tieneCuartoServicio || undefined,
      tiene_estudio: tieneEstudio || undefined,
      tiene_chimenea: tieneChimenea || undefined,
      tiene_doble_altura: tieneDobleAltura || undefined,
      tiene_rooftop: tieneRooftop || undefined,
      amoblado: (amoblado || proyecto.politica_amoblado === "incluido") || undefined,
    };
    // Track if tipología was buyer-selected (not pre-assigned)
    if (!unit.tipologia_id && selectedTipologiaId) {
      unidadSnapshot.tipologia_seleccionada_por_comprador = true;
      unidadSnapshot.tipologia_id_seleccionada = selectedTipologiaId;
    }
    if (complementoSelecciones.length > 0) {
      unidadSnapshot.complementos = complementoSelecciones;
    }

    // Build the render input and render the PDF via the Chromium worker.
    // Buyer-facing public POST is fail-soft (lead capture must never break);
    // agent-initiated POST (agente_id present) is fail-loud so the agent sees a 502.
    const input = buildInputFromDbRows({
      resultado,
      config: effectiveConfig,
      moneda,
      proyecto: {
        nombre: proyecto.nombre,
        constructora_nombre: proyecto.constructora_nombre,
        color_primario: proyecto.color_primario,
        ubicacion_direccion: proyecto.ubicacion_direccion ?? null,
        estado_construccion: proyecto.estado_construccion ?? "sobre_planos",
        logo_url: config.pdf_logo_proyecto_url || proyecto.logo_url,
        constructora_logo_url: config.pdf_logo_constructora_url || proyecto.constructora_logo_url,
        cover_url: coverUrl,
        renders: tipologiaRenders,
        plano_url: tipologiaPlanoUrl,
        whatsapp_numero: proyecto.whatsapp_numero,
        tour_360_url: proyecto.tour_360_url,
      },
      unidadSnapshot,
      unidadMedida: proyecto.unidad_medida_base === "sqft" ? "sqft" : "m²",
      agente: { nombre: agenteNombreCompleto, telefono: agenteTelefono, email: agenteEmail, avatarUrl: agenteAvatarUrl },
      buyer: { nombre: sanitize(nombre, 200), email: sanitize(email, 320), telefono: telefono ? sanitize(telefono, 30) : null },
      complementos: complementoSelecciones,
      fechaDisplay: fecha,
      fechaEstimadaEntrega: deliveryContext && effectiveConfig.tipo_entrega
        ? formatDeliveryDisplay(deliveryContext, effectiveConfig.tipo_entrega)
        : effectiveConfig.fecha_estimada_entrega ?? null,
      referenceNumber: refNumber,
      paymentPlanNombre: effectiveConfig.payment_plan_nombre ?? (projectLocale === "en" ? "Payment Plan" : "Plan de Pagos"),
      idioma: projectLocale,
      monedaSecundaria: moneda_secundaria ?? null,
      tipoCambio: tipo_cambio ?? null,
    });

    const isAgentAction = !!agente_id;
    const { pdfPath, pdfBuffer } = await generateCotizacionPdf(
      supabase, proyecto_id, cotizacionId, input, /* failSoft */ !isAgentAction,
    );

    // Persist the object PATH in the private bucket (NOT a public URL).
    const pdfUrl = pdfPath;

    // No dedicated columns for these (and no migration for this fix) — fold them
    // into the existing config_snapshot JSONB so the negotiated price and the
    // originating mode are recoverable for analytics/debug/support.
    const configSnapshot: CotizadorConfig & {
      precio_negociado?: number;
      plan_origen?: "calculadora" | "plantilla";
    } = { ...effectiveConfig };
    if (precioNegociadoValido != null) configSnapshot.precio_negociado = precioNegociadoValido;
    if (planOrigenValido != null) configSnapshot.plan_origen = planOrigenValido;

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
        config_snapshot: configSnapshot,
        resultado,
        pdf_url: pdfUrl,
        utm_source: utm_source ? sanitize(utm_source, 200) : null,
        utm_medium: utm_medium ? sanitize(utm_medium, 200) : null,
        utm_campaign: utm_campaign ? sanitize(utm_campaign, 200) : null,
        agente_id: agente_id || null,
        agente_nombre: agenteNombreCompleto || null,
        agente_telefono: agenteTelefono || null,
        agente_avatar_url: agenteAvatarUrl || null,
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
    const emailCfg = proyecto.email_config as EmailConfig | null;

    // Build microsite URL for action buttons
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "noddo.io";
    const micrositeUrl = proyecto.custom_domain && proyecto.domain_verified
      ? `https://${proyecto.custom_domain}`
      : `https://${proyecto.subdomain || proyecto.slug}.${rootDomain}`;

    // Fetch recursos for email attachments if needed
    let recursosForEmail: { id: string; nombre: string; url: string }[] | undefined;
    if (emailCfg?.adjuntos_recurso_ids?.length) {
      const { data: recRows } = await supabase
        .from("recursos")
        .select("id, nombre, url")
        .in("id", emailCfg.adjuntos_recurso_ids)
        .eq("proyecto_id", proyecto_id);
      if (recRows) recursosForEmail = recRows;
    }

    // Email to buyer with PDF (project's language).
    // Only send when the worker actually produced a PDF — on a fail-soft worker
    // outage pdfBuffer is null, the lead is still captured, and the agent can regenerate.
    if (pdfBuffer) {
      sendCotizacionBuyer({
        buyerEmail: sanitize(email, 320),
        buyerName: sanitize(nombre, 200),
        projectName: proyecto.nombre,
        unidadId: unit.identificador,
        totalFormatted,
        tipologiaName,
        areaM2: unit.area_m2,
        habitaciones: unit.habitaciones,
        banos: unit.banos,
        pdfBuffer,
        locale: projectLocale,
        emailConfig: emailCfg,
        projectSlug: proyecto.slug,
        projectLogoUrl: proyecto.logo_url,
        constructoraLogoUrl: proyecto.constructora_logo_url,
        constructoraNombre: proyecto.constructora_nombre,
        colorPrimario: proyecto.color_primario,
        whatsappNumero: proyecto.whatsapp_numero,
        tour360Url: proyecto.tour_360_url,
        brochureUrl: proyecto.brochure_url,
        micrositeUrl,
        recursos: recursosForEmail,
        agentName: agenteNombreCompleto,
        agentPhone: agenteTelefono,
        agentEmail: agenteEmail,
        agentAvatarUrl: agenteAvatarUrl,
      }).catch((err) => console.error("[cotizaciones] Buyer email failed:", err));
    }

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

    // Mint a short-lived signed URL for the agent response — never leak the raw
    // private object path. pdf_pending lets the UI offer a regenerate on outage.
    const signedUrl = pdfPath ? await getCotizacionSignedUrl(supabase, pdfPath) : null;
    return NextResponse.json(
      { id: cotizacionId, pdf_url: signedUrl, pdf_pending: pdfPath === null },
      { status: 201 },
    );
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
