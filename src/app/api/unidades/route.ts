import { pick } from "@/lib/api-utils";
import { getAuthContext, getAccessibleProjectIds, requirePermission } from "@/lib/auth-context";
import { logActivity } from "@/lib/activity-logger";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const proyectoId = searchParams.get("proyecto_id");

    if (!proyectoId) {
      return NextResponse.json({ error: "proyecto_id es requerido" }, { status: 400 });
    }

    // Verify project access for collaborators
    const accessibleIds = await getAccessibleProjectIds(auth);
    if (accessibleIds && !accessibleIds.includes(proyectoId)) {
      return NextResponse.json({ error: "Sin acceso a este proyecto" }, { status: 403 });
    }

    const { data, error } = await auth.supabase
      .from("unidades")
      .select("*, tipologia:tipologias(nombre, area_m2, habitaciones, banos, parqueaderos, depositos, precio_desde, area_construida, area_privada, area_balcon, area_lote, tiene_jacuzzi, tiene_piscina, tiene_bbq, tiene_terraza, tiene_jardin, tiene_cuarto_servicio, tiene_estudio, tiene_chimenea, tiene_doble_altura, tiene_rooftop), torre:torres(nombre)")
      .eq("proyecto_id", proyectoId)
      .order("piso", { ascending: false })
      .order("identificador");

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
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const denied = requirePermission(auth, "inventory.write");
    if (denied) return denied;

    const body = await request.json();
    if (!body.proyecto_id || !body.identificador) {
      return NextResponse.json(
        { error: "proyecto_id e identificador son requeridos" },
        { status: 400 }
      );
    }

    // Check project tipologia_mode — in multiple mode, strip tipologia_id (junction table is source of truth)
    const { data: proyecto } = await auth.supabase
      .from("proyectos")
      .select("tipologia_mode")
      .eq("id", body.proyecto_id)
      .single();
    const isMultiTipo = proyecto?.tipologia_mode === "multiple";

    const insertPayload = pick(body, ["proyecto_id", "tipologia_id", "identificador", "piso", "area_m2", "area_construida", "area_privada", "area_lote", "precio", "estado", "habitaciones", "banos", "orientacion", "vista", "vista_piso_id", "notas", "plano_url", "fachada_id", "fachada_x", "fachada_y", "planta_id", "planta_x", "planta_y", "torre_id", "lote", "etapa_nombre", "parqueaderos", "depositos", "orden", "custom_fields"]);
    if (isMultiTipo) {
      delete insertPayload.tipologia_id;
    }

    const { data, error } = await auth.supabase
      .from("unidades")
      .insert(insertPayload)
      .select()
      .single();

    if (error) throw error;

    // Insert available tipologías (multi-tipología mode)
    if (Array.isArray(body.available_tipologia_ids) && body.available_tipologia_ids.length > 0) {
      const junctionRows = body.available_tipologia_ids.map((tid: string) => ({
        proyecto_id: body.proyecto_id,
        unidad_id: data.id,
        tipologia_id: tid,
      }));
      await auth.supabase.from("unidad_tipologias").insert(junctionRows);
    }

    // Log activity (fire-and-forget)
    const { data: proj } = await auth.supabase.from("proyectos").select("nombre").eq("id", body.proyecto_id).single();
    logActivity({
      userId: auth.user.id, userEmail: auth.user.email!, userRole: auth.role,
      proyectoId: body.proyecto_id, proyectoNombre: proj?.nombre,
      actionType: "unit.create", actionCategory: "unit",
      metadata: { identificador: data.identificador, precio: data.precio },
      entityType: "unidad", entityId: data.id,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
