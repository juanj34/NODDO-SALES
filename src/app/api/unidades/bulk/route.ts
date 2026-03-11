import { getAuthContext } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin") return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    const { unidades, proyecto_id } = await request.json();
    if (!proyecto_id || !Array.isArray(unidades) || unidades.length === 0) {
      return NextResponse.json(
        { error: "proyecto_id y unidades[] son requeridos" },
        { status: 400 }
      );
    }

    const rows = unidades.map(
      (u: Record<string, unknown>, i: number) => ({
        ...u,
        proyecto_id,
        orden: u.orden ?? i,
      })
    );

    const { data, error } = await auth.supabase
      .from("unidades")
      .insert(rows)
      .select();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
