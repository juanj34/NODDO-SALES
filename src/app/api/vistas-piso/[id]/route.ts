import { pick } from "@/lib/api-utils";
import { getAuthContext, requirePermission } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

const VISTA_FIELDS = [
  "torre_id", "nombre", "descripcion", "orientacion",
  "piso_min", "piso_max", "tipologia_ids", "imagen_url", "thumbnail_url", "orden",
];

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const denied = requirePermission(auth, "content.write");
    if (denied) return denied;

    const body = await request.json();

    const { data, error } = await auth.supabase
      .from("vistas_piso")
      .update(pick(body, VISTA_FIELDS))
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Re-run auto-assignment for this vista:
    // 1. Clear all units currently assigned to this vista
    await auth.supabase
      .from("unidades")
      .update({ vista_piso_id: null })
      .eq("vista_piso_id", id);

    // 2. Re-assign matching units
    let assignedCount = 0;
    if (data.tipologia_ids?.length) {
      let updateQuery = auth.supabase
        .from("unidades")
        .update({ vista_piso_id: data.id })
        .eq("proyecto_id", data.proyecto_id)
        .in("tipologia_id", data.tipologia_ids)
        .is("vista_piso_id", null);

      if (data.torre_id) updateQuery = updateQuery.eq("torre_id", data.torre_id);
      if (data.piso_min !== null) updateQuery = updateQuery.gte("piso", data.piso_min);
      if (data.piso_max !== null) updateQuery = updateQuery.lte("piso", data.piso_max);

      const { data: updated } = await updateQuery.select("id");
      assignedCount = updated?.length ?? 0;
    }

    return NextResponse.json({ ...data, _assigned_count: assignedCount });
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
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const denied = requirePermission(auth, "content.write");
    if (denied) return denied;

    // ON DELETE SET NULL handles clearing unidades.vista_piso_id
    const { error } = await auth.supabase
      .from("vistas_piso")
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
