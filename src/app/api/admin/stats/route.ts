import { getAuthContext } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

function getRangeMs(range: string): number {
  switch (range) {
    case "7d": return 7 * 24 * 60 * 60 * 1000;
    case "30d": return 30 * 24 * 60 * 60 * 1000;
    case "90d": return 90 * 24 * 60 * 60 * 1000;
    default: return 30 * 24 * 60 * 60 * 1000;
  }
}

function computeTrend(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

export async function GET(request: NextRequest) {
  const auth = await getAuthContext();
  if (!auth || !auth.isPlatformAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const range = request.nextUrl.searchParams.get("range") || "30d";
  const rangeMs = getRangeMs(range);
  const now = new Date();
  const from = new Date(now.getTime() - rangeMs);
  const prevFrom = new Date(from.getTime() - rangeMs);
  const granularity = range === "7d" ? "day" : range === "90d" ? "week" : "day";

  const admin = createAdminClient();

  // Run all queries in parallel
  const [
    usersRes,
    projectsRes,
    publishedRes,
    leadsRangeRes,
    leadsAllRes,
    leadsPrevRes,
    plansRes,
    viewsOverTimeRes,
    summaryRes,
    usersOverTimeRes,
    projectsOverTimeRes,
    leadsOverTimeRes,
    prevViewsRes,
    prevUsersRes,
    prevProjectsRes,
    topViewsRes,
    topLeadsRes,
    deviceRes,
    countryRes,
    storageRes,
  ] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 1000, page: 1 }),
    admin.from("proyectos").select("id", { count: "exact", head: true }),
    admin.from("proyectos").select("id", { count: "exact", head: true }).eq("estado", "publicado"),
    admin.from("leads").select("id", { count: "exact", head: true }).gte("created_at", from.toISOString()),
    admin.from("leads").select("id", { count: "exact", head: true }),
    admin.from("leads").select("id", { count: "exact", head: true })
      .gte("created_at", prevFrom.toISOString())
      .lt("created_at", from.toISOString()),
    admin.from("user_plans").select("plan"),
    admin.rpc("platform_views_over_time", { p_from: from.toISOString(), p_to: now.toISOString(), p_granularity: granularity }),
    admin.rpc("platform_analytics_summary", { p_from: from.toISOString(), p_to: now.toISOString() }),
    admin.rpc("platform_users_over_time", { p_from: from.toISOString(), p_to: now.toISOString(), p_granularity: granularity }),
    admin.rpc("platform_projects_over_time", { p_from: from.toISOString(), p_to: now.toISOString(), p_granularity: granularity }),
    admin.rpc("platform_leads_over_time", { p_from: from.toISOString(), p_to: now.toISOString(), p_granularity: granularity }),
    admin.rpc("platform_analytics_summary", { p_from: prevFrom.toISOString(), p_to: from.toISOString() }),
    admin.rpc("platform_users_over_time", { p_from: prevFrom.toISOString(), p_to: from.toISOString(), p_granularity: granularity }),
    admin.rpc("platform_projects_over_time", { p_from: prevFrom.toISOString(), p_to: from.toISOString(), p_granularity: granularity }),
    admin.from("analytics_events").select("proyecto_id").eq("event_type", "pageview").gte("created_at", from.toISOString()),
    admin.from("leads").select("proyecto_id").gte("created_at", from.toISOString()),
    admin.from("analytics_events").select("device_type").eq("event_type", "pageview").gte("created_at", from.toISOString()),
    admin.from("analytics_events").select("country").eq("event_type", "pageview").gte("created_at", from.toISOString()).not("country", "is", null),
    admin.from("proyectos").select("storage_tours_bytes, storage_videos_bytes, storage_media_bytes, storage_limit_bytes"),
  ]);

  // Total users
  const allUsers = usersRes.data?.users ?? [];
  const totalUsers = allUsers.length;
  const sevenDaysAgoMs = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const recentSignups = allUsers.filter(
    (u) => new Date(u.created_at).getTime() >= sevenDaysAgoMs
  ).length;

  // Trends
  const usersInRange = allUsers.filter(
    (u) => new Date(u.created_at).getTime() >= from.getTime()
  ).length;
  const prevUsersCount = ((prevUsersRes.data ?? []) as Array<{ count: number }>)
    .reduce((sum, r) => sum + Number(r.count), 0);
  const projectsInRange = ((projectsOverTimeRes.data ?? []) as Array<{ count: number }>)
    .reduce((sum, r) => sum + Number(r.count), 0);
  const prevProjectsCount = ((prevProjectsRes.data ?? []) as Array<{ count: number }>)
    .reduce((sum, r) => sum + Number(r.count), 0);

  // Plan distribution
  const planCounts: Record<string, number> = { trial: 0, proyecto: 0, studio: 0, enterprise: 0 };
  for (const p of (plansRes.data ?? []) as Array<{ plan: string }>) {
    planCounts[p.plan] = (planCounts[p.plan] || 0) + 1;
  }

  // Platform summary
  const raw = (summaryRes.data ?? {}) as Record<string, number>;
  const platformSummary = {
    total_views: Number(raw.total_views ?? 0),
    unique_visitors: Number(raw.unique_visitors ?? 0),
    total_sessions: Number(raw.total_sessions ?? 0),
    whatsapp_clicks: Number(raw.whatsapp_clicks ?? 0),
    brochure_downloads: Number(raw.brochure_downloads ?? 0),
    video_plays: Number(raw.video_plays ?? 0),
    recurso_downloads: Number(raw.recurso_downloads ?? 0),
    cta_clicks: Number(raw.cta_clicks ?? 0),
  };

  const prevRaw = (prevViewsRes.data ?? {}) as Record<string, number>;

  // Top projects by views
  const viewsByProject = new Map<string, number>();
  for (const e of (topViewsRes.data ?? []) as Array<{ proyecto_id: string }>) {
    viewsByProject.set(e.proyecto_id, (viewsByProject.get(e.proyecto_id) || 0) + 1);
  }

  // Top projects by leads
  const leadsByProject = new Map<string, number>();
  for (const l of (topLeadsRes.data ?? []) as Array<{ proyecto_id: string }>) {
    leadsByProject.set(l.proyecto_id, (leadsByProject.get(l.proyecto_id) || 0) + 1);
  }

  // Get project names
  const topProjectIds = [...new Set([...viewsByProject.keys(), ...leadsByProject.keys()])];
  const projectNameMap = new Map<string, { nombre: string; slug: string }>();
  if (topProjectIds.length > 0) {
    const { data: projectNames } = await admin
      .from("proyectos")
      .select("id, nombre, slug")
      .in("id", topProjectIds);
    for (const p of projectNames ?? []) {
      projectNameMap.set(p.id, { nombre: p.nombre, slug: p.slug });
    }
  }

  const topProjectsByViews = [...viewsByProject.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, views]) => ({
      id,
      nombre: projectNameMap.get(id)?.nombre ?? "—",
      slug: projectNameMap.get(id)?.slug ?? "",
      views,
    }));

  const topProjectsByLeads = [...leadsByProject.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, leads]) => ({
      id,
      nombre: projectNameMap.get(id)?.nombre ?? "—",
      slug: projectNameMap.get(id)?.slug ?? "",
      leads,
    }));

  // Device breakdown
  const deviceCounts = new Map<string, number>();
  for (const e of (deviceRes.data ?? []) as Array<{ device_type: string | null }>) {
    const dt = e.device_type || "unknown";
    deviceCounts.set(dt, (deviceCounts.get(dt) || 0) + 1);
  }
  const viewsByDevice = [...deviceCounts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  // Country breakdown
  const countryCounts = new Map<string, number>();
  for (const e of (countryRes.data ?? []) as Array<{ country: string }>) {
    countryCounts.set(e.country, (countryCounts.get(e.country) || 0) + 1);
  }
  const viewsByCountry = [...countryCounts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Funnel
  const { data: allProjects } = await admin.from("proyectos").select("id, user_id, estado");
  const usersWithProject = new Set<string>();
  const publishedProjectIds = new Set<string>();
  for (const p of allProjects ?? []) {
    usersWithProject.add(p.user_id);
    if (p.estado === "publicado") publishedProjectIds.add(p.id);
  }

  const { data: tipProjects } = await admin.from("tipologias").select("proyecto_id");
  const { data: galProjects } = await admin.from("galeria_categorias").select("proyecto_id");
  const projectsWithContent = new Set<string>();
  for (const t of tipProjects ?? []) projectsWithContent.add(t.proyecto_id);
  for (const g of galProjects ?? []) projectsWithContent.add(g.proyecto_id);

  const { data: leadProjects } = await admin.from("leads").select("proyecto_id");
  const projectsWithLeads = new Set<string>();
  for (const l of leadProjects ?? []) projectsWithLeads.add(l.proyecto_id);

  // Storage
  let totalTours = 0, totalVideos = 0, totalMedia = 0, totalLimit = 0;
  for (const p of (storageRes.data ?? []) as Array<Record<string, number | null>>) {
    totalTours += (p.storage_tours_bytes as number) || 0;
    totalVideos += (p.storage_videos_bytes as number) || 0;
    totalMedia += (p.storage_media_bytes as number) || 0;
    totalLimit += (p.storage_limit_bytes as number) || 5368709120;
  }

  // Time series
  const viewsOverTime = ((viewsOverTimeRes.data ?? []) as Array<{ bucket: string; views: number; visitors: number }>).map((r) => ({
    bucket: r.bucket,
    views: Number(r.views),
    visitors: Number(r.visitors),
  }));

  const usersOverTime = ((usersOverTimeRes.data ?? []) as Array<{ bucket: string; count: number }>).map((r) => ({
    bucket: r.bucket,
    count: Number(r.count),
  }));

  const projectsOverTime = ((projectsOverTimeRes.data ?? []) as Array<{ bucket: string; count: number }>).map((r) => ({
    bucket: r.bucket,
    count: Number(r.count),
  }));

  const leadsOverTime = ((leadsOverTimeRes.data ?? []) as Array<{ bucket: string; count: number }>).map((r) => ({
    label: r.bucket,
    count: Number(r.count),
  }));

  return NextResponse.json({
    totalUsers,
    totalProjects: projectsRes.count ?? 0,
    publishedProjects: publishedRes.count ?? 0,
    totalLeads: leadsAllRes.count ?? 0,
    leadsInRange: leadsRangeRes.count ?? 0,
    recentSignups,
    planDistribution: planCounts,
    usersTrend: computeTrend(usersInRange, prevUsersCount),
    projectsTrend: computeTrend(projectsInRange, prevProjectsCount),
    leadsTrend: computeTrend(leadsRangeRes.count ?? 0, leadsPrevRes.count ?? 0),
    viewsTrend: computeTrend(platformSummary.total_views, Number(prevRaw.total_views ?? 0)),
    usersOverTime,
    projectsOverTime,
    leadsOverTime,
    viewsOverTime,
    platformSummary,
    topProjectsByViews,
    topProjectsByLeads,
    viewsByCountry,
    viewsByDevice,
    funnel: {
      signed_up: totalUsers,
      project_created: usersWithProject.size,
      content_added: projectsWithContent.size,
      published: publishedProjectIds.size,
      first_lead: projectsWithLeads.size,
    },
    storage: {
      total_bytes: totalTours + totalVideos + totalMedia,
      tours_bytes: totalTours,
      videos_bytes: totalVideos,
      media_bytes: totalMedia,
      total_limit_bytes: totalLimit,
    },
  });
}
