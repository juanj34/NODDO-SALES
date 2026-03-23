import { pick } from "@/lib/api-utils";
import { getAuthContext, verifyProjectOwnership } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin")
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

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

    // Build insert payload
    const insertData = pick(body, ["proyecto_id", "nombre", "descripcion", "area_m2", "area_construida", "area_privada", "area_lote", "habitaciones", "banos", "precio_desde", "plano_url", "renders", "caracteristicas", "parqueaderos", "depositos", "area_balcon", "hotspots", "ubicacion_plano_url", "torre_ids", "orden", "tipo_tipologia", "pisos", "video_id", "tour_360_url", "amenidades_data", "tiene_jacuzzi", "tiene_piscina", "tiene_bbq", "tiene_terraza", "tiene_jardin", "tiene_cuarto_servicio", "tiene_estudio", "tiene_chimenea", "tiene_doble_altura", "tiene_rooftop"]);

    // If precio_desde is set on creation, add audit fields
    if (body.precio_desde !== undefined && body.precio_desde !== null) {
      insertData.precio_actualizado_en = new Date().toISOString();
      insertData.precio_actualizado_por = auth.user.email || auth.user.id;
    }

    const { data, error } = await auth.supabase
      .from("tipologias")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    // If created with a price, save initial entry to history
    if (data && body.precio_desde !== undefined && body.precio_desde !== null) {
      await auth.supabase
        .from("tipologia_precio_historial")
        .insert({
          tipologia_id: data.id,
          precio_anterior: null,
          precio_nuevo: body.precio_desde,
          changed_by: auth.user.email || auth.user.id,
        });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
