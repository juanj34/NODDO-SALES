/**
 * Daily Digest Email - Sends a daily summary email with all key metrics
 * Runs every day at 9:00 AM Colombia time (UTC-5)
 * Endpoint: /api/cron/daily-digest
 *
 * Triggered by: Vercel Cron (configured in vercel.json)
 */

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { Redis } from "@upstash/redis";

const resend = new Resend(process.env.RESEND_API_KEY);

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Vercel Cron authorization
 * https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
 */
function isAuthorizedCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    // If no secret is set, allow in development only
    return process.env.NODE_ENV === "development";
  }

  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * Get metrics from last 24 hours
 */
async function getDailyMetrics() {
  const supabase = await createClient();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  try {
    // Leads (last 24h vs previous 24h)
    const { count: leadsToday } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", yesterday);

    const { count: leadsYesterday } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
      .lt("created_at", yesterday);

    // Projects count
    const { count: totalProjects } = await supabase
      .from("proyectos")
      .select("*", { count: "exact", head: true });

    const { count: publishedProjects } = await supabase
      .from("proyectos")
      .select("*", { count: "exact", head: true })
      .eq("estado", "publicado");

    // Recent errors from dashboard analytics
    const { data: recentErrors } = await supabase
      .from("dashboard_analytics")
      .select("event_data")
      .eq("event_type", "error")
      .gte("timestamp", yesterday)
      .order("timestamp", { ascending: false })
      .limit(5);

    // Redis stats (estimate from info command)
    const redisStats = {
      commandsToday: 0,
      memoryUsageMB: 0,
      maxMemoryMB: 25,
      rateLimitBlocked: 0,
    };

    try {
      // Rate limit blocked (from custom counter if exists)
      const blocked = await redis.get("stats:rate_limit:blocked:today");
      redisStats.rateLimitBlocked = typeof blocked === "number" ? blocked : 0;
    } catch (error) {
      console.error("Error getting Redis stats:", error);
    }

    const leadsChange = leadsYesterday ? ((leadsToday || 0) - leadsYesterday) / leadsYesterday * 100 : 0;

    return {
      leads: {
        today: leadsToday || 0,
        yesterday: leadsYesterday || 0,
        change: leadsChange,
      },
      projects: {
        total: totalProjects || 0,
        published: publishedProjects || 0,
      },
      errors: {
        count: recentErrors?.length || 0,
        recent: (recentErrors || []).map(e => ({
          type: e.event_data?.error_type || "Unknown",
          message: e.event_data?.error_message || "No message",
          count: 1,
        })),
      },
      redis: redisStats,
    };
  } catch (error) {
    console.error("Error getting daily metrics:", error);
    throw error;
  }
}

/**
 * Generate HTML email content
 */
function generateEmailHTML(metrics: Awaited<ReturnType<typeof getDailyMetrics>>, date: string) {
  const { leads, projects, errors, redis } = metrics;

  const leadsEmoji = leads.change > 0 ? "📈" : leads.change < 0 ? "📉" : "➡️";
  const leadsColor = leads.change > 0 ? "#10b981" : leads.change < 0 ? "#ef4444" : "#6b7280";

  const redisMemoryPercent = (redis.memoryUsageMB / redis.maxMemoryMB * 100).toFixed(1);
  const redisCommandsPercent = (redis.commandsToday / 10000 * 100).toFixed(1);

  const redisMemoryColor = parseFloat(redisMemoryPercent) > 80 ? "#ef4444" : parseFloat(redisMemoryPercent) > 60 ? "#f59e0b" : "#10b981";
  const redisCommandsColor = parseFloat(redisCommandsPercent) > 80 ? "#ef4444" : parseFloat(redisCommandsPercent) > 60 ? "#f59e0b" : "#10b981";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NODDO - Resumen Diario</title>
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
                📊 NODDO - Resumen Diario
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
                🎯 Métricas Clave
              </h2>

              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 16px; background-color: #f9fafb; border-radius: 6px; margin-bottom: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <span style="color: #6b7280; font-size: 14px;">Leads (últimas 24h)</span>
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
                      <span style="color: #6b7280; font-size: 14px;">Proyectos Publicados</span>
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
                      <span style="color: #6b7280; font-size: 14px;">Errores (últimas 24h)</span>
                      <strong style="color: ${errors.count > 0 ? "#ef4444" : "#10b981"}; font-size: 24px;">
                        ${errors.count}
                      </strong>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Redis Stats -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 18px; font-weight: 600;">
                ⚡ Upstash Redis
              </h2>

              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                      <span style="color: #6b7280; font-size: 13px;">Comandos hoy</span>
                      <span style="color: #1a1a1a; font-size: 13px; font-weight: 500;">
                        ${redis.commandsToday.toLocaleString()} / 10,000 (${redisCommandsPercent}%)
                      </span>
                    </div>
                    <div style="width: 100%; height: 6px; background-color: #e5e7eb; border-radius: 3px; overflow: hidden;">
                      <div style="width: ${redisCommandsPercent}%; height: 100%; background-color: ${redisCommandsColor}; transition: width 0.3s;"></div>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 12px 0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                      <span style="color: #6b7280; font-size: 13px;">Memoria</span>
                      <span style="color: #1a1a1a; font-size: 13px; font-weight: 500;">
                        ${redis.memoryUsageMB.toFixed(1)} MB / ${redis.maxMemoryMB} MB (${redisMemoryPercent}%)
                      </span>
                    </div>
                    <div style="width: 100%; height: 6px; background-color: #e5e7eb; border-radius: 3px; overflow: hidden;">
                      <div style="width: ${redisMemoryPercent}%; height: 100%; background-color: ${redisMemoryColor}; transition: width 0.3s;"></div>
                    </div>
                  </td>
                </tr>

                ${redis.rateLimitBlocked > 0 ? `
                <tr>
                  <td style="padding: 12px 0;">
                    <div style="display: flex; justify-content: space-between;">
                      <span style="color: #6b7280; font-size: 13px;">Rate limiting bloqueados</span>
                      <span style="color: #ef4444; font-size: 13px; font-weight: 500;">
                        ${redis.rateLimitBlocked} requests
                      </span>
                    </div>
                  </td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>

          ${errors.recent.length > 0 ? `
          <!-- Recent Errors -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 18px; font-weight: 600;">
                🔴 Errores Recientes
              </h2>

              ${errors.recent.slice(0, 3).map((error, i) => `
                <div style="padding: 12px; background-color: #fef2f2; border-left: 3px solid #ef4444; border-radius: 4px; margin-bottom: 8px;">
                  <strong style="color: #991b1b; font-size: 13px;">${i + 1}. ${error.type}</strong>
                  <p style="margin: 4px 0 0; color: #7f1d1d; font-size: 12px;">
                    ${error.message.substring(0, 100)}${error.message.length > 100 ? '...' : ''}
                  </p>
                </div>
              `).join('')}
            </td>
          </tr>
          ` : ''}

          <!-- Quick Links -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 18px; font-weight: 600;">
                🔗 Links Rápidos
              </h2>

              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="padding: 8px 0;">
                    <a href="https://sentry.io/organizations/noddo/projects/noddo-app/"
                       style="color: #b8973a; text-decoration: none; font-size: 14px;">
                      → Sentry (Errores)
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <a href="https://console.upstash.com/redis/d7364351-4963-49c6-a83d-c58a4c03c8da"
                       style="color: #b8973a; text-decoration: none; font-size: 14px;">
                      → Upstash (Redis)
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <a href="https://vercel.com/juanj34s-projects/noddo"
                       style="color: #b8973a; text-decoration: none; font-size: 14px;">
                      → Vercel (Deployments)
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <a href="https://noddo.io/dashboard"
                       style="color: #b8973a; text-decoration: none; font-size: 14px;">
                      → Dashboard NODDO
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
                Este es un email automático enviado diariamente a las 9:00 AM.<br>
                Para cambiar la configuración, visita tu dashboard de NODDO.
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

    const today = new Date().toLocaleDateString("es-CO", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    console.log("📧 Generating daily digest for:", today);

    const metrics = await getDailyMetrics();
    const htmlContent = generateEmailHTML(metrics, today);

    const { data, error } = await resend.emails.send({
      from: "NODDO Analytics <analytics@noddo.io>",
      to: ["juanjaramillo34@gmail.com"],
      subject: `📊 NODDO - Resumen Diario (${new Date().toLocaleDateString("es-CO", { day: "numeric", month: "short" })})`,
      html: htmlContent,
    });

    if (error) {
      console.error("❌ Error sending digest email:", error);
      return NextResponse.json(
        { error: "Failed to send email", details: error },
        { status: 500 }
      );
    }

    console.log("✅ Daily digest sent successfully:", data);

    return NextResponse.json({
      success: true,
      message: "Daily digest sent",
      emailId: data?.id,
      metrics,
    });
  } catch (error) {
    console.error("❌ Error in daily digest cron:", error);
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
