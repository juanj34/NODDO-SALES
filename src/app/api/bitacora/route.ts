import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-context";

/**
 * GET /api/bitacora
 *
 * Paginated activity log with filters.
 * RLS handles authorization automatically (admin sees own projects, collaborator sees assigned).
 *
 * Query params:
 *  page, limit, proyecto_id, action_category, user_id, date_from, date_to, search
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ data: [], total: 0, page: 1, limit: 50 });
    }

    const sp = new URL(request.url).searchParams;
    const page = Math.max(1, parseInt(sp.get("page") || "1"));
    const limit = Math.min(200, Math.max(1, parseInt(sp.get("limit") || "50")));
    const offset = (page - 1) * limit;

    const proyectoId = sp.get("proyecto_id");
    const actionCategory = sp.get("action_category");
    const userId = sp.get("user_id");
    const dateFrom = sp.get("date_from");
    const dateTo = sp.get("date_to");
    const search = sp.get("search");

    let query = auth.supabase
      .from("activity_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (proyectoId) query = query.eq("proyecto_id", proyectoId);
    if (actionCategory) query = query.eq("action_category", actionCategory);
    if (userId) query = query.eq("user_id", userId);
    if (dateFrom) query = query.gte("created_at", `${dateFrom}T00:00:00Z`);
    if (dateTo) query = query.lte("created_at", `${dateTo}T23:59:59Z`);
    if (search) query = query.ilike("description", `%${search}%`);

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error("[bitacora] query error:", error.message, error.code);
      return NextResponse.json({ data: [], total: 0, page, limit });
    }

    return NextResponse.json({ data: data || [], total: count || 0, page, limit });
  } catch (err) {
    console.error("[bitacora] GET error:", err);
    return NextResponse.json({ data: [], total: 0, page: 1, limit: 50 });
  }
}
