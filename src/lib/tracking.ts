/**
 * First-party analytics tracking utilities.
 * Used by SiteTracker and microsite components to send events
 * to /api/track via sendBeacon (non-blocking).
 */

const SESSION_KEY = "noddo_sid";
const VISITOR_KEY = "noddo_vid";

function generateId(): string {
  return crypto.randomUUID();
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = generateId();
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

export function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  let vid = localStorage.getItem(VISITOR_KEY);
  if (!vid) {
    vid = generateId();
    localStorage.setItem(VISITOR_KEY, vid);
  }
  return vid;
}

export function getDeviceType(): "desktop" | "mobile" | "tablet" {
  if (typeof window === "undefined") return "desktop";
  const w = window.screen.width;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

export function getUtmParams(): {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
} {
  if (typeof window === "undefined")
    return { utm_source: null, utm_medium: null, utm_campaign: null };
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
  };
}

interface TrackPayload {
  proyecto_id: string;
  event_type: string;
  page_path?: string;
  session_id: string;
  visitor_id: string;
  device_type: string;
  screen_width: number;
  metadata?: Record<string, unknown>;
  referrer?: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
}

/** Cached UTMs from initial page load (captured once, reused for all events) */
let cachedUtms: ReturnType<typeof getUtmParams> | null = null;

export function captureUtms(): void {
  if (typeof window === "undefined") return;
  if (!cachedUtms) cachedUtms = getUtmParams();
}

export function trackEvent(
  proyectoId: string,
  eventType: string,
  pagePath?: string,
  metadata?: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;

  // Ensure UTMs are captured on first call
  if (!cachedUtms) cachedUtms = getUtmParams();

  const payload: TrackPayload = {
    proyecto_id: proyectoId,
    event_type: eventType,
    page_path: pagePath || window.location.pathname,
    session_id: getSessionId(),
    visitor_id: getVisitorId(),
    device_type: getDeviceType(),
    screen_width: window.screen.width,
    referrer: document.referrer || undefined,
    utm_source: cachedUtms.utm_source,
    utm_medium: cachedUtms.utm_medium,
    utm_campaign: cachedUtms.utm_campaign,
    metadata,
  };

  const body = JSON.stringify(payload);

  // Use sendBeacon for non-blocking, survives page unloads
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
  } else {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      // Silently fail — analytics should never break the user experience
    });
  }
}
