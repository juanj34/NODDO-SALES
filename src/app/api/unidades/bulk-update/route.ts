import { pick } from "@/lib/api-utils";
import { getAuthContext } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_FIELDS = [
  "tipologia_id", "identificador", "piso",
  "area_m2", "area_construida", "area_privada", "area_lote",
  "precio", "precio_venta", "estado",
  "habitaciones", "banos", "parqueaderos", "depositos",
  "orientacion", "vista", "notas", "plano_url",
  "fachada_id", "torre_id", "lote", "etapa_nombre",
];

interface BulkChange {
  id: string;
  updates: Record<string, unknown>;
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin")
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    const { changes, proyecto_id } = await request.json();
    if (!proyecto_id || !Array.isArray(changes) || changes.length === 0) {
      return NextResponse.json(
        { error: "proyecto_id y changes[] son requeridos" },
        { status: 400 }
      );
    }

    // Verify project ownership and get pricing config
    const { data: project } = await auth.supabase
      .from("proyectos")
      .select("id, precio_source")
      .eq("id", proyecto_id)
      .eq("user_id", auth.adminUserId)
      .maybeSingle();
    if (!project) {
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    }

    let updated = 0;
    let errors = 0;

    for (const change of (changes as BulkChange[]).slice(0, 500)) {
      const { id, updates } = change;
      if (!id || !updates || typeof updates !== "object") {
        errors++;
        continue;
      }

      const cleanUpdates: Record<string, unknown> = pick(updates, ALLOWED_FIELDS);
      if (Object.keys(cleanUpdates).length === 0) continue;

      // --- precio_venta locking logic ---
      if (cleanUpdates.estado !== undefined) {
        const { data: unit } = await auth.supabase
          .from("unidades")
          .select("estado, precio, tipologia_id")
          .eq("id", id)
          .eq("proyecto_id", proyecto_id)
          .maybeSingle();

        if (unit) {
          if (cleanUpdates.estado === "vendida" && unit.estado !== "vendida") {
            // Transitioning to vendida: lock precio_venta
            let precioVenta: number | null = null;
            if (project.precio_source === "tipologia") {
              const tipId = (cleanUpdates.tipologia_id as string) ?? unit.tipologia_id;
              if (tipId) {
                const { data: tip } = await auth.supabase
                  .from("tipologias")
                  .select("precio_desde")
                  .eq("id", tipId)
                  .single();
                precioVenta = tip?.precio_desde ?? null;
              }
            } else {
              precioVenta = (cleanUpdates.precio as number) ?? unit.precio ?? null;
            }
            if (precioVenta !== null) {
              cleanUpdates.precio_venta = precioVenta;
            }
          } else if (unit.estado === "vendida" && cleanUpdates.estado !== "vendida") {
            // Reverting from vendida: clear precio_venta
            cleanUpdates.precio_venta = null;
          }
        }
      }

      // Strip manual precio_venta for non-vendida units
      if (cleanUpdates.precio_venta !== undefined && cleanUpdates.estado !== "vendida") {
        const { data: unitCheck } = await auth.supabase
          .from("unidades")
          .select("estado")
          .eq("id", id)
          .eq("proyecto_id", proyecto_id)
          .maybeSingle();
        if (unitCheck?.estado !== "vendida") {
          delete cleanUpdates.precio_venta;
        }
      }

      const { error } = await auth.supabase
        .from("unidades")
        .update(cleanUpdates)
        .eq("id", id)
        .eq("proyecto_id", proyecto_id);

      if (error) {
        console.error(`bulk-update unit ${id}:`, error.message);
        errors++;
      } else {
        updated++;
      }
    }

    return NextResponse.json({ updated, errors });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
