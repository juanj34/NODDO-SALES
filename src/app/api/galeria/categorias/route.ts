import { getAuthContext, verifyProjectOwnership } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin")
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    const body = await request.json();
    if (!body.proyecto_id || !body.nombre || !body.slug) {
      return NextResponse.json(
        { error: "proyecto_id, nombre y slug son requeridos" },
        { status: 400 }
      );
    }

    if (!(await verifyProjectOwnership(auth, body.proyecto_id))) {
      return NextResponse.json({ error: "Sin acceso a este proyecto" }, { status: 403 });
    }

    const insertData: Record<string, unknown> = {
      proyecto_id: body.proyecto_id,
      nombre: body.nombre,
      slug: body.slug,
    };
    if (body.orden !== undefined) insertData.orden = body.orden;
    if (body.torre_id !== undefined) insertData.torre_id = body.torre_id;

    const { data, error } = await auth.supabase
      .from("galeria_categorias")
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
