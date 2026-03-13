import { pick } from "@/lib/api-utils";
import { getAuthContext } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin") return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    const body = await request.json();
    if (!body.proyecto_id || !body.identificador) {
      return NextResponse.json(
        { error: "proyecto_id e identificador son requeridos" },
        { status: 400 }
      );
    }

    const { data, error } = await auth.supabase
      .from("unidades")
      .insert(pick(body, ["proyecto_id", "tipologia_id", "identificador", "piso", "area_m2", "precio", "estado", "habitaciones", "banos", "orientacion", "vista", "notas", "fachada_id", "fachada_x", "fachada_y", "torre_id", "orden"]))
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
