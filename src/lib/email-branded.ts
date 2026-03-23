/**
 * Branded cotización email builder.
 *
 * Generates HTML for project-customized buyer emails with:
 * - Project/constructora logos
 * - Custom greeting, body, and sign-off text
 * - Action buttons (WhatsApp, Tour 360, Brochure, Micrositio)
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

/* ── Main builder ──────────────────────────────────────────────────── */

export function buildBrandedCotizacionEmail(data: BrandedEmailData): string {
  const { emailConfig: cfg, locale } = data;
  const s = getEmailStrings(locale);
  const primaryColor = data.colorPrimario || "#b8973a";

  // Build logo row
  const logoImages: string[] = [];
  if (cfg.show_project_logo && data.projectLogoUrl) {
    logoImages.push(
      `<img src="${escapeHtml(data.projectLogoUrl)}" alt="${escapeHtml(data.projectName)}" height="40" style="display:inline-block;height:40px;max-width:160px;object-fit:contain;border:0;" />`
    );
  }
  if (cfg.show_constructora_logo && data.constructoraLogoUrl) {
    logoImages.push(
      `<img src="${escapeHtml(data.constructoraLogoUrl)}" alt="${escapeHtml(data.constructoraNombre || "")}" height="32" style="display:inline-block;height:32px;max-width:140px;object-fit:contain;border:0;" />`
    );
  }

  const logosRow = logoImages.length > 0
    ? `<tr><td align="center" style="padding:20px 40px 0;">
        <div style="display:inline-flex;align-items:center;gap:16px;">
          ${logoImages.join('<span style="display:inline-block;width:1px;height:24px;background:#333;margin:0 8px;"></span>')}
        </div>
      </td></tr>`
    : "";

  // Build saludo
  const saludoText = cfg.saludo || s.cotizacionBuyer.defaultSaludo;
  const saludoHtml = `<tr><td align="center" style="padding:0 40px 8px;">
    <p style="margin:0;font-size:14px;color:#c8c0b8;line-height:1.6;">
      ${escapeHtml(saludoText).replace(/\{nombre\}/gi, escapeHtml(data.buyerName)).replace(/\{proyecto\}/gi, escapeHtml(data.projectName))}
    </p>
  </td></tr>`;

  // Build body text
  const cuerpoText = cfg.cuerpo || s.cotizacionBuyer.body;
  const cuerpoHtml = `<tr><td align="center" style="padding:0 40px 16px;">
    <p style="margin:0;font-size:13px;color:#8a8580;line-height:1.6;">
      ${escapeHtml(cuerpoText).replace(/\{nombre\}/gi, escapeHtml(data.buyerName)).replace(/\{proyecto\}/gi, escapeHtml(data.projectName))}
    </p>
  </td></tr>`;

  // Build action buttons
  const buttons: string[] = [];

  if (cfg.boton_whatsapp && data.whatsappNumero) {
    const waUrl = `https://wa.me/${data.whatsappNumero.replace(/[^0-9]/g, "")}`;
    buttons.push(actionButton(waUrl, s.cotizacionBuyer.whatsappCta, primaryColor));
  }
  if (cfg.boton_tour_360 && data.tour360Url) {
    buttons.push(actionButton(data.tour360Url, s.cotizacionBuyer.tourCta, primaryColor));
  }
  if (cfg.boton_brochure_link && data.brochureUrl && data.micrositeUrl) {
    const brochurePageUrl = `${data.micrositeUrl}/brochure`;
    buttons.push(actionButton(brochurePageUrl, s.cotizacionBuyer.brochureCta, primaryColor));
  }
  if (cfg.boton_micrositio && data.micrositeUrl) {
    buttons.push(actionButton(data.micrositeUrl, s.cotizacionBuyer.micrositeCta, primaryColor));
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
    const agentParts: string[] = [];
    if (data.agentAvatarUrl) {
      agentParts.push(`<img src="${escapeHtml(data.agentAvatarUrl)}" alt="" width="40" height="40" style="border-radius:50%;width:40px;height:40px;object-fit:cover;border:2px solid ${primaryColor};display:block;" />`);
    }
    const textLines: string[] = [
      `<strong style="color:#f4f0e8;font-size:13px;">${escapeHtml(data.agentName)}</strong>`,
    ];
    if (data.agentPhone) {
      textLines.push(`<a href="tel:${escapeHtml(data.agentPhone)}" style="color:#8a8580;text-decoration:none;font-size:12px;">${escapeHtml(data.agentPhone)}</a>`);
    }
    if (data.agentEmail) {
      textLines.push(`<a href="mailto:${escapeHtml(data.agentEmail)}" style="color:#8a8580;text-decoration:none;font-size:12px;">${escapeHtml(data.agentEmail)}</a>`);
    }

    agentSignatureHtml = `<tr><td style="padding:0 40px 20px;">
      <table cellpadding="0" cellspacing="0" border="0" style="background-color:#1a1a1a;border:1px solid #2a2a2a;border-radius:10px;padding:14px 18px;width:100%;">
        <tr>
          ${data.agentAvatarUrl ? `<td style="width:48px;vertical-align:top;padding-right:12px;">${agentParts[0]}</td>` : ""}
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
    ? `${escapeHtml(despedidaText)}<br/><strong style="color:#f4f0e8;">${escapeHtml(data.constructoraNombre)}</strong>`
    : escapeHtml(despedidaText);
  const despedidaHtml = `<tr><td align="center" style="padding:0 40px 28px;">
    <p style="margin:0;font-size:12px;color:#8a8580;line-height:1.6;">
      ${signedBy}
    </p>
  </td></tr>`;

  // Assemble full email
  return `<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" border="0" style="background-color:#141414;border:1px solid #222222;border-radius:16px;overflow:hidden;max-width:520px;width:100%;">
        <tr><td style="height:3px;background-color:${primaryColor};font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td align="center" style="padding:40px 40px 8px;">
          <img src="https://noddo.io/LOGO_LOGO-WHITE.svg" alt="NODDO" width="140" height="22" style="display:block;border:0;outline:none;" />
        </td></tr>
        ${logosRow}
        <tr><td align="center" style="padding:16px 40px 4px;">
          <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:300;color:#f4f0e8;letter-spacing:0.02em;">
            ${s.cotizacionBuyer.heading}
          </h1>
        </td></tr>
        <tr><td align="center" style="padding:4px 40px 24px;">
          <span style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:${primaryColor};font-weight:600;">${escapeHtml(data.projectName)}</span>
        </td></tr>
        ${saludoHtml}
        ${detailTable([
          { label: s.cotizacionBuyer.labels.unit, value: data.unidadId },
          { label: s.cotizacionBuyer.labels.total, value: data.totalFormatted, highlight: true },
        ])}
        ${cuerpoHtml}
        ${buttonsRow}
        ${agentSignatureHtml}
        ${despedidaHtml}
        <tr><td style="padding:0 40px;"><div style="height:1px;background-color:#222222;"></div></td></tr>
        <tr><td style="padding:24px 40px 12px;">
          <p style="margin:0;font-size:11px;color:#5a5550;text-align:center;line-height:1.6;">
            ${getEmailStrings(locale).shared.footer.company}
          </p>
        </td></tr>
        <tr><td style="padding:0 40px 12px;">
          <p style="margin:0;font-size:11px;text-align:center;line-height:1.6;">
            <a href="https://noddo.io/privacidad" style="color:#5a5550;text-decoration:underline;">${getEmailStrings(locale).shared.footer.privacy}</a>
            <span style="color:#3a3530;"> · </span>
            <a href="https://noddo.io/terminos" style="color:#5a5550;text-decoration:underline;">${getEmailStrings(locale).shared.footer.terms}</a>
            <span style="color:#3a3530;"> · </span>
            <a href="mailto:hola@noddo.io" style="color:#5a5550;text-decoration:underline;">hola@noddo.io</a>
          </p>
        </td></tr>
        <tr><td style="padding:0 40px 32px;">
          <p style="margin:0;font-size:10px;text-align:center;line-height:1.5;">
            <a href="mailto:hola@noddo.io?subject=Cancelar%20suscripci%C3%B3n" style="color:#3a3530;text-decoration:underline;">${getEmailStrings(locale).shared.footer.unsubscribe}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/* ── Action button (smaller, inline) ─────────────────────────────── */

function actionButton(href: string, label: string, color: string): string {
  return `<table cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="background-color:${color};border-radius:6px;">
        <a href="${escapeHtml(href)}" target="_blank" style="display:inline-block;padding:10px 18px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:10px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#141414;text-decoration:none;white-space:nowrap;">
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>
  </table>`;
}
