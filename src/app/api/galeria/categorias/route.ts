import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await request.json();
    if (!body.proyecto_id || !body.nombre || !body.slug) {
      return NextResponse.json(
        { error: "proyecto_id, nombre y slug son requeridos" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("galeria_categorias")
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
