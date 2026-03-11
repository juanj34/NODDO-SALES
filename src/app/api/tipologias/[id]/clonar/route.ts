import { getAuthContext } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
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
    if (!body.torre_id) {
      return NextResponse.json(
        { error: "torre_id es requerido" },
        { status: 400 }
      );
    }

    // Fetch source tipología
    const { data: source, error: fetchError } = await auth.supabase
      .from("tipologias")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !source) {
      return NextResponse.json(
        { error: "Tipología no encontrada" },
        { status: 404 }
      );
    }

    // Clone: copy all fields except id and created_at
    const {
      id: _id,
      created_at: _created,
      ...fields
    } = source;

    const { data: cloned, error: insertError } = await auth.supabase
      .from("tipologias")
      .insert({
        ...fields,
        nombre: `${fields.nombre} (copia)`,
        torre_ids: [body.torre_id],
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return NextResponse.json(cloned, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
