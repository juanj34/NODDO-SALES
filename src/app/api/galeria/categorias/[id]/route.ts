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
    const allowed = ["nombre", "slug", "orden", "torre_id"];
    const updateData: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updateData[key] = body[key];
    }

    const { data, error } = await auth.supabase
      .from("galeria_categorias")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Log activity (fire-and-forget)
    if (data) {
      const { data: proj } = await auth.supabase
        .from("proyectos")
        .select("nombre")
        .eq("id", data.proyecto_id)
        .single();

      logActivity({
        userId: auth.user.id,
        userEmail: auth.user.email!,
        userRole: auth.role,
        proyectoId: data.proyecto_id,
        proyectoNombre: proj?.nombre ?? null,
        actionType: "gallery.category_update",
        actionCategory: "gallery",
        metadata: { nombre: data.nombre },
        entityType: "galeria_categoria",
        entityId: id,
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

    // Fetch category info before deletion for logging
    const { data: catData } = await auth.supabase
      .from("galeria_categorias")
      .select("nombre, proyecto_id")
      .eq("id", id)
      .single();

    const { error } = await auth.supabase
      .from("galeria_categorias")
      .delete()
      .eq("id", id);

    if (error) throw error;

    // Log activity (fire-and-forget)
    if (catData) {
      const { data: proj } = await auth.supabase
        .from("proyectos")
        .select("nombre")
        .eq("id", catData.proyecto_id)
        .single();

      logActivity({
        userId: auth.user.id,
        userEmail: auth.user.email!,
        userRole: auth.role,
        proyectoId: catData.proyecto_id,
        proyectoNombre: proj?.nombre ?? null,
        actionType: "gallery.category_delete",
        actionCategory: "gallery",
        metadata: { nombre: catData.nombre },
        entityType: "galeria_categoria",
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
