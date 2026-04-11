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
      .from("fachadas")
      .update(pick(body, ["nombre", "imagen_url", "num_pisos", "descripcion", "amenidades", "imagen_portada", "torre_id", "tipo", "piso_numero", "planta_tipo_nombre", "puntos_vacios", "orden"]))
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    const { data: proj } = await auth.supabase.from("proyectos").select("nombre").eq("id", data.proyecto_id).single();
    logActivity({
      userId: auth.user.id, userEmail: auth.user.email!, userRole: auth.role,
      proyectoId: data.proyecto_id, proyectoNombre: proj?.nombre,
      actionType: "fachada.update", actionCategory: "content",
      entityType: "fachada", entityId: id,
      metadata: { nombre: data.nombre },
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

    // Fetch before delete for logging
    const { data: fachada } = await auth.supabase.from("fachadas").select("proyecto_id, nombre").eq("id", id).single();

    const { error } = await auth.supabase
      .from("fachadas")
      .delete()
      .eq("id", id);

    if (error) throw error;

    if (fachada) {
      const { data: proj } = await auth.supabase.from("proyectos").select("nombre").eq("id", fachada.proyecto_id).single();
      logActivity({
        userId: auth.user.id, userEmail: auth.user.email!, userRole: auth.role,
        proyectoId: fachada.proyecto_id, proyectoNombre: proj?.nombre,
        actionType: "fachada.delete", actionCategory: "content",
        entityType: "fachada", entityId: id,
        metadata: { nombre: fachada.nombre },
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
