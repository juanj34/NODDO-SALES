import { getAuthContext } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin") return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    const { data, error } = await auth.supabase
      .from("colaborador_proyectos")
      .select("proyecto_id")
      .eq("colaborador_id", id);

    if (error) throw error;
    return NextResponse.json((data || []).map((r: { proyecto_id: string }) => r.proyecto_id));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin") return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    const body = await request.json();
    const proyectoIds: string[] = body.proyecto_ids || [];

    // Delete all existing assignments
    await auth.supabase
      .from("colaborador_proyectos")
      .delete()
      .eq("colaborador_id", id);

    // Insert new assignments (empty array = all projects, backward compat)
    if (proyectoIds.length > 0) {
      const rows = proyectoIds.map((pid) => ({
        colaborador_id: id,
        proyecto_id: pid,
      }));

      const { error } = await auth.supabase
        .from("colaborador_proyectos")
        .insert(rows);

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
