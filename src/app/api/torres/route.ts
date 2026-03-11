import { getAuthContext } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin")
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    const proyectoId = request.nextUrl.searchParams.get("proyecto_id");
    if (!proyectoId) {
      return NextResponse.json(
        { error: "proyecto_id es requerido" },
        { status: 400 }
      );
    }

    const { data, error } = await auth.supabase
      .from("torres")
      .select("*")
      .eq("proyecto_id", proyectoId)
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
    if (!auth)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin")
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    const body = await request.json();
    if (!body.proyecto_id || !body.nombre) {
      return NextResponse.json(
        { error: "proyecto_id y nombre son requeridos" },
        { status: 400 }
      );
    }

    const { data, error } = await auth.supabase
      .from("torres")
      .insert(body)
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
