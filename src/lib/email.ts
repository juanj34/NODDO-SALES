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

  const detailRows = [
    { label: "Nombre", value: data.leadName },
    { label: "Email", value: data.leadEmail },
    data.leadPhone ? { label: "Telefono", value: data.leadPhone } : null,
    data.leadCountry ? { label: "Pais", value: data.leadCountry } : null,
    data.leadTypology ? { label: "Tipologia de interes", value: data.leadTypology } : null,
    data.leadMessage ? { label: "Mensaje", value: data.leadMessage } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  const detailRowsHtml = detailRows
    .map(
      (row) =>
        `<tr>
          <td style="padding:8px 16px;font-size:11px;color:#5a5550;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;vertical-align:top;width:140px;">${row.label}</td>
          <td style="padding:8px 16px;font-size:13px;color:#f4f0e8;font-weight:300;">${escapeHtml(row.value)}</td>
        </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuevo lead — ${escapeHtml(data.projectName)}</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" border="0" style="background-color:#141414;border:1px solid #222222;border-radius:16px;overflow:hidden;max-width:520px;width:100%;">
          <!-- Gold accent bar -->
          <tr>
            <td style="height:3px;background-color:#b8973a;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Logo -->
          <tr>
            <td align="center" style="padding:40px 40px 8px;">
              <span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;letter-spacing:0.15em;font-weight:300;">
                <span style="color:#f4f0e8;">NOD</span><span style="color:#b8973a;">DO</span>
              </span>
            </td>
          </tr>

          <!-- Heading -->
          <tr>
            <td align="center" style="padding:16px 40px 4px;">
              <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:300;color:#f4f0e8;letter-spacing:0.02em;">
                Nuevo lead recibido
              </h1>
            </td>
          </tr>

          <!-- Project name -->
          <tr>
            <td align="center" style="padding:4px 40px 24px;">
              <span style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#b8973a;font-weight:600;">
                ${escapeHtml(data.projectName)}
              </span>
            </td>
          </tr>

          <!-- Lead details table -->
          <tr>
            <td style="padding:0 24px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#1a1a1a;border:1px solid #222222;border-radius:12px;overflow:hidden;">
                ${detailRowsHtml}
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding:0 40px 32px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background-color:#b8973a;border-radius:8px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://noddo.io"}/leads" target="_blank" style="display:inline-block;padding:14px 40px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;color:#141414;text-decoration:none;">
                      Ver Leads
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background-color:#222222;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 32px;">
              <p style="margin:0;font-size:11px;color:#3a3530;text-align:center;line-height:1.6;">
                Micrositios premium para desarrolladores inmobiliarios
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    await resend.emails.send({
      from: fromAddress,
      to: data.adminEmail,
      subject: `Nuevo lead en ${data.projectName} — NODDO`,
      html,
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

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" border="0" style="background-color:#141414;border:1px solid #222222;border-radius:16px;overflow:hidden;max-width:520px;width:100%;">
        <tr><td style="height:3px;background-color:#b8973a;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td align="center" style="padding:40px 40px 8px;">
          <span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;letter-spacing:0.15em;font-weight:300;">
            <span style="color:#f4f0e8;">NOD</span><span style="color:#b8973a;">DO</span>
          </span>
        </td></tr>
        <tr><td align="center" style="padding:16px 40px 4px;">
          <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:300;color:#f4f0e8;">
            Tu cotización está lista
          </h1>
        </td></tr>
        <tr><td align="center" style="padding:4px 40px 24px;">
          <span style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#b8973a;font-weight:600;">
            ${escapeHtml(data.projectName)}
          </span>
        </td></tr>
        <tr><td style="padding:0 24px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#1a1a1a;border:1px solid #222222;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:12px 16px;font-size:11px;color:#5a5550;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;">Unidad</td>
              <td style="padding:12px 16px;font-size:13px;color:#f4f0e8;font-weight:300;">${escapeHtml(data.unidadId)}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-size:11px;color:#5a5550;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;">Total</td>
              <td style="padding:12px 16px;font-size:13px;color:#b8973a;font-weight:600;">${escapeHtml(data.totalFormatted)}</td>
            </tr>
          </table>
        </td></tr>
        <tr><td align="center" style="padding:0 40px 16px;">
          <p style="margin:0;font-size:13px;color:#8a8580;line-height:1.6;">
            Adjunto encontrarás tu cotización en PDF con el desglose completo del plan de pagos.
          </p>
        </td></tr>
        <tr><td style="padding:0 40px;"><div style="height:1px;background-color:#222222;"></div></td></tr>
        <tr><td style="padding:24px 40px 32px;">
          <p style="margin:0;font-size:11px;color:#3a3530;text-align:center;line-height:1.6;">
            Micrositios premium para desarrolladores inmobiliarios
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    await resend.emails.send({
      from: fromAddress,
      to: data.buyerEmail,
      subject: `Tu cotización — ${data.projectName}`,
      html,
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

  const detailRows = [
    { label: "Cliente", value: data.buyerName },
    { label: "Email", value: data.buyerEmail },
    data.buyerPhone ? { label: "Teléfono", value: data.buyerPhone } : null,
    { label: "Unidad", value: data.unidadId },
    { label: "Total", value: data.totalFormatted },
  ].filter(Boolean) as { label: string; value: string }[];

  const detailRowsHtml = detailRows
    .map(
      (row) =>
        `<tr>
          <td style="padding:8px 16px;font-size:11px;color:#5a5550;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;vertical-align:top;width:140px;">${row.label}</td>
          <td style="padding:8px 16px;font-size:13px;color:#f4f0e8;font-weight:300;">${escapeHtml(row.value)}</td>
        </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" border="0" style="background-color:#141414;border:1px solid #222222;border-radius:16px;overflow:hidden;max-width:520px;width:100%;">
        <tr><td style="height:3px;background-color:#b8973a;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td align="center" style="padding:40px 40px 8px;">
          <span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;letter-spacing:0.15em;font-weight:300;">
            <span style="color:#f4f0e8;">NOD</span><span style="color:#b8973a;">DO</span>
          </span>
        </td></tr>
        <tr><td align="center" style="padding:16px 40px 4px;">
          <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:300;color:#f4f0e8;">
            Nueva cotización solicitada
          </h1>
        </td></tr>
        <tr><td align="center" style="padding:4px 40px 24px;">
          <span style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#b8973a;font-weight:600;">
            ${escapeHtml(data.projectName)}
          </span>
        </td></tr>
        <tr><td style="padding:0 24px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#1a1a1a;border:1px solid #222222;border-radius:12px;overflow:hidden;">
            ${detailRowsHtml}
          </table>
        </td></tr>
        <tr><td align="center" style="padding:0 40px 32px;">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" style="background-color:#b8973a;border-radius:8px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://noddo.io"}/leads" target="_blank" style="display:inline-block;padding:14px 40px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;color:#141414;text-decoration:none;">
                  Ver Leads
                </a>
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 40px;"><div style="height:1px;background-color:#222222;"></div></td></tr>
        <tr><td style="padding:24px 40px 32px;">
          <p style="margin:0;font-size:11px;color:#3a3530;text-align:center;line-height:1.6;">
            Micrositios premium para desarrolladores inmobiliarios
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    await resend.emails.send({
      from: fromAddress,
      to: data.adminEmail,
      subject: `Nueva cotización — ${data.projectName}`,
      html,
    });
  } catch (err) {
    console.error("[email] Failed to send admin cotización notification:", err);
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
