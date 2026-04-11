import { pick } from "@/lib/api-utils";
import { getAuthContext, requirePermission } from "@/lib/auth-context";
import { logActivity } from "@/lib/activity-logger";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
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
    if (!body.torre_id) {
      return NextResponse.json(
        { error: "torre_id es requerido" },
        { status: 400 }
      );
    }

    // Fetch source tipología
    const { data: source, error: fetchError } = await auth.supabase
      .from("tipologias")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !source) {
      return NextResponse.json(
        { error: "Tipología no encontrada" },
        { status: 404 }
      );
    }

    const { data: cloned, error: insertError } = await auth.supabase
      .from("tipologias")
      .insert({
        ...pick(source as Record<string, unknown>, ["proyecto_id", "nombre", "descripcion", "area_m2", "habitaciones", "banos", "precio_desde", "plano_url", "renders", "caracteristicas", "parqueaderos", "depositos", "area_balcon", "hotspots", "ubicacion_plano_url", "orden"]),
        nombre: `${source.nombre} (copia)`,
        torre_ids: [body.torre_id],
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Log activity (fire-and-forget)
    if (cloned) {
      const { data: proj } = await auth.supabase
        .from("proyectos")
        .select("nombre")
        .eq("id", source.proyecto_id)
        .single();

      logActivity({
        userId: auth.user.id,
        userEmail: auth.user.email!,
        userRole: auth.role,
        proyectoId: source.proyecto_id,
        proyectoNombre: proj?.nombre ?? null,
        actionType: "tipologia.clone",
        actionCategory: "tipologia",
        metadata: { nombre: cloned.nombre },
        entityType: "tipologia",
        entityId: cloned.id,
      });
    }

    return NextResponse.json(cloned, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
