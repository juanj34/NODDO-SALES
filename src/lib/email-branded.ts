/**
 * Branded cotización email builder.
 *
 * Generates HTML for project-customized buyer emails with:
 * - Project/constructora logos
 * - Custom greeting, body, and sign-off text
 * - Action buttons (WhatsApp, Tour 360, Brochure, Micrositio)
 * - Dark / Light theme support
 *
 * Falls back to i18n defaults when custom text is not provided.
 */

import type { EmailConfig } from "@/types";
import { type EmailLocale, getEmailStrings } from "./email-i18n";
import { detailTable, escapeHtml } from "./email";

/* ── Types ─────────────────────────────────────────────────────────── */

export interface BrandedEmailData {
  locale: EmailLocale;
  emailConfig: EmailConfig;
  // Project info
  projectName: string;
  projectSlug: string;
  projectLogoUrl: string | null;
  constructoraLogoUrl: string | null;
  constructoraNombre: string | null;
  colorPrimario: string;
  // Buyer / quote info
  buyerName: string;
  unidadId: string;
  totalFormatted: string;
  // Tipología details (optional, shown in detail table when present)
  tipologiaName?: string | null;
  areaM2?: number | null;
  habitaciones?: number | null;
  banos?: number | null;
  // URLs for action buttons
  whatsappNumero: string | null;
  tour360Url: string | null;
  brochureUrl: string | null;
  micrositeUrl: string | null;
  // Agent signature
  agentName?: string | null;
  agentPhone?: string | null;
  agentEmail?: string | null;
  agentAvatarUrl?: string | null;
}

/* ── Theme palettes ───────────────────────────────────────────────── */

interface EmailTheme {
  bodyBg: string;
  cardBg: string;
  cardBorder: string;
  headingText: string;
  saludoText: string;
  bodyText: string;
  detailBg: string;
  detailBorder: string;
  detailLabel: string;
  detailValue: string;
  agentBg: string;
  agentBorder: string;
  agentName: string;
  agentContact: string;
  divider: string;
  footerText: string;
  footerDot: string;
  logoDivider: string;
  btnText: string;
}

const DARK_THEME: EmailTheme = {
  bodyBg: "#0a0a0a",
  cardBg: "#141414",
  cardBorder: "#222222",
  headingText: "#f4f0e8",
  saludoText: "#c8c0b8",
  bodyText: "#8a8580",
  detailBg: "#1a1a1a",
  detailBorder: "#222222",
  detailLabel: "#5a5550",
  detailValue: "#f4f0e8",
  agentBg: "#1a1a1a",
  agentBorder: "#2a2a2a",
  agentName: "#f4f0e8",
  agentContact: "#8a8580",
  divider: "#222222",
  footerText: "#5a5550",
  footerDot: "#3a3530",
  logoDivider: "#333",
  btnText: "#141414",
};

const LIGHT_THEME: EmailTheme = {
  bodyBg: "#f5f5f0",
  cardBg: "#ffffff",
  cardBorder: "#e0ddd8",
  headingText: "#1a1a1a",
  saludoText: "#3a3a3a",
  bodyText: "#666660",
  detailBg: "#f8f7f5",
  detailBorder: "#e8e5e0",
  detailLabel: "#8a8580",
  detailValue: "#1a1a1a",
  agentBg: "#f8f7f5",
  agentBorder: "#e8e5e0",
  agentName: "#1a1a1a",
  agentContact: "#666660",
  divider: "#e8e5e0",
  footerText: "#999990",
  footerDot: "#ccc",
  logoDivider: "#ccc",
  btnText: "#141414",
};

function getTheme(tema?: "oscuro" | "claro"): EmailTheme {
  return tema === "claro" ? LIGHT_THEME : DARK_THEME;
}

/* ── Main builder ──────────────────────────────────────────────────── */

export function buildBrandedCotizacionEmail(data: BrandedEmailData): string {
  const { emailConfig: cfg, locale } = data;
  const s = getEmailStrings(locale);
  const primaryColor = data.colorPrimario || "#b8973a";
  const th = getTheme(cfg.email_tema);

  // Build logo row — custom email logos take priority over project defaults
  const projectLogo = cfg.email_project_logo_url || data.projectLogoUrl;
  const constructoraLogo = cfg.email_constructora_logo_url || data.constructoraLogoUrl;

  const logoImages: string[] = [];
  if (cfg.show_project_logo && projectLogo) {
    logoImages.push(
      `<img src="${escapeHtml(projectLogo)}" alt="${escapeHtml(data.projectName)}" height="40" style="display:inline-block;height:40px;max-width:160px;object-fit:contain;border:0;" />`
    );
  }
  if (cfg.show_constructora_logo && constructoraLogo) {
    logoImages.push(
      `<img src="${escapeHtml(constructoraLogo)}" alt="${escapeHtml(data.constructoraNombre || "")}" height="32" style="display:inline-block;height:32px;max-width:140px;object-fit:contain;border:0;" />`
    );
  }

  const logosRow = logoImages.length > 0
    ? `<tr><td align="center" style="padding:40px 40px 0;">
        <div style="display:inline-flex;align-items:center;gap:16px;">
          ${logoImages.join(`<span style="display:inline-block;width:1px;height:24px;background:${th.logoDivider};margin:0 8px;"></span>`)}
        </div>
      </td></tr>`
    : "";

  // Build saludo
  const saludoText = cfg.saludo || s.cotizacionBuyer.defaultSaludo;
  const saludoHtml = `<tr><td align="center" style="padding:0 40px 8px;">
    <p style="margin:0;font-size:14px;color:${th.saludoText};line-height:1.6;">
      ${escapeHtml(saludoText).replace(/\{nombre\}/gi, escapeHtml(data.buyerName)).replace(/\{proyecto\}/gi, escapeHtml(data.projectName))}
    </p>
  </td></tr>`;

  // Build body text
  const cuerpoText = cfg.cuerpo || s.cotizacionBuyer.body;
  const cuerpoHtml = `<tr><td align="center" style="padding:0 40px 16px;">
    <p style="margin:0;font-size:13px;color:${th.bodyText};line-height:1.6;">
      ${escapeHtml(cuerpoText).replace(/\{nombre\}/gi, escapeHtml(data.buyerName)).replace(/\{proyecto\}/gi, escapeHtml(data.projectName))}
    </p>
  </td></tr>`;

  // Build action buttons
  const buttons: string[] = [];

  if (cfg.boton_whatsapp && data.whatsappNumero) {
    const waUrl = `https://wa.me/${data.whatsappNumero.replace(/[^0-9]/g, "")}`;
    buttons.push(actionButton(waUrl, s.cotizacionBuyer.whatsappCta, primaryColor, th.btnText));
  }
  if (cfg.boton_tour_360 && data.tour360Url) {
    buttons.push(actionButton(data.tour360Url, s.cotizacionBuyer.tourCta, primaryColor, th.btnText));
  }
  if (cfg.boton_brochure_link && data.brochureUrl && data.micrositeUrl) {
    const brochurePageUrl = `${data.micrositeUrl}/brochure`;
    buttons.push(actionButton(brochurePageUrl, s.cotizacionBuyer.brochureCta, primaryColor, th.btnText));
  }
  if (cfg.boton_micrositio && data.micrositeUrl) {
    buttons.push(actionButton(data.micrositeUrl, s.cotizacionBuyer.micrositeCta, primaryColor, th.btnText));
  }

  const buttonsRow = buttons.length > 0
    ? `<tr><td align="center" style="padding:8px 40px 24px;">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>${buttons.map((b) => `<td style="padding:0 4px;">${b}</td>`).join("")}</tr>
        </table>
      </td></tr>`
    : "";

  // Build agent signature (if agent data provided)
  let agentSignatureHtml = "";
  if (data.agentName) {
    let avatarHtml = "";
    if (data.agentAvatarUrl) {
      avatarHtml = `<td style="width:48px;vertical-align:top;padding-right:12px;"><img src="${escapeHtml(data.agentAvatarUrl)}" alt="" width="40" height="40" style="border-radius:50%;width:40px;height:40px;object-fit:cover;border:2px solid ${primaryColor};display:block;" /></td>`;
    }
    const textLines: string[] = [
      `<strong style="color:${th.agentName};font-size:13px;">${escapeHtml(data.agentName)}</strong>`,
    ];
    if (data.agentPhone) {
      textLines.push(`<a href="tel:${escapeHtml(data.agentPhone)}" style="color:${th.agentContact};text-decoration:none;font-size:12px;">${escapeHtml(data.agentPhone)}</a>`);
    }
    if (data.agentEmail) {
      textLines.push(`<a href="mailto:${escapeHtml(data.agentEmail)}" style="color:${th.agentContact};text-decoration:none;font-size:12px;">${escapeHtml(data.agentEmail)}</a>`);
    }

    agentSignatureHtml = `<tr><td style="padding:0 40px 20px;">
      <table cellpadding="0" cellspacing="0" border="0" style="background-color:${th.agentBg};border:1px solid ${th.agentBorder};border-radius:10px;padding:14px 18px;width:100%;">
        <tr>
          ${avatarHtml}
          <td style="vertical-align:middle;">
            ${textLines.join("<br/>")}
          </td>
        </tr>
      </table>
    </td></tr>`;
  }

  // Build despedida
  const despedidaText = cfg.despedida || s.cotizacionBuyer.defaultDespedida;
  const signedBy = data.constructoraNombre
    ? `${escapeHtml(despedidaText)}<br/><strong style="color:${th.headingText};">${escapeHtml(data.constructoraNombre)}</strong>`
    : escapeHtml(despedidaText);
  const despedidaHtml = `<tr><td align="center" style="padding:0 40px 28px;">
    <p style="margin:0;font-size:12px;color:${th.bodyText};line-height:1.6;">
      ${signedBy}
    </p>
  </td></tr>`;

  // Assemble full email
  return `<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background-color:${th.bodyBg};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${th.bodyBg};padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" border="0" style="background-color:${th.cardBg};border:1px solid ${th.cardBorder};border-radius:16px;overflow:hidden;max-width:520px;width:100%;">
        <tr><td style="height:3px;background-color:${primaryColor};font-size:0;line-height:0;">&nbsp;</td></tr>
        ${logosRow}
        <tr><td align="center" style="padding:${logoImages.length > 0 ? "12" : "32"}px 40px 6px;">
          <span style="color:${primaryColor};font-size:16px;letter-spacing:8px;">&#x2014; &#x2726; &#x2014;</span>
        </td></tr>
        <tr><td align="center" style="padding:0 40px 4px;">
          <h1 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:300;font-style:italic;color:${th.headingText};letter-spacing:0.02em;">
            ${s.cotizacionBuyer.heading}
          </h1>
        </td></tr>
        <tr><td align="center" style="padding:4px 40px 24px;">
          <span style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:${primaryColor};font-weight:600;">${escapeHtml(data.projectName)}</span>
        </td></tr>
        ${saludoHtml}
        ${detailTable([
          { label: s.cotizacionBuyer.labels.unit, value: data.unidadId },
          ...(data.tipologiaName ? [{ label: s.cotizacionBuyer.labels.tipologia, value: data.tipologiaName }] : []),
          ...(data.areaM2 != null ? [{ label: s.cotizacionBuyer.labels.area, value: `${data.areaM2} m\u00B2` }] : []),
          ...(data.habitaciones != null ? [{ label: s.cotizacionBuyer.labels.habitaciones, value: String(data.habitaciones) }] : []),
          ...(data.banos != null ? [{ label: s.cotizacionBuyer.labels.banos, value: String(data.banos) }] : []),
          { label: s.cotizacionBuyer.labels.total, value: data.totalFormatted, highlight: true },
        ], { detailBg: th.detailBg, detailBorder: th.detailBorder, detailLabel: th.detailLabel, detailValue: th.detailValue, primaryColor })}
        ${cuerpoHtml}
        ${buttonsRow}
        ${agentSignatureHtml}
        ${despedidaHtml}
        <tr><td style="padding:0 40px;"><div style="height:1px;background-color:${th.divider};"></div></td></tr>
        <tr><td style="padding:24px 40px 12px;">
          <p style="margin:0;font-size:11px;color:${th.footerText};text-align:center;line-height:1.6;">
            ${getEmailStrings(locale).shared.footer.company}
          </p>
        </td></tr>
        <tr><td style="padding:0 40px 12px;">
          <p style="margin:0;font-size:11px;text-align:center;line-height:1.6;">
            <a href="https://noddo.io/privacidad" style="color:${th.footerText};text-decoration:underline;">${getEmailStrings(locale).shared.footer.privacy}</a>
            <span style="color:${th.footerDot};"> · </span>
            <a href="https://noddo.io/terminos" style="color:${th.footerText};text-decoration:underline;">${getEmailStrings(locale).shared.footer.terms}</a>
            <span style="color:${th.footerDot};"> · </span>
            <a href="mailto:hola@noddo.io" style="color:${th.footerText};text-decoration:underline;">hola@noddo.io</a>
          </p>
        </td></tr>
        <tr><td style="padding:0 40px 32px;">
          <p style="margin:0;font-size:10px;text-align:center;line-height:1.5;">
            <a href="mailto:hola@noddo.io?subject=Cancelar%20suscripci%C3%B3n" style="color:${th.footerDot};text-decoration:underline;">${getEmailStrings(locale).shared.footer.unsubscribe}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/* ── Action button (smaller, inline) ─────────────────────────────── */

function actionButton(href: string, label: string, bgColor: string, textColor: string): string {
  return `<table cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="background-color:${bgColor};border-radius:6px;">
        <a href="${escapeHtml(href)}" target="_blank" style="display:inline-block;padding:10px 18px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:10px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:${textColor};text-decoration:none;white-space:nowrap;">
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>
  </table>`;
}
