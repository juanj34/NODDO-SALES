import { getAuthContext } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin") return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    // 1. Fetch full project (owner check via adminUserId)
    const { data: proyecto, error: projErr } = await auth.supabase
      .from("proyectos")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.adminUserId)
      .single();

    if (projErr || !proyecto) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    // 2. Fetch all child data
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
      auth.supabase.from("avances_obra").select("*").eq("proyecto_id", id).eq("estado", "publicado").order("orden"),
    ]);

    // Fetch gallery images
    const catIds = (categorias || []).map((c: { id: string }) => c.id);
    const { data: allImages } = catIds.length > 0
      ? await auth.supabase
          .from("galeria_imagenes")
          .select("*")
          .in("categoria_id", catIds)
          .order("orden")
      : { data: [] as Record<string, unknown>[] };

    const imageMap = new Map<string, typeof allImages>();
    (allImages || []).forEach((img: { categoria_id: string }) => {
      if (!imageMap.has(img.categoria_id)) imageMap.set(img.categoria_id, []);
      imageMap.get(img.categoria_id)!.push(img);
    });

    const categoriasConImagenes = (categorias || []).map((cat: { id: string }) => ({
      ...cat,
      imagenes: imageMap.get(cat.id) || [],
    }));

    // Fetch plano puntos
    const planoIds = (planos || []).map((p: { id: string }) => p.id);
    const { data: planoPuntos } = planoIds.length > 0
      ? await auth.supabase.from("plano_puntos").select("*").in("plano_id", planoIds).order("orden")
      : { data: [] as Record<string, unknown>[] };

    // 3. Build snapshot
    const snapshot = {
      proyecto,
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
    };

    // 4. Get next version number
    const { data: lastVersion } = await auth.supabase
      .from("proyecto_versiones")
      .select("version_number")
      .eq("proyecto_id", id)
      .order("version_number", { ascending: false })
      .limit(1)
      .single();

    const nextVersion = (lastVersion?.version_number || 0) + 1;

    // 5. Insert snapshot
    const { error: snapErr } = await auth.supabase
      .from("proyecto_versiones")
      .insert({
        proyecto_id: id,
        version_number: nextVersion,
        snapshot,
        published_by: auth.user.id,
      });

    if (snapErr) throw snapErr;

    // 6. Set estado = publicado
    const { error: updateErr } = await auth.supabase
      .from("proyectos")
      .update({ estado: "publicado" })
      .eq("id", id)
      .eq("user_id", auth.adminUserId);

    if (updateErr) throw updateErr;

    return NextResponse.json({
      version_number: nextVersion,
      published_at: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al publicar" },
      { status: 500 }
    );
  }
}
