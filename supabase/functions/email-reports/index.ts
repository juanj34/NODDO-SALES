import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@3";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "weekly"; // "weekly" | "monthly"

    console.log(`[email-reports] Running ${type} reports`);

    // Obtener usuarios con reportes habilitados para este tipo
    const { data: configs, error: configError } = await supabase
      .from("email_report_config")
      .select("*")
      .eq(type === "weekly" ? "weekly_enabled" : "monthly_enabled", true);

    if (configError) {
      console.error("[email-reports] Failed to fetch configs:", configError);
      return new Response(JSON.stringify({ error: configError.message }), { status: 500 });
    }

    if (!configs || configs.length === 0) {
      console.log("[email-reports] No users with reports enabled");
      return new Response(JSON.stringify({ sent: 0, message: "No users with reports enabled" }), { status: 200 });
    }

    let sent = 0;
    let failed = 0;

    for (const config of configs) {
      try {
        await sendReport(config, type);
        sent++;
      } catch (err) {
        console.error(`[email-reports] Failed for user ${config.user_id}:`, err);
        failed++;
      }
    }

    // Actualizar timestamp de envío para usuarios que recibieron el reporte
    if (sent > 0) {
      const timestampField = type === "weekly" ? "last_weekly_sent" : "last_monthly_sent";
      await supabase
        .from("email_report_config")
        .update({ [timestampField]: new Date().toISOString() })
        .in("id", configs.map((c) => c.id));
    }

    console.log(`[email-reports] Completed: ${sent} sent, ${failed} failed`);
    return new Response(JSON.stringify({ sent, failed }), { status: 200 });
  } catch (err) {
    console.error("[email-reports] Unexpected error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});

async function sendReport(config: any, type: "weekly" | "monthly") {
  const userId = config.user_id;
  console.log(`[email-reports] sendReport START for user ${userId}`);

  // Obtener datos del usuario de auth.users
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

  if (userError || !userData?.user) {
    console.warn(`[email-reports] Failed to get user ${userId}:`, userError);
    return;
  }

  const userEmail = config.email_override || userData.user.email;
  const userName = userData.user.user_metadata?.name || userData.user.email?.split("@")[0] || "Usuario";
  console.log(`[email-reports] User email: ${userEmail}, name: ${userName}`);

  if (!userEmail) {
    console.warn(`[email-reports] No email for user ${userId}`);
    return;
  }

  // Rango de fechas
  const now = new Date();
  const from = type === "weekly"
    ? new Date(now.getTime() - 7 * 86400000) // 7 días atrás
    : new Date(now.getFullYear(), now.getMonth(), 1); // Primer día del mes
  const to = now;
  console.log(`[email-reports] Date range: ${from.toISOString()} to ${to.toISOString()}`);

  // Obtener proyectos del usuario
  let projectsQuery = supabase
    .from("proyectos")
    .select("id, nombre, moneda_base")
    .eq("user_id", userId);

  if (config.project_ids && config.project_ids.length > 0) {
    projectsQuery = projectsQuery.in("id", config.project_ids);
  }

  const { data: projects, error: projectsError } = await projectsQuery;
  console.log(`[email-reports] Projects query result:`, { projects, error: projectsError });

  if (projectsError || !projects || projects.length === 0) {
    console.warn(`[email-reports] No projects for user ${userId}`);
    return;
  }

  // Obtener datos de analytics + financiero para cada proyecto
  const reportData = [];
  console.log(`[email-reports] Fetching data for ${projects.length} projects`);

  for (const project of projects) {
    console.log(`[email-reports] Fetching data for project ${project.id} (${project.nombre})`);

    const [analyticsRes, financialRes, leadsRes] = await Promise.all([
      supabase.rpc("analytics_summary", {
        p_proyecto_id: project.id,
        p_from: from.toISOString(),
        p_to: to.toISOString(),
      }),
      supabase.rpc("analytics_financial_summary", {
        p_proyecto_id: project.id,
        p_from: from.toISOString(),
        p_to: to.toISOString(),
      }),
      supabase
        .from("leads")
        .select("id")
        .eq("proyecto_id", project.id)
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString()),
    ]);

    console.log(`[email-reports] Project ${project.nombre} data:`, {
      analytics: analyticsRes.data || {},
      financial: financialRes.data || {},
      leads: leadsRes.data?.length || 0,
    });

    reportData.push({
      project,
      analytics: analyticsRes.data || {},
      financial: financialRes.data || {},
      leads: leadsRes.data?.length || 0,
    });
  }

  console.log(`[email-reports] Generating HTML email for ${userEmail}`);
  // Generar HTML del email
  const html = generateReportHTML(reportData, type, from, to, userName);
  console.log(`[email-reports] HTML generated, length: ${html.length} chars`);

  // Enviar via Resend
  console.log(`[email-reports] Calling resend.emails.send() to ${userEmail}`);
  const emailResult = await resend.emails.send({
    from: "NODDO <reportes@noddo.io>",
    to: userEmail,
    subject: `Reporte ${type === "weekly" ? "Semanal" : "Mensual"} NODDO — ${formatDate(now)}`,
    html,
    headers: {
      "List-Unsubscribe": "<mailto:hola@noddo.io?subject=Cancelar%20suscripcion>",
    },
  });

  console.log(`[email-reports] Resend response:`, emailResult);

  if (emailResult.error) {
    console.error(`[email-reports] Resend error for ${userEmail}:`, emailResult.error);
    throw new Error(`Resend error: ${emailResult.error.message}`);
  }

  console.log(`[email-reports] SUCCESS - Sent ${type} report to ${userEmail}, email ID: ${emailResult.data?.id}`);
}

function generateReportHTML(data: any[], type: string, from: Date, to: Date, userName: string): string {
  const periodLabel = type === "weekly" ? "última semana" : "último mes";
  const dateRange = `${formatDateShort(from)} - ${formatDateShort(to)}`;

  // Agregar totales
  const totals = data.reduce(
    (acc, p) => ({
      views: acc.views + (p.analytics.total_views || 0),
      visitors: acc.visitors + (p.analytics.unique_visitors || 0),
      leads: acc.leads + p.leads,
      revenue: acc.revenue + (p.financial.total_revenue || 0),
      sold: acc.sold + (p.financial.vendida_count || 0),
    }),
    { views: 0, visitors: 0, leads: 0, revenue: 0, sold: 0 }
  );

  // Construir filas de la tabla por proyecto (solo si hay proyectos)
  const projectRows = data.length > 0
    ? data
        .map((p) => {
          const currency = p.project.moneda_base || "COP";
          const revenue = formatCurrency(p.financial.total_revenue || 0, currency);

          return `<tr style="border-bottom:1px solid #222222;">
            <td style="padding:12px 16px;font-size:13px;color:#f4f0e8;font-weight:300;">${escapeHtml(p.project.nombre)}</td>
            <td style="padding:12px 16px;text-align:right;font-size:12px;color:#8a8580;">${(p.analytics.total_views || 0).toLocaleString()}</td>
            <td style="padding:12px 16px;text-align:right;font-size:12px;color:#8a8580;">${p.leads}</td>
            <td style="padding:12px 16px;text-align:right;font-size:12px;color:#b8973a;font-weight:600;">${revenue}</td>
            <td style="padding:12px 16px;text-align:right;font-size:12px;color:#8a8580;">${p.financial.vendida_count || 0}</td>
          </tr>`;
        })
        .join("")
    : '<tr><td colspan="5" style="padding:24px;text-align:center;font-size:13px;color:#5a5550;">No hay proyectos activos</td></tr>';

  const appUrl = Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://noddo.io";
  const heading = `Reporte ${type === "weekly" ? "Semanal" : "Mensual"}`;

  // Usar el mismo estilo que todos los emails de NODDO
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" border="0" style="background-color:#141414;border:1px solid #222222;border-radius:16px;overflow:hidden;max-width:520px;width:100%;">
        <!-- Barra dorada superior -->
        <tr><td style="height:3px;background-color:#b8973a;font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- Logo NODDO -->
        <tr><td align="center" style="padding:40px 40px 8px;">
          <img src="https://noddo.io/LOGO_LOGO-WHITE.svg" alt="NODDO" width="140" height="22" style="display:block;border:0;outline:none;" />
        </td></tr>

        <!-- Heading -->
        <tr><td align="center" style="padding:16px 40px 4px;">
          <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:300;color:#f4f0e8;letter-spacing:0.02em;">
            ${heading}
          </h1>
        </td></tr>

        <!-- SubLabel: fecha -->
        <tr><td align="center" style="padding:4px 40px 24px;">
          <span style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#b8973a;font-weight:600;">${dateRange}</span>
        </td></tr>

        <!-- Greeting -->
        <tr><td align="center" style="padding:0 40px 16px;">
          <p style="margin:0;font-size:14px;color:#f4f0e8;line-height:1.7;font-weight:300;">
            Hola ${escapeHtml(userName)},
          </p>
        </td></tr>
        <tr><td align="center" style="padding:0 40px 24px;">
          <p style="margin:0;font-size:13px;color:#8a8580;line-height:1.7;">
            Aquí está el resumen de rendimiento de tus proyectos en la ${periodLabel}.
          </p>
        </td></tr>

        <!-- KPIs Totales -->
        <tr><td style="padding:0 24px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#1a1a1a;border:1px solid #222222;border-radius:12px;overflow:hidden;">
            <tr style="background:#0a0a0a;">
              <td colspan="2" style="padding:12px 16px;">
                <span style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#b8973a;font-weight:600;">Resumen General</span>
              </td>
            </tr>
            <tr style="border-top:1px solid #222222;">
              <td style="padding:8px 16px;font-size:11px;color:#5a5550;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;width:60%;">Visitas Totales</td>
              <td style="padding:8px 16px;font-size:13px;color:#f4f0e8;font-weight:300;text-align:right;">${totals.views.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding:8px 16px;font-size:11px;color:#5a5550;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;">Visitantes Únicos</td>
              <td style="padding:8px 16px;font-size:13px;color:#f4f0e8;font-weight:300;text-align:right;">${totals.visitors.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding:8px 16px;font-size:11px;color:#5a5550;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;">Leads Totales</td>
              <td style="padding:8px 16px;font-size:13px;color:#f4f0e8;font-weight:300;text-align:right;">${totals.leads}</td>
            </tr>
            <tr>
              <td style="padding:8px 16px;font-size:11px;color:#5a5550;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;">Unidades Vendidas</td>
              <td style="padding:8px 16px;font-size:13px;color:#b8973a;font-weight:600;text-align:right;">${totals.sold}</td>
            </tr>
          </table>
        </td></tr>

        <!-- Desglose por Proyecto (solo si hay más de 1 proyecto) -->
        ${
          data.length > 1
            ? `<tr><td align="center" style="padding:0 40px 16px;">
          <span style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#b8973a;font-weight:600;">Desglose por Proyecto</span>
        </td></tr>
        <tr><td style="padding:0 24px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#1a1a1a;border:1px solid #222222;border-radius:12px;overflow:hidden;">
            <thead>
              <tr style="background:#0a0a0a;border-bottom:1px solid #222222;">
                <th style="padding:10px 12px;text-align:left;font-size:9px;color:#5a5550;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;">Proyecto</th>
                <th style="padding:10px 8px;text-align:right;font-size:9px;color:#5a5550;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;">Visitas</th>
                <th style="padding:10px 8px;text-align:right;font-size:9px;color:#5a5550;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;">Leads</th>
                <th style="padding:10px 8px;text-align:right;font-size:9px;color:#5a5550;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;">Ingresos</th>
                <th style="padding:10px 8px;text-align:right;font-size:9px;color:#5a5550;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;">Vendidas</th>
              </tr>
            </thead>
            <tbody>
              ${projectRows}
            </tbody>
          </table>
        </td></tr>`
            : ""
        }

        <!-- CTA Button -->
        <tr><td align="center" style="padding:0 40px 32px;">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" style="background-color:#b8973a;border-radius:8px;">
                <a href="${appUrl}/proyectos" target="_blank" style="display:inline-block;padding:14px 40px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;color:#141414;text-decoration:none;">
                  VER DASHBOARD
                </a>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Divider -->
        <tr><td style="padding:0 40px;"><div style="height:1px;background-color:#222222;"></div></td></tr>

        <!-- Footer -->
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
            <span style="color:#3a3530;"> · </span>
            <a href="${appUrl}/cuenta/reportes" style="color:#5a5550;text-decoration:underline;">Configurar reportes</a>
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

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      notation: "compact",
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
