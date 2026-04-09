import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth-context";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const proyectoId = searchParams.get("proyecto_id");

  if (!proyectoId) {
    return NextResponse.json(
      { error: "proyecto_id is required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("vistas")
    .select("*")
    .eq("proyecto_id", proyectoId)
    .order("orden");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const { user } = await getAuthContext();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const body = await request.json();
  const { proyecto_id, nombre } = body;

  if (!proyecto_id || !nombre) {
    return NextResponse.json(
      { error: "proyecto_id and nombre are required" },
      { status: 400 }
    );
  }

  // Verify user owns the project
  const { data: proyecto, error: proyectoError } = await supabase
    .from("proyectos")
    .select("user_id")
    .eq("id", proyecto_id)
    .single();

  if (proyectoError || !proyecto || proyecto.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get max orden
  const { data: maxOrden } = await supabase
    .from("vistas")
    .select("orden")
    .eq("proyecto_id", proyecto_id)
    .order("orden", { ascending: false })
    .limit(1);

  const orden = (maxOrden?.[0]?.orden ?? -1) + 1;

  const { data, error } = await supabase
    .from("vistas")
    .insert([{ proyecto_id, nombre, orden }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
