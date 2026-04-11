import { pick } from "@/lib/api-utils";
import { getAuthContext, requirePermission, verifyProjectOwnership } from "@/lib/auth-context";
import { logActivity } from "@/lib/activity-logger";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const denied = requirePermission(auth, "content.write");
    if (denied) return denied;

    const body = await request.json();
    if (!body.categoria_id || !body.url) {
      return NextResponse.json(
        { error: "categoria_id y url son requeridos" },
        { status: 400 }
      );
    }

    // Verify ownership via categoria → proyecto
    const { data: cat } = await auth.supabase
      .from("galeria_categorias")
      .select("proyecto_id")
      .eq("id", body.categoria_id)
      .maybeSingle();
    if (!cat || !(await verifyProjectOwnership(auth, cat.proyecto_id))) {
      return NextResponse.json({ error: "Sin acceso a este proyecto" }, { status: 403 });
    }

    const { data, error } = await auth.supabase
      .from("galeria_imagenes")
      .insert(pick(body, ["categoria_id", "url", "thumbnail_url", "alt_text", "orden"]))
      .select()
      .single();

    if (error) throw error;

    // Fetch project name for activity log
    const { data: proj } = await auth.supabase.from("proyectos").select("nombre").eq("id", cat.proyecto_id).single();
    logActivity({
      userId: auth.user.id, userEmail: auth.user.email!, userRole: auth.role,
      proyectoId: cat.proyecto_id, proyectoNombre: proj?.nombre,
      actionType: "gallery.images_upload", actionCategory: "gallery",
      metadata: { count: 1 },
      entityType: "galeria_imagen", entityId: data.id,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
