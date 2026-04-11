import { pick } from "@/lib/api-utils";
import { logActivity } from "@/lib/activity-logger";
import { getAuthContext, requirePermission } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const denied = requirePermission(auth, "content.write");
    if (denied) return denied;

    const proyectoId = request.nextUrl.searchParams.get("proyecto_id");
    if (!proyectoId) {
      return NextResponse.json(
        { error: "proyecto_id es requerido" },
        { status: 400 }
      );
    }

    const { data, error } = await auth.supabase
      .from("torres")
      .select("*")
      .eq("proyecto_id", proyectoId)
      .order("orden", { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
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

    const { data, error } = await auth.supabase
      .from("torres")
      .insert(pick(body, ["proyecto_id", "nombre", "tipo", "num_pisos", "pisos_sotano", "pisos_planta_baja", "pisos_podio", "pisos_residenciales", "pisos_rooftop", "descripcion", "amenidades", "amenidades_data", "caracteristicas", "imagen_portada", "logo_url", "prefijo", "orden"]))
      .select()
      .single();

    if (error) throw error;

    logActivity({
      userId: auth.user.id,
      userEmail: auth.user.email!,
      userRole: auth.role,
      proyectoId: data.proyecto_id,
      actionType: "torre.create",
      actionCategory: "content",
      metadata: { nombre: data.nombre },
      entityType: "torre",
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
