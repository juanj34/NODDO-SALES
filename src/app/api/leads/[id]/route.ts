import { getAuthContext } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

const VALID_STATUSES = ["nuevo", "contactado", "calificado", "cerrado"];

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Status inválido. Opciones: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    // Verify the lead belongs to one of the user's projects
    const { data: proyectos } = await auth.supabase
      .from("proyectos")
      .select("id")
      .eq("user_id", auth.adminUserId);

    if (!proyectos?.length) {
      return NextResponse.json({ error: "Sin proyectos" }, { status: 403 });
    }

    const projectIds = proyectos.map((p) => p.id);

    const { data, error } = await auth.supabase
      .from("leads")
      .update({ status })
      .eq("id", id)
      .in("proyecto_id", projectIds)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
