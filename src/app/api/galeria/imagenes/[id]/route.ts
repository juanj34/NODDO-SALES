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
    const updates: Record<string, unknown> = {};
    if (body.alt_text !== undefined) updates.alt_text = body.alt_text;
    if (body.orden !== undefined) updates.orden = body.orden;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { data, error } = await auth.supabase
      .from("galeria_imagenes")
      .update(updates)
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

    // Fetch image info before deleting for the log
    const { data: img } = await auth.supabase
      .from("galeria_imagenes")
      .select("categoria_id")
      .eq("id", id)
      .single();

    const { error } = await auth.supabase
      .from("galeria_imagenes")
      .delete()
      .eq("id", id);

    if (error) throw error;

    if (img) {
      const { data: cat } = await auth.supabase.from("galeria_categorias").select("proyecto_id").eq("id", img.categoria_id).single();
      if (cat) {
        const { data: proj } = await auth.supabase.from("proyectos").select("nombre").eq("id", cat.proyecto_id).single();
        logActivity({
          userId: auth.user.id, userEmail: auth.user.email!, userRole: auth.role,
          proyectoId: cat.proyecto_id, proyectoNombre: proj?.nombre,
          actionType: "gallery.image_delete", actionCategory: "gallery",
          entityType: "galeria_imagen", entityId: id,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
