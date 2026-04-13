import { getAuthContext, getAccessibleProjectIds, verifyProjectOwnership, requirePermission } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verify access — all roles (admin, administrador, director, asesor) can use disponibilidad
    if (auth.role !== "admin" && auth.role !== "administrador") {
      const accessible = await getAccessibleProjectIds(auth);
      if (accessible && !accessible.includes(id)) {
        return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
      }
    } else {
      if (!(await verifyProjectOwnership(auth, id))) {
        return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
      }
    }

    const [
      { data: proyecto },
      { data: tipologias },
      { data: torres },
      { data: unidadTipologias },
    ] = await Promise.all([
      auth.supabase
        .from("proyectos")
        .select("tipologia_mode, precio_source, parqueaderos_mode, depositos_mode, moneda_base, disponibilidad_config, unidad_display_prefix, tipo_proyecto, inventory_columns")
        .eq("id", id)
        .single(),
      auth.supabase
        .from("tipologias")
        .select("id, nombre, area_m2, habitaciones, banos, precio_desde, parqueaderos, depositos")
        .eq("proyecto_id", id)
        .order("orden"),
      auth.supabase
        .from("torres")
        .select("id, nombre")
        .eq("proyecto_id", id)
        .order("orden"),
      auth.supabase
        .from("unidad_tipologias")
        .select("unidad_id, tipologia_id")
        .eq("proyecto_id", id),
    ]);

    if (!proyecto) {
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      tipologia_mode: proyecto.tipologia_mode,
      precio_source: proyecto.precio_source,
      parqueaderos_mode: proyecto.parqueaderos_mode,
      depositos_mode: proyecto.depositos_mode,
      moneda_base: proyecto.moneda_base,
      disponibilidad_config: proyecto.disponibilidad_config ?? {},
      unidad_display_prefix: proyecto.unidad_display_prefix ?? null,
      tipo_proyecto: proyecto.tipo_proyecto ?? "hibrido",
      inventory_columns: proyecto.inventory_columns ?? null,
      tipologias: tipologias ?? [],
      torres: torres ?? [],
      unidad_tipologias: unidadTipologias ?? [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
