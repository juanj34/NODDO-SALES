import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * ghl-book — Create a GHL appointment for NODDO demo booking.
 *
 * POST /ghl-book
 * Body: { name, email, phone?, startTime, endTime, company?, whatsappOptin?, utmSource?, utmMedium?, utmCampaign?, referrer?, visitorId? }
 *
 * Steps:
 * 1. Upsert contact in GHL -> get contactId
 * 2. Create appointment via GHL Calendars API
 * 3. Save appointment in Supabase (appointments table)
 * 4. Trigger booking-handler for confirmation emails (fire-and-forget)
 * 5. Return { success, appointmentId }
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GHL_BASE = "https://services.leadconnectorhq.com";
const CALENDAR_ID = Deno.env.get("GHL_CALENDAR_ID") || "3DFQdv2pBoX6pJF7ix9m";

interface BookingPayload {
  name: string;
  email: string;
  phone?: string;
  startTime: string;
  endTime: string;
  company?: string;
  whatsappOptin?: boolean;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
  visitorId?: string;
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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const ghlHeaders = {
      Authorization: `Bearer ${GHL_PIT_TOKEN}`,
      Version: "2021-07-28",
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const payload: BookingPayload = await req.json();
    const {
      name, email, phone, startTime, endTime, company,
      whatsappOptin, utmSource, utmMedium, utmCampaign, referrer, visitorId,
    } = payload;

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

    // Extract meeting link from GHL response (Zoom/Meet integration)
    const meetingLink =
      apptData?.meetingLink ||
      apptData?.appointment?.meetingLink ||
      apptData?.calendarData?.meetingLink ||
      apptData?.locationUrl ||
      null;

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

    // Step 2.5: Create pipeline opportunity + add tags (fire-and-forget)
    const GHL_PIPELINE_ID = Deno.env.get("GHL_PIPELINE_ID");
    const GHL_STAGE_DEMO_AGENDADO = Deno.env.get("GHL_STAGE_DEMO_AGENDADO");

    if (GHL_PIPELINE_ID && GHL_STAGE_DEMO_AGENDADO) {
      fetch(`${GHL_BASE}/opportunities/upsert`, {
        method: "POST",
        headers: ghlHeaders,
        body: JSON.stringify({
          pipelineId: GHL_PIPELINE_ID,
          locationId: GHL_LOCATION_ID,
          contactId,
          name: `Demo — ${company || firstName}`,
          pipelineStageId: GHL_STAGE_DEMO_AGENDADO,
          status: "open",
          monetaryValue: 149,
          source: utmSource || "booking",
        }),
      }).catch((err) =>
        console.error("[ghl-book] Pipeline opportunity failed:", err)
      );

      // Add demo-booked tag
      fetch(`${GHL_BASE}/contacts/${contactId}/tags`, {
        method: "POST",
        headers: ghlHeaders,
        body: JSON.stringify({ tags: ["demo-booked"] }),
      }).catch((err) =>
        console.error("[ghl-book] Tag add failed:", err)
      );
    }

    // Step 3: Save appointment in Supabase (fire-and-forget — don't block response)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const appointmentRow = {
      nombre: name,
      email,
      telefono: phone || null,
      empresa: company || null,
      whatsapp_optin: whatsappOptin || false,
      ghl_appointment_id: appointmentId || "unknown",
      ghl_contact_id: contactId,
      scheduled_for: startTime,
      duration_minutes: 30,
      timezone: "America/Bogota",
      status: "confirmed",
      utm_source: utmSource || null,
      utm_medium: utmMedium || null,
      utm_campaign: utmCampaign || null,
      referrer: referrer || null,
      visitor_id: visitorId || null,
      meeting_link: meetingLink,
    };

    // Insert appointment — don't await to avoid blocking
    const insertPromise = supabase
      .from("appointments")
      .insert(appointmentRow)
      .select("id")
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error("[ghl-book] Failed to save appointment:", error.message);
          return;
        }

        // Step 4: Trigger booking-handler for confirmations (fire-and-forget)
        const handlerUrl = `${SUPABASE_URL}/functions/v1/booking-handler`;
        fetch(handlerUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "confirmation",
            appointmentId: data.id,
          }),
        }).catch((err) =>
          console.error("[ghl-book] Failed to trigger booking-handler:", err)
        );
      });

    // Don't block the response — let it run in background
    // Deno edge functions will keep running until all promises settle
    insertPromise.catch((err) =>
      console.error("[ghl-book] Appointment save error:", err)
    );

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
