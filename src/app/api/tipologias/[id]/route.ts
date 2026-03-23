import { pick } from "@/lib/api-utils";
import { getAuthContext } from "@/lib/auth-context";
import { deleteTourFiles } from "@/lib/r2";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin")
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    const body = await request.json();

    // If precio_desde is being updated, fetch current price first for history
    let precioAnterior: number | null = null;
    if ("precio_desde" in body && body.precio_desde !== undefined) {
      const { data: currentTipo } = await auth.supabase
        .from("tipologias")
        .select("precio_desde")
        .eq("id", id)
        .single();

      if (currentTipo) {
        precioAnterior = currentTipo.precio_desde;
      }
    }

    // Build update payload
    const updateData = pick(body, ["nombre", "descripcion", "area_m2", "area_construida", "area_privada", "area_lote", "habitaciones", "banos", "precio_desde", "plano_url", "renders", "caracteristicas", "parqueaderos", "depositos", "area_balcon", "hotspots", "ubicacion_plano_url", "torre_ids", "orden", "tipo_tipologia", "pisos", "video_id", "tour_360_url", "amenidades_data", "tiene_jacuzzi", "tiene_piscina", "tiene_bbq", "tiene_terraza", "tiene_jardin", "tiene_cuarto_servicio", "tiene_estudio", "tiene_chimenea", "tiene_doble_altura", "tiene_rooftop"]);

    // If precio_desde is being updated, add audit fields
    if ("precio_desde" in body && body.precio_desde !== undefined) {
      updateData.precio_actualizado_en = new Date().toISOString();
      updateData.precio_actualizado_por = auth.user.email || auth.user.id;
    }

    const { data, error } = await auth.supabase
      .from("tipologias")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // If price changed, save to history
    if ("precio_desde" in body && body.precio_desde !== undefined && body.precio_desde !== precioAnterior) {
      await auth.supabase
        .from("tipologia_precio_historial")
        .insert({
          tipologia_id: id,
          precio_anterior: precioAnterior,
          precio_nuevo: body.precio_desde,
          changed_by: auth.user.email || auth.user.id,
        });
    }

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
    if (!auth)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin")
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    // Block deletion if tipología has vendida units
    const { count: vendidaCount } = await auth.supabase
      .from("unidades")
      .select("id", { count: "exact", head: true })
      .eq("tipologia_id", id)
      .eq("estado", "vendida");

    if (vendidaCount && vendidaCount > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar: ${vendidaCount} unidad(es) vendida(s) asignadas a esta tipología`, code: "TIPOLOGIA_HAS_VENDIDAS" },
        { status: 409 }
      );
    }

    // Clean up R2-hosted tour files if this tipología has one
    const r2PublicUrl = process.env.R2_PUBLIC_URL || "";
    const { data: tipoData } = await auth.supabase
      .from("tipologias")
      .select("tour_360_url, proyecto_id")
      .eq("id", id)
      .single();

    if (tipoData?.tour_360_url && r2PublicUrl && tipoData.tour_360_url.startsWith(r2PublicUrl)) {
      try {
        await deleteTourFiles(tipoData.proyecto_id, `tipologias/${id}`);
      } catch {
        // Non-blocking — proceed with deletion even if R2 cleanup fails
      }
    }

    const { error } = await auth.supabase
      .from("tipologias")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
