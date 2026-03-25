import { getAuthContext, requirePermission } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const denied = requirePermission(auth, "inventory.write");
    if (denied) return denied;

    const body = await request.json();
    const { assignments } = body as {
      assignments: { complemento_id: string; unidad_id: string | null }[];
    };

    if (!Array.isArray(assignments) || assignments.length === 0) {
      return NextResponse.json(
        { error: "assignments[] es requerido" },
        { status: 400 }
      );
    }

    // Bulk update each complemento's unidad_id
    const results = await Promise.all(
      assignments.map(({ complemento_id, unidad_id }) =>
        auth.supabase
          .from("complementos")
          .update({ unidad_id })
          .eq("id", complemento_id)
      )
    );

    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      return NextResponse.json(
        { error: `${errors.length} asignaciones fallaron`, details: errors.map((e) => e.error?.message) },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, updated: assignments.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
