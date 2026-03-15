import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/analytics/dashboard
 * Returns dashboard analytics summary and event data
 * Query params: ?days=30 (default: 7)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get days parameter (default 7)
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "7", 10);

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch analytics data
    const { data: events, error } = await supabase
      .from("dashboard_analytics")
      .select("*")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Analytics API] Error fetching events:", error);
      return NextResponse.json(
        { error: "Failed to fetch analytics" },
        { status: 500 }
      );
    }

    // Process data for different widgets
    const analytics = processAnalytics(events || []);

    return NextResponse.json({
      ...analytics,
      period_days: days,
      total_events: events?.length || 0,
    });
  } catch (error) {
    console.error("[Analytics API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function processAnalytics(events: Array<{ id?: string; user_id?: string; session_id?: string; event_type: string; created_at: string; device_type?: string; user_role?: string; metadata?: Record<string, unknown> }>) {
  // Overview metrics
  const totalEvents = events.length;
  const uniqueUsers = new Set(events.map((e) => e.user_id).filter(Boolean)).size;
  const uniqueSessions = new Set(events.map((e) => e.session_id)).size;

  // Events by type
  const eventsByType: Record<string, number> = {};
  events.forEach((e) => {
    eventsByType[e.event_type] = (eventsByType[e.event_type] || 0) + 1;
  });

  // Events by day (last 30 days max)
  const eventsByDay: Record<string, number> = {};
  events.forEach((e) => {
    const day = new Date(e.created_at).toISOString().split("T")[0];
    eventsByDay[day] = (eventsByDay[day] || 0) + 1;
  });

  // Popular shortcuts
  const shortcutEvents = events.filter((e) =>
    e.event_type.startsWith("shortcut_")
  );
  const shortcutClicks: Record<string, number> = {};
  shortcutEvents.forEach((e) => {
    const shortcut = e.event_type.replace("shortcut_", "").replace("_click", "");
    shortcutClicks[shortcut] = (shortcutClicks[shortcut] || 0) + 1;
  });

  // CRUD activity
  const crudEvents = events.filter((e) =>
    ["project_create", "project_edit", "project_delete", "project_clone"].includes(
      e.event_type
    )
  );

  // Search patterns
  const searchEvents = events.filter((e) => e.event_type === "projects_search");
  const searchQueries: Record<string, number> = {};
  searchEvents.forEach((e) => {
    const query = e.metadata?.query as string | undefined;
    if (query) {
      searchQueries[query] = (searchQueries[query] || 0) + 1;
    }
  });

  // Top searches (sorted by count, top 10)
  const topSearches = Object.entries(searchQueries)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([query, count]) => ({ query, count }));

  // Device breakdown
  const deviceCounts: Record<string, number> = {};
  events.forEach((e) => {
    if (e.device_type) {
      deviceCounts[e.device_type] = (deviceCounts[e.device_type] || 0) + 1;
    }
  });

  // Recent activity (last 20 events)
  const recentActivity = events.slice(0, 20).map((e) => ({
    id: e.id,
    event_type: e.event_type,
    user_role: e.user_role,
    created_at: e.created_at,
    metadata: e.metadata,
  }));

  return {
    overview: {
      total_events: totalEvents,
      unique_users: uniqueUsers,
      unique_sessions: uniqueSessions,
      avg_events_per_session: uniqueSessions > 0 ? (totalEvents / uniqueSessions).toFixed(1) : "0",
    },
    events_by_day: Object.entries(eventsByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, count]) => ({ day, count })),
    events_by_type: Object.entries(eventsByType)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([type, count]) => ({ type, count })),
    popular_shortcuts: Object.entries(shortcutClicks)
      .sort(([, a], [, b]) => b - a)
      .map(([shortcut, clicks]) => ({ shortcut, clicks })),
    crud_activity: {
      creates: crudEvents.filter((e) => e.event_type === "project_create").length,
      edits: crudEvents.filter((e) => e.event_type === "project_edit").length,
      deletes: crudEvents.filter((e) => e.event_type === "project_delete").length,
      clones: crudEvents.filter((e) => e.event_type === "project_clone").length,
    },
    top_searches: topSearches,
    device_breakdown: Object.entries(deviceCounts).map(([device, count]) => ({
      device,
      count,
    })),
    recent_activity: recentActivity,
  };
}
