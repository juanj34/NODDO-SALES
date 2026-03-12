import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * ghl-slots — Proxy for GHL free-slots API
 * GET /ghl-slots?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Returns: { slots: { "YYYY-MM-DD": ["HH:MM", ...] }, timezone }
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GHL_BASE = "https://services.leadconnectorhq.com";
const CALENDAR_ID = Deno.env.get("GHL_CALENDAR_ID") || "YOUR_NODDO_CALENDAR_ID";
const TIMEZONE = Deno.env.get("GHL_TIMEZONE") || "America/Bogota";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const GHL_PIT_TOKEN = Deno.env.get("GHL_PIT_TOKEN")!;
    const url = new URL(req.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    if (!startDate || !endDate) {
      return new Response(
        JSON.stringify({
          error: "startDate and endDate are required (YYYY-MM-DD)",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // GHL API requires epoch milliseconds
    const startEpoch = new Date(startDate + "T00:00:00").getTime();
    const endEpoch = new Date(endDate + "T23:59:59").getTime();

    const ghlUrl = `${GHL_BASE}/calendars/${CALENDAR_ID}/free-slots?startDate=${startEpoch}&endDate=${endEpoch}&timezone=${TIMEZONE}`;

    const ghlRes = await fetch(ghlUrl, {
      headers: {
        Authorization: `Bearer ${GHL_PIT_TOKEN}`,
        Version: "2021-07-28",
        Accept: "application/json",
      },
    });

    if (!ghlRes.ok) {
      const errText = await ghlRes.text();
      console.error(`[ghl-slots] GHL API error ${ghlRes.status}:`, errText);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch availability",
          status: ghlRes.status,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const ghlData = await ghlRes.json();

    // GHL returns: { "YYYY-MM-DD": { "slots": ["2026-02-25T08:00:00+04:00", ...] } }
    const slots: Record<string, string[]> = {};

    for (const [dateKey, dayData] of Object.entries(ghlData)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) continue;
      const daySlots = (dayData as Record<string, unknown>)?.slots;
      if (!Array.isArray(daySlots)) continue;
      slots[dateKey] = daySlots
        .map((slot: unknown) => {
          const slotStr =
            typeof slot === "string"
              ? slot
              : (slot as Record<string, string>)?.start ||
                (slot as Record<string, string>)?.startTime ||
                "";
          if (!slotStr) return null;
          const match = slotStr.match(/T(\d{2}:\d{2})/);
          if (match) return match[1];
          if (/^\d{2}:\d{2}$/.test(slotStr)) return slotStr;
          return null;
        })
        .filter(Boolean) as string[];
    }

    return new Response(JSON.stringify({ slots, timezone: TIMEZONE }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[ghl-slots] Error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
