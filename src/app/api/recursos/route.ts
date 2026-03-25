import { pick } from "@/lib/api-utils";
import { getAuthContext, requirePermission } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const denied = requirePermission(auth, "content.write");
    if (denied) return denied;

    const body = await request.json();
    if (!body.proyecto_id || !body.nombre || !body.url) {
      return NextResponse.json(
        { error: "proyecto_id, nombre y url son requeridos" },
        { status: 400 }
      );
    }

    const { data, error } = await auth.supabase
      .from("recursos")
      .insert(pick(body, ["proyecto_id", "nombre", "descripcion", "tipo", "url", "orden"]))
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
