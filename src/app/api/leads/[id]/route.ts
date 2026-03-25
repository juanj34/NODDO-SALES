import { getAuthContext } from "@/lib/auth-context";
import { logActivity } from "@/lib/activity-logger";
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
    const { status, notas } = body;

    // At least one field must be provided
    if (!status && notas === undefined) {
      return NextResponse.json(
        { error: "Nada que actualizar" },
        { status: 400 }
      );
    }

    if (status && !VALID_STATUSES.includes(status)) {
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

    const projectIds = proyectos.map((p: { id: string }) => p.id);

    // Asesores can only update leads assigned to them
    if (auth.role === "asesor") {
      const { data: lead } = await auth.supabase
        .from("leads")
        .select("asignado_a")
        .eq("id", id)
        .in("proyecto_id", projectIds)
        .single();

      if (!lead) {
        return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
      }
      if (lead.asignado_a !== auth.user.id) {
        return NextResponse.json(
          { error: "Solo puedes actualizar leads asignados a ti" },
          { status: 403 }
        );
      }
    }

    // Build update payload — asesores can only change status
    const updatePayload: Record<string, unknown> = {};
    if (status) updatePayload.status = status;
    if (notas !== undefined && auth.role !== "asesor") {
      updatePayload.notas = notas;
    }

    const { data, error } = await auth.supabase
      .from("leads")
      .update(updatePayload)
      .eq("id", id)
      .in("proyecto_id", projectIds)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
    }

    // Fetch project name for the log
    const { data: proj } = await auth.supabase.from("proyectos").select("nombre").eq("id", data.proyecto_id).single();
    logActivity({
      userId: auth.user.id, userEmail: auth.user.email!, userRole: auth.role,
      proyectoId: data.proyecto_id, proyectoNombre: proj?.nombre,
      actionType: "lead.status_change", actionCategory: "lead",
      metadata: { nombre: data.nombre, statusNuevo: status },
      entityType: "lead", entityId: id,
    });

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
