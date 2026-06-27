import { NextRequest, NextResponse } from "next/server";
import { calcularCotizacion, buildPrecioBaseComplementos } from "@/lib/cotizador/calcular";
import { resolveDeliveryContext, formatDeliveryDisplay } from "@/lib/cotizador/delivery";
import { renderCotizacionPdf } from "@/lib/cotizador/generate";
import { buildCotizacionData } from "@/lib/cotizador/html/build-data";
import { buildCotizacionHtml } from "@/lib/cotizador/html/build-html";
import { buildInputFromDbRows } from "@/lib/cotizador/html/from-db";
import type { EmailLocale } from "@/lib/email-i18n";
import type { CotizadorConfig, FaseConfig, DescuentoConfig, Unidad, Currency, ComplementoSeleccion } from "@/types";
import { getAuthContext } from "@/lib/auth-context";

// PDF/image generation is CPU- and memory-heavy; raise above the Vercel default.
export const runtime = "nodejs";
export const maxDuration = 60;

/* ── POST /api/cotizaciones/preview ── */

export async function POST(request: NextRequest) {
  try {
    // Auth required — dashboard only
    const auth = await getAuthContext();
    if (!auth?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      proyecto_id, unidad_id,
      nombre, email, telefono,
      agente_id, agente_nombre,
      tipologia_id: selectedTipologiaId,
      custom_fases,
      custom_descuentos,
      complemento_ids,
      complemento_selections,
      precio_base_parqueaderos,
      precio_base_depositos,
      separacion_incluida,
      payment_plan_nombre,
      admin_fee,
      amoblado,
      idioma,
      moneda_secundaria,
      tipo_cambio,
      precio_negociado,
    } = body as {
      proyecto_id: string;
      unidad_id: string;
      nombre?: string;
      email?: string;
      telefono?: string;
      agente_id?: string;
      agente_nombre?: string;
      tipologia_id?: string;
      custom_fases?: FaseConfig[];
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
    };

    if (!proyecto_id || !unidad_id) {
      return NextResponse.json({ error: "proyecto_id y unidad_id requeridos" }, { status: 400 });
    }

    const { supabase } = auth;

    // Fetch project
    const { data: proyecto, error: projErr } = await supabase
      .from("proyectos")
      .select("id, nombre, constructora_nombre, constructora_logo_url, logo_url, color_primario, cotizador_config, render_principal_url, tour_360_url, whatsapp_numero, disclaimer, parqueaderos_mode, depositos_mode, parqueaderos_precio_base, depositos_precio_base, idioma, tipo_proyecto, precio_source, unidad_medida_base, estado_construccion, politica_amoblado, ubicacion_direccion")
      .eq("id", proyecto_id)
      .single();

    if (projErr || !proyecto) {
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    }

    const config = (proyecto.cotizador_config ?? {}) as CotizadorConfig;
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

    // Fetch tipología
    const effectiveTipologiaId = unit.tipologia_id || selectedTipologiaId || null;
    let tipologiaName: string | null = null;
    let tipologiaRenders: string[] = [];
    let tipologiaPlanoUrl: string | null = null;
    let tieneJacuzzi = false, tienePiscina = false, tieneBbq = false;
    let tieneTerraza = false, tieneJardin = false, tieneCuartoServicio = false;
    let tieneEstudio = false, tieneChimenea = false, tieneDobleAltura = false, tieneRooftop = false;

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

      const pisos = tipo?.pisos as Array<{ plano_url?: string }> | null;
      if (pisos && pisos.length > 0 && pisos[0]?.plano_url) {
        tipologiaPlanoUrl = pisos[0].plano_url;
      } else {
        tipologiaPlanoUrl = tipo?.plano_url ?? null;
      }

      if (isTipologiaPricing && tipo?.precio_desde != null) {
        unit.precio = tipo.precio_desde;
      }
      if (tipo) {
        if (unit.area_m2 == null && tipo.area_m2 !== null) unit.area_m2 = tipo.area_m2;
        if (unit.area_construida == null && tipo.area_construida !== null) unit.area_construida = tipo.area_construida;
        if (unit.area_privada == null && tipo.area_privada !== null) unit.area_privada = tipo.area_privada;
        if (unit.area_lote == null && tipo.area_lote !== null) unit.area_lote = tipo.area_lote;
        if (unit.habitaciones == null && tipo.habitaciones !== null) unit.habitaciones = tipo.habitaciones;
        if (unit.banos == null && tipo.banos !== null) unit.banos = tipo.banos;
      }

      if (!isTipologiaPricing && !unit.tipologia_id && selectedTipologiaId && tipo) {
        if (tipo.precio_desde !== null) {
          if (proyecto.tipo_proyecto === "lotes" && unit.precio) {
            unit.precio = unit.precio + tipo.precio_desde;
          } else {
            unit.precio = tipo.precio_desde;
          }
        }
      }
    }

    // Apply negotiated price override
    if (precio_negociado != null && precio_negociado > 0) {
      unit.precio = precio_negociado;
    }

    if (!unit.precio) {
      return NextResponse.json({ error: "Unidad sin precio" }, { status: 400 });
    }

    // Build effective config
    const effectiveConfig: CotizadorConfig = custom_fases
      ? { ...config, fases: custom_fases }
      : config;

    if (separacion_incluida !== undefined) effectiveConfig.separacion_incluida_en_inicial = separacion_incluida;
    if (payment_plan_nombre !== undefined) effectiveConfig.payment_plan_nombre = payment_plan_nombre;
    if (admin_fee !== undefined) effectiveConfig.admin_fee = admin_fee;

    // Fetch complementos
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
          const sel = complemento_selections?.find((s) => s.complemento_id === c.id);
          if (sel) {
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
          const mode = c.tipo === "parqueadero" ? proyecto.parqueaderos_mode : proyecto.depositos_mode;
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

    const precioFinal = unit.precio;
    const deliveryContext = resolveDeliveryContext(effectiveConfig);

    const resultado = calcularCotizacion(
      precioFinal,
      effectiveConfig,
      custom_descuentos || [],
      complementoSelecciones,
      deliveryContext,
    );

    // Resolve cover image URL (worker fetches images by absolute URL at render time)
    const coverUrl = config.portada_url || proyecto.render_principal_url || tipologiaRenders[0] || null;

    // Agent info
    let agenteNombreCompleto = agente_nombre || null;
    let agenteTelefono: string | null = null;
    let agenteEmail: string | null = null;

    if (agente_id) {
      const { data: agentProfile } = await supabase
        .from("user_profiles")
        .select("nombre, apellido, telefono")
        .eq("user_id", agente_id)
        .maybeSingle();

      if (agentProfile) {
        const fullName = [agentProfile.nombre, agentProfile.apellido].filter(Boolean).join(" ");
        if (fullName) agenteNombreCompleto = fullName;
        agenteTelefono = agentProfile.telefono;
      }

      const { data: agentUser } = await supabase.auth.admin.getUserById(agente_id);
      if (agentUser?.user?.email) agenteEmail = agentUser.user.email;
    }

    // Locale + date
    const now = new Date();
    const projectLocale: EmailLocale = idioma || (proyecto.idioma as EmailLocale) || "es";
    const dateIntlLocale = projectLocale === "en" ? "en-US" : "es-CO";
    const fecha = now.toLocaleDateString(dateIntlLocale, { day: "numeric", month: "long", year: "numeric" });

    // Buyer info (with preview defaults)
    const buyerName = nombre?.trim() || "Vista previa";
    const buyerEmail = email?.trim() || "preview@noddo.io";
    const buyerPhone = telefono?.trim() || null;

    // Build the render input from the live unit (no stored snapshot for a preview).
    const previewSnapshot: Record<string, unknown> = {
      identificador: unit.identificador,
      tipologia: tipologiaName,
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
      unidadSnapshot: previewSnapshot,
      unidadMedida: proyecto.unidad_medida_base === "sqft" ? "sqft" : "m²",
      agente: { nombre: agenteNombreCompleto, telefono: agenteTelefono, email: agenteEmail, avatarUrl: null },
      buyer: { nombre: buyerName, email: buyerEmail, telefono: buyerPhone },
      complementos: complementoSelecciones,
      fechaDisplay: fecha,
      fechaEstimadaEntrega: deliveryContext && effectiveConfig.tipo_entrega
        ? formatDeliveryDisplay(deliveryContext, effectiveConfig.tipo_entrega)
        : effectiveConfig.fecha_estimada_entrega ?? null,
      referenceNumber: "PREVIEW",
      paymentPlanNombre: effectiveConfig.payment_plan_nombre ?? (projectLocale === "en" ? "Payment Plan" : "Plan de Pagos"),
      idioma: projectLocale,
      monedaSecundaria: moneda_secundaria ?? null,
      tipoCambio: tipo_cambio ?? null,
    });

    // Preview is fail-loud: if the worker is down, surface a 502 (handled below).
    const html = buildCotizacionHtml(buildCotizacionData(input));
    const pdfBuffer = await renderCotizacionPdf(html);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[cotizaciones/preview] Error:", error);
    const message = error instanceof Error ? error.message : "Error generating preview";
    // Render-worker failures surface as a 502 so the UI shows a clear "worker down"
    // error instead of a blank PDF (preview is an active agent action → fail-loud).
    const isWorkerError = /render worker|COTIZADOR_RENDER_URL|RENDER_SHARED_SECRET/i.test(message);
    return NextResponse.json(
      { error: isWorkerError ? "El servicio de generación de PDF no está disponible. Intenta de nuevo en un momento." : message },
      { status: isWorkerError ? 502 : 500 },
    );
  }
}
