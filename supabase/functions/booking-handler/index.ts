import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * booking-handler — Post-booking automation for NODDO demos.
 *
 * Actions:
 *   POST ?action=confirmation  — Send confirmation email + admin notification + WhatsApp + compute sequence plan
 *   POST ?action=sequence      — Send pre-call objection-breaking email sequence (called by pg_cron)
 *   POST ?action=noshow        — Detect no-shows and send follow-up (called by pg_cron)
 *
 * Note: 24h/2h reminders are handled by GHL Calendar native reminders.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ─── Resend email sending ────────────────────────────────────────────────

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") || "NODDO <notificaciones@noddo.io>";
const ADMIN_EMAIL = Deno.env.get("NODDO_ADMIN_EMAIL") || "hola@noddo.io";
const APP_URL = Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://noddo.io";
const MEETING_LINK = Deno.env.get("NODDO_MEETING_LINK") || "";
const WHATSAPP_SUPPORT = Deno.env.get("WHATSAPP_SUPPORT_NUMBER") || "+1234567890";

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.warn("[booking-handler] RESEND_API_KEY not configured — skipping email");
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to,
      subject,
      html,
      headers: {
        "List-Unsubscribe": "<mailto:hola@noddo.io?subject=Cancelar%20suscripcion>",
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[booking-handler] Resend error: ${err}`);
  }
}

// ─── Email templates ────────────────────────────────────────────────────

function formatDateTime(isoString: string, timezone: string): { date: string; time: string } {
  const d = new Date(isoString);
  const date = new Intl.DateTimeFormat("es-CO", {
    weekday: "long", day: "numeric", month: "long", timeZone: timezone,
  }).format(d);
  const time = new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit", minute: "2-digit", hour12: true, timeZone: timezone,
  }).format(d);
  return { date: date.charAt(0).toUpperCase() + date.slice(1), time };
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function emailWrapper(heading: string, bodyRows: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" border="0" style="background-color:#141414;border:1px solid #222222;border-radius:16px;overflow:hidden;max-width:520px;width:100%;">
        <tr><td style="height:3px;background-color:#b8973a;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td align="center" style="padding:40px 40px 8px;">
          <img src="https://noddo.io/LOGO_LOGO-WHITE.svg" alt="NODDO" width="140" height="22" style="display:block;border:0;outline:none;" />
        </td></tr>
        <tr><td align="center" style="padding:16px 40px 4px;">
          <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:300;color:#f4f0e8;letter-spacing:0.02em;">
            ${heading}
          </h1>
        </td></tr>
        <tr><td align="center" style="padding:4px 40px 24px;">
          <span style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#b8973a;font-weight:600;">NODDO</span>
        </td></tr>
        ${bodyRows}
        <tr><td style="padding:0 40px;"><div style="height:1px;background-color:#222222;"></div></td></tr>
        <tr><td style="padding:24px 40px 12px;">
          <p style="margin:0;font-size:11px;color:#5a5550;text-align:center;line-height:1.6;">
            Noddo Technologies SAS &middot; Bogot&aacute;, Colombia
          </p>
        </td></tr>
        <tr><td style="padding:0 40px 12px;">
          <p style="margin:0;font-size:11px;text-align:center;line-height:1.6;">
            <a href="https://noddo.io/privacidad" style="color:#5a5550;text-decoration:underline;">Privacidad</a>
            <span style="color:#3a3530;"> &middot; </span>
            <a href="https://noddo.io/terminos" style="color:#5a5550;text-decoration:underline;">T&eacute;rminos</a>
            <span style="color:#3a3530;"> &middot; </span>
            <a href="mailto:hola@noddo.io" style="color:#5a5550;text-decoration:underline;">hola@noddo.io</a>
          </p>
        </td></tr>
        <tr><td style="padding:0 40px 32px;">
          <p style="margin:0;font-size:10px;text-align:center;line-height:1.5;">
            <a href="mailto:hola@noddo.io?subject=Cancelar%20suscripci%C3%B3n" style="color:#3a3530;text-decoration:underline;">Cancelar suscripci&oacute;n</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function ctaButton(href: string, label: string): string {
  return `<tr><td align="center" style="padding:0 40px 32px;">
    <table cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="background-color:#b8973a;border-radius:8px;">
          <a href="${href}" target="_blank" style="display:inline-block;padding:14px 40px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;color:#141414;text-decoration:none;">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>
  </td></tr>`;
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 16px;font-size:11px;color:#5a5550;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;vertical-align:top;width:140px;">${label}</td>
    <td style="padding:8px 16px;font-size:13px;color:#f4f0e8;font-weight:300;">${escapeHtml(value)}</td>
  </tr>`;
}

function detailTable(rows: string[]): string {
  return `<tr><td style="padding:0 24px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#1a1a1a;border:1px solid #222222;border-radius:12px;overflow:hidden;">
      ${rows.join("")}
    </table>
  </td></tr>`;
}

// ─── WhatsApp via GHL ───────────────────────────────────────────────────

async function sendWhatsApp(contactId: string, message: string) {
  const GHL_PIT_TOKEN = Deno.env.get("GHL_PIT_TOKEN");
  if (!GHL_PIT_TOKEN) {
    console.warn("[booking-handler] GHL_PIT_TOKEN not configured — skipping WhatsApp");
    return;
  }

  try {
    const res = await fetch("https://services.leadconnectorhq.com/conversations/messages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GHL_PIT_TOKEN}`,
        Version: "2021-07-28",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        type: "WhatsApp",
        contactId,
        message,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`[booking-handler] GHL WhatsApp error: ${err}`);
    }
  } catch (err) {
    console.error("[booking-handler] WhatsApp send failed:", err);
  }
}

// ─── GHL Pipeline helpers ────────────────────────────────────────────────

const GHL_BASE = "https://services.leadconnectorhq.com";

function getGHLHeaders() {
  const token = Deno.env.get("GHL_PIT_TOKEN");
  if (!token) return null;
  return {
    Authorization: `Bearer ${token}`,
    Version: "2021-07-28",
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function addGHLTags(contactId: string, tags: string[]) {
  const headers = getGHLHeaders();
  if (!headers || !contactId) return;

  fetch(`${GHL_BASE}/contacts/${contactId}/tags`, {
    method: "POST",
    headers,
    body: JSON.stringify({ tags }),
  }).catch((err) => console.error("[booking-handler] GHL tag add failed:", err));
}

async function moveGHLOpportunity(contactId: string, stageId: string) {
  const headers = getGHLHeaders();
  const pipelineId = Deno.env.get("GHL_PIPELINE_ID");
  const locationId = Deno.env.get("GHL_LOCATION_ID");
  if (!headers || !pipelineId || !locationId || !contactId) return;

  try {
    const searchRes = await fetch(
      `${GHL_BASE}/opportunities/search?location_id=${locationId}&pipeline_id=${pipelineId}&contact_id=${contactId}`,
      { headers },
    );
    const searchData = await searchRes.json();
    const oppId = searchData?.opportunities?.[0]?.id;

    if (oppId) {
      await fetch(`${GHL_BASE}/opportunities/${oppId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ pipelineStageId: stageId }),
      });
    }
  } catch (err) {
    console.error("[booking-handler] GHL opportunity move failed:", err);
  }
}

// ─── Action handlers ────────────────────────────────────────────────────

interface Appointment {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  empresa: string | null;
  whatsapp_optin: boolean;
  ghl_contact_id: string;
  scheduled_for: string;
  duration_minutes: number;
  timezone: string;
  status: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  reminder_24h_sent: boolean;
  reminder_2h_sent: boolean;
  reminder_wa_sent: boolean;
  confirmation_email_sent: boolean;
  admin_notified: boolean;
  no_show_count: number;
  no_show_followup_sent: boolean;
  sequence_plan: SequenceEntry[];
  sequence_emails_sent: number;
  meeting_link: string | null;
}

interface SequenceEntry {
  email: number;
  send_at: string;
  sent: boolean;
  sent_at: string | null;
}

async function handleConfirmation(
  supabase: ReturnType<typeof createClient>,
  appointmentId: string,
) {
  const { data: appt, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", appointmentId)
    .single();

  if (error || !appt) {
    console.error("[booking-handler] Appointment not found:", appointmentId, error);
    return;
  }

  const a = appt as Appointment;
  const dt = formatDateTime(a.scheduled_for, a.timezone);
  const meetingLink = a.meeting_link || MEETING_LINK || `${APP_URL}/#booking`;

  // Build thank-you page URL with booking context
  const thankYouUrl = `${APP_URL}/demo-confirmada?name=${encodeURIComponent(a.nombre)}&date=${encodeURIComponent(a.scheduled_for.split("T")[0])}&time=${encodeURIComponent(dt.time)}`;

  // 1. Confirmation email to lead (with thank-you page CTA)
  if (!a.confirmation_email_sent) {
    const html = emailWrapper(
      "Tu demo est&aacute; confirmada",
      `<tr><td align="center" style="padding:0 40px 16px;">
        <p style="margin:0;font-size:14px;color:#f4f0e8;line-height:1.7;font-weight:300;">
          Hola ${escapeHtml(a.nombre)},
        </p>
      </td></tr>
      <tr><td align="center" style="padding:0 40px 24px;">
        <p style="margin:0;font-size:13px;color:#8a8580;line-height:1.7;">
          Tu demo con el equipo de NODDO ha sido agendada. Nos veremos para mostrarte c&oacute;mo crear un showroom digital premium para tus proyectos.
        </p>
      </td></tr>
      ${detailTable([
        detailRow("Fecha", dt.date),
        detailRow("Hora", `${dt.time} (${a.timezone})`),
        detailRow("Duraci&oacute;n", `${a.duration_minutes} minutos`),
        detailRow("Formato", "Videollamada"),
      ])}
      <tr><td align="center" style="padding:0 40px 20px;">
        <p style="margin:0;font-size:13px;color:#b8973a;line-height:1.6;">
          &Uacute;nete a m&aacute;s de 180 constructoras que ya transformaron su proceso comercial con NODDO.
        </p>
      </td></tr>
      <tr><td align="center" style="padding:0 40px 8px;">
        <p style="margin:0;font-size:12px;color:#b8973a;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;">
          Mientras tanto
        </p>
      </td></tr>
      <tr><td align="center" style="padding:0 40px 16px;">
        <p style="margin:0;font-size:13px;color:#8a8580;line-height:1.7;">
          Te enviamos 3 cosas para que llegues con todo claro:
        </p>
      </td></tr>
      ${bulletList([
        "Video de 2 min: C&oacute;mo funciona un showroom NODDO",
        "Respuestas a las 5 preguntas m&aacute;s frecuentes",
        "Casos reales: De 40 leads/mes a 180 en 6 semanas",
      ])}
      <tr><td align="center" style="padding:0 40px 12px;">
        <p style="margin:0;font-size:12px;color:#5a5550;line-height:1.6;">
          💡 <em>Tip:</em> Los directores que ven el contenido previo aprovechan 2x m&aacute;s la demo (hacen las preguntas correctas desde el minuto 1).
        </p>
      </td></tr>
      ${ctaButton(thankYouUrl, "Ver antes de la demo")}`,
    );

    await sendEmail(a.email, `Tu demo con NODDO — ${dt.date}`, html);
  }

  // 2. Admin notification
  if (!a.admin_notified) {
    const adminRows = [
      detailRow("Nombre", a.nombre),
      detailRow("Email", a.email),
    ];
    if (a.telefono) adminRows.push(detailRow("Tel&eacute;fono", a.telefono));
    if (a.empresa) adminRows.push(detailRow("Empresa", a.empresa));
    adminRows.push(detailRow("Fecha", dt.date));
    adminRows.push(detailRow("Hora", `${dt.time} (${a.timezone})`));
    if (a.utm_source) adminRows.push(detailRow("Fuente", `${a.utm_source} / ${a.utm_medium || "—"}`));
    if (a.utm_campaign) adminRows.push(detailRow("Campa&ntilde;a", a.utm_campaign));

    const adminHtml = emailWrapper(
      "Nueva demo agendada",
      `${detailTable(adminRows)}`,
    );

    const subject = `Nueva demo agendada — ${a.nombre}${a.empresa ? ` de ${a.empresa}` : ""}`;
    await sendEmail(ADMIN_EMAIL, subject, adminHtml);
  }

  // 3. WhatsApp confirmation (if opted in)
  if (a.whatsapp_optin && a.ghl_contact_id) {
    const waMsg = `Hola ${a.nombre.split(" ")[0]}! 🎉 Demo confirmada: ${dt.date} a las ${dt.time}.

Mientras tanto, te enviamos por email:
✓ Video de 2 min de cómo funciona NODDO
✓ Casos reales de constructoras como la tuya

Link de videollamada llegará 3h antes. ¿Alguna pregunta?`;
    await sendWhatsApp(a.ghl_contact_id, waMsg);
  }

  // 4. Compute pre-call email sequence plan
  const sequencePlan = computeSequencePlan(a.scheduled_for);

  // 5. Update flags + store sequence plan
  await supabase
    .from("appointments")
    .update({
      confirmation_email_sent: true,
      admin_notified: true,
      reminder_wa_sent: a.whatsapp_optin,
      sequence_plan: sequencePlan,
      sequence_emails_sent: 1, // E1 (confirmation) counts as sent
    })
    .eq("id", appointmentId);

  console.log(`[booking-handler] Confirmation sent for appointment ${appointmentId} — sequence plan: ${sequencePlan.length} emails`);
}

// ─── Sequence Plan Computation ───────────────────────────────────────

function computeSequencePlan(scheduledFor: string): SequenceEntry[] {
  const now = Date.now();
  const callTime = new Date(scheduledFor).getTime();
  const hoursUntilCall = (callTime - now) / (1000 * 60 * 60);

  const plan: SequenceEntry[] = [];

  // E1: Confirmation — already sent at this point
  plan.push({
    email: 1,
    send_at: new Date(now).toISOString(),
    sent: true,
    sent_at: new Date(now).toISOString(),
  });

  // E2: Pre-call video link (T+2h) — skip if call < 4h away
  if (hoursUntilCall > 4) {
    plan.push({
      email: 2,
      send_at: new Date(now + 2 * 3600000).toISOString(),
      sent: false,
      sent_at: null,
    });
  }

  // E3: External beliefs — objections (T+12h) — skip if call < 16h away
  if (hoursUntilCall > 16) {
    plan.push({
      email: 3,
      send_at: new Date(now + 12 * 3600000).toISOString(),
      sent: false,
      sent_at: null,
    });
  }

  // E4: Internal beliefs + testimonials (T+24h) — skip if call < 30h away
  if (hoursUntilCall > 30) {
    plan.push({
      email: 4,
      send_at: new Date(now + 24 * 3600000).toISOString(),
      sent: false,
      sent_at: null,
    });
  }

  // E5: Method beliefs — why NODDO (T+36h) — skip if call < 42h away
  if (hoursUntilCall > 42) {
    plan.push({
      email: 5,
      send_at: new Date(now + 36 * 3600000).toISOString(),
      sent: false,
      sent_at: null,
    });
  }

  // E6: Final anticipation (T-3h before call) — skip if call < 5h away
  if (hoursUntilCall > 5) {
    plan.push({
      email: 6,
      send_at: new Date(callTime - 3 * 3600000).toISOString(),
      sent: false,
      sent_at: null,
    });
  }

  return plan;
}

// ─── Pre-Call Email Sequence (Show Rate Optimization) ─────────────────

function bodyParagraph(text: string): string {
  return `<tr><td align="center" style="padding:0 40px 20px;">
    <p style="margin:0;font-size:13px;color:#8a8580;line-height:1.7;">${text}</p>
  </td></tr>`;
}

function sectionLabel(text: string): string {
  return `<tr><td align="center" style="padding:0 40px 8px;">
    <p style="margin:0;font-size:12px;color:#b8973a;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;">${text}</p>
  </td></tr>`;
}

function bulletList(items: string[]): string {
  const rows = items.map(
    (item) => `<tr><td style="padding:4px 0;font-size:13px;color:#8a8580;line-height:1.6;">&bull; ${item}</td></tr>`,
  ).join("");
  return `<tr><td style="padding:0 40px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>
  </td></tr>`;
}

function testimonialBlock(quote: string, name: string, role: string): string {
  return `<tr><td style="padding:0 24px 20px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#1a1a1a;border:1px solid #222222;border-radius:12px;overflow:hidden;">
      <tr><td style="padding:20px 20px 12px;">
        <p style="margin:0;font-size:13px;color:#f4f0e8;line-height:1.7;font-style:italic;font-weight:300;">&ldquo;${escapeHtml(quote)}&rdquo;</p>
      </td></tr>
      <tr><td style="padding:0 20px 16px;">
        <p style="margin:0;font-size:11px;color:#b8973a;font-weight:600;">${escapeHtml(name)}</p>
        <p style="margin:0;font-size:11px;color:#5a5550;">${escapeHtml(role)}</p>
      </td></tr>
    </table>
  </td></tr>`;
}

function seqGreeting(firstName: string): string {
  return `<tr><td align="center" style="padding:0 40px 16px;">
    <p style="margin:0;font-size:14px;color:#f4f0e8;line-height:1.7;font-weight:300;">Hola ${escapeHtml(firstName)},</p>
  </td></tr>`;
}

function buildSequenceEmail(
  emailNum: number,
  a: Appointment,
  thankYouUrl: string,
  meetingLink: string,
): { subject: string; html: string } | null {
  const firstName = a.nombre.split(" ")[0];
  const dt = formatDateTime(a.scheduled_for, a.timezone);

  switch (emailNum) {
    // ─── E2: Pre-call video (T+2h) ────────────────────────────
    case 2:
      return {
        subject: "Antes de tu demo, mira esto (2 min) — NODDO",
        // Alternative subject for A/B testing: "2 min que cambiarán tu demo — 73% dicen 'ojalá lo hubiera visto antes'"
        html: emailWrapper(
          "Prep&aacute;rate para tu demo",
          `${seqGreeting(firstName)}
          ${bodyParagraph(
            `Tu demo es el <strong style="color:#f4f0e8;">${dt.date}</strong> a las <strong style="color:#f4f0e8;">${dt.time}</strong>. Preparamos un video de 2 minutos para que llegues con todo claro y puedas hacer las preguntas que realmente te importan.`,
          )}
          ${sectionLabel("Lo que ver&aacute;s")}
          ${bulletList([
            "C&oacute;mo funciona un showroom NODDO por dentro",
            "Qu&eacute; tan r&aacute;pido se publica",
            "Por qu&eacute; las constructoras est&aacute;n migrando de sitios web gen&eacute;ricos",
          ])}
          ${bodyParagraph(
            `<strong style="color:#f4f0e8;">Antes de ver el video:</strong> Piensa en la pregunta #1 que m&aacute;s te hacen los compradores de tus proyectos. En el video ver&aacute;s c&oacute;mo NODDO la responde sin que levantes el tel&eacute;fono.`,
          )}
          ${ctaButton(thankYouUrl, "Ver video de 2 min")}
          <tr><td align="center" style="padding:0 40px 24px;">
            <p style="margin:0;font-size:12px;color:#5a5550;line-height:1.6;">
              Recuerda: NODDO = Showroom listo en 1 d&iacute;a, leads 2.4x m&aacute;s cualificados, sin c&oacute;digo.
            </p>
          </td></tr>`,
        ),
      };

    // ─── E3: External beliefs (T+12h) ─────────────────────────
    case 3:
      return {
        subject: "Lo que otros directores nos dicen antes de la demo — NODDO",
        html: emailWrapper(
          "Dudas frecuentes antes de la llamada",
          `${seqGreeting(firstName)}
          ${bodyParagraph(
            "Estas son las 3 preguntas que m&aacute;s escuchamos de directores comerciales como t&uacute; antes de ver la plataforma. Tal vez alguna te suena:",
          )}
          ${sectionLabel("&ldquo;No tengo tiempo para otra herramienta&rdquo;")}
          ${bodyParagraph(
            "NODDO no es una herramienta m&aacute;s que gestionar. Es una p&aacute;gina de venta que se publica en menos de 1 d&iacute;a. Subes tus renders, planos y datos &mdash; y el showroom se arma solo. Sin reuniones con agencias, sin iteraciones de dise&ntilde;o, sin esperar 3 meses.",
          )}
          ${sectionLabel("&ldquo;Ya tenemos agencia de marketing&rdquo;")}
          ${bodyParagraph(
            "Perfecto. NODDO no reemplaza a tu agencia &mdash; la complementa. Tu agencia genera tr&aacute;fico, NODDO lo convierte. Un showroom digital captura leads calificados, muestra inventario en tiempo real y da una experiencia inmersiva que un sitio web normal no puede.",
          )}
          ${sectionLabel("&ldquo;Nuestro proyecto es diferente&rdquo;")}
          ${bodyParagraph(
            "Hemos trabajado con apartamentos, casas campestres, oficinas, lotes y proyectos de uso mixto. El formato se adapta. En la demo te mostramos c&oacute;mo se ve con tu tipo de proyecto espec&iacute;fico.",
          )}
          ${ctaButton(thankYouUrl, "Ver m&aacute;s preguntas frecuentes")}`,
        ),
      };

    // ─── E4: Internal beliefs + testimonials (T+24h) ──────────
    case 4:
      return {
        subject: 'De "no soy tech" a publicar en 1 día — NODDO',
        html: emailWrapper(
          "No necesitas ser tech para usar NODDO",
          `${seqGreeting(firstName)}
          ${bodyParagraph(
            "La preocupaci&oacute;n m&aacute;s com&uacute;n que escuchamos: <em style='color:#f4f0e8;'>&ldquo;&iquest;Y si mi equipo no es t&eacute;cnico?&rdquo;</em>",
          )}
          ${bodyParagraph(
            "<strong style='color:#b8973a;'>El 89% de nuestros clientes NO tienen equipo t&eacute;cnico.</strong> Y publican en menos de 1 d&iacute;a.",
          )}
          ${bodyParagraph(
            "Si sabes subir una foto a WhatsApp, puedes usar NODDO. En serio. El editor funciona arrastrando y soltando. No hay c&oacute;digo, no hay configuraciones complejas, no necesitas un desarrollador.",
          )}
          ${sectionLabel("Qu&eacute; dicen nuestros clientes")}
          ${testimonialBlock(
            "En la primera semana recuperamos los 3 meses que perdimos con nuestro sitio anterior. Más leads, mejor calidad, sin depender de la agencia.",
            "Carlos Mendoza",
            "Director Comercial — Constructora Habitat",
          )}
          ${testimonialBlock(
            "Lo publicamos en un día. Sin agencia, sin reuniones interminables. Simplemente funciona.",
            "Andrés Velásquez",
            "CEO — AV Desarrollos",
          )}
          ${bodyParagraph(
            "En tu demo: Te mostramos el editor en vivo. Ver&aacute;s c&oacute;mo subir un render y asignarlo a una unidad en menos de 30 segundos. Sin c&oacute;digo, sin configuraciones.",
          )}
          ${ctaButton(thankYouUrl, "Ver m&aacute;s historias")}`,
        ),
      };

    // ─── E5: Method beliefs — why NODDO (T+36h) ──────────────
    case 5:
      return {
        subject: "Por qué NODDO y no un sitio web normal — NODDO",
        html: emailWrapper(
          "&iquest;Por qu&eacute; NODDO?",
          `${seqGreeting(firstName)}
          ${bodyParagraph(
            "Podr&iacute;as hacer un sitio web en Wix. Podr&iacute;as pagarle a una agencia. Podr&iacute;as hasta no hacer nada y seguir vendiendo con WhatsApp y PDF.",
          )}
          ${bodyParagraph(
            "Pero hay una raz&oacute;n por la que constructoras est&aacute;n cambiando a showrooms digitales:",
          )}
          ${sectionLabel("Comparemos los n&uacute;meros reales")}
          <tr><td style="padding:0 40px 20px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:12px;color:#8a8580;line-height:1.7;">
              <tr>
                <td style="padding:8px 0;"><strong style="color:#f4f0e8;">Wix / WordPress:</strong> $0-$200/mes</td>
              </tr>
              <tr>
                <td style="padding:0 0 12px 16px;color:#5a5550;">→ Problema: T&uacute; armas todo. Sin Grid interactivo. Sin inventario en vivo. 40+ horas de tu tiempo.</td>
              </tr>
              <tr>
                <td style="padding:8px 0;"><strong style="color:#f4f0e8;">Agencia personalizada:</strong> $30k-$80k + 3-6 meses</td>
              </tr>
              <tr>
                <td style="padding:0 0 12px 16px;color:#5a5550;">→ Problema: 15 reuniones. Iteraciones infinitas. Cuando termina, ya vendiste 20 unidades sin herramienta.</td>
              </tr>
              <tr>
                <td style="padding:8px 0;"><strong style="color:#b8973a;">NODDO:</strong> $149/mes + Publicado ma&ntilde;ana</td>
              </tr>
              <tr>
                <td style="padding:0 0 0 16px;color:#b8973a;">→ Todo incluido: Grid, inventario, analytics, implementaci&oacute;n asistida.</td>
              </tr>
            </table>
          </td></tr>
          ${sectionLabel("La diferencia")}
          ${bulletList([
            "<strong style='color:#f4f0e8;'>Fachada interactiva</strong> &mdash; El comprador explora el edificio haciendo clic en cada unidad. No es un render est&aacute;tico, es una experiencia.",
            "<strong style='color:#f4f0e8;'>Inventario en vivo</strong> &mdash; Disponibilidad, precios y estados se actualizan al instante. Cero hojas de c&aacute;lculo desactualizadas.",
            "<strong style='color:#f4f0e8;'>Leads calificados</strong> &mdash; Sabes qu&eacute; tipolog&iacute;a le interes&oacute;, desde d&oacute;nde lleg&oacute;, cu&aacute;nto naveg&oacute;. Y llegan 24/7 (incluso cuando tu oficina est&aacute; cerrada).",
            "<strong style='color:#f4f0e8;'>Publicado en 1 d&iacute;a</strong> &mdash; No en 3 meses. No con 15 reuniones. Un d&iacute;a.",
          ])}
          ${sectionLabel("Cada semana sin NODDO")}
          <tr><td style="padding:0 40px 20px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:12px;color:#8a8580;line-height:1.7;">
              <tr><td style="padding:4px 0;">❌ ~12-18 leads perdidos (compradores que googean a las 11pm y no encuentran nada)</td></tr>
              <tr><td style="padding:4px 0;">❌ 3-5 presentaciones lentas (sales rep pierde tiempo buscando archivos)</td></tr>
              <tr><td style="padding:4px 0;">❌ $0 visibilidad de tu embudo (no sabes qu&eacute; unidades generan m&aacute;s inter&eacute;s)</td></tr>
            </table>
          </td></tr>
          ${bodyParagraph(
            "En la demo te mostramos un proyecto real con 124 unidades. Ver&aacute;s el Grid en acci&oacute;n, los analytics en vivo, y una funcionalidad que el 94% dice 'no sab&iacute;a que era posible' (la revelaremos en la llamada).",
          )}
          ${ctaButton(thankYouUrl, "Ver la diferencia")}`,
        ),
      };

    // ─── E6: Final anticipation (T-3h) ───────────────────────
    case 6:
      return {
        subject: "Nos vemos en 3 horas — NODDO",
        html: emailWrapper(
          "Nos vemos pronto",
          `${seqGreeting(firstName)}
          ${bodyParagraph(
            `Tu demo es <strong style='color:#f4f0e8;'>hoy a las ${dt.time}</strong>. Estamos emocionados de mostrarte la plataforma.`,
          )}
          ${sectionLabel("Para que aproveches al m&aacute;ximo")}
          ${bulletList([
            "Ten a la mano el nombre de tu proyecto y n&uacute;mero de unidades",
            "Si tienes renders o planos, perfecto &mdash; te mostramos c&oacute;mo se ver&iacute;an",
            "Prepara tus preguntas &mdash; la sesi&oacute;n es 100% personalizada",
          ])}
          ${ctaButton(meetingLink, "Unirme a la videollamada")}
          <tr><td align="center" style="padding:0 40px 24px;">
            <p style="margin:0;font-size:12px;color:#5a5550;line-height:1.6;">
              &iquest;Necesitas cambiar la hora? <a href="${APP_URL}/#booking" style="color:#b8973a;text-decoration:underline;">Reagenda aqu&iacute;</a>
            </p>
          </td></tr>`,
        ),
      };

    default:
      return null;
  }
}

async function handleSequence(supabase: ReturnType<typeof createClient>) {
  const now = new Date();

  // Find confirmed appointments with pending sequence emails
  const { data: appointments } = await supabase
    .from("appointments")
    .select("*")
    .eq("status", "confirmed")
    .lt("sequence_emails_sent", 6)
    .gte("scheduled_for", now.toISOString());

  let totalSent = 0;

  for (const appt of (appointments || []) as Appointment[]) {
    const plan = appt.sequence_plan || [];
    if (!plan.length) continue;

    const dt = formatDateTime(appt.scheduled_for, appt.timezone);
    const thankYouUrl = `${APP_URL}/demo-confirmada?name=${encodeURIComponent(appt.nombre)}&date=${encodeURIComponent(appt.scheduled_for.split("T")[0])}&time=${encodeURIComponent(dt.time)}`;
    const meetingLink = appt.meeting_link || MEETING_LINK || `${APP_URL}/#booking`;

    let updated = false;

    for (const entry of plan) {
      if (entry.sent) continue;
      if (new Date(entry.send_at) > now) continue;

      const emailContent = buildSequenceEmail(entry.email, appt, thankYouUrl, meetingLink);
      if (!emailContent) continue;

      await sendEmail(appt.email, emailContent.subject, emailContent.html);

      entry.sent = true;
      entry.sent_at = now.toISOString();
      updated = true;
      totalSent++;

      console.log(`[booking-handler] Sequence E${entry.email} sent to ${appt.email}`);
    }

    if (updated) {
      await supabase
        .from("appointments")
        .update({
          sequence_plan: plan,
          sequence_emails_sent: plan.filter((e) => e.sent).length,
        })
        .eq("id", appt.id);
    }
  }

  console.log(`[booking-handler] Sequence check complete — ${totalSent} emails sent`);
}

async function handleNoShow(supabase: ReturnType<typeof createClient>) {
  const now = new Date();
  const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

  // Find appointments that should have happened (30 min - 2h ago) still in 'confirmed' status
  const { data: noShows } = await supabase
    .from("appointments")
    .select("*")
    .eq("status", "confirmed")
    .eq("no_show_followup_sent", false)
    .lte("scheduled_for", thirtyMinAgo.toISOString())
    .gte("scheduled_for", twoHoursAgo.toISOString());

  for (const appt of (noShows || []) as Appointment[]) {
    const newNoShowCount = (appt.no_show_count || 0) + 1;

    // Mark as no-show
    await supabase
      .from("appointments")
      .update({
        status: "no_show",
        no_show_count: newNoShowCount,
        no_show_followup_sent: true,
      })
      .eq("id", appt.id);

    // Update GHL: add no-show tag
    if (appt.ghl_contact_id) {
      addGHLTags(appt.ghl_contact_id, ["demo-no-show"]);
    }

    // Only send follow-up if first no-show (second = stop all comms)
    if (newNoShowCount <= 1) {
      // Email follow-up
      const html = emailWrapper(
        "&iquest;Todo bien?",
        `<tr><td align="center" style="padding:0 40px 16px;">
          <p style="margin:0;font-size:14px;color:#f4f0e8;line-height:1.7;font-weight:300;">
            Hola ${escapeHtml(appt.nombre)},
          </p>
        </td></tr>
        <tr><td align="center" style="padding:0 40px 24px;">
          <p style="margin:0;font-size:13px;color:#8a8580;line-height:1.7;">
            Vimos que no pudiste conectarte a la demo de hoy. No te preocupes, entendemos que las agendas se complican.
          </p>
        </td></tr>
        ${sectionLabel("Te perdiste de ver")}
        ${bulletList([
          "El Noddo Grid en acci&oacute;n (fachada interactiva con inventario en vivo)",
          "C&oacute;mo publicar en 1 d&iacute;a vs. 3-6 meses con agencia",
          "Analytics en tiempo real de un proyecto con 847 leads capturados",
        ])}
        <tr><td align="center" style="padding:0 40px 16px;">
          <p style="margin:0;font-size:13px;color:#8a8580;line-height:1.7;">
            Esta semana ya ayudamos a 3 directores comerciales a lanzar sus showrooms. Todos dijeron lo mismo: <em style="color:#f4f0e8;">'Ojal&aacute; lo hubiera hecho antes.'</em>
          </p>
        </td></tr>
        ${ctaButton(`${APP_URL}/#booking`, "Reagendar demo")}
        <tr><td align="center" style="padding:0 40px 12px;">
          <p style="margin:0;font-size:12px;color:#b8973a;line-height:1.6;">
            ⚡ Solo nos quedan 2 slots esta semana &mdash; reserva el tuyo antes de que se llenen.
          </p>
        </td></tr>
        <tr><td align="center" style="padding:0 40px 24px;">
          <p style="margin:0;font-size:12px;color:#5a5550;line-height:1.6;">
            Tambi&eacute;n puedes escribirnos por <a href="https://wa.me/${WHATSAPP_SUPPORT.replace(/[^0-9]/g, "")}?text=Hola,%20quiero%20reagendar%20mi%20demo%20de%20NODDO" style="color:#b8973a;text-decoration:underline;">WhatsApp</a> si prefieres.
          </p>
        </td></tr>`,
      );
      // Alternative subject for A/B testing: "Te perdiste la demo — ¿Reagendamos?"
      await sendEmail(appt.email, "¿Todo bien? Tu demo con NODDO", html);

      // WhatsApp no-show
      if (appt.whatsapp_optin && appt.ghl_contact_id) {
        const waMsg = `Hola ${appt.nombre.split(" ")[0]}, vimos que no pudiste conectarte.

Te perdiste ver el Grid interactivo en acción (la parte que todos dicen 'wow' 🤯).

¿Reagendamos? Solo quedan 2 slots esta semana: ${APP_URL}/#booking`;
        await sendWhatsApp(appt.ghl_contact_id, waMsg);
      }

      console.log(`[booking-handler] No-show follow-up sent for ${appt.id} (count: ${newNoShowCount})`);
    } else {
      console.log(`[booking-handler] No-show ${appt.id} count ${newNoShowCount} — no more follow-ups`);
    }
  }
}

// ─── Main handler ───────────────────────────────────────────────────────

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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Also accept action from body (for internal calls)
    let bodyAction = action;
    let appointmentId: string | undefined;

    if (!action) {
      try {
        const body = await req.json();
        bodyAction = body.action;
        appointmentId = body.appointmentId;
      } catch {
        // No body — use query param
      }
    }

    const finalAction = action || bodyAction;

    switch (finalAction) {
      case "confirmation":
        if (!appointmentId) {
          return new Response(
            JSON.stringify({ error: "appointmentId required for confirmation" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        await handleConfirmation(supabase, appointmentId);
        break;

      case "sequence":
        await handleSequence(supabase);
        break;

      case "noshow":
        await handleNoShow(supabase);
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${finalAction}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
    }

    return new Response(
      JSON.stringify({ success: true, action: finalAction }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[booking-handler] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
