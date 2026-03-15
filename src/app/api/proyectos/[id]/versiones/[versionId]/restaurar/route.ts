import { getAuthContext } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const { id, versionId } = await params;
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin") return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    // Verify ownership
    const { data: proyecto } = await auth.supabase
      .from("proyectos")
      .select("id")
      .eq("id", id)
      .eq("user_id", auth.adminUserId)
      .single();

    if (!proyecto) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    // Fetch the snapshot
    const { data: version, error: vErr } = await auth.supabase
      .from("proyecto_versiones")
      .select("snapshot")
      .eq("id", versionId)
      .eq("proyecto_id", id)
      .single();

    if (vErr || !version) {
      return NextResponse.json(
        { error: "Versión no encontrada" },
        { status: 404 }
      );
    }

    const snap = version.snapshot as {
      proyecto: Record<string, unknown>;
      tipologias: Record<string, unknown>[];
      galeria_categorias: (Record<string, unknown> & { imagenes?: Record<string, unknown>[] })[];
      videos: Record<string, unknown>[];
      puntos_interes: Record<string, unknown>[];
      unidades: Record<string, unknown>[];
      recursos: Record<string, unknown>[];
      fachadas: Record<string, unknown>[];
      torres: Record<string, unknown>[];
      planos_interactivos: Record<string, unknown>[];
      plano_puntos: Record<string, unknown>[];
      avances_obra: Record<string, unknown>[];
    };

    // --- Delete current child data (order matters for FK) ---

    // Get current category IDs for image deletion
    const { data: currentCats } = await auth.supabase
      .from("galeria_categorias")
      .select("id")
      .eq("proyecto_id", id);
    const currentCatIds = (currentCats || []).map((c: { id: string }) => c.id);

    // Delete in FK-safe order
    // plano_puntos refs planos_interactivos; unidades/fachadas ref torres
    const { data: currentPlanos } = await auth.supabase
      .from("planos_interactivos")
      .select("id")
      .eq("proyecto_id", id);
    const currentPlanoIds = (currentPlanos || []).map((p: { id: string }) => p.id);
    if (currentPlanoIds.length > 0) {
      await auth.supabase.from("plano_puntos").delete().in("plano_id", currentPlanoIds);
    }
    await auth.supabase.from("planos_interactivos").delete().eq("proyecto_id", id);
    await auth.supabase.from("unidades").delete().eq("proyecto_id", id);
    await auth.supabase.from("fachadas").delete().eq("proyecto_id", id);
    await auth.supabase.from("torres").delete().eq("proyecto_id", id);
    if (currentCatIds.length > 0) {
      await auth.supabase.from("galeria_imagenes").delete().in("categoria_id", currentCatIds);
    }
    await auth.supabase.from("galeria_categorias").delete().eq("proyecto_id", id);
    await auth.supabase.from("tipologias").delete().eq("proyecto_id", id);
    await auth.supabase.from("videos").delete().eq("proyecto_id", id);
    await auth.supabase.from("puntos_interes").delete().eq("proyecto_id", id);
    await auth.supabase.from("recursos").delete().eq("proyecto_id", id);
    await auth.supabase.from("avances_obra").delete().eq("proyecto_id", id);

    // --- Insert from snapshot ---

    if (snap.tipologias?.length) {
      const { error } = await auth.supabase.from("tipologias").insert(snap.tipologias);
      if (error) throw new Error(`Restore tipologias: ${error.message}`);
    }

    // Torres before fachadas/unidades (they reference torre_id)
    if (snap.torres?.length) {
      const { error } = await auth.supabase.from("torres").insert(snap.torres);
      if (error) throw new Error(`Restore torres: ${error.message}`);
    }

    if (snap.fachadas?.length) {
      const { error } = await auth.supabase.from("fachadas").insert(snap.fachadas);
      if (error) throw new Error(`Restore fachadas: ${error.message}`);
    }

    // Gallery: categories first, then images
    if (snap.galeria_categorias?.length) {
      const catsOnly = snap.galeria_categorias.map(({ imagenes: _imgs, ...cat }) => cat);
      const { error } = await auth.supabase.from("galeria_categorias").insert(catsOnly);
      if (error) throw new Error(`Restore galeria_categorias: ${error.message}`);

      const allImages = snap.galeria_categorias.flatMap((cat) => cat.imagenes || []);
      if (allImages.length) {
        const { error: imgErr } = await auth.supabase.from("galeria_imagenes").insert(allImages);
        if (imgErr) throw new Error(`Restore galeria_imagenes: ${imgErr.message}`);
      }
    }

    if (snap.unidades?.length) {
      const { error } = await auth.supabase.from("unidades").insert(snap.unidades);
      if (error) throw new Error(`Restore unidades: ${error.message}`);
    }

    if (snap.videos?.length) {
      const { error } = await auth.supabase.from("videos").insert(snap.videos);
      if (error) throw new Error(`Restore videos: ${error.message}`);
    }

    if (snap.puntos_interes?.length) {
      const { error } = await auth.supabase.from("puntos_interes").insert(snap.puntos_interes);
      if (error) throw new Error(`Restore puntos_interes: ${error.message}`);
    }

    if (snap.recursos?.length) {
      const { error } = await auth.supabase.from("recursos").insert(snap.recursos);
      if (error) throw new Error(`Restore recursos: ${error.message}`);
    }

    // Planos interactivos, then plano_puntos (plano_puntos references plano_id)
    if (snap.planos_interactivos?.length) {
      const { error } = await auth.supabase.from("planos_interactivos").insert(snap.planos_interactivos);
      if (error) throw new Error(`Restore planos_interactivos: ${error.message}`);
    }

    if (snap.plano_puntos?.length) {
      const { error } = await auth.supabase.from("plano_puntos").insert(snap.plano_puntos);
      if (error) throw new Error(`Restore plano_puntos: ${error.message}`);
    }

    if (snap.avances_obra?.length) {
      const { error } = await auth.supabase.from("avances_obra").insert(snap.avances_obra);
      if (error) throw new Error(`Restore avances_obra: ${error.message}`);
    }

    // Update project fields from snapshot (exclude id, user_id, created_at)
    const { id: _id, user_id: _uid, created_at: _ca, ...projectFields } = snap.proyecto;
    const { error: updateErr } = await auth.supabase
      .from("proyectos")
      .update({ ...projectFields, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", auth.adminUserId);

    if (updateErr) throw updateErr;

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al restaurar" },
      { status: 500 }
    );
  }
}
