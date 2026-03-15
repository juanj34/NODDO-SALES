import { getAuthContext } from "@/lib/auth-context";
import { checkProjectLimit } from "@/lib/plan-limits";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin")
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    // Check plan limit
    const limit = await checkProjectLimit(auth.supabase, auth.user.id);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `Has alcanzado el límite de ${limit.max} proyecto(s) en tu plan` },
        { status: 403 }
      );
    }

    // Fetch source project
    const { data: source, error: srcErr } = await auth.supabase
      .from("proyectos")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.adminUserId)
      .single();

    if (srcErr || !source) {
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    }

    // Generate unique slug
    let newSlug = `${source.slug}-copia`;
    let suffix = 1;
     
    while (true) {
      const { data: exists } = await auth.supabase
        .from("proyectos")
        .select("id")
        .eq("slug", newSlug)
        .single();
      if (!exists) break;
      suffix++;
      newSlug = `${source.slug}-copia-${suffix}`;
    }

    // Create cloned project
    const {
      id: _id, created_at: _ca, updated_at: _ua, estado: _e,
      slug: _slug, subdomain: _sub, custom_domain: _cd, domain_verified: _dv,
      ...projectFields
    } = source;

    const { data: newProject, error: insertErr } = await auth.supabase
      .from("proyectos")
      .insert({
        ...projectFields,
        nombre: `${source.nombre} (copia)`,
        slug: newSlug,
        subdomain: newSlug,
        estado: "borrador",
        user_id: auth.user.id,
      })
      .select()
      .single();

    if (insertErr) throw insertErr;
    const newId = newProject.id;

    // Clone tipologias
    const { data: tipologias } = await auth.supabase
      .from("tipologias")
      .select("*")
      .eq("proyecto_id", id)
      .order("orden");

    if (tipologias?.length) {
      await auth.supabase.from("tipologias").insert(
        tipologias.map(({ id: _tid, proyecto_id: _pid, created_at: _tca, ...rest }) => ({
          ...rest,
          proyecto_id: newId,
        }))
      );
    }

    // Clone gallery categories + images
    const { data: categorias } = await auth.supabase
      .from("galeria_categorias")
      .select("*")
      .eq("proyecto_id", id)
      .order("orden");

    if (categorias?.length) {
      for (const cat of categorias) {
        const { id: catId, proyecto_id: _cpid, ...catRest } = cat;
        const { data: newCat } = await auth.supabase
          .from("galeria_categorias")
          .insert({ ...catRest, proyecto_id: newId })
          .select()
          .single();

        if (newCat) {
          const { data: imgs } = await auth.supabase
            .from("galeria_imagenes")
            .select("*")
            .eq("categoria_id", catId)
            .order("orden");

          if (imgs?.length) {
            await auth.supabase.from("galeria_imagenes").insert(
              imgs.map(({ id: _iid, categoria_id: _cid, ...rest }) => ({
                ...rest,
                categoria_id: newCat.id,
              }))
            );
          }
        }
      }
    }

    // Clone POIs
    const { data: pois } = await auth.supabase
      .from("puntos_interes")
      .select("*")
      .eq("proyecto_id", id)
      .order("orden");

    if (pois?.length) {
      await auth.supabase.from("puntos_interes").insert(
        pois.map(({ id: _pid2, proyecto_id: _ppid, ...rest }) => ({
          ...rest,
          proyecto_id: newId,
        }))
      );
    }

    // Clone torres
    const { data: torres } = await auth.supabase
      .from("torres")
      .select("*")
      .eq("proyecto_id", id)
      .order("orden");

    if (torres?.length) {
      await auth.supabase.from("torres").insert(
        torres.map(({ id: _tid2, proyecto_id: _tpid, ...rest }) => ({
          ...rest,
          proyecto_id: newId,
        }))
      );
    }

    // Clone videos
    const { data: videos } = await auth.supabase
      .from("videos")
      .select("*")
      .eq("proyecto_id", id)
      .order("orden");

    if (videos?.length) {
      await auth.supabase.from("videos").insert(
        videos.map(({ id: _vid, proyecto_id: _vpid, stream_uid: _su, stream_status: _ss, ...rest }) => ({
          ...rest,
          proyecto_id: newId,
        }))
      );
    }

    return NextResponse.json(newProject, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al clonar" },
      { status: 500 }
    );
  }
}
