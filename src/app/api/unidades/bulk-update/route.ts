import { pick } from "@/lib/api-utils";
import { getAuthContext } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_FIELDS = [
  "tipologia_id", "identificador", "piso",
  "area_m2", "area_construida", "area_privada", "area_lote",
  "precio", "estado",
  "habitaciones", "banos", "parqueaderos", "depositos",
  "orientacion", "vista", "notas",
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

    // Verify project ownership
    const { data: project } = await auth.supabase
      .from("proyectos")
      .select("id")
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

      const cleanUpdates = pick(updates, ALLOWED_FIELDS);
      if (Object.keys(cleanUpdates).length === 0) continue;

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
