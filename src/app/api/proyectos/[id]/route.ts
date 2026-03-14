import { getAuthContext } from "@/lib/auth-context";
import { pick } from "@/lib/api-utils";
import { getProjectFeatures } from "@/lib/feature-flags";
import { NextRequest, NextResponse } from "next/server";

const PROYECTO_FIELDS = [
  "nombre", "slug", "descripcion", "estado", "disclaimer", "politica_privacidad_url",
  "logo_url", "constructora_nombre", "constructora_logo_url", "constructora_website",
  "color_primario", "color_secundario", "color_fondo", "whatsapp_numero",
  "ubicacion_direccion", "ubicacion_lat", "ubicacion_lng", "tour_360_url",
  "brochure_url", "render_principal_url", "favicon_url", "og_image_url",
  "hero_video_url", "fachada_url", "mapa_ubicacion_url", "subdomain",
  "custom_domain", "domain_verified", "etapa_label", "background_audio_url",
  "hide_noddo_badge",
  "cotizador_enabled", "cotizador_config",
  "webhook_config",
];

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

    // Fetch related data
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
    ]);

    // Fetch all gallery images in a single query (avoids N+1)
    const catIds = (categorias || []).map((c) => c.id);
    const { data: allImages } = catIds.length > 0
      ? await auth.supabase
          .from("galeria_imagenes")
          .select("*")
          .in("categoria_id", catIds)
          .order("orden")
      : { data: [] };

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

    // Fetch plano puntos
    const planoIds = (planos || []).map((p: { id: string }) => p.id);
    const { data: planoPuntos } = planoIds.length > 0
      ? await auth.supabase.from("plano_puntos").select("*").in("plano_id", planoIds).order("orden")
      : { data: [] };

    // Fetch project features
    const features = await getProjectFeatures(auth.supabase, id);

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
      features,
    });
  } catch (err) {
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
    if (auth.role !== "admin") {
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
    }

    const body = await request.json();

    const updateData: Record<string, unknown> = { ...pick(body, PROYECTO_FIELDS), updated_at: new Date().toISOString() };

    // Auto-sync subdomain when slug changes (if subdomain was never independently customized)
    if (body.slug !== undefined && body.subdomain === undefined) {
      const { data: current } = await auth.supabase
        .from("proyectos")
        .select("slug, subdomain")
        .eq("id", id)
        .single();

      if (current && (current.subdomain === current.slug || !current.subdomain)) {
        updateData.subdomain = body.slug;
      }
    }

    const { data, error } = await auth.supabase
      .from("proyectos")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
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
    if (auth.role !== "admin") {
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
    }

    const { error } = await auth.supabase
      .from("proyectos")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
