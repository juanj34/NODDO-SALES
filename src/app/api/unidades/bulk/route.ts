import { pick } from "@/lib/api-utils";
import { getAuthContext } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin") return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    const { unidades, proyecto_id } = await request.json();
    if (!proyecto_id || !Array.isArray(unidades) || unidades.length === 0) {
      return NextResponse.json(
        { error: "proyecto_id y unidades[] son requeridos" },
        { status: 400 }
      );
    }

    // Verify project ownership
    const { data: project } = await auth.supabase
      .from("proyectos")
      .select("id")
      .eq("id", proyecto_id)
      .eq("user_id", auth.adminUserId)
      .maybeSingle();
    if (!project) {
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    }

    const rows = unidades.map(
      (u: Record<string, unknown>, i: number) => ({
        ...pick(u, ["tipologia_id", "identificador", "piso", "area_m2", "area_construida", "area_privada", "area_lote", "precio", "estado", "habitaciones", "banos", "orientacion", "vista", "notas", "plano_url", "fachada_id", "fachada_x", "fachada_y", "planta_id", "planta_x", "planta_y", "torre_id", "lote", "etapa_nombre", "parqueaderos", "depositos", "custom_fields"]),
        proyecto_id,
        orden: u.orden ?? i,
      })
    );

    const { data, error } = await auth.supabase
      .from("unidades")
      .insert(rows)
      .select();

    if (error) throw error;

    // Insert junction rows for multi-tipología if provided
    const junctionRows: { proyecto_id: string; unidad_id: string; tipologia_id: string }[] = [];
    unidades.forEach((u: Record<string, unknown>, i: number) => {
      const availIds = u.available_tipologia_ids;
      if (Array.isArray(availIds) && data[i]) {
        for (const tid of availIds) {
          junctionRows.push({ proyecto_id, unidad_id: data[i].id, tipologia_id: tid as string });
        }
      }
    });
    if (junctionRows.length > 0) {
      await auth.supabase.from("unidad_tipologias").insert(junctionRows);
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin") return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    const { ids, proyecto_id } = await request.json();
    if (!proyecto_id || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "proyecto_id e ids[] son requeridos" },
        { status: 400 }
      );
    }

    // Verify project ownership
    const { data: project } = await auth.supabase
      .from("proyectos")
      .select("id")
      .eq("id", proyecto_id)
      .eq("user_id", auth.adminUserId)
      .maybeSingle();
    if (!project) {
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    }

    // Delete all units belonging to this project with matching ids
    const { error } = await auth.supabase
      .from("unidades")
      .delete()
      .in("id", ids)
      .eq("proyecto_id", proyecto_id);

    if (error) throw error;

    return NextResponse.json({ success: true, deleted: ids.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
