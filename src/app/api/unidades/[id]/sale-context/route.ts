import { getAuthContext, getAccessibleProjectIds, verifyProjectOwnership } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Asesores don't get sale context (they can only change estado)
    if (auth.role === "asesor") {
      return NextResponse.json({ leads: [], cotizaciones: [] });
    }

    // Get the unit to find its proyecto_id
    const { data: unit } = await auth.supabase
      .from("unidades")
      .select("proyecto_id")
      .eq("id", id)
      .maybeSingle();

    if (!unit) {
      return NextResponse.json({ error: "Unidad no encontrada" }, { status: 404 });
    }

    if (!(await verifyProjectOwnership(auth, unit.proyecto_id))) {
      return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
    }

    const [{ data: leads }, { data: cotizaciones }] = await Promise.all([
      auth.supabase
        .from("leads")
        .select("id, nombre, email, telefono, status")
        .eq("proyecto_id", unit.proyecto_id)
        .order("created_at", { ascending: false })
        .limit(100),
      auth.supabase
        .from("cotizaciones")
        .select("id, nombre, email, resultado, created_at, pdf_url")
        .eq("unidad_id", id)
        .order("created_at", { ascending: false }),
    ]);

    return NextResponse.json({
      leads: leads ?? [],
      cotizaciones: cotizaciones ?? [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
