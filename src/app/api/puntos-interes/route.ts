import { pick } from "@/lib/api-utils";
import { getAuthContext, requirePermission } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const denied = requirePermission(auth, "content.write");
    if (denied) return denied;

    const body = await request.json();
    if (!body.proyecto_id || !body.nombre || !body.categoria || body.lat == null || body.lng == null) {
      return NextResponse.json(
        { error: "proyecto_id, nombre, categoria, lat y lng son requeridos" },
        { status: 400 }
      );
    }

    const { data, error } = await auth.supabase
      .from("puntos_interes")
      .insert(pick(body, ["proyecto_id", "nombre", "descripcion", "categoria", "imagen_url", "ciudad", "lat", "lng", "distancia_km", "tiempo_minutos", "orden"]))
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
