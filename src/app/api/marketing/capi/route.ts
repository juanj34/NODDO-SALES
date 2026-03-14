import { NextRequest, NextResponse } from "next/server";

/**
 * Meta Conversions API (CAPI) proxy.
 *
 * Receives pre-hashed PII from the client and forwards events
 * to Meta's server-side Conversions API for deduplication with Pixel.
 *
 * POST /api/marketing/capi
 */

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const META_CAPI_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;

interface CAPIRequestBody {
  eventName: string;
  eventId: string;
  eventTime: number;
  eventSourceUrl: string;
  userAgent?: string;
  fbp?: string | null;
  fbc?: string | null;
  emailHash?: string;
  phoneHash?: string;
  fnHash?: string;
  lnHash?: string;
  cityHash?: string;
  countryHash?: string;
  value?: number;
  currency?: string;
}

export async function POST(req: NextRequest) {
  // Skip if not configured
  if (!META_PIXEL_ID || !META_CAPI_TOKEN) {
    return NextResponse.json({ skipped: true }, { status: 200 });
  }

  try {
    const body: CAPIRequestBody = await req.json();

    // Build user_data with pre-hashed values
    const userData: Record<string, unknown> = {
      client_ip_address:
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "0.0.0.0",
      client_user_agent: body.userAgent || req.headers.get("user-agent") || "",
    };

    if (body.emailHash) userData.em = [body.emailHash];
    if (body.phoneHash) userData.ph = [body.phoneHash];
    if (body.fnHash) userData.fn = [body.fnHash];
    if (body.lnHash) userData.ln = [body.lnHash];
    if (body.cityHash) userData.ct = [body.cityHash];
    if (body.countryHash) userData.country = [body.countryHash];
    if (body.fbp) userData.fbp = body.fbp;
    if (body.fbc) userData.fbc = body.fbc;

    // Build event payload
    const eventPayload: Record<string, unknown> = {
      event_name: body.eventName,
      event_time: body.eventTime || Math.floor(Date.now() / 1000),
      event_id: body.eventId,
      event_source_url: body.eventSourceUrl,
      action_source: "website",
      user_data: userData,
    };

    if (body.value !== undefined) {
      eventPayload.custom_data = {
        value: body.value,
        currency: body.currency || "USD",
      };
    }

    // Send to Meta Conversions API
    const capiUrl = `https://graph.facebook.com/v21.0/${META_PIXEL_ID}/events`;

    const res = await fetch(capiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [eventPayload],
        access_token: META_CAPI_TOKEN,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[CAPI] Meta API error:", err);
      return NextResponse.json({ error: "CAPI failed" }, { status: 502 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[CAPI] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
