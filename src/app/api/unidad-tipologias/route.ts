import { getAuthContext, requirePermission, verifyProjectOwnership } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/unidad-tipologias
 * Bulk assign available tipologías to unidades (for multi-tipología mode).
 * Body: { proyecto_id, unidad_ids: string[], tipologia_ids: string[] }
 * Creates all combinations (cartesian product).
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const denied = requirePermission(auth, "content.write");
    if (denied) return denied;

    const { proyecto_id, unidad_ids, tipologia_ids } = await request.json();
    if (!proyecto_id || !Array.isArray(unidad_ids) || !Array.isArray(tipologia_ids)) {
      return NextResponse.json(
        { error: "proyecto_id, unidad_ids[] y tipologia_ids[] son requeridos" },
        { status: 400 }
      );
    }

    if (!(await verifyProjectOwnership(auth, proyecto_id))) {
      return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
    }

    // Reject changes for units with committed estados
    const { data: units, error: unitsErr } = await auth.supabase
      .from("unidades")
      .select("id, estado")
      .in("id", unidad_ids)
      .eq("proyecto_id", proyecto_id);
    if (unitsErr) throw unitsErr;

    const lockedIds = new Set(
      (units ?? [])
        .filter((u: { estado: string }) => ["vendida", "reservada", "separado"].includes(u.estado))
        .map((u: { id: string }) => u.id)
    );
    const eligibleUnitIds = (unidad_ids as string[]).filter((id: string) => !lockedIds.has(id));

    if (eligibleUnitIds.length === 0) {
      return NextResponse.json(
        { error: "No se pueden modificar tipologías de unidades vendidas/reservadas/separadas" },
        { status: 400 }
      );
    }

    // Build cartesian product rows
    const rows = eligibleUnitIds.flatMap((uid: string) =>
      tipologia_ids.map((tid: string) => ({
        proyecto_id,
        unidad_id: uid,
        tipologia_id: tid,
      }))
    );

    if (rows.length === 0) {
      return NextResponse.json({ inserted: 0 });
    }

    // Upsert to avoid duplicates (ON CONFLICT DO NOTHING via unique constraint)
    const { data, error } = await auth.supabase
      .from("unidad_tipologias")
      .upsert(rows, { onConflict: "unidad_id,tipologia_id", ignoreDuplicates: true })
      .select();

    if (error) throw error;
    return NextResponse.json({ inserted: data?.length ?? 0 }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/unidad-tipologias
 * Remove tipología options from unidades.
 * Body: { proyecto_id, unidad_ids: string[], tipologia_ids: string[] }
 * Removes all matching combinations.
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const denied = requirePermission(auth, "content.write");
    if (denied) return denied;

    const { proyecto_id, unidad_ids, tipologia_ids } = await request.json();
    if (!proyecto_id || !Array.isArray(unidad_ids) || !Array.isArray(tipologia_ids)) {
      return NextResponse.json(
        { error: "proyecto_id, unidad_ids[] y tipologia_ids[] son requeridos" },
        { status: 400 }
      );
    }

    if (!(await verifyProjectOwnership(auth, proyecto_id))) {
      return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
    }

    // Reject changes for units with committed estados
    const { data: units, error: unitsErr } = await auth.supabase
      .from("unidades")
      .select("id, estado")
      .in("id", unidad_ids)
      .eq("proyecto_id", proyecto_id);
    if (unitsErr) throw unitsErr;

    const lockedIds = new Set(
      (units ?? [])
        .filter((u: { estado: string }) => ["vendida", "reservada", "separado"].includes(u.estado))
        .map((u: { id: string }) => u.id)
    );
    const eligibleUnitIds = (unidad_ids as string[]).filter((id: string) => !lockedIds.has(id));

    if (eligibleUnitIds.length === 0) {
      return NextResponse.json(
        { error: "No se pueden modificar tipologías de unidades vendidas/reservadas/separadas" },
        { status: 400 }
      );
    }

    const { error } = await auth.supabase
      .from("unidad_tipologias")
      .delete()
      .eq("proyecto_id", proyecto_id)
      .in("unidad_id", eligibleUnitIds)
      .in("tipologia_id", tipologia_ids);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
