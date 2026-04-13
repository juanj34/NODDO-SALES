import { getAuthContext, requirePermission } from "@/lib/auth-context";
import { sendCollaboratorStatusChange } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const denied = requirePermission(auth, "team.manage");
    if (denied) return denied;

    const body = await request.json();

    // Fetch the target collaborator to enforce elevation rules
    const { data: target } = await auth.supabase
      .from("colaboradores")
      .select("id, rol, estado, email")
      .eq("id", id)
      .eq("admin_user_id", auth.adminUserId)
      .single();

    if (!target) {
      return NextResponse.json({ error: "Colaborador no encontrado" }, { status: 404 });
    }

    // Administrador cannot edit other administradores
    if (auth.role === "administrador" && target.rol === "administrador") {
      return NextResponse.json({ error: "Solo el propietario puede editar administradores" }, { status: 403 });
    }

    const updateFields: Record<string, string | null> = {};

    if (body.nombre !== undefined) updateFields.nombre = body.nombre;
    if (body.estado !== undefined) {
      if (!["activo", "suspendido"].includes(body.estado)) {
        return NextResponse.json(
          { error: "Estado inválido" },
          { status: 400 }
        );
      }
      updateFields.estado = body.estado;
    }
    if (body.rol !== undefined) {
      const allowedRoles: string[] = auth.role === "admin"
        ? ["administrador", "director", "asesor"]
        : ["director", "asesor"];
      if (!allowedRoles.includes(body.rol)) {
        return NextResponse.json(
          { error: "Rol inválido" },
          { status: 400 }
        );
      }
      updateFields.rol = body.rol;
    }

    // Fetch current estado before update (for status change email)
    const previousEstado = target.estado;

    const { data, error } = await auth.supabase
      .from("colaboradores")
      .update(updateFields)
      .eq("id", id)
      .eq("admin_user_id", auth.adminUserId)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        { error: "Colaborador no encontrado" },
        { status: 404 }
      );
    }

    // Send status change email if estado changed
    if (body.estado !== undefined && previousEstado !== body.estado && data.email) {
      const action = body.estado === "suspendido" ? "suspended" : "reactivated";
      sendCollaboratorStatusChange({ email: data.email, action }).catch((err) =>
        console.error("[collab] status email error:", err)
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const denied = requirePermission(auth, "team.manage");
    if (denied) return denied;

    // Administrador cannot delete other administradores
    if (auth.role === "administrador") {
      const { data: target } = await auth.supabase
        .from("colaboradores")
        .select("rol")
        .eq("id", id)
        .eq("admin_user_id", auth.adminUserId)
        .single();
      if (target?.rol === "administrador") {
        return NextResponse.json({ error: "Solo el propietario puede eliminar administradores" }, { status: 403 });
      }
    }

    const { error } = await auth.supabase
      .from("colaboradores")
      .delete()
      .eq("id", id)
      .eq("admin_user_id", auth.adminUserId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
