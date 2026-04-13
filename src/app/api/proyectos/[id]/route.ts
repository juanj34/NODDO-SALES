import { getAuthContext, requirePermission } from "@/lib/auth-context";
import { pick } from "@/lib/api-utils";
import { logActivity } from "@/lib/activity-logger";
import { reportApiError } from "@/lib/error-reporter";
import { NextRequest, NextResponse } from "next/server";

const PROYECTO_FIELDS = [
  "nombre", "slug", "descripcion", "estado", "disclaimer", "politica_privacidad_url",
  "logo_url", "logo_height", "constructora_nombre", "constructora_logo_url", "constructora_website",
  "color_primario", "color_secundario", "color_fondo", "tema_modo", "whatsapp_numero",
  "ubicacion_direccion", "ubicacion_lat", "ubicacion_lng", "tour_360_url",
  "brochure_url", "render_principal_url", "favicon_url", "og_image_url",
  "hero_video_url", "fachada_url", "mapa_ubicacion_url", "subdomain",
  "custom_domain", "domain_verified", "etapa_label", "background_audio_url",
  "hide_noddo_badge",
  "ocultar_vendidas",
  "ocultar_precio_vendidas",
  "habilitar_extra_jacuzzi",
  "habilitar_extra_piscina",
  "habilitar_extra_bbq",
  "habilitar_extra_terraza",
  "habilitar_extra_jardin",
  "habilitar_extra_cuarto_servicio",
  "habilitar_extra_estudio",
  "habilitar_extra_chimenea",
  "habilitar_extra_doble_altura",
  "habilitar_extra_rooftop",
  "idioma", "moneda_base", "unidad_medida_base",
  "cotizador_enabled", "cotizador_config",
  "email_config",
  "webhook_config",
  "tipo_proyecto",
  "parqueaderos_mode", "depositos_mode",
  "parqueaderos_precio_base", "depositos_precio_base",
  "tipologia_mode",
  "precio_source",
  "inventory_columns",
  "inventory_columns_by_type",
  "inventory_columns_microsite",
  "inventory_columns_microsite_by_type",
  "custom_columns",
  "unidad_display_prefix",
  "secciones_visibles",
  "tipologia_fields",
  "agent_mode_config",
  "disponibilidad_config",
  "estado_construccion",
  "politica_amoblado",
  "precio_amoblado",
];

/**
 * Content/media fields that directors (content.write) can update
 * without needing project.update (administrador) permission.
 */
const CONTENT_FIELDS = new Set([
  "brochure_url", "render_principal_url", "hero_video_url",
  "fachada_url", "mapa_ubicacion_url", "tour_360_url",
  "background_audio_url", "favicon_url", "og_image_url",
  "logo_url", "logo_height", "constructora_logo_url",
  "secciones_visibles", "disclaimer", "politica_privacidad_url",
  "etapa_label", "estado_construccion",
]);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: proyecto, error } = await auth.supabase
      .from("proyectos")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.adminUserId)
      .single();

    if (error || !proyecto) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    // Fetch related data in parallel
    const [
      { data: tipologias },
      { data: categorias },
      { data: videos },
      { data: puntosInteres },
      { data: unidades },
      { data: recursos },
      { data: fachadas },
      { data: torres },
      { data: planos },
      { data: avancesObra },
      { data: complementos },
      { data: unidadTipologias },
      { data: vistasPiso },
    ] = await Promise.all([
      auth.supabase.from("tipologias").select("*").eq("proyecto_id", id).order("orden"),
      auth.supabase.from("galeria_categorias").select("*").eq("proyecto_id", id).order("orden"),
      auth.supabase.from("videos").select("*").eq("proyecto_id", id).order("orden"),
      auth.supabase.from("puntos_interes").select("*").eq("proyecto_id", id).order("orden"),
      auth.supabase.from("unidades").select("*").eq("proyecto_id", id).order("orden"),
      auth.supabase.from("recursos").select("*").eq("proyecto_id", id).order("orden"),
      auth.supabase.from("fachadas").select("*").eq("proyecto_id", id).order("orden"),
      auth.supabase.from("torres").select("*").eq("proyecto_id", id).order("orden"),
      auth.supabase.from("planos_interactivos").select("*").eq("proyecto_id", id).order("orden"),
      auth.supabase.from("avances_obra").select("*").eq("proyecto_id", id).order("orden"),
      auth.supabase.from("complementos").select("*").eq("proyecto_id", id).order("orden"),
      auth.supabase.from("unidad_tipologias").select("*").eq("proyecto_id", id),
      auth.supabase.from("vistas_piso").select("*").eq("proyecto_id", id).order("orden"),
    ]);

    // Fetch gallery images + plano puntos in parallel (both depend on IDs from above)
    const catIds = (categorias || []).map((c) => c.id);
    const planoIds = (planos || []).map((p: { id: string }) => p.id);

    const [{ data: allImages }, { data: planoPuntos }] = await Promise.all([
      catIds.length > 0
        ? auth.supabase.from("galeria_imagenes").select("*").in("categoria_id", catIds).order("orden")
        : Promise.resolve({ data: [] }),
      planoIds.length > 0
        ? auth.supabase.from("plano_puntos").select("*").in("plano_id", planoIds).order("orden")
        : Promise.resolve({ data: [] }),
    ]);

    const imgs = allImages || [];
    const imagesByCategory: Record<string, typeof imgs> = {};
    imgs.forEach((img) => {
      if (!imagesByCategory[img.categoria_id]) imagesByCategory[img.categoria_id] = [];
      imagesByCategory[img.categoria_id].push(img);
    });

    const categoriasConImagenes = (categorias || []).map((cat) => ({
      ...cat,
      imagenes: imagesByCategory[cat.id] || [],
    }));

    return NextResponse.json({
      ...proyecto,
      tipologias: tipologias || [],
      galeria_categorias: categoriasConImagenes,
      videos: videos || [],
      puntos_interes: puntosInteres || [],
      unidades: unidades || [],
      recursos: recursos || [],
      fachadas: fachadas || [],
      torres: torres || [],
      planos_interactivos: planos || [],
      plano_puntos: planoPuntos || [],
      avances_obra: avancesObra || [],
      complementos: complementos || [],
      unidad_tipologias: unidadTipologias || [],
      vistas_piso: vistasPiso || [],
    });
  } catch (err) {
    void reportApiError(err, { route: "/api/proyectos/[id]", statusCode: 500 });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const body = await request.json();

    // Field-aware permission: content-only updates (brochure, media URLs) require
    // content.write (director+), all other fields require project.update (administrador+)
    const requestedFields = Object.keys(body).filter((k) => PROYECTO_FIELDS.includes(k));
    const isContentOnly = requestedFields.length > 0 &&
      requestedFields.every((f) => CONTENT_FIELDS.has(f));
    const denied = requirePermission(auth, isContentOnly ? "content.write" : "project.update");
    if (denied) return denied;

    const updateData: Record<string, unknown> = { ...pick(body, PROYECTO_FIELDS), updated_at: new Date().toISOString() };

    // Auto-sync subdomain when slug changes (unless subdomain is explicitly provided)
    // This ensures the public URL matches the slug by default.
    // Users can customize subdomain independently via the Dominio page (/editor/[id]/dominio).
    if (body.slug !== undefined && body.subdomain === undefined) {
      updateData.subdomain = body.slug;
    }

    // Fetch current state before updating (for change tracking)
    const { data: before } = await auth.supabase
      .from("proyectos")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.adminUserId)
      .single();

    const { data, error } = await auth.supabase
      .from("proyectos")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", auth.adminUserId)
      .select()
      .single();

    if (error) throw error;

    // Compute changed fields for detailed activity log
    const changedFields = before
      ? Object.keys(updateData).filter(
          (k) => k !== "updated_at" && JSON.stringify(before[k]) !== JSON.stringify(data[k])
        )
      : Object.keys(updateData).filter((k) => k !== "updated_at");

    logActivity({
      userId: auth.user.id, userEmail: auth.user.email!, userRole: auth.role,
      proyectoId: id, proyectoNombre: data.nombre,
      actionType: "project.update", actionCategory: "project",
      metadata: {
        changedFields,
        changes: Object.fromEntries(
          changedFields.slice(0, 10).map((f) => [
            f,
            { from: before?.[f] ?? null, to: data[f] ?? null },
          ])
        ),
      },
      entityType: "proyecto", entityId: id,
    });

    // Revalidate cached project data for both slug and subdomain
    const { revalidateProyecto } = await import("@/lib/supabase/cached-queries");
    await revalidateProyecto(data.slug);
    if (data.subdomain && data.subdomain !== data.slug) {
      await revalidateProyecto(data.subdomain);
    }

    return NextResponse.json(data);
  } catch (err) {
    void reportApiError(err, { route: "/api/proyectos/[id]", statusCode: 500 });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const denied = requirePermission(auth, "project.delete");
    if (denied) return denied;

    // Fetch name before deleting for the log
    const { data: proj } = await auth.supabase.from("proyectos").select("nombre").eq("id", id).single();

    const { error } = await auth.supabase
      .from("proyectos")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.adminUserId);

    if (error) throw error;

    logActivity({
      userId: auth.user.id, userEmail: auth.user.email!, userRole: auth.role,
      proyectoId: id, proyectoNombre: proj?.nombre,
      actionType: "project.delete", actionCategory: "project",
      metadata: { nombre: proj?.nombre },
      entityType: "proyecto", entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    void reportApiError(err, { route: "/api/proyectos/[id]", statusCode: 500 });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
