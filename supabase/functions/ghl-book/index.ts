import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * ghl-book — Create a GHL appointment for NODDO demo booking.
 *
 * POST /ghl-book
 * Body: { name, email, phone?, startTime, endTime, company? }
 *
 * Steps:
 * 1. Upsert contact in GHL -> get contactId
 * 2. Create appointment via GHL Calendars API
 * 3. Return { success, appointmentId }
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GHL_BASE = "https://services.leadconnectorhq.com";
const CALENDAR_ID = Deno.env.get("GHL_CALENDAR_ID") || "YOUR_NODDO_CALENDAR_ID";

interface BookingPayload {
  name: string;
  email: string;
  phone?: string;
  startTime: string;
  endTime: string;
  company?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const GHL_PIT_TOKEN = Deno.env.get("GHL_PIT_TOKEN")!;
    const GHL_LOCATION_ID = Deno.env.get("GHL_LOCATION_ID")!;

    const ghlHeaders = {
      Authorization: `Bearer ${GHL_PIT_TOKEN}`,
      Version: "2021-07-28",
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const payload: BookingPayload = await req.json();
    const { name, email, phone, startTime, endTime, company } = payload;

    if (!name || !email || !startTime || !endTime) {
      return new Response(
        JSON.stringify({
          error: "name, email, startTime, endTime are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Step 1: Upsert contact
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || name;
    const lastName = nameParts.slice(1).join(" ") || "";

    const contactBody: Record<string, unknown> = {
      email,
      firstName,
      lastName,
      locationId: GHL_LOCATION_ID,
      source: "NODDO Marketing Website",
    };
    if (phone) contactBody.phone = phone;
    if (company) contactBody.companyName = company;

    const contactRes = await fetch(`${GHL_BASE}/contacts/upsert`, {
      method: "POST",
      headers: ghlHeaders,
      body: JSON.stringify(contactBody),
    });

    const contactData = await contactRes.json();
    const contactId = contactData?.contact?.id;

    if (!contactId) {
      console.error(
        "[ghl-book] Contact upsert failed:",
        JSON.stringify(contactData)
      );
      return new Response(
        JSON.stringify({ error: "Contact upsert failed" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Create appointment
    const appointmentBody = {
      calendarId: CALENDAR_ID,
      locationId: GHL_LOCATION_ID,
      contactId,
      startTime,
      endTime,
      title: `Demo NODDO — ${firstName}`,
      appointmentStatus: "confirmed",
      address: "Videollamada (enlace por email)",
    };

    const apptRes = await fetch(
      `${GHL_BASE}/calendars/events/appointments`,
      {
        method: "POST",
        headers: ghlHeaders,
        body: JSON.stringify(appointmentBody),
      }
    );

    const apptData = await apptRes.json();
    const appointmentId =
      apptData?.id || apptData?.event?.id || apptData?.appointment?.id;

    if (!apptRes.ok) {
      console.error(
        "[ghl-book] Appointment creation failed:",
        JSON.stringify(apptData)
      );
      return new Response(
        JSON.stringify({
          error: "Appointment creation failed",
          details: apptData,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        appointmentId: appointmentId || "created",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[ghl-book] Error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
