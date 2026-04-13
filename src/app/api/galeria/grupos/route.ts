import { getAuthContext, requirePermission, verifyProjectOwnership } from "@/lib/auth-context";
import { logActivity } from "@/lib/activity-logger";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const proyectoId = request.nextUrl.searchParams.get("proyecto_id");
    if (!proyectoId)
      return NextResponse.json({ error: "proyecto_id requerido" }, { status: 400 });

    const { data, error } = await auth.supabase
      .from("galeria_grupos")
      .select("*")
      .eq("proyecto_id", proyectoId)
      .order("orden");

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const denied = requirePermission(auth, "content.write");
    if (denied) return denied;

    const body = await request.json();
    if (!body.proyecto_id || !body.nombre) {
      return NextResponse.json(
        { error: "proyecto_id y nombre son requeridos" },
        { status: 400 }
      );
    }

    if (!(await verifyProjectOwnership(auth, body.proyecto_id))) {
      return NextResponse.json({ error: "Sin acceso a este proyecto" }, { status: 403 });
    }

    const insertData: Record<string, unknown> = {
      proyecto_id: body.proyecto_id,
      nombre: body.nombre,
    };
    if (body.orden !== undefined) insertData.orden = body.orden;

    const { data, error } = await auth.supabase
      .from("galeria_grupos")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    logActivity({
      userId: auth.user.id,
      userEmail: auth.user.email!,
      userRole: auth.role,
      proyectoId: body.proyecto_id,
      actionType: "gallery.grupo_create",
      actionCategory: "gallery",
      metadata: { nombre: data.nombre },
      entityType: "galeria_grupo",
      entityId: data.id,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
