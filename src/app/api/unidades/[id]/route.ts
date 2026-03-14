import { pick } from "@/lib/api-utils";
import { getAuthContext, getAccessibleProjectIds, verifyProjectOwnership } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

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

    const body = await request.json();

    // Lookup the unidad to get its proyecto_id for ownership check
    const { data: unidad } = await auth.supabase
      .from("unidades")
      .select("tipologia_id, tipologias(proyecto_id)")
      .eq("id", id)
      .maybeSingle();
    if (!unidad) {
      return NextResponse.json({ error: "Unidad no encontrada" }, { status: 404 });
    }
    const proyectoId = (unidad.tipologias as unknown as { proyecto_id: string })?.proyecto_id;

    // Collaborators can ONLY update estado
    if (auth.role === "colaborador") {
      const allowedKeys = ["estado"];
      const bodyKeys = Object.keys(body);
      if (bodyKeys.some((k) => !allowedKeys.includes(k))) {
        return NextResponse.json(
          { error: "Solo puedes actualizar el estado de la unidad" },
          { status: 403 }
        );
      }
      // Verify collaborator has access to this project
      const accessible = await getAccessibleProjectIds(auth);
      if (accessible && !accessible.includes(proyectoId)) {
        return NextResponse.json({ error: "Sin acceso a este proyecto" }, { status: 403 });
      }
    } else {
      // Admin: verify project ownership
      if (!(await verifyProjectOwnership(auth, proyectoId))) {
        return NextResponse.json({ error: "Sin acceso a este proyecto" }, { status: 403 });
      }
    }

    const { data, error } = await auth.supabase
      .from("unidades")
      .update(pick(body, ["tipologia_id", "identificador", "piso", "area_m2", "precio", "estado", "habitaciones", "banos", "orientacion", "vista", "notas", "fachada_id", "fachada_x", "fachada_y", "planta_id", "planta_x", "planta_y", "torre_id", "parqueaderos", "depositos", "orden"]))
      .eq("id", id)
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
      .from("unidades")
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
