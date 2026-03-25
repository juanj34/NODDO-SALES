import { Resend } from "resend";
import { type EmailLocale, getEmailStrings, t, dateLocale } from "./email-i18n";
import type { EmailConfig } from "@/types";
import { buildBrandedCotizacionEmail } from "./email-branded";

// Lazy initialization - only create when needed (avoids build-time errors)
function getResend() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

const PLAN_LABELS: Record<string, string> = {
  basic: "Basic",
  premium: "Premium",
  enterprise: "Enterprise",
};

/* ── Lead notification: sent to admin when a new lead comes in ─────── */

interface LeadNotificationData {
  adminEmail: string;
  projectName: string;
  leadName: string;
  leadEmail: string;
  leadPhone?: string | null;
  leadTypology?: string | null;
  leadMessage?: string | null;
  leadCountry?: string | null;
  locale?: EmailLocale;
}

export async function sendLeadNotification(data: LeadNotificationData) {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not configured — skipping lead notification");
    return;
  }

  const locale = data.locale || "es";
  const s = getEmailStrings(locale);
  const fromAddress = process.env.RESEND_FROM_EMAIL || "NODDO <notificaciones@noddo.io>";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://noddo.io";

  const rows = [
    { label: s.leadNotification.labels.name, value: data.leadName },
    { label: s.leadNotification.labels.email, value: data.leadEmail },
    data.leadPhone ? { label: s.leadNotification.labels.phone, value: data.leadPhone } : null,
    data.leadCountry ? { label: s.leadNotification.labels.country, value: data.leadCountry } : null,
    data.leadTypology ? { label: s.leadNotification.labels.typology, value: data.leadTypology } : null,
    data.leadMessage ? { label: s.leadNotification.labels.message, value: data.leadMessage } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  const html = emailWrapper(
    s.leadNotification.heading,
    escapeHtml(data.projectName),
    `${detailTable(rows)}
    ${ctaButton(appUrl + "/leads", s.shared.viewLeads)}`,
    locale,
  );

  try {
    await resend.emails.send({
      from: fromAddress,
      to: data.adminEmail,
      subject: t(s.leadNotification.subject, { project: data.projectName }),
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
  locale?: EmailLocale;
  // Branded email fields (optional — when present, use branded template)
  emailConfig?: EmailConfig | null;
  projectSlug?: string;
  projectLogoUrl?: string | null;
  constructoraLogoUrl?: string | null;
  constructoraNombre?: string | null;
  colorPrimario?: string;
  whatsappNumero?: string | null;
  tour360Url?: string | null;
  brochureUrl?: string | null;
  micrositeUrl?: string | null;
  recursos?: { id: string; nombre: string; url: string }[];
  // Tipología details for email body
  tipologiaName?: string | null;
  areaM2?: number | null;
  habitaciones?: number | null;
  banos?: number | null;
  // Agent info for signature
  agentName?: string | null;
  agentPhone?: string | null;
  agentEmail?: string | null;
  agentAvatarUrl?: string | null;
}

export async function sendCotizacionBuyer(data: CotizacionBuyerData) {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not configured — skipping cotización email");
    return;
  }

  const locale = data.locale || "es";
  const s = getEmailStrings(locale);
  const fromAddress = process.env.RESEND_FROM_EMAIL || "NODDO <notificaciones@noddo.io>";
  const cfg = data.emailConfig;

  // Build HTML — branded template if config exists, otherwise default
  const html = cfg
    ? buildBrandedCotizacionEmail({
        locale,
        emailConfig: cfg,
        projectName: data.projectName,
        projectSlug: data.projectSlug || "",
        projectLogoUrl: data.projectLogoUrl ?? null,
        constructoraLogoUrl: data.constructoraLogoUrl ?? null,
        constructoraNombre: data.constructoraNombre ?? null,
        colorPrimario: data.colorPrimario || "#b8973a",
        buyerName: data.buyerName,
        unidadId: data.unidadId,
        totalFormatted: data.totalFormatted,
        tipologiaName: data.tipologiaName ?? null,
        areaM2: data.areaM2 ?? null,
        habitaciones: data.habitaciones ?? null,
        banos: data.banos ?? null,
        whatsappNumero: data.whatsappNumero ?? null,
        tour360Url: data.tour360Url ?? null,
        brochureUrl: data.brochureUrl ?? null,
        micrositeUrl: data.micrositeUrl ?? null,
        agentName: data.agentName ?? null,
        agentPhone: data.agentPhone ?? null,
        agentEmail: data.agentEmail ?? null,
        agentAvatarUrl: data.agentAvatarUrl ?? null,
      })
    : emailWrapper(
        s.cotizacionBuyer.heading,
        escapeHtml(data.projectName),
        `${detailTable([
          { label: s.cotizacionBuyer.labels.unit, value: data.unidadId },
          ...(data.tipologiaName ? [{ label: s.cotizacionBuyer.labels.tipologia, value: data.tipologiaName }] : []),
          ...(data.areaM2 != null ? [{ label: s.cotizacionBuyer.labels.area, value: `${data.areaM2} m\u00B2` }] : []),
          ...(data.habitaciones != null ? [{ label: s.cotizacionBuyer.labels.habitaciones, value: String(data.habitaciones) }] : []),
          ...(data.banos != null ? [{ label: s.cotizacionBuyer.labels.banos, value: String(data.banos) }] : []),
          { label: s.cotizacionBuyer.labels.total, value: data.totalFormatted, highlight: true },
        ])}
        <tr><td align="center" style="padding:0 40px 16px;">
          <p style="margin:0;font-size:13px;color:#8a8580;line-height:1.6;">
            ${s.cotizacionBuyer.body}
          </p>
        </td></tr>`,
        locale,
      );

  // Build attachments list
  const attachments: { filename: string; content: Buffer }[] = [];
  const pdfFilename = `${s.cotizacionBuyer.filename}_${data.unidadId.replace(/\s+/g, "_")}.pdf`;

  if (!cfg || cfg.adjuntar_cotizacion_pdf !== false) {
    attachments.push({ filename: pdfFilename, content: data.pdfBuffer });
  }

  let totalSize = data.pdfBuffer.length;
  const MAX_TOTAL = 25 * 1024 * 1024;

  // Attach brochure if enabled
  if (cfg?.adjuntar_brochure && data.brochureUrl) {
    const buf = await downloadAttachment(data.brochureUrl);
    if (buf && totalSize + buf.length < MAX_TOTAL) {
      attachments.push({ filename: "Brochure.pdf", content: buf });
      totalSize += buf.length;
    }
  }

  // Attach selected recursos
  if (cfg?.adjuntos_recurso_ids?.length && data.recursos) {
    for (const recurso of data.recursos) {
      if (!cfg.adjuntos_recurso_ids.includes(recurso.id)) continue;
      const buf = await downloadAttachment(recurso.url);
      if (buf && totalSize + buf.length < MAX_TOTAL) {
        const ext = recurso.url.split(".").pop()?.split("?")[0] || "pdf";
        attachments.push({ filename: `${recurso.nombre}.${ext}`, content: buf });
        totalSize += buf.length;
      }
    }
  }

  try {
    await resend.emails.send({
      from: fromAddress,
      to: data.buyerEmail,
      replyTo: cfg?.reply_to || undefined,
      subject: t(s.cotizacionBuyer.subject, { project: data.projectName }),
      html,
      headers: { "List-Unsubscribe": "<mailto:hola@noddo.io?subject=Cancelar%20suscripcion>" },
      attachments,
    });
  } catch (err) {
    console.error("[email] Failed to send cotización to buyer:", err);
  }
}

/* ── Attachment download helper ── */

async function downloadAttachment(url: string, maxBytes = 10 * 1024 * 1024): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const arrayBuf = await res.arrayBuffer();
    if (arrayBuf.byteLength > maxBytes) return null;
    return Buffer.from(arrayBuf);
  } catch {
    return null;
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
  locale?: EmailLocale;
}

export async function sendCotizacionAdmin(data: CotizacionAdminData) {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not configured — skipping admin cotización notification");
    return;
  }

  const locale = data.locale || "es";
  const s = getEmailStrings(locale);
  const fromAddress = process.env.RESEND_FROM_EMAIL || "NODDO <notificaciones@noddo.io>";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://noddo.io";

  const rows = [
    { label: s.cotizacionAdmin.labels.client, value: data.buyerName },
    { label: s.cotizacionAdmin.labels.email, value: data.buyerEmail },
    data.buyerPhone ? { label: s.cotizacionAdmin.labels.phone, value: data.buyerPhone } : null,
    { label: s.cotizacionAdmin.labels.unit, value: data.unidadId },
    { label: s.cotizacionAdmin.labels.total, value: data.totalFormatted },
  ].filter(Boolean) as { label: string; value: string }[];

  const html = emailWrapper(
    s.cotizacionAdmin.heading,
    escapeHtml(data.projectName),
    `${detailTable(rows)}
    ${ctaButton(appUrl + "/leads", s.shared.viewLeads)}`,
    locale,
  );

  try {
    await resend.emails.send({
      from: fromAddress,
      to: data.adminEmail,
      subject: t(s.cotizacionAdmin.subject, { project: data.projectName }),
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
  plan?: "basic" | "premium" | "enterprise";
  locale?: EmailLocale;
}

export async function sendWelcomeEmail(data: WelcomeEmailData) {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not configured — skipping welcome email");
    return;
  }

  const locale = data.locale || "es";
  const s = getEmailStrings(locale);
  const fromAddress = process.env.RESEND_FROM_EMAIL || "NODDO <notificaciones@noddo.io>";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://noddo.io";

  const plan = data.plan || "basic";
  const planLabel = PLAN_LABELS[plan];
  const planPrice = s.welcome.planPrices[plan];

  const html = emailWrapper(
    s.welcome.heading,
    undefined,
    `<tr><td align="center" style="padding:0 40px 16px;">
      <p style="margin:0;font-size:14px;color:#f4f0e8;line-height:1.7;font-weight:300;">
        ${s.shared.hello} ${escapeHtml(data.name)},
      </p>
    </td></tr>
    <tr><td align="center" style="padding:0 40px 24px;">
      <p style="margin:0;font-size:13px;color:#8a8580;line-height:1.7;">
        ${t(s.welcome.body, { plan: planLabel, price: planPrice })}
      </p>
    </td></tr>
    ${ctaButton(appUrl + "/proyectos", s.welcome.createProject)}
    <tr><td align="center" style="padding:0 40px 24px;">
      <p style="margin:0;font-size:12px;color:#5a5550;line-height:1.6;">
        ${s.welcome.needMore} <a href="${appUrl}/pricing" style="color:#b8973a;text-decoration:underline;">${s.welcome.viewPlans}</a>
      </p>
    </td></tr>`,
    locale,
  );

  try {
    await resend.emails.send({
      from: fromAddress,
      to: data.email,
      subject: s.welcome.subject,
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
  locale?: EmailLocale;
}

export async function sendLeadConfirmation(data: LeadConfirmationData) {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not configured — skipping lead confirmation");
    return;
  }

  const locale = data.locale || "es";
  const s = getEmailStrings(locale);
  const fromAddress = process.env.RESEND_FROM_EMAIL || "NODDO <notificaciones@noddo.io>";

  const html = emailWrapper(
    s.leadConfirmation.heading,
    escapeHtml(data.projectName),
    `<tr><td align="center" style="padding:0 40px 16px;">
      <p style="margin:0;font-size:14px;color:#f4f0e8;line-height:1.7;font-weight:300;">
        ${s.shared.hello} ${escapeHtml(data.name)},
      </p>
    </td></tr>
    <tr><td align="center" style="padding:0 40px 24px;">
      <p style="margin:0;font-size:13px;color:#8a8580;line-height:1.7;">
        ${t(s.leadConfirmation.body, { project: escapeHtml(data.projectName) })}
      </p>
    </td></tr>`,
    locale,
  );

  try {
    await resend.emails.send({
      from: fromAddress,
      to: data.email,
      subject: t(s.leadConfirmation.subject, { project: data.projectName }),
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
  rol?: "director" | "asesor";
  locale?: EmailLocale;
}

export async function sendCollaboratorInvite(data: CollaboratorInviteData) {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not configured — skipping collaborator invite");
    return;
  }

  const locale = data.locale || "es";
  const s = getEmailStrings(locale);
  const fromAddress = process.env.RESEND_FROM_EMAIL || "NODDO <notificaciones@noddo.io>";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://noddo.io";

  const bodyTemplate = data.rol === "director"
    ? s.collaboratorInvite.bodyDirector
    : s.collaboratorInvite.bodyAsesor;

  const html = emailWrapper(
    s.collaboratorInvite.heading,
    undefined,
    `<tr><td align="center" style="padding:0 40px 24px;">
      <p style="margin:0;font-size:13px;color:#8a8580;line-height:1.7;">
        ${t(bodyTemplate, { inviter: escapeHtml(data.inviterName) })}
      </p>
    </td></tr>
    ${ctaButton(appUrl + "/login", s.collaboratorInvite.cta)}`,
    locale,
  );

  try {
    await resend.emails.send({
      from: fromAddress,
      to: data.email,
      subject: t(s.collaboratorInvite.subject, { inviter: data.inviterName }),
      html,
      headers: { "List-Unsubscribe": "<mailto:hola@noddo.io?subject=Cancelar%20suscripcion>" },
    });
  } catch (err) {
    console.error("[email] Failed to send collaborator invite:", err);
  }
}

/* ── Collaborator welcome: sent when collaborator activates account ── */

interface CollaboratorWelcomeData {
  email: string;
  rol: "director" | "asesor";
  locale?: EmailLocale;
}

export async function sendCollaboratorWelcome(data: CollaboratorWelcomeData) {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not configured — skipping collaborator welcome");
    return;
  }

  const locale = data.locale || "es";
  const s = getEmailStrings(locale);
  const fromAddress = process.env.RESEND_FROM_EMAIL || "NODDO <notificaciones@noddo.io>";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://noddo.io";

  const bodyText = data.rol === "director"
    ? s.collaboratorWelcome.bodyDirector
    : s.collaboratorWelcome.bodyAsesor;

  const html = emailWrapper(
    s.collaboratorWelcome.heading,
    undefined,
    `<tr><td align="center" style="padding:0 40px 24px;">
      <p style="margin:0;font-size:13px;color:#8a8580;line-height:1.7;">
        ${bodyText}
      </p>
    </td></tr>
    ${ctaButton(appUrl + "/proyectos", s.collaboratorWelcome.cta)}`,
    locale,
  );

  try {
    await resend.emails.send({
      from: fromAddress,
      to: data.email,
      subject: s.collaboratorWelcome.subject,
      html,
      headers: { "List-Unsubscribe": "<mailto:hola@noddo.io?subject=Cancelar%20suscripcion>" },
    });
  } catch (err) {
    console.error("[email] Failed to send collaborator welcome:", err);
  }
}

/* ── Collaborator status change: when admin suspends/reactivates ── */

interface CollaboratorStatusData {
  email: string;
  action: "suspended" | "reactivated";
  locale?: EmailLocale;
}

export async function sendCollaboratorStatusChange(data: CollaboratorStatusData) {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not configured — skipping status change email");
    return;
  }

  const locale = data.locale || "es";
  const s = getEmailStrings(locale);
  const fromAddress = process.env.RESEND_FROM_EMAIL || "NODDO <notificaciones@noddo.io>";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://noddo.io";

  const isSuspended = data.action === "suspended";
  const subject = isSuspended ? s.collaboratorStatus.subjectSuspended : s.collaboratorStatus.subjectReactivated;
  const heading = isSuspended ? s.collaboratorStatus.headingSuspended : s.collaboratorStatus.headingReactivated;
  const body = isSuspended ? s.collaboratorStatus.bodySuspended : s.collaboratorStatus.bodyReactivated;

  const html = emailWrapper(
    heading,
    undefined,
    `<tr><td align="center" style="padding:0 40px 24px;">
      <p style="margin:0;font-size:13px;color:#8a8580;line-height:1.7;">
        ${body}
      </p>
    </td></tr>
    ${!isSuspended ? ctaButton(appUrl + "/login", s.collaboratorWelcome.cta) : ""}`,
    locale,
  );

  try {
    await resend.emails.send({
      from: fromAddress,
      to: data.email,
      subject,
      html,
      headers: { "List-Unsubscribe": "<mailto:hola@noddo.io?subject=Cancelar%20suscripcion>" },
    });
  } catch (err) {
    console.error("[email] Failed to send status change email:", err);
  }
}

/* ── Admin user invite: sent by platform admin when creating a new user ── */

interface AdminUserInviteData {
  email: string;
  plan: string;
  locale?: EmailLocale;
}

export async function sendAdminUserInvite(data: AdminUserInviteData) {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not configured — skipping admin user invite");
    return;
  }

  const locale = data.locale || "es";
  const s = getEmailStrings(locale);
  const fromAddress = process.env.RESEND_FROM_EMAIL || "NODDO <notificaciones@noddo.io>";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://noddo.io";

  const planLabel = data.plan.charAt(0).toUpperCase() + data.plan.slice(1);

  const html = emailWrapper(
    s.adminInvite.heading,
    undefined,
    `<tr><td align="center" style="padding:0 40px 24px;">
      <p style="margin:0;font-size:13px;color:#8a8580;line-height:1.7;">
        ${t(s.adminInvite.body, { plan: planLabel })}
      </p>
    </td></tr>
    ${ctaButton(appUrl + "/login", s.adminInvite.cta)}`,
    locale,
  );

  try {
    await resend.emails.send({
      from: fromAddress,
      to: data.email,
      subject: s.adminInvite.subject,
      html,
      headers: { "List-Unsubscribe": "<mailto:hola@noddo.io?subject=Cancelar%20suscripcion>" },
    });
  } catch (err) {
    console.error("[email] Failed to send admin user invite:", err);
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
  locale?: EmailLocale;
}

export async function sendBookingConfirmation(data: BookingConfirmationData) {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not configured — skipping booking confirmation");
    return;
  }

  const locale = data.locale || "es";
  const s = getEmailStrings(locale);
  const fromAddress = process.env.RESEND_FROM_EMAIL || "NODDO <notificaciones@noddo.io>";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://noddo.io";

  const dateFormatted = formatDateTime(data.scheduledFor, data.timezone, locale);

  const bulletsHtml = s.bookingConfirmation.bullets
    .map(
      (b) =>
        `<tr><td style="padding:4px 0;font-size:13px;color:#8a8580;line-height:1.6;">
          &bull; ${b}
        </td></tr>`
    )
    .join("");

  const html = emailWrapper(
    s.bookingConfirmation.heading,
    "NODDO",
    `<tr><td align="center" style="padding:0 40px 16px;">
      <p style="margin:0;font-size:14px;color:#f4f0e8;line-height:1.7;font-weight:300;">
        ${s.shared.hello} ${escapeHtml(data.name)},
      </p>
    </td></tr>
    <tr><td align="center" style="padding:0 40px 24px;">
      <p style="margin:0;font-size:13px;color:#8a8580;line-height:1.7;">
        ${s.bookingConfirmation.body}
      </p>
    </td></tr>
    ${detailTable([
      { label: s.bookingConfirmation.labels.date, value: dateFormatted.date },
      { label: s.bookingConfirmation.labels.time, value: `${dateFormatted.time} (${data.timezone})` },
      { label: s.bookingConfirmation.labels.duration, value: `${data.durationMinutes} ${s.bookingConfirmation.durationUnit}` },
      { label: s.bookingConfirmation.labels.format, value: s.bookingConfirmation.formatValue },
    ])}
    <tr><td align="center" style="padding:0 40px 8px;">
      <p style="margin:0;font-size:12px;color:#b8973a;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;">
        ${s.bookingConfirmation.whatToExpect}
      </p>
    </td></tr>
    <tr><td style="padding:0 40px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${bulletsHtml}
      </table>
    </td></tr>
    ${data.meetingLink ? ctaButton(data.meetingLink, s.bookingConfirmation.joinCall) : ctaButton(appUrl, s.bookingConfirmation.goToNoddo)}`,
    locale,
  );

  try {
    await resend.emails.send({
      from: fromAddress,
      to: data.email,
      subject: t(s.bookingConfirmation.subject, { date: dateFormatted.date }),
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
  locale?: EmailLocale;
}

export async function sendBookingAdminNotification(data: BookingAdminNotificationData) {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not configured — skipping booking admin notification");
    return;
  }

  const locale = data.locale || "es";
  const s = getEmailStrings(locale);
  const fromAddress = process.env.RESEND_FROM_EMAIL || "NODDO <notificaciones@noddo.io>";

  const dateFormatted = formatDateTime(data.scheduledFor, data.timezone, locale);

  const rows = [
    { label: s.bookingAdmin.labels.name, value: data.leadName },
    { label: s.bookingAdmin.labels.email, value: data.leadEmail },
    data.leadPhone ? { label: s.bookingAdmin.labels.phone, value: data.leadPhone } : null,
    data.leadCompany ? { label: s.bookingAdmin.labels.company, value: data.leadCompany } : null,
    { label: s.bookingAdmin.labels.date, value: dateFormatted.date },
    { label: s.bookingAdmin.labels.time, value: `${dateFormatted.time} (${data.timezone})` },
    data.utmSource ? { label: s.bookingAdmin.labels.source, value: `${data.utmSource} / ${data.utmMedium || "—"}` } : null,
    data.utmCampaign ? { label: s.bookingAdmin.labels.campaign, value: data.utmCampaign } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  const html = emailWrapper(
    s.bookingAdmin.heading,
    "NODDO",
    `${detailTable(rows)}`,
    locale,
  );

  try {
    await resend.emails.send({
      from: fromAddress,
      to: data.adminEmail,
      subject: t(s.bookingAdmin.subject, { lead: data.leadName }) + (data.leadCompany ? ` de ${data.leadCompany}` : ""),
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
  locale?: EmailLocale;
}

export async function sendBookingReminder(data: BookingReminderData) {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not configured — skipping booking reminder");
    return;
  }

  const locale = data.locale || "es";
  const s = getEmailStrings(locale);
  const fromAddress = process.env.RESEND_FROM_EMAIL || "NODDO <notificaciones@noddo.io>";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://noddo.io";
  const dateFormatted = formatDateTime(data.scheduledFor, data.timezone, locale);

  const is24h = data.type === "24h";

  const bodyText = is24h
    ? t(s.bookingReminder.body24h, { date: dateFormatted.date, time: dateFormatted.time })
    : t(s.bookingReminder.body2h, { time: dateFormatted.time });

  const html = emailWrapper(
    is24h ? s.bookingReminder.heading24h : s.bookingReminder.heading2h,
    "NODDO",
    `<tr><td align="center" style="padding:0 40px 16px;">
      <p style="margin:0;font-size:14px;color:#f4f0e8;line-height:1.7;font-weight:300;">
        ${s.shared.hello} ${escapeHtml(data.name)},
      </p>
    </td></tr>
    <tr><td align="center" style="padding:0 40px 24px;">
      <p style="margin:0;font-size:13px;color:#8a8580;line-height:1.7;">
        ${bodyText}
      </p>
    </td></tr>
    ${data.meetingLink ? ctaButton(data.meetingLink, s.bookingReminder.joinCall) : ctaButton(appUrl, s.bookingReminder.goToNoddo)}`,
    locale,
  );

  try {
    await resend.emails.send({
      from: fromAddress,
      to: data.email,
      subject: is24h ? s.bookingReminder.subject24h : s.bookingReminder.subject2h,
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
  locale?: EmailLocale;
}

export async function sendNoShowFollowup(data: NoShowFollowupData) {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not configured — skipping no-show followup");
    return;
  }

  const locale = data.locale || "es";
  const s = getEmailStrings(locale);
  const fromAddress = process.env.RESEND_FROM_EMAIL || "NODDO <notificaciones@noddo.io>";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://noddo.io";

  const html = emailWrapper(
    s.noShow.heading,
    "NODDO",
    `<tr><td align="center" style="padding:0 40px 16px;">
      <p style="margin:0;font-size:14px;color:#f4f0e8;line-height:1.7;font-weight:300;">
        ${s.shared.hello} ${escapeHtml(data.name)},
      </p>
    </td></tr>
    <tr><td align="center" style="padding:0 40px 24px;">
      <p style="margin:0;font-size:13px;color:#8a8580;line-height:1.7;">
        ${s.noShow.body}
      </p>
    </td></tr>
    ${ctaButton(appUrl + "/#booking", s.noShow.rescheduleCta)}
    <tr><td align="center" style="padding:0 40px 24px;">
      <p style="margin:0;font-size:12px;color:#5a5550;line-height:1.6;">
        ${s.noShow.whatsappNote}
      </p>
    </td></tr>`,
    locale,
  );

  try {
    await resend.emails.send({
      from: fromAddress,
      to: data.email,
      subject: s.noShow.subject,
      html,
      headers: { "List-Unsubscribe": "<mailto:hola@noddo.io?subject=Cancelar%20suscripcion>" },
    });
  } catch (err) {
    console.error("[email] Failed to send no-show followup:", err);
  }
}

/* ── Helper: fetch a user's locale from user_profiles ── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getUserLocale(supabaseClient: any, userId: string): Promise<EmailLocale> {
  try {
    const { data } = await supabaseClient
      .from("user_profiles")
      .select("locale")
      .eq("user_id", userId)
      .single();
    return (data?.locale as EmailLocale) || "es";
  } catch {
    return "es";
  }
}

/* ── Shared email template helpers ── */

export function emailWrapper(heading: string, subLabel: string | undefined, bodyRows: string, locale: EmailLocale = "es"): string {
  const s = getEmailStrings(locale);
  return `<!DOCTYPE html>
<html lang="${locale}">
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
            ${s.shared.footer.company}
          </p>
        </td></tr>
        <tr><td style="padding:0 40px 12px;">
          <p style="margin:0;font-size:11px;text-align:center;line-height:1.6;">
            <a href="https://noddo.io/privacidad" style="color:#5a5550;text-decoration:underline;">${s.shared.footer.privacy}</a>
            <span style="color:#3a3530;"> · </span>
            <a href="https://noddo.io/terminos" style="color:#5a5550;text-decoration:underline;">${s.shared.footer.terms}</a>
            <span style="color:#3a3530;"> · </span>
            <a href="mailto:hola@noddo.io" style="color:#5a5550;text-decoration:underline;">hola@noddo.io</a>
          </p>
        </td></tr>
        <tr><td style="padding:0 40px 32px;">
          <p style="margin:0;font-size:10px;text-align:center;line-height:1.5;">
            <a href="mailto:hola@noddo.io?subject=Cancelar%20suscripci%C3%B3n" style="color:#3a3530;text-decoration:underline;">${s.shared.footer.unsubscribe}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function detailTable(
  rows: { label: string; value: string; highlight?: boolean }[],
  theme?: { detailBg: string; detailBorder: string; detailLabel: string; detailValue: string; primaryColor: string },
): string {
  const bg = theme?.detailBg ?? "#1a1a1a";
  const border = theme?.detailBorder ?? "#222222";
  const labelColor = theme?.detailLabel ?? "#5a5550";
  const valueColor = theme?.detailValue ?? "#f4f0e8";
  const highlightColor = theme?.primaryColor ?? "#b8973a";

  const rowsHtml = rows
    .map(
      (row) =>
        `<tr>
          <td style="padding:8px 16px;font-size:11px;color:${labelColor};font-weight:600;text-transform:uppercase;letter-spacing:0.1em;vertical-align:top;width:140px;">${row.label}</td>
          <td style="padding:8px 16px;font-family:'Courier New',Courier,monospace;font-size:13px;${row.highlight ? `color:${highlightColor};font-weight:700;` : `color:${valueColor};font-weight:400;`}">${escapeHtml(row.value)}</td>
        </tr>`
    )
    .join("");

  return `<tr><td style="padding:0 24px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${bg};border:1px solid ${border};border-radius:12px;overflow:hidden;">
      ${rowsHtml}
    </table>
  </td></tr>`;
}

export function ctaButton(href: string, label: string): string {
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

function formatDateTime(isoString: string, timezone: string, locale: EmailLocale = "es"): { date: string; time: string } {
  const intlLocale = dateLocale(locale);
  const d = new Date(isoString);
  const date = new Intl.DateTimeFormat(intlLocale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: timezone,
  }).format(d);
  const time = new Intl.DateTimeFormat(intlLocale, {
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

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
