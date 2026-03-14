import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * ghl-contact — Central GHL motor for NODDO marketing.
 *
 * Creates/updates contacts in GoHighLevel with tags, custom fields,
 * pipeline opportunities, and activity notes.
 *
 * POST /ghl-contact
 * Body: {
 *   email, name, phone?, company?,
 *   tags?, customFields?,
 *   pipeline?: { stageId, name?, monetaryValue? },
 *   source?, utm?: { source?, medium?, campaign? },
 *   note?
 * }
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GHL_BASE = "https://services.leadconnectorhq.com";

interface ContactPayload {
  email: string;
  name: string;
  phone?: string;
  company?: string;
  tags?: string[];
  customFields?: Record<string, string>;
  pipeline?: {
    stageId: string;
    name?: string;
    monetaryValue?: number;
  };
  source?: string;
  utm?: { source?: string; medium?: string; campaign?: string };
  note?: string;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "POST only" }, 405);
  }

  try {
    const GHL_PIT_TOKEN = Deno.env.get("GHL_PIT_TOKEN");
    const GHL_LOCATION_ID = Deno.env.get("GHL_LOCATION_ID");
    const GHL_PIPELINE_ID = Deno.env.get("GHL_PIPELINE_ID");

    if (!GHL_PIT_TOKEN || !GHL_LOCATION_ID) {
      console.error("[ghl-contact] Missing GHL_PIT_TOKEN or GHL_LOCATION_ID");
      return json({ error: "GHL not configured" }, 503);
    }

    const ghlHeaders = {
      Authorization: `Bearer ${GHL_PIT_TOKEN}`,
      Version: "2021-07-28",
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const payload: ContactPayload = await req.json();
    const { email, name, phone, company, tags, customFields, pipeline, source, utm, note } = payload;

    if (!email || !name) {
      return json({ error: "email and name are required" }, 400);
    }

    // ── Step 1: Upsert contact ──────────────────────────────────────────

    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || name;
    const lastName = nameParts.slice(1).join(" ") || "";

    const contactBody: Record<string, unknown> = {
      email,
      firstName,
      lastName,
      locationId: GHL_LOCATION_ID,
      source: source || "NODDO Marketing",
    };

    if (phone) contactBody.phone = phone;
    if (company) contactBody.companyName = company;
    if (tags?.length) contactBody.tags = tags;

    // Custom fields (GHL expects array of { id, value } or { key, field_value })
    if (customFields && Object.keys(customFields).length > 0) {
      contactBody.customFields = Object.entries(customFields).map(
        ([key, value]) => ({ key, field_value: value })
      );
    }

    const contactRes = await fetch(`${GHL_BASE}/contacts/upsert`, {
      method: "POST",
      headers: ghlHeaders,
      body: JSON.stringify(contactBody),
    });

    const contactData = await contactRes.json();
    const contactId = contactData?.contact?.id;

    if (!contactId) {
      console.error("[ghl-contact] Contact upsert failed:", JSON.stringify(contactData));
      return json({ error: "Contact upsert failed", details: contactData }, 502);
    }

    // If tags provided and contact already existed, add tags separately
    // (upsert may not merge tags for existing contacts)
    if (tags?.length && !contactData?.new) {
      fetch(`${GHL_BASE}/contacts/${contactId}/tags`, {
        method: "POST",
        headers: ghlHeaders,
        body: JSON.stringify({ tags }),
      }).catch((err) => console.error("[ghl-contact] Tag add failed:", err));
    }

    // ── Step 2: Create/update pipeline opportunity (optional) ───────────

    let opportunityId: string | null = null;

    if (pipeline?.stageId && GHL_PIPELINE_ID) {
      const oppBody: Record<string, unknown> = {
        pipelineId: GHL_PIPELINE_ID,
        locationId: GHL_LOCATION_ID,
        contactId,
        name: pipeline.name || company || `${firstName} ${lastName}`.trim(),
        pipelineStageId: pipeline.stageId,
        status: "open",
      };

      if (pipeline.monetaryValue !== undefined) {
        oppBody.monetaryValue = pipeline.monetaryValue;
      }

      if (utm?.source) oppBody.source = utm.source;
      else if (source) oppBody.source = source;

      const oppRes = await fetch(`${GHL_BASE}/opportunities/upsert`, {
        method: "POST",
        headers: ghlHeaders,
        body: JSON.stringify(oppBody),
      });

      const oppData = await oppRes.json();
      opportunityId = oppData?.opportunity?.id || oppData?.id || null;

      if (!oppRes.ok) {
        console.error("[ghl-contact] Opportunity upsert failed:", JSON.stringify(oppData));
        // Non-blocking — contact was created, opportunity is bonus
      }
    }

    // ── Step 3: Add note (optional) ─────────────────────────────────────

    if (note) {
      fetch(`${GHL_BASE}/contacts/${contactId}/notes`, {
        method: "POST",
        headers: ghlHeaders,
        body: JSON.stringify({ body: note, userId: contactId }),
      }).catch((err) => console.error("[ghl-contact] Note add failed:", err));
    }

    // ── Step 4: Add UTM as note if present ──────────────────────────────

    if (utm && (utm.source || utm.medium || utm.campaign)) {
      const utmNote = [
        utm.source && `Source: ${utm.source}`,
        utm.medium && `Medium: ${utm.medium}`,
        utm.campaign && `Campaign: ${utm.campaign}`,
      ]
        .filter(Boolean)
        .join(" | ");

      if (utmNote) {
        fetch(`${GHL_BASE}/contacts/${contactId}/notes`, {
          method: "POST",
          headers: ghlHeaders,
          body: JSON.stringify({ body: `UTM Attribution: ${utmNote}` }),
        }).catch((err) => console.error("[ghl-contact] UTM note failed:", err));
      }
    }

    return json({
      success: true,
      contactId,
      opportunityId,
      isNew: !!contactData?.new,
    });
  } catch (err) {
    console.error("[ghl-contact] Error:", err);
    return json({ error: "Internal error" }, 500);
  }
});
