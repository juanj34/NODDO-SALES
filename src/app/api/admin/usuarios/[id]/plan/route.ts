import { getAuthContext } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/admin-audit";
import { NextRequest, NextResponse } from "next/server";

const PLAN_DEFAULTS: Record<string, { max_projects: number; max_units_per_project: number | null; max_collaborators: number }> = {
  trial: { max_projects: 1, max_units_per_project: 50, max_collaborators: 2 },
  proyecto: { max_projects: 1, max_units_per_project: 200, max_collaborators: 5 },
  studio: { max_projects: 5, max_units_per_project: null, max_collaborators: 5 },
  enterprise: { max_projects: 999, max_units_per_project: null, max_collaborators: 5 },
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
  const { plan, status, max_projects, max_units_per_project, max_collaborators } = body;

  if (!plan || !PLAN_DEFAULTS[plan]) {
    return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
  }

  const VALID_STATUSES = ["active", "trial", "cancelled", "suspended"];
  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Estado de plan inválido" }, { status: 400 });
  }

  const defaults = PLAN_DEFAULTS[plan];

  // Use custom overrides if provided, otherwise fall back to plan defaults
  const finalMaxProjects = max_projects !== undefined ? max_projects : defaults.max_projects;
  const finalMaxUnits = max_units_per_project !== undefined ? max_units_per_project : defaults.max_units_per_project;
  const finalMaxCollabs = max_collaborators !== undefined ? max_collaborators : defaults.max_collaborators;

  const admin = createAdminClient();

  // Upsert the plan
  const { error } = await admin
    .from("user_plans")
    .upsert(
      {
        user_id: userId,
        plan,
        status: status || "active",
        max_projects: finalMaxProjects,
        max_units_per_project: finalMaxUnits,
        max_collaborators: finalMaxCollabs,
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
    details: {
      plan,
      status: status || "active",
      max_projects: finalMaxProjects,
      max_units_per_project: finalMaxUnits,
      max_collaborators: finalMaxCollabs,
    },
  });

  return NextResponse.json({ ok: true });
}
