/**
 * Dashboard analytics tracking utilities.
 * Tracks admin/collaborator actions within the dashboard.
 */

import { getSessionId, getVisitorId, getDeviceType } from "./tracking";

export type DashboardEventType =
  // Navigation
  | "dashboard_view"
  | "projects_view"
  | "project_detail_view"
  // Project actions
  | "project_create"
  | "project_edit"
  | "project_delete"
  | "project_clone"
  | "project_publish"
  | "project_archive"
  // Search & filters
  | "projects_search"
  | "projects_filter_status"
  | "projects_sort"
  // Shortcuts
  | "shortcut_leads_click"
  | "shortcut_analytics_click"
  | "shortcut_disponibilidad_click"
  | "shortcut_cotizador_click"
  // Table interactions
  | "project_table_row_select"
  | "project_table_edit_click"
  | "project_table_delete_click"
  | "project_table_clone_click";

interface DashboardTrackPayload {
  event_type: DashboardEventType;
  user_id?: string;
  user_role?: "admin" | "colaborador";
  page_path?: string;
  session_id: string;
  visitor_id: string;
  device_type: string;
  screen_width: number;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Track a dashboard event.
 * Sends analytics data to /api/track/dashboard endpoint.
 */
export function trackDashboardEvent(
  eventType: DashboardEventType,
  metadata?: Record<string, unknown>,
  userId?: string,
  userRole?: "admin" | "colaborador"
): void {
  if (typeof window === "undefined") return;

  // Skip tracking in development (optional - remove to track in dev)
  if (process.env.NODE_ENV === "development") {
    console.log("[Dashboard Analytics]", eventType, metadata);
    return;
  }

  const payload: DashboardTrackPayload = {
    event_type: eventType,
    user_id: userId,
    user_role: userRole,
    page_path: window.location.pathname,
    session_id: getSessionId(),
    visitor_id: getVisitorId(),
    device_type: getDeviceType(),
    screen_width: window.screen.width,
    metadata,
    timestamp: new Date().toISOString(),
  };

  const body = JSON.stringify(payload);

  // Use sendBeacon for non-blocking, survives page unloads
  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      "/api/track/dashboard",
      new Blob([body], { type: "application/json" })
    );
  } else {
    fetch("/api/track/dashboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      // Silently fail — analytics should never break the user experience
    });
  }
}

/**
 * Hook wrapper for easier usage in components.
 * Returns a track function bound to the current user.
 */
export function useDashboardTracking(
  userId?: string,
  userRole?: "admin" | "colaborador"
) {
  return {
    track: (eventType: DashboardEventType, metadata?: Record<string, unknown>) => {
      trackDashboardEvent(eventType, metadata, userId, userRole);
    },
  };
}
