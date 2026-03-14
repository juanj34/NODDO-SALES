/**
 * Marketing tracking utilities for NODDO's marketing site.
 *
 * Fires events to 3 systems in parallel:
 * 1. First-party analytics (existing /api/track)
 * 2. Meta Pixel (client-side fbq)
 * 3. GA4 dataLayer (via GTM)
 *
 * Also handles Meta CAPI (server-side) for high-value conversion events.
 */

// ─── Types ──────────────────────────────────────────────────────────────

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    dataLayer?: Record<string, unknown>[];
  }
}

type MarketingEvent =
  | "page_view"
  | "booking_opened"
  | "booking_date_selected"
  | "booking_time_selected"
  | "booking_confirmed"
  | "pricing_viewed"
  | "pricing_plan_clicked"
  | "demo_live_viewed"
  | "cta_clicked"
  | "thank_you_page_viewed"
  | "thank_you_video_played"
  | "thank_you_breakout_clicked";

interface CAPIEventData {
  eventName: string;
  eventId: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  country?: string;
  value?: number;
  currency?: string;
}

// ─── Meta Pixel helpers ─────────────────────────────────────────────────

function fireMetaPixel(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.fbq) {
    if (params) {
      window.fbq("track", eventName, params);
    } else {
      window.fbq("track", eventName);
    }
  }
}

// ─── GA4 / GTM dataLayer helpers ────────────────────────────────────────

function pushDataLayer(event: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined") {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...params });
  }
}

// ─── Cookie helpers for Meta CAPI ───────────────────────────────────────

export function getMetaCookies(): { fbp: string | null; fbc: string | null } {
  if (typeof document === "undefined") return { fbp: null, fbc: null };

  const cookies = document.cookie.split(";").reduce(
    (acc, c) => {
      const [key, ...val] = c.trim().split("=");
      acc[key] = val.join("=");
      return acc;
    },
    {} as Record<string, string>,
  );

  return {
    fbp: cookies["_fbp"] || null,
    fbc: cookies["_fbc"] || null,
  };
}

// ─── Generate dedup event ID ────────────────────────────────────────────

function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// ─── SHA-256 hash for CAPI PII ──────────────────────────────────────────

async function sha256(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.trim().toLowerCase());
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── CAPI server-side event ─────────────────────────────────────────────

export async function sendCAPIEvent(data: CAPIEventData) {
  try {
    const { fbp, fbc } = getMetaCookies();

    const body: Record<string, unknown> = {
      eventName: data.eventName,
      eventId: data.eventId,
      eventTime: Math.floor(Date.now() / 1000),
      eventSourceUrl: window.location.href,
      fbp,
      fbc,
      userAgent: navigator.userAgent,
    };

    if (data.email) body.emailHash = await sha256(data.email);
    if (data.phone) body.phoneHash = await sha256(data.phone);
    if (data.firstName) body.fnHash = await sha256(data.firstName);
    if (data.lastName) body.lnHash = await sha256(data.lastName);
    if (data.city) body.cityHash = await sha256(data.city);
    if (data.country) body.countryHash = await sha256(data.country);
    if (data.value !== undefined) body.value = data.value;
    if (data.currency) body.currency = data.currency;

    // Fire-and-forget to our CAPI proxy
    fetch("/api/marketing/capi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {
      // Silent fail — CAPI is non-blocking
    });
  } catch {
    // Silent fail
  }
}

// ─── GHL push (fire-and-forget) ────────────────────────────────────────

/**
 * Push event data to GHL via our proxy route.
 * Only works if the user has already identified (email stored in localStorage).
 * For identified pushes, call pushToGHLIdentified with explicit contact data.
 */
export function pushToGHL(data: {
  tags?: string[];
  note?: string;
  customFields?: Record<string, string>;
  pipeline?: { stageId: string; name?: string; monetaryValue?: number };
}) {
  if (typeof window === "undefined") return;

  // Only push if we have a stored contact
  try {
    const stored = localStorage.getItem("noddo_ghl_contact");
    if (!stored) return;

    const { email } = JSON.parse(stored);
    if (!email) return;

    fetch("/api/marketing/ghl", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        name: email.split("@")[0], // Fallback — GHL will match by email
        ...data,
      }),
      keepalive: true,
    }).catch(() => {
      // Silent fail
    });
  } catch {
    // Silent fail
  }
}

/**
 * Push to GHL with explicit contact data (for forms/bookings).
 */
export function pushToGHLIdentified(data: {
  email: string;
  name: string;
  phone?: string;
  company?: string;
  tags?: string[];
  note?: string;
  customFields?: Record<string, string>;
  pipeline?: { stageId: string; name?: string; monetaryValue?: number };
  source?: string;
}) {
  if (typeof window === "undefined") return;

  fetch("/api/marketing/ghl", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    keepalive: true,
  }).catch(() => {
    // Silent fail
  });
}

// ─── Main tracking function ─────────────────────────────────────────────

export function trackMarketingEvent(
  event: MarketingEvent,
  params?: Record<string, unknown>,
) {
  // 1. GA4 dataLayer push
  pushDataLayer(event, params);

  // 2. Meta Pixel events (mapped from internal event names)
  switch (event) {
    case "booking_opened":
      fireMetaPixel("InitiateCheckout");
      break;
    case "booking_confirmed":
      fireMetaPixel("Schedule");
      fireMetaPixel("Lead", { value: 100, currency: "USD" });
      break;
    case "pricing_viewed":
      fireMetaPixel("ViewContent", { content_name: "pricing" });
      break;
    case "pricing_plan_clicked":
      fireMetaPixel("ViewContent", {
        content_name: `plan-${params?.plan || "unknown"}`,
        value: params?.value,
        currency: "USD",
      });
      break;
    case "demo_live_viewed":
      fireMetaPixel("ViewContent", { content_name: "demo-live" });
      break;
  }

  // 3. First-party beacon (reuse existing /api/track)
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    const payload = JSON.stringify({
      event_type: event,
      page_path: typeof window !== "undefined" ? window.location.pathname : "/",
      metadata: params || {},
    });
    navigator.sendBeacon("/api/track", payload);
  }
}

// ─── Convenience functions ──────────────────────────────────────────────

export function trackBookingOpened() {
  trackMarketingEvent("booking_opened");
}

export function trackBookingDateSelected(date: string) {
  trackMarketingEvent("booking_date_selected", { date });
}

export function trackBookingTimeSelected(time: string) {
  trackMarketingEvent("booking_time_selected", { time });
}

export function trackBookingConfirmed(data: {
  email: string;
  name: string;
  phone?: string;
}) {
  const eventId = generateEventId();

  trackMarketingEvent("booking_confirmed", {
    event_id: eventId,
    email_provided: true,
  });

  // Fire Meta CAPI server-side event for dedup
  const nameParts = data.name.trim().split(/\s+/);
  sendCAPIEvent({
    eventName: "Lead",
    eventId,
    email: data.email,
    phone: data.phone,
    firstName: nameParts[0],
    lastName: nameParts.slice(1).join(" ") || undefined,
    value: 100,
    currency: "USD",
  });
}

export function trackPricingViewed() {
  trackMarketingEvent("pricing_viewed");
}

export function trackCTAClicked(ctaName: string) {
  trackMarketingEvent("cta_clicked", { cta_name: ctaName });
}

export function trackPricingPlanClicked(plan: string, value: number) {
  trackMarketingEvent("pricing_plan_clicked", { plan, value });

  // Push to GHL if contact is known
  pushToGHL({
    tags: [`plan-${plan}`],
    note: `Interesado en Plan ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
  });
}

export function trackDemoLiveViewed() {
  trackMarketingEvent("demo_live_viewed");

  // Push to GHL if contact is known
  pushToGHL({
    tags: ["demo-live-viewed"],
    note: "Vio demo en vivo",
  });
}

export function trackThankYouPageViewed() {
  trackMarketingEvent("thank_you_page_viewed");
}

export function trackThankYouVideoPlayed(videoId?: string) {
  trackMarketingEvent("thank_you_video_played", { video_id: videoId });
}

export function trackBreakoutVideoClicked(videoId: string) {
  trackMarketingEvent("thank_you_breakout_clicked", { video_id: videoId });
}
