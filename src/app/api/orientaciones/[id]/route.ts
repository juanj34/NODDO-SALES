import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth-context";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { user } = auth;

  const supabase = await createClient();
  const body = await request.json();
  const { nombre, orden } = body;

  // Verify user owns this orientacion
  const { data: orientacion, error: fetchError } = await supabase
    .from("orientaciones")
    .select("proyecto_id")
    .eq("id", id)
    .single();

  if (fetchError || !orientacion) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: proyecto } = await supabase
    .from("proyectos")
    .select("user_id")
    .eq("id", orientacion.proyecto_id)
    .single();

  if (!proyecto || proyecto.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updates: Record<string, unknown> = {};
  if (nombre !== undefined) updates.nombre = nombre;
  if (orden !== undefined) updates.orden = orden;

  const { data, error } = await supabase
    .from("orientaciones")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { user } = auth;

  const supabase = await createClient();

  // Verify user owns this orientacion
  const { data: orientacion, error: fetchError } = await supabase
    .from("orientaciones")
    .select("proyecto_id")
    .eq("id", id)
    .single();

  if (fetchError || !orientacion) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: proyecto } = await supabase
    .from("proyectos")
    .select("user_id")
    .eq("id", orientacion.proyecto_id)
    .single();

  if (!proyecto || proyecto.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("orientaciones")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
