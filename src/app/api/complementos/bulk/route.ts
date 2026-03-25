import { pick } from "@/lib/api-utils";
import { getAuthContext, requirePermission } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

const COMPLEMENTO_FIELDS = [
  "proyecto_id", "torre_id", "unidad_id", "tipo", "subtipo",
  "identificador", "nivel", "area_m2", "precio", "estado", "notas", "orden",
];

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const denied = requirePermission(auth, "inventory.write");
    if (denied) return denied;

    const body = await request.json();
    const { proyecto_id, complementos } = body;

    if (!proyecto_id || !Array.isArray(complementos) || complementos.length === 0) {
      return NextResponse.json(
        { error: "proyecto_id y complementos[] son requeridos" },
        { status: 400 }
      );
    }

    const rows = complementos.map((c: Record<string, unknown>, i: number) => ({
      ...pick(c, COMPLEMENTO_FIELDS),
      proyecto_id,
      orden: c.orden ?? i,
    }));

    const { data, error } = await auth.supabase
      .from("complementos")
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
