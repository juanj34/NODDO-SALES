import { getAuthContext, requirePermission } from "@/lib/auth-context";
import { logActivity } from "@/lib/activity-logger";
import { NextRequest, NextResponse } from "next/server";

/**
 * PUT /api/leads/[id]/asignar
 * Assign a lead to an asesor (or unassign by setting asignado_a to null).
 * Requires leads.assign permission (director+).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const denied = requirePermission(auth, "leads.assign");
    if (denied) return denied;

    const body = await request.json();
    const { asignado_a } = body; // UUID string or null

    // Verify the lead belongs to one of admin's projects
    const { data: proyectos } = await auth.supabase
      .from("proyectos")
      .select("id")
      .eq("user_id", auth.adminUserId);

    if (!proyectos?.length) {
      return NextResponse.json({ error: "Sin proyectos" }, { status: 403 });
    }

    const projectIds = proyectos.map((p: { id: string }) => p.id);

    // If assigning, verify the target user is an active asesor/director under this admin
    if (asignado_a) {
      const { data: collab } = await auth.supabase
        .from("colaboradores")
        .select("id, email, nombre, rol")
        .eq("admin_user_id", auth.adminUserId)
        .eq("colaborador_user_id", asignado_a)
        .eq("estado", "activo")
        .maybeSingle();

      if (!collab) {
        return NextResponse.json(
          { error: "El usuario seleccionado no es un colaborador activo" },
          { status: 400 }
        );
      }
    }

    const { data, error } = await auth.supabase
      .from("leads")
      .update({ asignado_a: asignado_a || null })
      .eq("id", id)
      .in("proyecto_id", projectIds)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
    }

    // Log activity
    const { data: proj } = await auth.supabase
      .from("proyectos")
      .select("nombre")
      .eq("id", data.proyecto_id)
      .single();

    let assigneeName = "nadie";
    if (asignado_a) {
      const { data: collabInfo } = await auth.supabase
        .from("colaboradores")
        .select("nombre, email")
        .eq("colaborador_user_id", asignado_a)
        .eq("admin_user_id", auth.adminUserId)
        .maybeSingle();
      assigneeName = collabInfo?.nombre || collabInfo?.email || asignado_a;
    }

    logActivity({
      userId: auth.user.id,
      userEmail: auth.user.email!,
      userRole: auth.role,
      proyectoId: data.proyecto_id,
      proyectoNombre: proj?.nombre,
      actionType: "lead.assign",
      actionCategory: "lead",
      metadata: {
        nombre: data.nombre,
        email: data.email,
        asignado_a: asignado_a || null,
        asignado_nombre: assigneeName,
      },
      entityType: "lead",
      entityId: id,
    });

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
