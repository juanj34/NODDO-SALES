import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/marketing/ghl — Proxy to ghl-contact edge function.
 *
 * Adds the service role key server-side so the frontend never exposes it.
 * Public endpoint (no auth required) — used by marketing site forms/tracking.
 *
 * Rate limited by IP: max 10 requests per minute.
 */

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT;
}

export async function POST(req: NextRequest) {
  // Rate limit by IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("[api/marketing/ghl] Missing Supabase env vars");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  try {
    const body = await req.json();

    // Validate minimum fields
    if (!body.email || !body.name) {
      return NextResponse.json(
        { error: "email and name are required" },
        { status: 400 }
      );
    }

    // Forward to edge function
    const edgeRes = await fetch(`${SUPABASE_URL}/functions/v1/ghl-contact`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await edgeRes.json();

    if (!edgeRes.ok) {
      console.error("[api/marketing/ghl] Edge function error:", data);
      return NextResponse.json(data, { status: edgeRes.status });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
