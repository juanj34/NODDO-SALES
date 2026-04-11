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
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const denied = requirePermission(auth, "content.write");
    if (denied) return denied;

    const body = await request.json();
    const { data, error } = await auth.supabase
      .from("puntos_interes")
      .update(pick(body, ["nombre", "descripcion", "categoria", "imagen_url", "ciudad", "lat", "lng", "distancia_km", "tiempo_minutos", "orden"]))
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
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const denied = requirePermission(auth, "content.write");
    if (denied) return denied;

    // Fetch before delete for logging
    const { data: poi } = await auth.supabase.from("puntos_interes").select("proyecto_id, nombre").eq("id", id).single();

    const { error } = await auth.supabase
      .from("puntos_interes")
      .delete()
      .eq("id", id);

    if (error) throw error;

    if (poi) {
      const { data: proj } = await auth.supabase.from("proyectos").select("nombre").eq("id", poi.proyecto_id).single();
      logActivity({
        userId: auth.user.id, userEmail: auth.user.email!, userRole: auth.role,
        proyectoId: poi.proyecto_id, proyectoNombre: proj?.nombre,
        actionType: "poi.delete", actionCategory: "content",
        entityType: "punto_interes", entityId: id,
        metadata: { nombre: poi.nombre },
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
