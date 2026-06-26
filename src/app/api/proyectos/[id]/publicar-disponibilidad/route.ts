import { getAuthContext } from "@/lib/auth-context";
import { revalidateProyecto } from "@/lib/supabase/cached-queries";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    // All roles (admin, director, asesor) can publish availability
    const isAdmin = auth.role === "admin" || auth.role === "administrador";

    // Verify project ownership (admin) or access (collaborator)
    const { data: proyecto, error: projErr } = await auth.supabase
      .from("proyectos")
      .select("id, user_id, slug, subdomain")
      .eq("id", id)
      .single();

    if (projErr || !proyecto) {
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    }

    if (isAdmin && proyecto.user_id !== auth.adminUserId) {
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    }

    // 1. Get the latest published version
    const { data: latestVersion, error: versionErr } = await auth.supabase
      .from("proyecto_versiones")
      .select("id, snapshot")
      .eq("proyecto_id", id)
      .order("version_number", { ascending: false })
      .limit(1)
      .single();

    if (versionErr || !latestVersion) {
      return NextResponse.json(
        { error: "No hay versión publicada. Publica el proyecto completo primero." },
        { status: 400 }
      );
    }

    // 2. Re-fetch ALL inventory entities the public availability table renders.
    // Refreshing only `unidades` desyncs the microsite from the live inventory:
    // a unit assigned a tipología (or multi-tipo link / complemento) that didn't
    // exist in the last full publish has no matching entry in the snapshot, so the
    // microsite can't resolve its type/price and shows "—". Mirror the entity set
    // (and queries) of the full publish, but leave gallery/copy/video/etc. snapshot
    // arrays untouched so unrelated draft edits are NOT published by this action.
    const [
      { data: currentUnidades, error: unidadesErr },
      { data: currentTipologias, error: tipologiasErr },
      { data: currentUnidadTipologias, error: unidadTipologiasErr },
      { data: currentComplementos, error: complementosErr },
    ] = await Promise.all([
      auth.supabase.from("unidades").select("*").eq("proyecto_id", id).order("orden"),
      auth.supabase.from("tipologias").select("*").eq("proyecto_id", id).order("orden"),
      auth.supabase.from("unidad_tipologias").select("*").eq("proyecto_id", id),
      auth.supabase.from("complementos").select("*").eq("proyecto_id", id).order("orden"),
    ]);

    const inventoryErr = unidadesErr || tipologiasErr || unidadTipologiasErr || complementosErr;
    if (inventoryErr) throw inventoryErr;

    // 3. Update only the inventory arrays in the snapshot
    const updatedSnapshot = {
      ...(latestVersion.snapshot as Record<string, unknown>),
      unidades: currentUnidades || [],
      tipologias: currentTipologias || [],
      unidad_tipologias: currentUnidadTipologias || [],
      complementos: currentComplementos || [],
    };

    const { error: updateErr } = await auth.supabase
      .from("proyecto_versiones")
      .update({ snapshot: updatedSnapshot })
      .eq("id", latestVersion.id);

    if (updateErr) throw updateErr;

    // Snapshot changed -> invalidate the public microsite cache (slug + subdomain),
    // mirroring publicar/despublicar. Without this, sold/reserved units keep showing
    // as available on the public site for up to the 1h unstable_cache TTL (P0-10).
    if (proyecto.slug) await revalidateProyecto(proyecto.slug);
    if (proyecto.subdomain && proyecto.subdomain !== proyecto.slug) {
      await revalidateProyecto(proyecto.subdomain);
    }

    return NextResponse.json({
      updated: true,
      unidades_count: (currentUnidades || []).length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al publicar disponibilidad" },
      { status: 500 }
    );
  }
}
