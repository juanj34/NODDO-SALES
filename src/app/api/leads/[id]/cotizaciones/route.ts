import { getAuthContext } from "@/lib/auth-context";
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

    // Fetch the lead to get email and proyecto_id
    const { data: lead, error: leadError } = await auth.supabase
      .from("leads")
      .select("email, proyecto_id")
      .eq("id", id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
    }

    // Verify project ownership
    const { data: proyecto } = await auth.supabase
      .from("proyectos")
      .select("id")
      .eq("id", lead.proyecto_id)
      .eq("user_id", auth.adminUserId)
      .single();

    if (!proyecto) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Fetch cotizaciones matching email + proyecto_id
    const { data: cotizaciones, error } = await auth.supabase
      .from("cotizaciones")
      .select("id, unidad_snapshot, resultado, pdf_url, agente_nombre, created_at")
      .eq("email", lead.email)
      .eq("proyecto_id", lead.proyecto_id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(cotizaciones || []);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
