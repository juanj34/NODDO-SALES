import { pick } from "@/lib/api-utils";
import { logActivity } from "@/lib/activity-logger";
import { getAuthContext, requirePermission } from "@/lib/auth-context";
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
    const { data, error } = await auth.supabase
      .from("recursos")
      .update(pick(body, ["nombre", "descripcion", "tipo", "url", "orden"]))
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
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

    // Fetch before delete for logging
    const { data: recurso } = await auth.supabase.from("recursos").select("proyecto_id, nombre").eq("id", id).single();

    const { error } = await auth.supabase
      .from("recursos")
      .delete()
      .eq("id", id);

    if (error) throw error;

    if (recurso) {
      const { data: proj } = await auth.supabase.from("proyectos").select("nombre").eq("id", recurso.proyecto_id).single();
      logActivity({
        userId: auth.user.id, userEmail: auth.user.email!, userRole: auth.role,
        proyectoId: recurso.proyecto_id, proyectoNombre: proj?.nombre,
        actionType: "recurso.delete", actionCategory: "content",
        entityType: "recurso", entityId: id,
        metadata: { nombre: recurso.nombre },
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
