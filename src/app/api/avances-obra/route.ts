import { pick } from "@/lib/api-utils";
import { logActivity } from "@/lib/activity-logger";
import { getAuthContext, requirePermission } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const denied = requirePermission(auth, "content.write");
    if (denied) return denied;

    const body = await request.json();
    if (!body.proyecto_id || !body.titulo || !body.fecha) {
      return NextResponse.json(
        { error: "proyecto_id, titulo y fecha son requeridos" },
        { status: 400 }
      );
    }

    const { data, error } = await auth.supabase
      .from("avances_obra")
      .insert(pick(body, ["proyecto_id", "titulo", "fecha", "descripcion", "video_url", "imagen_url", "estado", "orden"]))
      .select()
      .single();

    if (error) throw error;

    const { data: proj } = await auth.supabase.from("proyectos").select("nombre").eq("id", body.proyecto_id).single();
    logActivity({
      userId: auth.user.id, userEmail: auth.user.email!, userRole: auth.role,
      proyectoId: body.proyecto_id, proyectoNombre: proj?.nombre,
      actionType: "avance.create", actionCategory: "content",
      entityType: "avance", entityId: data.id,
      metadata: { titulo: data.titulo },
    });

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
