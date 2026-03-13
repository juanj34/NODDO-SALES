import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const VALID_EVENT_TYPES = new Set([
  "pageview",
  "whatsapp_click",
  "brochure_download",
  "video_play",
  "cta_click",
  "recurso_download",
  "lead_submit",
  "tour_360_view",
]);

/* ── Bot detection ── */
const BOT_UA_REGEX =
  /bot|crawler|spider|crawling|googlebot|bingbot|yandexbot|slurp|duckduckbot|baiduspider|facebookexternalhit|twitterbot|linkedinbot|semrushbot|ahrefsbot|mj12bot|dotbot|petalbot|bytespider|headlesschrome|puppeteer|playwright|phantomjs/i;

function isBot(userAgent: string | null): boolean {
  if (!userAgent) return true; // No UA = likely bot
  return BOT_UA_REGEX.test(userAgent);
}

/* ── Simple in-memory rate limiter ── */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 100; // events per minute per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) return true;
  return false;
}

// Clean up stale entries every 5 minutes
if (typeof globalThis !== "undefined") {
  const cleanup = () => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap) {
      if (now > entry.resetAt) rateLimitMap.delete(key);
    }
  };
  setInterval(cleanup, 5 * 60_000).unref?.();
}

export async function POST(request: NextRequest) {
  try {
    const userAgent = request.headers.get("user-agent") || null;

    // Bot filter
    if (isBot(userAgent)) {
      return NextResponse.json({ ok: true }, { status: 202 }); // Accept silently, don't store
    }

    // Rate limit by IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const supabase = await createClient();
    const body = await request.json();

    // Support single event or batch
    const events = Array.isArray(body) ? body : [body];

    if (events.length === 0 || events.length > 50) {
      return NextResponse.json(
        { error: "Between 1 and 50 events required" },
        { status: 400 }
      );
    }

    // Server-side enrichment from request headers
    const country = request.headers.get("x-vercel-ip-country") || null;
    const city = request.headers.get("x-vercel-ip-city") || null;

    const rows = [];
    for (const event of events) {
      if (!event.proyecto_id || !event.event_type) continue;
      if (!VALID_EVENT_TYPES.has(event.event_type)) continue;
      if (!event.session_id) continue;

      rows.push({
        proyecto_id: event.proyecto_id,
        event_type: event.event_type,
        page_path: event.page_path || null,
        session_id: event.session_id,
        visitor_id: event.visitor_id || null,
        device_type: event.device_type || null,
        user_agent: userAgent,
        screen_width: event.screen_width || null,
        referrer: event.referrer || null,
        utm_source: event.utm_source || null,
        utm_medium: event.utm_medium || null,
        utm_campaign: event.utm_campaign || null,
        country,
        city,
        metadata: event.metadata || {},
      });
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: "No valid events" }, { status: 400 });
    }

    const { error } = await supabase.from("analytics_events").insert(rows);
    if (error) throw error;

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[track]", err);
    return NextResponse.json(
      { error: "Error" },
      { status: 500 }
    );
  }
}
