import { getAuthContext } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await getAuthContext();
  if (!auth || !auth.isPlatformAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const admin = createAdminClient();

  // Get all users from auth
  const { data: authData, error: authError } = await admin.auth.admin.listUsers({
    perPage: 1000,
    page: 1,
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  const users = authData?.users ?? [];

  // Get project counts per user
  const { data: projects } = await admin
    .from("proyectos")
    .select("user_id, id");

  // Get lead counts per user (via project)
  const { data: leads } = await admin
    .from("leads")
    .select("proyecto_id");

  // Get all plans
  const { data: plans } = await admin.from("user_plans").select("*");

  // Build project count map
  const projectCounts = new Map<string, number>();
  for (const p of projects ?? []) {
    projectCounts.set(p.user_id, (projectCounts.get(p.user_id) || 0) + 1);
  }

  // Build project-to-user map
  const projectUserMap = new Map<string, string>();
  for (const p of projects ?? []) {
    projectUserMap.set(p.id, p.user_id);
  }

  // Build lead count per user
  const leadCounts = new Map<string, number>();
  for (const l of leads ?? []) {
    const userId = projectUserMap.get(l.proyecto_id);
    if (userId) {
      leadCounts.set(userId, (leadCounts.get(userId) || 0) + 1);
    }
  }

  // Build plan map
  const planMap = new Map<string, typeof plans extends (infer T)[] | null ? T : never>();
  for (const p of plans ?? []) {
    planMap.set(p.user_id, p);
  }

  // Combine
  const result = users.map((u) => ({
    id: u.id,
    email: u.email ?? "",
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at ?? null,
    projectCount: projectCounts.get(u.id) || 0,
    leadCount: leadCounts.get(u.id) || 0,
    plan: planMap.get(u.id)?.plan ?? null,
    planStatus: planMap.get(u.id)?.status ?? null,
    maxProjects: planMap.get(u.id)?.max_projects ?? null,
  }));

  // Sort by creation date (newest first)
  result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json(result);
}
