import { getAuthContext } from "@/lib/auth-context";
import { NextResponse } from "next/server";
import type { DashboardSummary, DashboardRecentLead } from "@/types";

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Fetch all projects for this user
    const { data: projects, error: projErr } = await auth.supabase
      .from("proyectos")
      .select("id, nombre")
      .eq("user_id", auth.adminUserId)
      .order("created_at", { ascending: false });

    if (projErr) throw projErr;

    if (!projects || projects.length === 0) {
      const empty: DashboardSummary = {
        total_views: 0,
        unique_visitors: 0,
        total_leads: 0,
        conversion_rate: 0,
        total_interactions: 0,
        views_sparkline: [],
        recent_leads: [],
        project_stats: {},
      };
      return NextResponse.json(empty);
    }

    const projectIds = projects.map((p) => p.id);
    const projectNameMap = new Map(projects.map((p) => [p.id, p.nombre]));

    const now = new Date().toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    // For each project: fetch summary + time series in parallel
    const perProjectResults = await Promise.all(
      projectIds.map(async (pid) => {
        const [summaryRes, timeSeriesRes] = await Promise.all([
          auth.supabase.rpc("analytics_summary", {
            p_proyecto_id: pid,
            p_from: sevenDaysAgo,
            p_to: now,
          }),
          auth.supabase.rpc("analytics_views_over_time", {
            p_proyecto_id: pid,
            p_from: sevenDaysAgo,
            p_to: now,
            p_granularity: "day",
          }),
        ]);

        const summary = summaryRes.data || {
          total_views: 0,
          unique_visitors: 0,
          total_sessions: 0,
          whatsapp_clicks: 0,
          brochure_downloads: 0,
          video_plays: 0,
          recurso_downloads: 0,
          cta_clicks: 0,
        };

        const timeSeries = (timeSeriesRes.data || []).map(
          (r: { bucket: string; views: number; visitors: number }) => ({
            bucket: r.bucket.slice(0, 10),
            views: Number(r.views),
            visitors: Number(r.visitors),
          })
        );

        return { pid, summary, timeSeries };
      })
    );

    // Also fetch recent leads + leads count in 7d window
    const [recentLeadsRes, leadsCountRes] = await Promise.all([
      auth.supabase
        .from("leads")
        .select("id, nombre, email, pais, tipologia_interes, proyecto_id, created_at")
        .in("proyecto_id", projectIds)
        .order("created_at", { ascending: false })
        .limit(5),
      auth.supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .in("proyecto_id", projectIds)
        .gte("created_at", sevenDaysAgo),
    ]);

    // Aggregate summaries
    let totalViews = 0;
    let uniqueVisitors = 0;
    let totalInteractions = 0;
    const projectStats: Record<string, { views_7d: number; leads_7d: number }> = {};

    for (const { pid, summary } of perProjectResults) {
      totalViews += Number(summary.total_views) || 0;
      uniqueVisitors += Number(summary.unique_visitors) || 0;
      totalInteractions +=
        (Number(summary.whatsapp_clicks) || 0) +
        (Number(summary.brochure_downloads) || 0) +
        (Number(summary.video_plays) || 0) +
        (Number(summary.recurso_downloads) || 0) +
        (Number(summary.cta_clicks) || 0);

      projectStats[pid] = {
        views_7d: Number(summary.total_views) || 0,
        leads_7d: 0, // will fill below
      };
    }

    // Count leads per project in 7d window
    if (projectIds.length > 0) {
      const { data: leadsPerProject } = await auth.supabase
        .from("leads")
        .select("proyecto_id")
        .in("proyecto_id", projectIds)
        .gte("created_at", sevenDaysAgo);

      if (leadsPerProject) {
        for (const l of leadsPerProject) {
          if (projectStats[l.proyecto_id]) {
            projectStats[l.proyecto_id].leads_7d += 1;
          }
        }
      }
    }

    // Merge time series across projects (sum views per date bucket)
    const mergedSparkline = new Map<string, number>();
    for (const { timeSeries } of perProjectResults) {
      for (const entry of timeSeries) {
        mergedSparkline.set(
          entry.bucket,
          (mergedSparkline.get(entry.bucket) || 0) + entry.views
        );
      }
    }

    // Fill date gaps for sparkline
    const sparkline: { bucket: string; views: number }[] = [];
    const cursor = new Date(sevenDaysAgo);
    cursor.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(now);
    endDate.setUTCHours(0, 0, 0, 0);
    while (cursor <= endDate) {
      const key = cursor.toISOString().slice(0, 10);
      sparkline.push({ bucket: key, views: mergedSparkline.get(key) || 0 });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    const totalLeads = leadsCountRes.count || 0;
    const conversionRate =
      uniqueVisitors > 0
        ? Math.round((totalLeads / uniqueVisitors) * 10000) / 100
        : 0;

    // Map recent leads with project names
    const recentLeads: DashboardRecentLead[] = (recentLeadsRes.data || []).map(
      (l: {
        id: string;
        nombre: string;
        email: string;
        pais: string | null;
        tipologia_interes: string | null;
        proyecto_id: string;
        created_at: string;
      }) => ({
        id: l.id,
        nombre: l.nombre,
        email: l.email,
        pais: l.pais,
        tipologia_interes: l.tipologia_interes,
        proyecto_nombre: projectNameMap.get(l.proyecto_id) || "",
        proyecto_id: l.proyecto_id,
        created_at: l.created_at,
      })
    );

    const response: DashboardSummary = {
      total_views: totalViews,
      unique_visitors: uniqueVisitors,
      total_leads: totalLeads,
      conversion_rate: conversionRate,
      total_interactions: totalInteractions,
      views_sparkline: sparkline,
      recent_leads: recentLeads,
      project_stats: projectStats,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[dashboard/summary]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
