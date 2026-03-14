import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-context";

const VALID_STATUSES = ["confirmed", "attended", "no_show", "cancelled", "rescheduled"];

/**
 * GET /api/marketing/appointments — List all demo appointments.
 * PATCH /api/marketing/appointments — Update appointment status.
 * Platform admin only.
 *
 * GET query params:
 *   status  — Filter by status (confirmed, attended, no_show, cancelled)
 *   page    — Page number (default 1)
 *   limit   — Items per page (default 50, max 100)
 *
 * PATCH body:
 *   id      — Appointment UUID
 *   status  — New status value
 */

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check platform admin
  if (ctx.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
  const offset = (page - 1) * limit;

  let query = ctx.supabase
    .from("appointments")
    .select("*", { count: "exact" })
    .order("scheduled_for", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("[api/marketing/appointments] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Stats summary
  const { data: stats } = await ctx.supabase.rpc("appointments_summary");

  return NextResponse.json({
    appointments: data || [],
    total: count || 0,
    page,
    limit,
    stats: stats?.[0] || null,
  });
}

export async function PATCH(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (ctx.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ error: "id and status are required" }, { status: 400 });
    }
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
    }

    const updateFields: Record<string, unknown> = { status };

    // If marking as no_show, increment the counter
    if (status === "no_show") {
      const { data: current } = await ctx.supabase
        .from("appointments")
        .select("no_show_count")
        .eq("id", id)
        .single();

      updateFields.no_show_count = (current?.no_show_count || 0) + 1;
    }

    const { data, error } = await ctx.supabase
      .from("appointments")
      .update(updateFields)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[api/marketing/appointments] PATCH error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Trigger GHL pipeline updates via edge function (fire-and-forget)
    if (data?.ghl_contact_id && (status === "attended" || status === "no_show")) {
      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (SUPABASE_URL && SERVICE_ROLE_KEY) {
        const tags = status === "attended" ? ["demo-attended"] : ["demo-no-show"];
        const stageEnvKey = status === "attended" ? "GHL_STAGE_DEMO_REALIZADO" : undefined;
        const stageId = stageEnvKey ? process.env[stageEnvKey] : undefined;

        // Add tags via ghl-contact
        fetch(`${SUPABASE_URL}/functions/v1/ghl-contact`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: data.email,
            name: data.nombre,
            tags,
            ...(stageId ? { pipeline: { stageId } } : {}),
            note: status === "attended"
              ? "Demo completada exitosamente"
              : "No asistió a la demo",
          }),
        }).catch((err) =>
          console.error("[api/marketing/appointments] GHL update failed:", err)
        );
      }
    }

    return NextResponse.json({ appointment: data });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
