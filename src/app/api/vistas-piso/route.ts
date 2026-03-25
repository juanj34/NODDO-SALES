import { pick } from "@/lib/api-utils";
import { getAuthContext, getAccessibleProjectIds, requirePermission } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

const VISTA_FIELDS = [
  "proyecto_id", "torre_id", "nombre", "descripcion", "orientacion",
  "piso_min", "piso_max", "tipologia_ids", "imagen_url", "thumbnail_url", "orden",
];

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const proyectoId = searchParams.get("proyecto_id");

    if (!proyectoId) {
      return NextResponse.json({ error: "proyecto_id es requerido" }, { status: 400 });
    }

    const accessibleIds = await getAccessibleProjectIds(auth);
    if (accessibleIds && !accessibleIds.includes(proyectoId)) {
      return NextResponse.json({ error: "Sin acceso a este proyecto" }, { status: 403 });
    }

    const { data, error } = await auth.supabase
      .from("vistas_piso")
      .select("*")
      .eq("proyecto_id", proyectoId)
      .order("orden");

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const denied = requirePermission(auth, "content.write");
    if (denied) return denied;

    const body = await request.json();
    if (!body.proyecto_id || !body.nombre || !body.imagen_url) {
      return NextResponse.json(
        { error: "proyecto_id, nombre e imagen_url son requeridos" },
        { status: 400 }
      );
    }

    const { data, error } = await auth.supabase
      .from("vistas_piso")
      .insert(pick(body, VISTA_FIELDS))
      .select()
      .single();

    if (error) throw error;

    // Auto-assign to matching units
    let assignedCount = 0;
    if (data.tipologia_ids?.length) {
      // Build update query for matching unassigned units
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

    return NextResponse.json({ ...data, _assigned_count: assignedCount }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
