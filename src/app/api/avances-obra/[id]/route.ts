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
      .from("avances_obra")
      .update(pick(body, ["titulo", "fecha", "descripcion", "video_url", "imagen_url", "estado", "orden"]))
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (data.proyecto_id) {
      const { data: proj } = await auth.supabase.from("proyectos").select("nombre").eq("id", data.proyecto_id).single();
      logActivity({
        userId: auth.user.id, userEmail: auth.user.email!, userRole: auth.role,
        proyectoId: data.proyecto_id, proyectoNombre: proj?.nombre,
        actionType: "avance.update", actionCategory: "content",
        entityType: "avance", entityId: id,
        metadata: { titulo: data.titulo },
      });
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
    if (!auth)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const denied = requirePermission(auth, "content.write");
    if (denied) return denied;

    // Fetch before delete for logging
    const { data: avance } = await auth.supabase.from("avances_obra").select("proyecto_id, titulo").eq("id", id).single();

    const { error } = await auth.supabase
      .from("avances_obra")
      .delete()
      .eq("id", id);

    if (error) throw error;

    if (avance) {
      const { data: proj } = await auth.supabase.from("proyectos").select("nombre").eq("id", avance.proyecto_id).single();
      logActivity({
        userId: auth.user.id, userEmail: auth.user.email!, userRole: auth.role,
        proyectoId: avance.proyecto_id, proyectoNombre: proj?.nombre,
        actionType: "avance.delete", actionCategory: "content",
        entityType: "avance", entityId: id,
        metadata: { titulo: avance.titulo },
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
