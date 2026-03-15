import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-context";

/**
 * GET /api/bitacora/export
 *
 * Export activity logs as CSV. Same filters as main route, max 10 000 rows.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const sp = new URL(request.url).searchParams;
    const proyectoId = sp.get("proyecto_id");
    const actionCategory = sp.get("action_category");
    const dateFrom = sp.get("date_from");
    const dateTo = sp.get("date_to");

    let query = auth.supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10000);

    if (proyectoId) query = query.eq("proyecto_id", proyectoId);
    if (actionCategory) query = query.eq("action_category", actionCategory);
    if (dateFrom) query = query.gte("created_at", `${dateFrom}T00:00:00Z`);
    if (dateTo) query = query.lte("created_at", `${dateTo}T23:59:59Z`);

    const { data, error } = await query;
    if (error) throw error;

    const headers = ["Fecha", "Usuario", "Rol", "Proyecto", "Categoría", "Acción", "Descripción"];
    const rows = (data || []).map((log) => [
      new Date(log.created_at).toLocaleString("es-CO", { timeZone: "America/Bogota" }),
      log.user_email,
      log.user_role,
      log.proyecto_nombre || "—",
      log.action_category,
      log.action_type,
      log.description,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const filename = `bitacora_${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse("\uFEFF" + csv, {
      headers: {
        "Content-Type": "text/csv;charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("[bitacora/export] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 }
    );
  }
}
