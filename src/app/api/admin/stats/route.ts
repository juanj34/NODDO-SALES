import { getAuthContext } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await getAuthContext();
  if (!auth || !auth.isPlatformAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const admin = createAdminClient();

  // Run all queries in parallel
  const [
    usersRes,
    projectsRes,
    publishedRes,
    leadsMonthRes,
    leadsAllRes,
    recentSignupsRes,
  ] = await Promise.all([
    // Total users
    admin.auth.admin.listUsers({ perPage: 1000, page: 1 }),
    // Total projects
    admin.from("proyectos").select("id", { count: "exact", head: true }),
    // Published projects
    admin
      .from("proyectos")
      .select("id", { count: "exact", head: true })
      .eq("estado", "publicado"),
    // Leads this month
    admin
      .from("leads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    // Total leads
    admin.from("leads").select("id", { count: "exact", head: true }),
    // Users in last 7 days (using auth admin API)
    admin.auth.admin.listUsers({ perPage: 1000, page: 1 }),
  ]);

  const sevenDaysAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentSignups = (recentSignupsRes.data?.users ?? []).filter(
    (u) => new Date(u.created_at).getTime() >= sevenDaysAgoMs
  ).length;
  const totalUsers = usersRes.data?.users?.length ?? 0;

  // Plan distribution
  const { data: plans } = await admin.from("user_plans").select("plan");
  const planCounts: Record<string, number> = { trial: 0, proyecto: 0, studio: 0, enterprise: 0 };
  for (const p of plans ?? []) {
    planCounts[p.plan] = (planCounts[p.plan] || 0) + 1;
  }

  return NextResponse.json({
    totalUsers,
    totalProjects: projectsRes.count ?? 0,
    publishedProjects: publishedRes.count ?? 0,
    leadsThisMonth: leadsMonthRes.count ?? 0,
    totalLeads: leadsAllRes.count ?? 0,
    recentSignups,
    planDistribution: planCounts,
  });
}
