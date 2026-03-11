import { getAuthContext } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin") return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    const proyectoId = request.nextUrl.searchParams.get("proyecto_id");
    if (!proyectoId) {
      return NextResponse.json(
        { error: "proyecto_id es requerido" },
        { status: 400 }
      );
    }

    let query = auth.supabase
      .from("planos_interactivos")
      .select("*")
      .eq("proyecto_id", proyectoId);

    const tipo = request.nextUrl.searchParams.get("tipo");
    if (tipo) {
      query = query.eq("tipo", tipo);
    }

    const { data, error } = await query.order("orden", { ascending: true });

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
    if (!body.proyecto_id || !body.nombre || !body.imagen_url || !body.tipo) {
      return NextResponse.json(
        { error: "proyecto_id, nombre, imagen_url y tipo son requeridos" },
        { status: 400 }
      );
    }

    // Whitelist fields to prevent unknown columns from causing errors
    const insertData: Record<string, unknown> = {
      proyecto_id: body.proyecto_id,
      nombre: body.nombre,
      imagen_url: body.imagen_url,
      tipo: body.tipo,
    };
    if (body.descripcion !== undefined) insertData.descripcion = body.descripcion;
    if (body.visible !== undefined) insertData.visible = body.visible;
    if (body.orden !== undefined) insertData.orden = body.orden;

    const { data, error } = await auth.supabase
      .from("planos_interactivos")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Supabase planos INSERT error:", JSON.stringify(error));
      return NextResponse.json(
        { error: `${error.message} [code: ${error.code}, details: ${error.details || "none"}, hint: ${error.hint || "none"}]` },
        { status: 500 }
      );
    }
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("Planos POST catch error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
