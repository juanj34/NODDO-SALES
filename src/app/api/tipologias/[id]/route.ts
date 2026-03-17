import { pick } from "@/lib/api-utils";
import { getAuthContext } from "@/lib/auth-context";
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
    const updateData = pick(body, ["nombre", "descripcion", "area_m2", "area_construida", "area_privada", "area_lote", "habitaciones", "banos", "precio_desde", "plano_url", "renders", "caracteristicas", "parqueaderos", "depositos", "area_balcon", "hotspots", "ubicacion_plano_url", "torre_ids", "orden", "tipo_tipologia", "pisos"]);

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
