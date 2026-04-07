import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { calcularCotizacion, buildPrecioBaseComplementos } from "@/lib/cotizador/calcular";
import { resolveDeliveryContext, formatDeliveryDisplay } from "@/lib/cotizador/delivery";
import { generarPDF } from "@/lib/cotizador/pdf-react/render";
import type { EmailLocale } from "@/lib/email-i18n";
import type { CotizadorConfig, FaseConfig, DescuentoConfig, Unidad, Currency, ComplementoSeleccion } from "@/types";
import { getAuthContext } from "@/lib/auth-context";

/* ── Image cache (module-scope, survives across requests) ── */

interface CachedImage {
  base64: string;
  format: "JPEG" | "PNG";
  width?: number;
  height?: number;
  cachedAt: number;
}

const IMAGE_CACHE = new Map<string, CachedImage | null>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

async function fetchImageCached(
  url: string | null,
): Promise<{ base64: string; format: "JPEG" | "PNG"; width?: number; height?: number } | null> {
  if (!url) return null;

  // Check cache
  const cached = IMAGE_CACHE.get(url);
  if (cached !== undefined && cached !== null && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached;
  }
  if (cached === null) {
    // Previously failed — retry after TTL
    const failEntry = IMAGE_CACHE.get(url);
    if (failEntry === null) {
      // Null entries don't have cachedAt, always retry
    }
  }

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      IMAGE_CACHE.set(url, null);
      return null;
    }
    const buffer = await res.arrayBuffer();
    const uint8 = new Uint8Array(buffer);

    const isJPEG = uint8[0] === 0xff && uint8[1] === 0xd8;
    const isPNG = uint8[0] === 0x89 && uint8[1] === 0x50;

    let resized: Buffer;
    let format: "JPEG" | "PNG";

    if (!isJPEG && !isPNG) {
      resized = await sharp(Buffer.from(buffer)).resize(1200, null, { withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
      format = "JPEG";
    } else {
      resized = await sharp(Buffer.from(buffer)).resize(1200, null, { withoutEnlargement: true }).toBuffer();
      format = isJPEG ? "JPEG" : "PNG";
    }

    const meta = await sharp(resized).metadata();
    const result: CachedImage = {
      base64: resized.toString("base64"),
      format,
      width: meta.width,
      height: meta.height,
      cachedAt: Date.now(),
    };
    IMAGE_CACHE.set(url, result);

    // Evict old entries if cache grows too large
    if (IMAGE_CACHE.size > 50) {
      const now = Date.now();
      for (const [key, val] of IMAGE_CACHE) {
        if (val === null || now - val.cachedAt > CACHE_TTL_MS) IMAGE_CACHE.delete(key);
      }
    }

    return result;
  } catch {
    IMAGE_CACHE.set(url, null);
    return null;
  }
}

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
    let tipologiaUbicacionPlanoUrl: string | null = null;
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
      tipologiaUbicacionPlanoUrl = tipo?.ubicacion_plano_url ?? null;

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

    // Resolve image URLs
    const coverUrl = config.portada_url || proyecto.render_principal_url || tipologiaRenders[0] || null;
    const constructoraLogoUrl = config.pdf_logo_constructora_url || proyecto.constructora_logo_url;
    const projectLogoUrl = config.pdf_logo_proyecto_url || proyecto.logo_url;

    // Fetch images with cache (parallel)
    const [coverImage, logoImage, projectLogoImage, planoImage, keyPlanImage] = await Promise.all([
      fetchImageCached(coverUrl),
      fetchImageCached(constructoraLogoUrl),
      fetchImageCached(projectLogoUrl),
      fetchImageCached(tipologiaPlanoUrl),
      fetchImageCached(tipologiaUbicacionPlanoUrl),
    ]);

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

    // Generate PDF
    const pdfBuffer = await generarPDF({
      projectName: proyecto.nombre,
      constructoraName: proyecto.constructora_nombre,
      colorPrimario: proyecto.color_primario,
      unidadId: unit.identificador,
      tipologiaName,
      area_construida: unit.area_construida,
      area_privada: unit.area_privada,
      area_lote: unit.area_lote,
      area_m2: unit.area_m2,
      unidad_medida: proyecto.unidad_medida_base === "sqft" ? "sqft" : "m²",
      piso: unit.piso,
      vista: unit.vista,
      habitaciones: unit.habitaciones,
      banos: unit.banos,
      orientacion: unit.orientacion,
      parqueaderos: unit.parqueaderos,
      depositos: unit.depositos,
      tiene_jacuzzi: tieneJacuzzi,
      tiene_piscina: tienePiscina,
      tiene_bbq: tieneBbq,
      tiene_terraza: tieneTerraza,
      tiene_jardin: tieneJardin,
      tiene_cuarto_servicio: tieneCuartoServicio,
      tiene_estudio: tieneEstudio,
      tiene_chimenea: tieneChimenea,
      tiene_doble_altura: tieneDobleAltura,
      tiene_rooftop: tieneRooftop,
      resultado,
      config: effectiveConfig,
      complementos: complementoSelecciones.length > 0 ? complementoSelecciones : undefined,
      buyerName,
      buyerEmail,
      buyerPhone,
      agenteName: agenteNombreCompleto,
      agentePhone: agenteTelefono,
      agenteEmail,
      fecha,
      referenceNumber: "PREVIEW",
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
      tour360Url: proyecto.tour_360_url,
      whatsappNumero: proyecto.whatsapp_numero,
      disclaimer: proyecto.disclaimer,
      pdfSaludo: effectiveConfig.pdf_saludo ?? null,
      pdfDespedida: effectiveConfig.pdf_despedida ?? null,
      fechaEstimadaEntrega: deliveryContext && effectiveConfig.tipo_entrega
        ? formatDeliveryDisplay(deliveryContext, effectiveConfig.tipo_entrega)
        : effectiveConfig.fecha_estimada_entrega ?? null,
      tipoEntrega: effectiveConfig.tipo_entrega ?? null,
      mesesRestantes: deliveryContext?.mesesDisponibles ?? null,
      paymentPlanNombre: effectiveConfig.payment_plan_nombre ?? null,
      adminFee: resultado.admin_fee ?? null,
      adminFeeLabel: resultado.admin_fee_label ?? null,
      coverStyle: config.pdf_cover_style ?? "hero",
      pdfTheme: config.pdf_theme ?? "neutral",
      pisoLabel: unit.piso != null ? (projectLocale === "en" ? `Floor ${unit.piso}` : `Piso ${unit.piso}`) : null,
      idioma: projectLocale,
      estadoConstruccion: proyecto.estado_construccion ?? "sobre_planos",
      amoblado: amoblado || proyecto.politica_amoblado === "incluido" || undefined,
      ubicacionDireccion: proyecto.ubicacion_direccion ?? null,
      monedaSecundaria: moneda_secundaria ?? null,
      tipoCambio: tipo_cambio ?? null,
      hitosConstructivos: effectiveConfig.hitos_constructivos ?? [],
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[cotizaciones/preview] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error generating preview" },
      { status: 500 },
    );
  }
}
