/**
 * Daily Digest Email - Sends a personalized daily summary to each opted-in admin
 * Runs every day at 9:00 AM Colombia time (UTC-5)
 * Endpoint: /api/cron/daily-digest
 *
 * Triggered by: Vercel Cron (configured in vercel.json)
 */

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { Redis } from "@upstash/redis";

// Lazy initialization
function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY environment variable is not set");
  }
  return new Resend(process.env.RESEND_API_KEY);
}

function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error("Upstash Redis environment variables are not set");
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

/**
 * Vercel Cron authorization
 */
function isAuthorizedCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return process.env.NODE_ENV === "development";
  }

  return authHeader === `Bearer ${cronSecret}`;
}

interface AdminDigestTarget {
  userId: string;
  email: string;
  locale: "es" | "en";
  projectIds: string[];
  projectNames: string[];
}

/**
 * Get all admins who have daily digest enabled
 */
async function getDigestRecipients(): Promise<AdminDigestTarget[]> {
  const supabase = createAdminClient();

  // Get all admin users (those who own at least one project)
  const { data: projectOwners } = await supabase
    .from("proyectos")
    .select("user_id");

  if (!projectOwners?.length) return [];

  const uniqueOwnerIds = [...new Set(projectOwners.map((p) => p.user_id))];

  // Check which owners have daily digest enabled (or no config = default enabled)
  const { data: configs } = await supabase
    .from("email_report_config")
    .select("user_id, daily_digest_enabled, email_override")
    .in("user_id", uniqueOwnerIds);

  const configMap = new Map(
    (configs || []).map((c) => [c.user_id, c])
  );

  // Filter: include if no config (default=enabled) or daily_digest_enabled=true
  const enabledOwnerIds = uniqueOwnerIds.filter((uid) => {
    const cfg = configMap.get(uid);
    return !cfg || cfg.daily_digest_enabled !== false;
  });

  if (enabledOwnerIds.length === 0) return [];

  // Get locale preferences for all enabled owners
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("id, locale")
    .in("id", enabledOwnerIds);

  const localeMap = new Map(
    (profiles || []).map((p) => [p.id, p.locale as "es" | "en"])
  );

  // Get emails for enabled owners
  const recipients: AdminDigestTarget[] = [];

  for (const userId of enabledOwnerIds) {
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    if (!userData?.user?.email) continue;

    const cfg = configMap.get(userId);
    const email = cfg?.email_override || userData.user.email;
    const locale = localeMap.get(userId) || "es";

    // Get this admin's projects
    const { data: projects } = await supabase
      .from("proyectos")
      .select("id, nombre")
      .eq("user_id", userId);

    if (!projects?.length) continue;

    recipients.push({
      userId,
      email,
      locale,
      projectIds: projects.map((p) => p.id),
      projectNames: projects.map((p) => p.nombre),
    });
  }

  return recipients;
}

/**
 * Get metrics for a specific admin's projects (last 24h)
 */
async function getAdminMetrics(projectIds: string[]) {
  const supabase = createAdminClient();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  // Leads today vs yesterday
  const { count: leadsToday } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .in("proyecto_id", projectIds)
    .gte("created_at", yesterday);

  const { count: leadsYesterday } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .in("proyecto_id", projectIds)
    .gte("created_at", twoDaysAgo)
    .lt("created_at", yesterday);

  // Projects status
  const { count: totalProjects } = await supabase
    .from("proyectos")
    .select("*", { count: "exact", head: true })
    .in("id", projectIds);

  const { count: publishedProjects } = await supabase
    .from("proyectos")
    .select("*", { count: "exact", head: true })
    .in("id", projectIds)
    .eq("estado", "publicado");

  // Unit changes (from activity_logs)
  const { count: unitChanges } = await supabase
    .from("activity_logs")
    .select("*", { count: "exact", head: true })
    .in("proyecto_id", projectIds)
    .eq("action_category", "unit")
    .gte("created_at", yesterday);

  // Cotizaciones
  const { count: cotizaciones } = await supabase
    .from("cotizaciones")
    .select("*", { count: "exact", head: true })
    .in("proyecto_id", projectIds)
    .gte("created_at", yesterday);

  const leadsChange = leadsYesterday
    ? (((leadsToday || 0) - leadsYesterday) / leadsYesterday) * 100
    : 0;

  return {
    leads: { today: leadsToday || 0, yesterday: leadsYesterday || 0, change: leadsChange },
    projects: { total: totalProjects || 0, published: publishedProjects || 0 },
    unitChanges: unitChanges || 0,
    cotizaciones: cotizaciones || 0,
  };
}

/**
 * Get activity summary for a specific admin's projects (last 24h)
 */
async function getAdminActivitySummary(projectIds: string[]) {
  const supabase = createAdminClient();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: activities } = await supabase
    .from("activity_logs")
    .select("action_category, description, description_en")
    .in("proyecto_id", projectIds)
    .gte("created_at", yesterday)
    .order("created_at", { ascending: false })
    .limit(200);

  if (!activities || activities.length === 0) {
    return { total: 0, byCategory: {} as Record<string, number>, recentEs: [] as string[], recentEn: [] as string[] };
  }

  const byCategory: Record<string, number> = {};
  for (const a of activities) {
    byCategory[a.action_category] = (byCategory[a.action_category] || 0) + 1;
  }

  const top5 = activities.slice(0, 5);
  const recentEs = top5.map((a) => a.description);
  const recentEn = top5.map((a) => a.description_en || a.description);

  return { total: activities.length, byCategory, recentEs, recentEn };
}

/**
 * Get platform-level stats (only for platform admin)
 */
async function getPlatformStats() {
  let redisStats = { commandsToday: 0, memoryUsageMB: 0, maxMemoryMB: 25, rateLimitBlocked: 0 };

  try {
    const redis = getRedis();
    const blocked = await redis.get("stats:rate_limit:blocked:today");
    redisStats.rateLimitBlocked = typeof blocked === "number" ? blocked : 0;
  } catch {
    // Redis stats are optional
  }

  const supabase = createAdminClient();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: recentErrors } = await supabase
    .from("dashboard_analytics")
    .select("event_data")
    .eq("event_type", "error")
    .gte("timestamp", yesterday)
    .order("timestamp", { ascending: false })
    .limit(5);

  return {
    redis: redisStats,
    errors: {
      count: recentErrors?.length || 0,
      recent: (recentErrors || []).map((e) => ({
        type: e.event_data?.error_type || "Unknown",
        message: e.event_data?.error_message || "No message",
      })),
    },
  };
}

type AdminMetrics = Awaited<ReturnType<typeof getAdminMetrics>>;
type ActivitySummary = Awaited<ReturnType<typeof getAdminActivitySummary>>;
type PlatformStats = Awaited<ReturnType<typeof getPlatformStats>> | null;

/**
 * Email copy in both languages
 */
const EMAIL_COPY = {
  es: {
    title: "NODDO - Resumen Diario",
    keyMetrics: "Metricas Clave",
    leads24h: "Leads (ultimas 24h)",
    publishedProjects: "Proyectos Publicados",
    inventoryChanges: "Cambios de inventario",
    quotesGenerated: "Cotizaciones generadas",
    activitySummary: (n: number) => `Resumen de Actividad (${n} acciones)`,
    recentActions: "Ultimas acciones:",
    platform: "Plataforma",
    rateLimitBlocked: "Rate limiting bloqueados",
    errors24h: "Errores (ultimas 24h)",
    goToDashboard: "Ir a tu Dashboard",
    viewActivityLog: "Ver Bitacora completa",
    footer: "Recibes este email porque tienes habilitado el resumen diario.",
    disableLink: "Desactivar en Cuenta &rarr; Notificaciones",
    catLabels: { project: "Proyectos", unit: "Unidades", lead: "Leads", cotizacion: "Cotizaciones", gallery: "Galeria", video: "Videos", tipologia: "Tipologias", colaborador: "Colaboradores", content: "Contenido", other: "Otros" } as Record<string, string>,
  },
  en: {
    title: "NODDO - Daily Digest",
    keyMetrics: "Key Metrics",
    leads24h: "Leads (last 24h)",
    publishedProjects: "Published Projects",
    inventoryChanges: "Inventory changes",
    quotesGenerated: "Quotes generated",
    activitySummary: (n: number) => `Activity Summary (${n} actions)`,
    recentActions: "Recent actions:",
    platform: "Platform",
    rateLimitBlocked: "Rate limit blocked",
    errors24h: "Errors (last 24h)",
    goToDashboard: "Go to Dashboard",
    viewActivityLog: "View Activity Log",
    footer: "You receive this email because you have the daily digest enabled.",
    disableLink: "Disable in Account &rarr; Notifications",
    catLabels: { project: "Projects", unit: "Units", lead: "Leads", cotizacion: "Quotes", gallery: "Gallery", video: "Videos", tipologia: "Types", colaborador: "Collaborators", content: "Content", other: "Other" } as Record<string, string>,
  },
};

/**
 * Generate personalized HTML email
 */
function generateEmailHTML(
  metrics: AdminMetrics,
  activitySummary: ActivitySummary,
  platformStats: PlatformStats,
  date: string,
  locale: "es" | "en",
) {
  const { leads, projects, unitChanges, cotizaciones } = metrics;
  const t = EMAIL_COPY[locale];
  const recent = locale === "en" ? activitySummary.recentEn : activitySummary.recentEs;

  const leadsEmoji = leads.change > 0 ? "📈" : leads.change < 0 ? "📉" : "➡️";
  const leadsColor = leads.change > 0 ? "#10b981" : leads.change < 0 ? "#ef4444" : "#6b7280";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; background: linear-gradient(135deg, #b8973a 0%, #d4b05a 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #1a1a1a; font-size: 28px; font-weight: 600;">
                ${t.title}
              </h1>
              <p style="margin: 8px 0 0; color: #2a2a2a; font-size: 14px; opacity: 0.9;">
                ${date}
              </p>
            </td>
          </tr>

          <!-- Key Metrics -->
          <tr>
            <td style="padding: 30px 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 18px; font-weight: 600;">
                ${t.keyMetrics}
              </h2>

              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 16px; background-color: #f9fafb; border-radius: 6px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <span style="color: #6b7280; font-size: 14px;">${t.leads24h}</span>
                      <div style="text-align: right;">
                        <strong style="color: #1a1a1a; font-size: 24px;">${leads.today}</strong>
                        <span style="color: ${leadsColor}; font-size: 14px; margin-left: 8px;">
                          ${leadsEmoji} ${leads.change.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>

                <tr><td style="height: 8px;"></td></tr>

                <tr>
                  <td style="padding: 16px; background-color: #f9fafb; border-radius: 6px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <span style="color: #6b7280; font-size: 14px;">${t.publishedProjects}</span>
                      <strong style="color: #1a1a1a; font-size: 24px;">
                        ${projects.published} <span style="color: #6b7280; font-size: 14px;">/ ${projects.total}</span>
                      </strong>
                    </div>
                  </td>
                </tr>

                <tr><td style="height: 8px;"></td></tr>

                <tr>
                  <td style="padding: 16px; background-color: #f9fafb; border-radius: 6px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <span style="color: #6b7280; font-size: 14px;">${t.inventoryChanges}</span>
                      <strong style="color: #1a1a1a; font-size: 24px;">${unitChanges}</strong>
                    </div>
                  </td>
                </tr>

                <tr><td style="height: 8px;"></td></tr>

                <tr>
                  <td style="padding: 16px; background-color: #f9fafb; border-radius: 6px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <span style="color: #6b7280; font-size: 14px;">${t.quotesGenerated}</span>
                      <strong style="color: #1a1a1a; font-size: 24px;">${cotizaciones}</strong>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Activity Summary -->
          ${activitySummary.total > 0 ? `
          <tr>
            <td style="padding: 0 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 18px; font-weight: 600;">
                ${t.activitySummary(activitySummary.total)}
              </h2>

              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 16px; background-color: #f9fafb; border-radius: 6px;">
                    ${Object.entries(activitySummary.byCategory).map(([cat, count]) => {
                      return `<span style="display: inline-block; margin: 3px 6px 3px 0; padding: 4px 10px; background-color: #e5e7eb; border-radius: 12px; font-size: 12px; color: #374151;">
                        ${t.catLabels[cat] || cat}: <strong>${count}</strong>
                      </span>`;
                    }).join("")}
                  </td>
                </tr>
              </table>

              ${recent.length > 0 ? `
              <div style="margin-top: 12px;">
                <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; font-weight: 600;">${t.recentActions}</p>
                ${recent.map((desc) => `
                  <div style="padding: 6px 0; border-bottom: 1px solid #f3f4f6; font-size: 12px; color: #4b5563;">
                    &bull; ${desc}
                  </div>
                `).join("")}
              </div>
              ` : ""}
            </td>
          </tr>
          ` : ""}

          ${platformStats ? `
          <!-- Platform Stats (admin only) -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 18px; font-weight: 600;">
                ${t.platform}
              </h2>

              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                ${platformStats.redis.rateLimitBlocked > 0 ? `
                <tr>
                  <td style="padding: 12px 0;">
                    <div style="display: flex; justify-content: space-between;">
                      <span style="color: #6b7280; font-size: 13px;">${t.rateLimitBlocked}</span>
                      <span style="color: #ef4444; font-size: 13px; font-weight: 500;">
                        ${platformStats.redis.rateLimitBlocked} requests
                      </span>
                    </div>
                  </td>
                </tr>
                ` : ""}

                <tr>
                  <td style="padding: 12px 0;">
                    <div style="display: flex; justify-content: space-between;">
                      <span style="color: #6b7280; font-size: 13px;">${t.errors24h}</span>
                      <span style="color: ${platformStats.errors.count > 0 ? "#ef4444" : "#10b981"}; font-size: 13px; font-weight: 500;">
                        ${platformStats.errors.count}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>

              ${platformStats.errors.recent.length > 0 ? `
              <div style="margin-top: 8px;">
                ${platformStats.errors.recent.slice(0, 3).map((error, i) => `
                  <div style="padding: 8px; background-color: #fef2f2; border-left: 3px solid #ef4444; border-radius: 4px; margin-bottom: 6px;">
                    <strong style="color: #991b1b; font-size: 12px;">${i + 1}. ${error.type}</strong>
                    <p style="margin: 2px 0 0; color: #7f1d1d; font-size: 11px;">
                      ${error.message.substring(0, 100)}${error.message.length > 100 ? "..." : ""}
                    </p>
                  </div>
                `).join("")}
              </div>
              ` : ""}
            </td>
          </tr>
          ` : ""}

          <!-- Quick Links -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="padding: 8px 0;">
                    <a href="https://noddo.io/dashboard"
                       style="color: #b8973a; text-decoration: none; font-size: 14px;">
                      &rarr; ${t.goToDashboard}
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <a href="https://noddo.io/bitacora"
                       style="color: #b8973a; text-decoration: none; font-size: 14px;">
                      &rarr; ${t.viewActivityLog}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                ${t.footer}<br>
                <a href="https://noddo.io/cuenta" style="color: #b8973a; text-decoration: none;">
                  ${t.disableLink}
                </a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Platform admin user ID (from .env or hardcoded for the main account)
 */
const PLATFORM_ADMIN_EMAIL = "juanjaramillo34@gmail.com";

/**
 * POST handler for manual trigger (for testing)
 */
export async function POST(request: NextRequest) {
  try {
    if (!isAuthorizedCronRequest(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("[daily-digest] Generating daily digests");

    // Get all opted-in admins
    const recipients = await getDigestRecipients();

    if (recipients.length === 0) {
      console.log("[daily-digest] No recipients with daily digest enabled");
      return NextResponse.json({ success: true, message: "No recipients", sent: 0 });
    }

    console.log(`[daily-digest] Sending to ${recipients.length} recipient(s)`);

    // Platform stats only fetched once (for platform admin)
    let platformStats: PlatformStats = null;
    const hasPlatformAdmin = recipients.some((r) => r.email === PLATFORM_ADMIN_EMAIL);
    if (hasPlatformAdmin) {
      platformStats = await getPlatformStats();
    }

    const resend = getResend();
    const supabase = createAdminClient();
    const results: { email: string; success: boolean; error?: string }[] = [];

    for (const recipient of recipients) {
      try {
        // Get personalized metrics and activity
        const [metrics, activitySummary] = await Promise.all([
          getAdminMetrics(recipient.projectIds),
          getAdminActivitySummary(recipient.projectIds),
        ]);

        // Only include platform stats for the platform admin
        const includePlatformStats =
          recipient.email === PLATFORM_ADMIN_EMAIL ? platformStats : null;

        // Format date in recipient's locale
        const dateFmt = recipient.locale === "en" ? "en-US" : "es-CO";
        const dateStr = new Date().toLocaleDateString(dateFmt, {
          weekday: "long", year: "numeric", month: "long", day: "numeric",
        });
        const shortDate = new Date().toLocaleDateString(dateFmt, { day: "numeric", month: "short" });
        const subjectPrefix = recipient.locale === "en" ? "NODDO - Daily Digest" : "NODDO - Resumen Diario";

        const htmlContent = generateEmailHTML(
          metrics,
          activitySummary,
          includePlatformStats,
          dateStr,
          recipient.locale,
        );

        const { error } = await resend.emails.send({
          from: "NODDO <analytics@noddo.io>",
          to: [recipient.email],
          subject: `${subjectPrefix} (${shortDate})`,
          html: htmlContent,
        });

        if (error) {
          console.error(`[daily-digest] Error sending to ${recipient.email}:`, error);
          results.push({ email: recipient.email, success: false, error: String(error) });
        } else {
          results.push({ email: recipient.email, success: true });

          // Update last_daily_sent
          await supabase
            .from("email_report_config")
            .upsert(
              { user_id: recipient.userId, last_daily_sent: new Date().toISOString(), updated_at: new Date().toISOString() },
              { onConflict: "user_id" }
            );
        }
      } catch (err) {
        console.error(`[daily-digest] Error processing ${recipient.email}:`, err);
        results.push({ email: recipient.email, success: false, error: String(err) });
      }
    }

    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(`[daily-digest] Done: ${sent} sent, ${failed} failed`);

    return NextResponse.json({
      success: true,
      message: `Daily digest sent to ${sent} recipients`,
      sent,
      failed,
      results,
    });
  } catch (error) {
    console.error("[daily-digest] Error in daily digest cron:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET handler - Vercel Cron uses GET by default
 */
export async function GET(request: NextRequest) {
  return POST(request);
}
