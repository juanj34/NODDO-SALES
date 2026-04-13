import { getAuthContext, requirePermission } from "@/lib/auth-context";
import { logActivity } from "@/lib/activity-logger";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const denied = requirePermission(auth, "content.write");
    if (denied) return denied;

    const body = await request.json();
    const updateData: Record<string, unknown> = {};
    if (body.nombre !== undefined) updateData.nombre = body.nombre;
    if (body.orden !== undefined) updateData.orden = body.orden;

    const { data, error } = await auth.supabase
      .from("galeria_grupos")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    logActivity({
      userId: auth.user.id,
      userEmail: auth.user.email!,
      userRole: auth.role,
      proyectoId: data.proyecto_id,
      actionType: "gallery.grupo_update",
      actionCategory: "gallery",
      metadata: { nombre: data.nombre },
      entityType: "galeria_grupo",
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const denied = requirePermission(auth, "content.write");
    if (denied) return denied;

    const { data: grupo } = await auth.supabase
      .from("galeria_grupos")
      .select("nombre, proyecto_id")
      .eq("id", id)
      .single();

    const { error } = await auth.supabase
      .from("galeria_grupos")
      .delete()
      .eq("id", id);

    if (error) throw error;

    if (grupo) {
      logActivity({
        userId: auth.user.id,
        userEmail: auth.user.email!,
        userRole: auth.role,
        proyectoId: grupo.proyecto_id,
        actionType: "gallery.grupo_delete",
        actionCategory: "gallery",
        metadata: { nombre: grupo.nombre },
        entityType: "galeria_grupo",
        entityId: id,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
