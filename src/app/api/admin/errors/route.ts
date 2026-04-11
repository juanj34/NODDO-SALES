import { getAuthContext } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/errors — List error logs with filters
 * PATCH /api/admin/errors — Resolve/unresolve an error
 */

export async function GET(request: NextRequest) {
  const auth = await getAuthContext();
  if (!auth || !auth.isPlatformAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const severity = searchParams.get("severity");
  const resolved = searchParams.get("resolved");
  const route = searchParams.get("route");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const admin = createAdminClient();

  let query = admin
    .from("error_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (severity) query = query.eq("severity", severity);
  if (resolved === "true") query = query.eq("resolved", true);
  else if (resolved === "false" || !resolved) query = query.eq("resolved", false);
  if (route) query = query.eq("route", route);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also fetch unique routes for the filter dropdown
  const { data: routeData } = await admin
    .from("error_logs")
    .select("route")
    .eq("resolved", false)
    .order("route");

  const routes = [...new Set((routeData ?? []).map((r: { route: string }) => r.route))];

  // Summary stats
  const { data: stats } = await admin.rpc("error_log_stats").maybeSingle();

  return NextResponse.json({
    errors: data ?? [],
    total: count ?? 0,
    routes,
    stats: stats ?? { total_unresolved: 0, critical: 0, errors: 0, warnings: 0 },
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthContext();
  if (!auth || !auth.isPlatformAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const { id, resolved, resolution_note } = body as {
    id: string;
    resolved: boolean;
    resolution_note?: string;
  };

  if (!id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }

  const admin = createAdminClient();

  const updateData: Record<string, unknown> = {
    resolved,
    resolved_at: resolved ? new Date().toISOString() : null,
    resolved_by: resolved ? auth.user.id : null,
    resolution_note: resolution_note ?? null,
  };

  const { error } = await admin
    .from("error_logs")
    .update(updateData)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
