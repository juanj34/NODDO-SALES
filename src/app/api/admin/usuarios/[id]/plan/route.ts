import { getAuthContext } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/admin-audit";
import { PLAN_DEFAULTS, type Plan } from "@/lib/plan-limits";
import { sendPlanUpgrade } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

const VALID_PLANS: Plan[] = ["basic", "premium", "enterprise"];

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

  if (!plan || !VALID_PLANS.includes(plan)) {
    return NextResponse.json({ error: "Plan inválido. Debe ser: basic, premium, o enterprise" }, { status: 400 });
  }

  const VALID_STATUSES = ["active", "trial", "cancelled", "suspended"];
  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Estado de plan inválido" }, { status: 400 });
  }

  const defaults = PLAN_DEFAULTS[plan as Plan];

  // Use custom overrides if provided, otherwise fall back to plan defaults
  const finalMaxProjects = max_projects !== undefined ? max_projects : defaults.max_projects;
  const finalMaxUnits = max_units_per_project !== undefined ? max_units_per_project : defaults.max_units_per_project;
  const finalMaxCollabs = max_collaborators !== undefined ? max_collaborators : defaults.max_collaborators;

  const admin = createAdminClient();

  // Fetch existing plan to compare
  const { data: existingPlan } = await admin
    .from("user_plans")
    .select("plan")
    .eq("user_id", userId)
    .single();

  const oldPlan = existingPlan?.plan as Plan | null;

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
      oldPlan,
      newPlan: plan,
      status: status || "active",
      max_projects: finalMaxProjects,
      max_units_per_project: finalMaxUnits,
      max_collaborators: finalMaxCollabs,
    },
  });

  // Send upgrade email if plan changed and it's an upgrade (not a new plan)
  if (oldPlan && oldPlan !== plan) {
    const { data: user } = await admin.auth.admin.getUserById(userId);
    if (user?.user?.email) {
      sendPlanUpgrade({
        email: user.user.email,
        name: user.user.user_metadata?.full_name || user.user.email.split("@")[0],
        oldPlan: oldPlan as "basic" | "premium" | "enterprise",
        newPlan: plan as "basic" | "premium" | "enterprise",
        maxProjects: finalMaxProjects,
        maxUnits: finalMaxUnits,
      }).catch((err) => {
        console.error("[admin/plan] Failed to send upgrade email:", err);
      });
    }
  }

  return NextResponse.json({ ok: true });
}
