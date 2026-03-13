import { pick } from "@/lib/api-utils";
import { getAuthContext } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin")
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    const body = await request.json();
    if (!body.proyecto_id || !body.url) {
      return NextResponse.json(
        { error: "proyecto_id y url son requeridos" },
        { status: 400 }
      );
    }

    const { data, error } = await auth.supabase
      .from("videos")
      .insert(pick(body, ["proyecto_id", "titulo", "url", "thumbnail_url", "orden"]))
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
