import { Resend } from "resend";
import { type EmailLocale, getEmailStrings, t, dateLocale } from "./email-i18n";

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

  const html = emailWrapper(
    s.cotizacionBuyer.heading,
    escapeHtml(data.projectName),
    `${detailTable([
      { label: s.cotizacionBuyer.labels.unit, value: data.unidadId },
      { label: s.cotizacionBuyer.labels.total, value: data.totalFormatted, highlight: true },
    ])}
    <tr><td align="center" style="padding:0 40px 16px;">
      <p style="margin:0;font-size:13px;color:#8a8580;line-height:1.6;">
        ${s.cotizacionBuyer.body}
      </p>
    </td></tr>`,
    locale,
  );

  const filename = `${s.cotizacionBuyer.filename}_${data.unidadId.replace(/\s+/g, "_")}.pdf`;

  try {
    await resend.emails.send({
      from: fromAddress,
      to: data.buyerEmail,
      subject: t(s.cotizacionBuyer.subject, { project: data.projectName }),
      html,
      headers: { "List-Unsubscribe": "<mailto:hola@noddo.io?subject=Cancelar%20suscripcion>" },
      attachments: [{ filename, content: data.pdfBuffer }],
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

  const html = emailWrapper(
    s.collaboratorInvite.heading,
    undefined,
    `<tr><td align="center" style="padding:0 40px 24px;">
      <p style="margin:0;font-size:13px;color:#8a8580;line-height:1.7;">
        ${t(s.collaboratorInvite.body, { inviter: escapeHtml(data.inviterName) })}
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

/* ── Plan upgrade confirmation: sent when admin upgrades user's plan ── */

interface PlanUpgradeData {
  email: string;
  name: string;
  oldPlan: "basic" | "premium" | "enterprise";
  newPlan: "basic" | "premium" | "enterprise";
  maxProjects: number;
  maxUnits: number | null;
  locale?: EmailLocale;
}

export async function sendPlanUpgrade(data: PlanUpgradeData) {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not configured — skipping plan upgrade email");
    return;
  }

  const locale = data.locale || "es";
  const s = getEmailStrings(locale);
  const fromAddress = process.env.RESEND_FROM_EMAIL || "NODDO <notificaciones@noddo.io>";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://noddo.io";

  const newPlanLabel = PLAN_LABELS[data.newPlan];
  const newPlanPrice = s.welcome.planPrices[data.newPlan];

  const planFeatures = s.planUpgrade.features[data.newPlan] || [];

  const featuresHtml = planFeatures
    .map(
      (f) =>
        `<tr><td style="padding:4px 0;font-size:13px;color:#8a8580;line-height:1.6;">
          &bull; ${f}
        </td></tr>`
    )
    .join("");

  const html = emailWrapper(
    t(s.planUpgrade.heading, { plan: newPlanLabel }),
    "NODDO",
    `<tr><td align="center" style="padding:0 40px 16px;">
      <p style="margin:0;font-size:14px;color:#f4f0e8;line-height:1.7;font-weight:300;">
        ${s.shared.hello} ${escapeHtml(data.name)},
      </p>
    </td></tr>
    <tr><td align="center" style="padding:0 40px 24px;">
      <p style="margin:0;font-size:13px;color:#8a8580;line-height:1.7;">
        ${t(s.planUpgrade.body, { oldPlan: PLAN_LABELS[data.oldPlan], newPlan: newPlanLabel, price: newPlanPrice })}
      </p>
    </td></tr>
    ${detailTable([
      { label: s.planUpgrade.labels.newPlan, value: newPlanLabel, highlight: true },
      { label: s.planUpgrade.labels.maxProjects, value: data.maxProjects === 999 ? s.planUpgrade.unlimited : String(data.maxProjects) },
      { label: s.planUpgrade.labels.maxUnits, value: data.maxUnits === null ? s.planUpgrade.unlimitedFem : String(data.maxUnits) },
    ])}
    ${planFeatures.length > 0 ? `<tr><td align="center" style="padding:0 40px 8px;">
      <p style="margin:0;font-size:12px;color:#b8973a;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;">
        ${s.planUpgrade.featuresUnlocked}
      </p>
    </td></tr>
    <tr><td style="padding:0 40px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${featuresHtml}
      </table>
    </td></tr>` : ""}
    ${ctaButton(appUrl + "/proyectos", s.planUpgrade.exploreCta)}`,
    locale,
  );

  try {
    await resend.emails.send({
      from: fromAddress,
      to: data.email,
      subject: t(s.planUpgrade.subject, { plan: newPlanLabel }),
      html,
      headers: { "List-Unsubscribe": "<mailto:hola@noddo.io?subject=Cancelar%20suscripcion>" },
    });
  } catch (err) {
    console.error("[email] Failed to send plan upgrade email:", err);
  }
}

/* ── Feature blocked: sent when user tries to use a feature they don't have ── */

interface FeatureBlockedData {
  email: string;
  name: string;
  feature: string;
  currentPlan: "basic" | "premium" | "enterprise";
  requiredPlan: "basic" | "premium" | "enterprise";
  locale?: EmailLocale;
}

export async function sendFeatureBlocked(data: FeatureBlockedData) {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not configured — skipping feature blocked email");
    return;
  }

  const locale = data.locale || "es";
  const s = getEmailStrings(locale);
  const fromAddress = process.env.RESEND_FROM_EMAIL || "NODDO <notificaciones@noddo.io>";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://noddo.io";

  const requiredPlanLabel = PLAN_LABELS[data.requiredPlan];
  const requiredPlanPrice = s.welcome.planPrices[data.requiredPlan];

  const html = emailWrapper(
    t(s.featureBlocked.heading, { feature: data.feature }),
    "NODDO",
    `<tr><td align="center" style="padding:0 40px 16px;">
      <p style="margin:0;font-size:14px;color:#f4f0e8;line-height:1.7;font-weight:300;">
        ${s.shared.hello} ${escapeHtml(data.name)},
      </p>
    </td></tr>
    <tr><td align="center" style="padding:0 40px 24px;">
      <p style="margin:0;font-size:13px;color:#8a8580;line-height:1.7;">
        ${t(s.featureBlocked.body, { feature: data.feature, plan: requiredPlanLabel, price: requiredPlanPrice })}
      </p>
    </td></tr>
    <tr><td align="center" style="padding:0 40px 24px;">
      <p style="margin:0;font-size:13px;color:#8a8580;line-height:1.7;">
        ${s.featureBlocked.body2}
      </p>
    </td></tr>
    ${ctaButton(appUrl + "/pricing", t(s.featureBlocked.upgradeCta, { plan: requiredPlanLabel }))}
    <tr><td align="center" style="padding:0 40px 24px;">
      <p style="margin:0;font-size:12px;color:#5a5550;line-height:1.6;">
        ${s.shared.questions}
      </p>
    </td></tr>`,
    locale,
  );

  try {
    await resend.emails.send({
      from: fromAddress,
      to: data.email,
      subject: t(s.featureBlocked.subject, { feature: data.feature }),
      html,
      headers: { "List-Unsubscribe": "<mailto:hola@noddo.io?subject=Cancelar%20suscripcion>" },
    });
  } catch (err) {
    console.error("[email] Failed to send feature blocked email:", err);
  }
}

/* ── Helper: fetch a user's locale from user_profiles ── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getUserLocale(supabaseClient: any, userId: string): Promise<EmailLocale> {
  try {
    const { data } = await supabaseClient
      .from("user_profiles")
      .select("locale")
      .eq("id", userId)
      .single();
    return (data?.locale as EmailLocale) || "es";
  } catch {
    return "es";
  }
}

/* ── Shared email template helpers ── */

function emailWrapper(heading: string, subLabel: string | undefined, bodyRows: string, locale: EmailLocale = "es"): string {
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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
