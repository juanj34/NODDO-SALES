import { pick } from "@/lib/api-utils";
import { getAuthContext, getAccessibleProjectIds, verifyProjectOwnership } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

const COMPLEMENTO_FIELDS = [
  "torre_id", "unidad_id", "tipo", "subtipo",
  "identificador", "nivel", "area_m2", "precio", "estado", "notas", "orden",
];

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await request.json();

    // Lookup complemento to get proyecto_id
    const { data: complemento } = await auth.supabase
      .from("complementos")
      .select("proyecto_id")
      .eq("id", id)
      .maybeSingle();

    if (!complemento) {
      return NextResponse.json({ error: "Complemento no encontrado" }, { status: 404 });
    }

    // Collaborators can ONLY update estado
    if (auth.role === "colaborador") {
      const bodyKeys = Object.keys(body);
      if (bodyKeys.some((k) => k !== "estado")) {
        return NextResponse.json(
          { error: "Solo puedes actualizar el estado" },
          { status: 403 }
        );
      }
      const accessible = await getAccessibleProjectIds(auth);
      if (accessible && !accessible.includes(complemento.proyecto_id)) {
        return NextResponse.json({ error: "Sin acceso a este proyecto" }, { status: 403 });
      }
    } else {
      if (!(await verifyProjectOwnership(auth, complemento.proyecto_id))) {
        return NextResponse.json({ error: "Sin acceso a este proyecto" }, { status: 403 });
      }
    }

    const { data, error } = await auth.supabase
      .from("complementos")
      .update(pick(body, COMPLEMENTO_FIELDS))
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
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin") return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    const { error } = await auth.supabase
      .from("complementos")
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
