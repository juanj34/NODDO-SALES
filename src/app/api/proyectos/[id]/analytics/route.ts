import { getAuthContext } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";
import type { AnalyticsResponse, AnalyticsBreakdown } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verify project access
    const { data: proyecto } = await auth.supabase
      .from("proyectos")
      .select("id, user_id")
      .eq("id", id)
      .eq("user_id", auth.adminUserId)
      .single();

    if (!proyecto) {
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") || new Date(Date.now() - 30 * 86400000).toISOString();
    const to = searchParams.get("to") || new Date().toISOString();

    // Run all queries in parallel
    const [
      summaryResult,
      timeSeriesResult,
      eventsResult,
      leadsResult,
      financialResult,
    ] = await Promise.all([
      // 1. Summary via RPC
      auth.supabase.rpc("analytics_summary", {
        p_proyecto_id: id,
        p_from: from,
        p_to: to,
      }),
      // 2. Time series via RPC
      auth.supabase.rpc("analytics_views_over_time", {
        p_proyecto_id: id,
        p_from: from,
        p_to: to,
        p_granularity: "day",
      }),
      // 3. All events for breakdowns (JS-side grouping)
      auth.supabase
        .from("analytics_events")
        .select("event_type, page_path, device_type, country, referrer, utm_source, visitor_id, session_id")
        .eq("proyecto_id", id)
        .gte("created_at", from)
        .lte("created_at", to)
        .order("created_at", { ascending: false }),
      // 4. Leads for this project in range
      auth.supabase
        .from("leads")
        .select("utm_source, tipologia_interes, pais, created_at")
        .eq("proyecto_id", id)
        .gte("created_at", from)
        .lte("created_at", to)
        .order("created_at", { ascending: false }),
      // 5. Financial metrics via RPC
      auth.supabase.rpc("analytics_financial_summary", {
        p_proyecto_id: id,
        p_from: from,
        p_to: to,
      }),
    ]);

    const summary = summaryResult.data || {
      total_views: 0,
      unique_visitors: 0,
      total_sessions: 0,
      whatsapp_clicks: 0,
      brochure_downloads: 0,
      video_plays: 0,
      recurso_downloads: 0,
      cta_clicks: 0,
    };

    const rawTimeSeries = (timeSeriesResult.data || []).map((r: { bucket: string; views: number; visitors: number }) => ({
      bucket: r.bucket,
      views: Number(r.views),
      visitors: Number(r.visitors),
    }));

    // Fill date gaps so charts show 0s for days without data
    const timeSeries = fillDateGaps(rawTimeSeries, from, to);

    const events = eventsResult.data || [];
    const leads = leadsResult.data || [];

    // Build breakdowns from events
    const pageviews = events.filter((e: { event_type: string }) => e.event_type === "pageview");

    const viewsByPage = groupAndSort(pageviews, (e: { page_path: string | null }) => cleanPagePath(e.page_path));
    const viewsByDevice = groupAndSort(pageviews, (e: { device_type: string | null }) => e.device_type || "unknown");
    const viewsByCountry = groupAndSort(pageviews, (e: { country: string | null }) => e.country || "Desconocido");
    const viewsByReferrer = groupAndSort(
      pageviews.filter((e: { referrer: string | null }) => e.referrer),
      (e: { referrer: string | null }) => cleanReferrer(e.referrer)
    );

    // Lead breakdowns
    const leadsBySource = groupAndSort(leads, (l: { utm_source: string | null }) => l.utm_source || "Directo");
    const leadsByTipologia = groupAndSort(
      leads.filter((l: { tipologia_interes: string | null }) => l.tipologia_interes),
      (l: { tipologia_interes: string | null }) => l.tipologia_interes!
    );
    const leadsByCountry = groupAndSort(leads, (l: { pais: string | null }) => l.pais || "Desconocido");

    // Leads over time (by day) — also fill date gaps
    const rawLeadsOverTime = groupAndSort(leads, (l: { created_at: string }) => l.created_at.slice(0, 10));
    const leadsOverTime = fillBreakdownDateGaps(rawLeadsOverTime, from, to);

    // Conversion rate
    const totalLeads = leads.length;
    const uniqueVisitors = summary.unique_visitors || 0;
    const conversionRate = uniqueVisitors > 0 ? (totalLeads / uniqueVisitors) * 100 : 0;

    // Bounce rate: sessions with only 1 pageview / total sessions
    const sessionPageCounts = new Map<string, number>();
    for (const e of pageviews) {
      const sid = (e as { session_id: string }).session_id;
      sessionPageCounts.set(sid, (sessionPageCounts.get(sid) || 0) + 1);
    }
    const totalSessions = summary.total_sessions || sessionPageCounts.size || 1;
    const bounceSessions = Array.from(sessionPageCounts.values()).filter((c) => c === 1).length;
    const bounceRate = totalSessions > 0 ? (bounceSessions / totalSessions) * 100 : 0;

    // Average pages per session
    const totalPageviews = summary.total_views || pageviews.length;
    const avgPagesPerSession = totalSessions > 0 ? totalPageviews / totalSessions : 0;

    // Financial metrics
    const financial = financialResult.data || null;

    const response: AnalyticsResponse = {
      summary,
      total_leads: totalLeads,
      conversion_rate: Math.round(conversionRate * 100) / 100,
      bounce_rate: Math.round(bounceRate * 100) / 100,
      avg_pages_per_session: Math.round(avgPagesPerSession * 100) / 100,
      views_over_time: timeSeries,
      leads_over_time: leadsOverTime,
      views_by_page: viewsByPage,
      views_by_device: viewsByDevice,
      views_by_country: viewsByCountry,
      views_by_referrer: viewsByReferrer,
      leads_by_source: leadsBySource,
      leads_by_tipologia: leadsByTipologia,
      leads_by_country: leadsByCountry,
      financial,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[analytics]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

/* ── Helpers ── */

function groupAndSort<T>(
  items: T[],
  getKey: (item: T) => string
): AnalyticsBreakdown[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = getKey(item);
    map.set(key, (map.get(key) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function cleanPagePath(path: string | null): string {
  if (!path) return "/";
  // Remove /sites/[slug] prefix to show clean page names
  const match = path.match(/\/sites\/[^/]+(.*)$/);
  const clean = match ? match[1] || "/" : path;
  const pageNames: Record<string, string> = {
    "/": "Inicio",
    "/tipologias": "Tipologías",
    "/galeria": "Galería",
    "/ubicacion": "Ubicación",
    "/videos": "Videos",
    "/contacto": "Contacto",
    "/brochure": "Brochure",
    "/tour-360": "Tour 360",
    "/recursos": "Recursos",
    "/avances": "Avances",
    "/explorar": "Explorar",
  };
  return pageNames[clean] || clean;
}

function cleanReferrer(referrer: string | null): string {
  if (!referrer) return "Directo";
  try {
    const url = new URL(referrer);
    return url.hostname.replace("www.", "");
  } catch {
    return referrer;
  }
}

/** Fill missing dates in time series so charts show 0 for days without data */
function fillDateGaps(
  data: { bucket: string; views: number; visitors: number }[],
  fromISO: string,
  toISO: string
): { bucket: string; views: number; visitors: number }[] {
  const map = new Map<string, { views: number; visitors: number }>();
  for (const d of data) {
    map.set(d.bucket.slice(0, 10), { views: d.views, visitors: d.visitors });
  }

  const result: { bucket: string; views: number; visitors: number }[] = [];
  const start = new Date(fromISO);
  const end = new Date(toISO);
  // Normalize to date-only
  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(0, 0, 0, 0);

  const cursor = new Date(start);
  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
    const entry = map.get(key);
    result.push({
      bucket: key,
      views: entry?.views || 0,
      visitors: entry?.visitors || 0,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return result;
}

/** Fill missing dates in breakdown arrays (for leads_over_time) */
function fillBreakdownDateGaps(
  data: AnalyticsBreakdown[],
  fromISO: string,
  toISO: string
): AnalyticsBreakdown[] {
  const map = new Map<string, number>();
  for (const d of data) {
    map.set(d.label, d.count);
  }

  const result: AnalyticsBreakdown[] = [];
  const start = new Date(fromISO);
  const end = new Date(toISO);
  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(0, 0, 0, 0);

  const cursor = new Date(start);
  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
    result.push({ label: key, count: map.get(key) || 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return result;
}
