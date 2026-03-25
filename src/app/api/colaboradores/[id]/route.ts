import { getAuthContext } from "@/lib/auth-context";
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
    if (auth.role !== "admin") {
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
    }

    const body = await request.json();
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
      if (!["director", "asesor"].includes(body.rol)) {
        return NextResponse.json(
          { error: "Rol inválido" },
          { status: 400 }
        );
      }
      updateFields.rol = body.rol;
    }

    // Fetch current estado before update (for status change email)
    let previousEstado: string | null = null;
    if (body.estado !== undefined) {
      const { data: current } = await auth.supabase
        .from("colaboradores")
        .select("estado, email")
        .eq("id", id)
        .eq("admin_user_id", auth.user.id)
        .single();
      previousEstado = current?.estado ?? null;
    }

    const { data, error } = await auth.supabase
      .from("colaboradores")
      .update(updateFields)
      .eq("id", id)
      .eq("admin_user_id", auth.user.id)
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
    if (body.estado !== undefined && previousEstado && previousEstado !== body.estado && data.email) {
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
    if (auth.role !== "admin") {
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
    }

    const { error } = await auth.supabase
      .from("colaboradores")
      .delete()
      .eq("id", id)
      .eq("admin_user_id", auth.user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
