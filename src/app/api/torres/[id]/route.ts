import { pick } from "@/lib/api-utils";
import { getAuthContext } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin")
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    const body = await request.json();

    const updateData = pick(body, ["nombre", "tipo", "num_pisos", "pisos_sotano", "pisos_planta_baja", "pisos_podio", "pisos_residenciales", "pisos_rooftop", "descripcion", "amenidades", "amenidades_data", "caracteristicas", "imagen_portada", "logo_url", "prefijo", "orden"]);

    // When switching to urbanismo, clear tower-specific composition fields
    if (updateData.tipo === "urbanismo") {
      updateData.pisos_sotano = null;
      updateData.pisos_planta_baja = null;
      updateData.pisos_podio = null;
      updateData.pisos_residenciales = null;
      updateData.pisos_rooftop = null;
    }

    const { data, error } = await auth.supabase
      .from("torres")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin")
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    const { error } = await auth.supabase
      .from("torres")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
