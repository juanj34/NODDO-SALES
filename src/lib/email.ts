import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface LeadNotificationData {
  adminEmail: string;
  projectName: string;
  leadName: string;
  leadEmail: string;
  leadPhone?: string | null;
  leadTypology?: string | null;
  leadMessage?: string | null;
  leadCountry?: string | null;
}

export async function sendLeadNotification(data: LeadNotificationData) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not configured — skipping lead notification");
    return;
  }

  const fromAddress = process.env.RESEND_FROM_EMAIL || "NODDO <notificaciones@noddo.io>";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://noddo.io";

  const rows = [
    { label: "Nombre", value: data.leadName },
    { label: "Email", value: data.leadEmail },
    data.leadPhone ? { label: "Telefono", value: data.leadPhone } : null,
    data.leadCountry ? { label: "Pais", value: data.leadCountry } : null,
    data.leadTypology ? { label: "Tipologia de interes", value: data.leadTypology } : null,
    data.leadMessage ? { label: "Mensaje", value: data.leadMessage } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  const html = emailWrapper(
    "Nuevo lead recibido",
    escapeHtml(data.projectName),
    `${detailTable(rows)}
    ${ctaButton(appUrl + "/leads", "Ver Leads")}`,
  );

  try {
    await resend.emails.send({
      from: fromAddress,
      to: data.adminEmail,
      subject: `Nuevo lead en ${data.projectName} — NODDO`,
      html,
      headers: { "List-Unsubscribe": "<mailto:hola@noddo.io?subject=Cancelar%20suscripcion>" },
    });
  } catch (err) {
    console.error("[email] Failed to send lead notification:", err);
  }
}

/* ── Cotización: Email to buyer with PDF attachment ── */

interface CotizacionBuyerData {
  buyerEmail: string;
  buyerName: string;
  projectName: string;
  unidadId: string;
  totalFormatted: string;
  pdfBuffer: Buffer;
}

export async function sendCotizacionBuyer(data: CotizacionBuyerData) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not configured — skipping cotización email");
    return;
  }

  const fromAddress = process.env.RESEND_FROM_EMAIL || "NODDO <notificaciones@noddo.io>";

  const html = emailWrapper(
    "Tu cotización está lista",
    escapeHtml(data.projectName),
    `${detailTable([
      { label: "Unidad", value: data.unidadId },
      { label: "Total", value: data.totalFormatted, highlight: true },
    ])}
    <tr><td align="center" style="padding:0 40px 16px;">
      <p style="margin:0;font-size:13px;color:#8a8580;line-height:1.6;">
        Adjunto encontrarás tu cotización en PDF con el desglose completo del plan de pagos.
      </p>
    </td></tr>`,
  );

  try {
    await resend.emails.send({
      from: fromAddress,
      to: data.buyerEmail,
      subject: `Tu cotización — ${data.projectName}`,
      html,
      headers: { "List-Unsubscribe": "<mailto:hola@noddo.io?subject=Cancelar%20suscripcion>" },
      attachments: [
        {
          filename: `Cotizacion_${data.unidadId.replace(/\s+/g, "_")}.pdf`,
          content: data.pdfBuffer,
        },
      ],
    });
  } catch (err) {
    console.error("[email] Failed to send cotización to buyer:", err);
  }
}

/* ── Cotización: Admin notification ── */

interface CotizacionAdminData {
  adminEmail: string;
  projectName: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string | null;
  unidadId: string;
  totalFormatted: string;
}

export async function sendCotizacionAdmin(data: CotizacionAdminData) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not configured — skipping admin cotización notification");
    return;
  }

  const fromAddress = process.env.RESEND_FROM_EMAIL || "NODDO <notificaciones@noddo.io>";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://noddo.io";

  const rows = [
    { label: "Cliente", value: data.buyerName },
    { label: "Email", value: data.buyerEmail },
    data.buyerPhone ? { label: "Teléfono", value: data.buyerPhone } : null,
    { label: "Unidad", value: data.unidadId },
    { label: "Total", value: data.totalFormatted },
  ].filter(Boolean) as { label: string; value: string }[];

  const html = emailWrapper(
    "Nueva cotización solicitada",
    escapeHtml(data.projectName),
    `${detailTable(rows)}
    ${ctaButton(appUrl + "/leads", "Ver Leads")}`,
  );

  try {
    await resend.emails.send({
      from: fromAddress,
      to: data.adminEmail,
      subject: `Nueva cotización — ${data.projectName}`,
      html,
      headers: { "List-Unsubscribe": "<mailto:hola@noddo.io?subject=Cancelar%20suscripcion>" },
    });
  } catch (err) {
    console.error("[email] Failed to send admin cotización notification:", err);
  }
}

/* ── Welcome email: sent after registration ── */

interface WelcomeEmailData {
  email: string;
  name: string;
}

export async function sendWelcomeEmail(data: WelcomeEmailData) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not configured — skipping welcome email");
    return;
  }

  const fromAddress = process.env.RESEND_FROM_EMAIL || "NODDO <notificaciones@noddo.io>";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://noddo.io";

  const html = emailWrapper(
    "Bienvenido a NODDO",
    undefined,
    `<tr><td align="center" style="padding:0 40px 16px;">
      <p style="margin:0;font-size:14px;color:#f4f0e8;line-height:1.7;font-weight:300;">
        Hola ${escapeHtml(data.name)},
      </p>
    </td></tr>
    <tr><td align="center" style="padding:0 40px 24px;">
      <p style="margin:0;font-size:13px;color:#8a8580;line-height:1.7;">
        Tu cuenta está lista. Crea tu primer proyecto y lanza un micrositio premium para tu desarrollo inmobiliario en minutos.
      </p>
    </td></tr>
    ${ctaButton(appUrl + "/proyectos", "Crear mi primer proyecto")}`,
  );

  try {
    await resend.emails.send({
      from: fromAddress,
      to: data.email,
      subject: "Bienvenido a NODDO",
      html,
      headers: { "List-Unsubscribe": "<mailto:hola@noddo.io?subject=Cancelar%20suscripcion>" },
    });
  } catch (err) {
    console.error("[email] Failed to send welcome email:", err);
  }
}

/* ── Lead confirmation: sent to the visitor who submitted a lead ── */

interface LeadConfirmationData {
  email: string;
  name: string;
  projectName: string;
}

export async function sendLeadConfirmation(data: LeadConfirmationData) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not configured — skipping lead confirmation");
    return;
  }

  const fromAddress = process.env.RESEND_FROM_EMAIL || "NODDO <notificaciones@noddo.io>";

  const html = emailWrapper(
    "Gracias por tu interés",
    escapeHtml(data.projectName),
    `<tr><td align="center" style="padding:0 40px 16px;">
      <p style="margin:0;font-size:14px;color:#f4f0e8;line-height:1.7;font-weight:300;">
        Hola ${escapeHtml(data.name)},
      </p>
    </td></tr>
    <tr><td align="center" style="padding:0 40px 24px;">
      <p style="margin:0;font-size:13px;color:#8a8580;line-height:1.7;">
        Hemos recibido tu solicitud de información sobre <strong style="color:#f4f0e8;">${escapeHtml(data.projectName)}</strong>. Un asesor especializado se pondrá en contacto contigo en las próximas 24 horas.
      </p>
    </td></tr>`,
  );

  try {
    await resend.emails.send({
      from: fromAddress,
      to: data.email,
      subject: `Gracias por tu interés en ${data.projectName}`,
      html,
      headers: { "List-Unsubscribe": "<mailto:hola@noddo.io?subject=Cancelar%20suscripcion>" },
    });
  } catch (err) {
    console.error("[email] Failed to send lead confirmation:", err);
  }
}

/* ── Collaborator invite: sent when admin invites a collaborator ── */

interface CollaboratorInviteData {
  email: string;
  inviterName: string;
}

export async function sendCollaboratorInvite(data: CollaboratorInviteData) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not configured — skipping collaborator invite");
    return;
  }

  const fromAddress = process.env.RESEND_FROM_EMAIL || "NODDO <notificaciones@noddo.io>";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://noddo.io";

  const html = emailWrapper(
    "Has sido invitado",
    undefined,
    `<tr><td align="center" style="padding:0 40px 24px;">
      <p style="margin:0;font-size:13px;color:#8a8580;line-height:1.7;">
        <strong style="color:#f4f0e8;">${escapeHtml(data.inviterName)}</strong> te ha invitado como colaborador en NODDO. Podrás gestionar el inventario de sus proyectos inmobiliarios.
      </p>
    </td></tr>
    ${ctaButton(appUrl + "/login", "Acceder a NODDO")}`,
  );

  try {
    await resend.emails.send({
      from: fromAddress,
      to: data.email,
      subject: `${data.inviterName} te invita a colaborar en NODDO`,
      html,
      headers: { "List-Unsubscribe": "<mailto:hola@noddo.io?subject=Cancelar%20suscripcion>" },
    });
  } catch (err) {
    console.error("[email] Failed to send collaborator invite:", err);
  }
}

/* ── Booking confirmation: sent to the person who booked a demo ── */

interface BookingConfirmationData {
  email: string;
  name: string;
  scheduledFor: string; // ISO string
  timezone: string;
  durationMinutes: number;
  meetingLink?: string;
}

export async function sendBookingConfirmation(data: BookingConfirmationData) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not configured — skipping booking confirmation");
    return;
  }

  const fromAddress = process.env.RESEND_FROM_EMAIL || "NODDO <notificaciones@noddo.io>";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://noddo.io";
  const bookingUrl = `${appUrl}/`;

  const dateFormatted = formatDateTime(data.scheduledFor, data.timezone);

  const html = emailWrapper(
    "Tu demo está confirmada",
    "NODDO",
    `<tr><td align="center" style="padding:0 40px 16px;">
      <p style="margin:0;font-size:14px;color:#f4f0e8;line-height:1.7;font-weight:300;">
        Hola ${escapeHtml(data.name)},
      </p>
    </td></tr>
    <tr><td align="center" style="padding:0 40px 24px;">
      <p style="margin:0;font-size:13px;color:#8a8580;line-height:1.7;">
        Tu demo con el equipo de NODDO ha sido agendada. Nos veremos para mostrarte cómo crear un showroom digital premium para tus proyectos.
      </p>
    </td></tr>
    ${detailTable([
      { label: "Fecha", value: dateFormatted.date },
      { label: "Hora", value: `${dateFormatted.time} (${data.timezone})` },
      { label: "Duración", value: `${data.durationMinutes} minutos` },
      { label: "Formato", value: "Videollamada" },
    ])}
    <tr><td align="center" style="padding:0 40px 8px;">
      <p style="margin:0;font-size:12px;color:#b8973a;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;">
        Qué esperar en la demo
      </p>
    </td></tr>
    <tr><td style="padding:0 40px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="padding:4px 0;font-size:13px;color:#8a8580;line-height:1.6;">
          &bull; Recorrido completo por la plataforma
        </td></tr>
        <tr><td style="padding:4px 0;font-size:13px;color:#8a8580;line-height:1.6;">
          &bull; Configuración personalizada para tu proyecto
        </td></tr>
        <tr><td style="padding:4px 0;font-size:13px;color:#8a8580;line-height:1.6;">
          &bull; Resolución de dudas y próximos pasos
        </td></tr>
      </table>
    </td></tr>
    ${data.meetingLink ? ctaButton(data.meetingLink, "Unirme a la videollamada") : ctaButton(bookingUrl, "Ir a NODDO")}`,
  );

  try {
    await resend.emails.send({
      from: fromAddress,
      to: data.email,
      subject: `Tu demo con NODDO — ${dateFormatted.date}`,
      html,
      headers: { "List-Unsubscribe": "<mailto:hola@noddo.io?subject=Cancelar%20suscripcion>" },
    });
  } catch (err) {
    console.error("[email] Failed to send booking confirmation:", err);
  }
}

/* ── Booking admin notification: sent to NODDO team when demo is booked ── */

interface BookingAdminNotificationData {
  adminEmail: string;
  leadName: string;
  leadEmail: string;
  leadPhone?: string | null;
  leadCompany?: string | null;
  scheduledFor: string;
  timezone: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
}

export async function sendBookingAdminNotification(data: BookingAdminNotificationData) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not configured — skipping booking admin notification");
    return;
  }

  const fromAddress = process.env.RESEND_FROM_EMAIL || "NODDO <notificaciones@noddo.io>";

  const dateFormatted = formatDateTime(data.scheduledFor, data.timezone);

  const rows = [
    { label: "Nombre", value: data.leadName },
    { label: "Email", value: data.leadEmail },
    data.leadPhone ? { label: "Teléfono", value: data.leadPhone } : null,
    data.leadCompany ? { label: "Empresa", value: data.leadCompany } : null,
    { label: "Fecha", value: dateFormatted.date },
    { label: "Hora", value: `${dateFormatted.time} (${data.timezone})` },
    data.utmSource ? { label: "Fuente", value: `${data.utmSource} / ${data.utmMedium || "—"}` } : null,
    data.utmCampaign ? { label: "Campaña", value: data.utmCampaign } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  const html = emailWrapper(
    "Nueva demo agendada",
    "NODDO",
    `${detailTable(rows)}`,
  );

  try {
    await resend.emails.send({
      from: fromAddress,
      to: data.adminEmail,
      subject: `Nueva demo agendada — ${data.leadName}${data.leadCompany ? ` de ${data.leadCompany}` : ""}`,
      html,
      headers: { "List-Unsubscribe": "<mailto:hola@noddo.io?subject=Cancelar%20suscripcion>" },
    });
  } catch (err) {
    console.error("[email] Failed to send booking admin notification:", err);
  }
}

/* ── Booking reminder: sent before demo (24h and 2h) ── */

interface BookingReminderData {
  email: string;
  name: string;
  scheduledFor: string;
  timezone: string;
  meetingLink?: string;
  type: "24h" | "2h";
}

export async function sendBookingReminder(data: BookingReminderData) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not configured — skipping booking reminder");
    return;
  }

  const fromAddress = process.env.RESEND_FROM_EMAIL || "NODDO <notificaciones@noddo.io>";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://noddo.io";
  const dateFormatted = formatDateTime(data.scheduledFor, data.timezone);

  const is24h = data.type === "24h";

  const html = emailWrapper(
    is24h ? "Tu demo es mañana" : "Tu demo es en 2 horas",
    "NODDO",
    `<tr><td align="center" style="padding:0 40px 16px;">
      <p style="margin:0;font-size:14px;color:#f4f0e8;line-height:1.7;font-weight:300;">
        Hola ${escapeHtml(data.name)},
      </p>
    </td></tr>
    <tr><td align="center" style="padding:0 40px 24px;">
      <p style="margin:0;font-size:13px;color:#8a8580;line-height:1.7;">
        ${is24h
          ? `Solo un recordatorio: tu demo con NODDO es mañana <strong style="color:#f4f0e8;">${dateFormatted.date}</strong> a las <strong style="color:#f4f0e8;">${dateFormatted.time}</strong>. Prepara tus preguntas — queremos que aproveches al máximo la sesión.`
          : `Tu demo con NODDO comienza en 2 horas a las <strong style="color:#f4f0e8;">${dateFormatted.time}</strong>. ¡Te esperamos!`
        }
      </p>
    </td></tr>
    ${data.meetingLink ? ctaButton(data.meetingLink, "Unirme a la videollamada") : ctaButton(appUrl, "Ir a NODDO")}`,
  );

  try {
    await resend.emails.send({
      from: fromAddress,
      to: data.email,
      subject: is24h ? "Tu demo es mañana — NODDO" : "Tu demo es en 2 horas — NODDO",
      html,
      headers: { "List-Unsubscribe": "<mailto:hola@noddo.io?subject=Cancelar%20suscripcion>" },
    });
  } catch (err) {
    console.error("[email] Failed to send booking reminder:", err);
  }
}

/* ── No-show follow-up: sent when lead doesn't attend demo ── */

interface NoShowFollowupData {
  email: string;
  name: string;
}

export async function sendNoShowFollowup(data: NoShowFollowupData) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not configured — skipping no-show followup");
    return;
  }

  const fromAddress = process.env.RESEND_FROM_EMAIL || "NODDO <notificaciones@noddo.io>";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://noddo.io";

  const html = emailWrapper(
    "¿Todo bien?",
    "NODDO",
    `<tr><td align="center" style="padding:0 40px 16px;">
      <p style="margin:0;font-size:14px;color:#f4f0e8;line-height:1.7;font-weight:300;">
        Hola ${escapeHtml(data.name)},
      </p>
    </td></tr>
    <tr><td align="center" style="padding:0 40px 24px;">
      <p style="margin:0;font-size:13px;color:#8a8580;line-height:1.7;">
        Vimos que no pudiste conectarte a la demo de hoy. No te preocupes, entendemos que las agendas se complican. Si aún te interesa ver cómo NODDO puede transformar la comercialización de tus proyectos, puedes reagendar cuando quieras.
      </p>
    </td></tr>
    ${ctaButton(appUrl + "/#booking", "Reagendar demo")}
    <tr><td align="center" style="padding:0 40px 24px;">
      <p style="margin:0;font-size:12px;color:#5a5550;line-height:1.6;">
        También puedes escribirnos por <a href="https://wa.me/971585407848?text=Hola,%20quiero%20reagendar%20mi%20demo%20de%20NODDO" style="color:#b8973a;text-decoration:underline;">WhatsApp</a> si prefieres.
      </p>
    </td></tr>`,
  );

  try {
    await resend.emails.send({
      from: fromAddress,
      to: data.email,
      subject: "¿Todo bien? Tu demo con NODDO",
      html,
      headers: { "List-Unsubscribe": "<mailto:hola@noddo.io?subject=Cancelar%20suscripcion>" },
    });
  } catch (err) {
    console.error("[email] Failed to send no-show followup:", err);
  }
}

/* ── Shared email template helpers ── */

function emailWrapper(heading: string, subLabel: string | undefined, bodyRows: string): string {
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
        ${subLabel ? `<tr><td align="center" style="padding:4px 40px 24px;">
          <span style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#b8973a;font-weight:600;">${subLabel}</span>
        </td></tr>` : '<tr><td style="padding:0 0 16px;"></td></tr>'}
        ${bodyRows}
        <tr><td style="padding:0 40px;"><div style="height:1px;background-color:#222222;"></div></td></tr>
        <tr><td style="padding:24px 40px 12px;">
          <p style="margin:0;font-size:11px;color:#5a5550;text-align:center;line-height:1.6;">
            Noddo Technologies SAS · Bogotá, Colombia
          </p>
        </td></tr>
        <tr><td style="padding:0 40px 12px;">
          <p style="margin:0;font-size:11px;text-align:center;line-height:1.6;">
            <a href="https://noddo.io/privacidad" style="color:#5a5550;text-decoration:underline;">Privacidad</a>
            <span style="color:#3a3530;"> · </span>
            <a href="https://noddo.io/terminos" style="color:#5a5550;text-decoration:underline;">Términos</a>
            <span style="color:#3a3530;"> · </span>
            <a href="mailto:hola@noddo.io" style="color:#5a5550;text-decoration:underline;">hola@noddo.io</a>
          </p>
        </td></tr>
        <tr><td style="padding:0 40px 32px;">
          <p style="margin:0;font-size:10px;text-align:center;line-height:1.5;">
            <a href="mailto:hola@noddo.io?subject=Cancelar%20suscripci%C3%B3n" style="color:#3a3530;text-decoration:underline;">Cancelar suscripción</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function detailTable(rows: { label: string; value: string; highlight?: boolean }[]): string {
  const rowsHtml = rows
    .map(
      (row) =>
        `<tr>
          <td style="padding:8px 16px;font-size:11px;color:#5a5550;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;vertical-align:top;width:140px;">${row.label}</td>
          <td style="padding:8px 16px;font-size:13px;${row.highlight ? "color:#b8973a;font-weight:600;" : "color:#f4f0e8;font-weight:300;"}">${escapeHtml(row.value)}</td>
        </tr>`
    )
    .join("");

  return `<tr><td style="padding:0 24px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#1a1a1a;border:1px solid #222222;border-radius:12px;overflow:hidden;">
      ${rowsHtml}
    </table>
  </td></tr>`;
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

function formatDateTime(isoString: string, timezone: string): { date: string; time: string } {
  const d = new Date(isoString);
  const date = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: timezone,
  }).format(d);
  const time = new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone,
  }).format(d);
  return {
    date: date.charAt(0).toUpperCase() + date.slice(1),
    time,
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
