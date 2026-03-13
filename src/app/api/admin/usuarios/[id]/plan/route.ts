import { getAuthContext } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/admin-audit";
import { NextRequest, NextResponse } from "next/server";

const PLAN_LIMITS: Record<string, { max_projects: number; max_units_per_project: number | null }> = {
  trial: { max_projects: 1, max_units_per_project: 50 },
  proyecto: { max_projects: 1, max_units_per_project: 200 },
  studio: { max_projects: 5, max_units_per_project: null },
  enterprise: { max_projects: 999, max_units_per_project: null },
};

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthContext();
  if (!auth || !auth.isPlatformAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id: userId } = await params;
  const body = await request.json();
  const { plan, status } = body;

  if (!plan || !PLAN_LIMITS[plan]) {
    return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
  }

  const VALID_STATUSES = ["active", "trial", "cancelled", "suspended"];
  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Estado de plan inválido" }, { status: 400 });
  }

  const admin = createAdminClient();
  const limits = PLAN_LIMITS[plan];

  // Upsert the plan
  const { error } = await admin
    .from("user_plans")
    .upsert(
      {
        user_id: userId,
        plan,
        status: status || "active",
        max_projects: limits.max_projects,
        max_units_per_project: limits.max_units_per_project,
        started_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAdminAction({
    adminId: auth.user.id,
    adminEmail: auth.user.email ?? "",
    action: "plan_changed",
    targetType: "user",
    targetId: userId,
    details: { plan, status: status || "active" },
  });

  return NextResponse.json({ ok: true });
}
