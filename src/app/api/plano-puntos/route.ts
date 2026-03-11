import { getAuthContext } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin") return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    const planoId = request.nextUrl.searchParams.get("plano_id");
    if (!planoId) {
      return NextResponse.json(
        { error: "plano_id es requerido" },
        { status: 400 }
      );
    }

    const { data, error } = await auth.supabase
      .from("plano_puntos")
      .select("*")
      .eq("plano_id", planoId)
      .order("orden", { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
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
    if (auth.role !== "admin") return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    const body = await request.json();
    if (!body.plano_id || !body.titulo || body.x == null || body.y == null) {
      return NextResponse.json(
        { error: "plano_id, titulo, x e y son requeridos" },
        { status: 400 }
      );
    }

    const insertData: Record<string, unknown> = {
      plano_id: body.plano_id,
      titulo: body.titulo,
      x: body.x,
      y: body.y,
    };
    const optionalFields = ["descripcion", "imagen_url", "render_url", "fachada_id", "torre_id", "orden"];
    for (const field of optionalFields) {
      if (body[field] !== undefined) insertData[field] = body[field];
    }

    const { data, error } = await auth.supabase
      .from("plano_puntos")
      .insert(insertData)
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
