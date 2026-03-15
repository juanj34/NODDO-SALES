import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// Lazy initialization - only create when needed (avoids build-time errors)
function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY environment variable is not set");
  }
  return new Resend(process.env.RESEND_API_KEY);
}

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase environment variables are not set");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// Verificar autorización del cron
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) return true; // Si no hay secret, permitir (desarrollo)

  return authHeader === `Bearer ${cronSecret}`;
}

interface ResourceMetrics {
  service: string;
  current: number;
  limit: number;
  percentage: number;
  unit: string;
  status: "safe" | "warning" | "critical";
  recommendation?: string;
}

interface UpstashStats {
  total_commands?: number;
  total_bandwidth?: number;
  db_disk?: number;
  db_memory?: number;
  db_request_limit?: number;
}

// Obtener métricas de Vercel
async function getVercelMetrics(): Promise<ResourceMetrics[]> {
  const vercelToken = process.env.VERCEL_API_TOKEN || process.env.AUTH_BEARER_TOKEN;
  const vercelProjectId = process.env.VERCEL_PROJECT_ID;
  const vercelTeamId = process.env.VERCEL_TEAM_ID;

  if (!vercelToken || !vercelProjectId) {
    return [];
  }

  const metrics: ResourceMetrics[] = [];

  try {
    // Obtener uso de funciones (último mes)
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const since = lastMonth.getTime();
    const until = today.getTime();

    const url = vercelTeamId
      ? `https://api.vercel.com/v1/analytics/usage?projectId=${vercelProjectId}&teamId=${vercelTeamId}&since=${since}&until=${until}`
      : `https://api.vercel.com/v1/analytics/usage?projectId=${vercelProjectId}&since=${since}&until=${until}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${vercelToken}` },
    });

    if (response.ok) {
      const data = await response.json();

      // Invocaciones serverless (límite Hobby: 100,000/mes)
      const invocations = data.usage?.requests || 0;
      metrics.push({
        service: "Vercel Serverless Functions",
        current: invocations,
        limit: 100000,
        percentage: (invocations / 100000) * 100,
        unit: "invocations/month",
        status: invocations > 80000 ? "critical" : invocations > 60000 ? "warning" : "safe",
        recommendation: invocations > 80000
          ? "⚠️ Considera upgrade a Pro (1M invocations/mes)"
          : invocations > 60000
            ? "Monitorear de cerca, acercándose al límite"
            : undefined,
      });

      // Bandwidth (límite Hobby: 100 GB/mes)
      const bandwidth = data.usage?.bandwidth || 0;
      const bandwidthGB = bandwidth / (1024 * 1024 * 1024);
      metrics.push({
        service: "Vercel Bandwidth",
        current: Math.round(bandwidthGB * 100) / 100,
        limit: 100,
        percentage: (bandwidthGB / 100) * 100,
        unit: "GB/month",
        status: bandwidthGB > 80 ? "critical" : bandwidthGB > 60 ? "warning" : "safe",
        recommendation: bandwidthGB > 80
          ? "⚠️ Considera upgrade a Pro (1TB/mes) o optimizar assets"
          : bandwidthGB > 60
            ? "Optimizar imágenes y videos si es posible"
            : undefined,
      });

      // Build time (límite Hobby: 6,000 min/mes)
      const buildMinutes = data.usage?.buildMinutes || 0;
      metrics.push({
        service: "Vercel Build Time",
        current: buildMinutes,
        limit: 6000,
        percentage: (buildMinutes / 6000) * 100,
        unit: "minutes/month",
        status: buildMinutes > 4800 ? "critical" : buildMinutes > 3600 ? "warning" : "safe",
        recommendation: buildMinutes > 4800
          ? "⚠️ Considera upgrade a Pro o reducir frecuencia de deploys"
          : undefined,
      });
    }
  } catch (error) {
    console.error("Error fetching Vercel metrics:", error);
  }

  return metrics;
}

// Obtener métricas de Supabase
async function getSupabaseMetrics(): Promise<ResourceMetrics[]> {
  const supabase = getSupabase();
  const metrics: ResourceMetrics[] = [];

  try {
    // Database size (límite Free: 500 MB)
    const { data: dbSize } = await supabase.rpc("pg_database_size", {
      database_name: "postgres",
    });

    if (dbSize) {
      const sizeGB = dbSize / (1024 * 1024 * 1024);
      metrics.push({
        service: "Supabase Database",
        current: Math.round(sizeGB * 1000) / 1000,
        limit: 0.5,
        percentage: (sizeGB / 0.5) * 100,
        unit: "GB",
        status: sizeGB > 0.4 ? "critical" : sizeGB > 0.3 ? "warning" : "safe",
        recommendation: sizeGB > 0.4
          ? "⚠️ URGENTE: Database cerca del límite (500 MB). Upgrade a Pro ($25/mes)"
          : sizeGB > 0.3
            ? "Limpiar datos antiguos o considerar upgrade pronto"
            : undefined,
      });
    }

    // Storage (límite Free: 1 GB)
    // Nota: Esto requeriría llamar a la API de Supabase Management
    // Por simplicidad, monitoreamos vía query de storage.objects
    const { count: filesCount } = await supabase
      .from("storage.objects")
      .select("*", { count: "exact", head: true });

    if (filesCount) {
      // Estimación: promedio 2 MB por archivo
      const estimatedGB = (filesCount * 2) / 1024;
      metrics.push({
        service: "Supabase Storage",
        current: Math.round(estimatedGB * 100) / 100,
        limit: 1,
        percentage: (estimatedGB / 1) * 100,
        unit: "GB (estimado)",
        status: estimatedGB > 0.8 ? "critical" : estimatedGB > 0.6 ? "warning" : "safe",
        recommendation: estimatedGB > 0.8
          ? "⚠️ Storage casi lleno. Considera upgrade a Pro (100 GB)"
          : estimatedGB > 0.6
            ? "Eliminar archivos no usados o considerar upgrade"
            : undefined,
      });
    }

    // Active connections (límite depende del plan)
    const { data: connections } = await supabase.rpc("pg_stat_activity_count");
    if (connections) {
      metrics.push({
        service: "Supabase Connections",
        current: connections,
        limit: 60, // Free tier tiene ~60 connections
        percentage: (connections / 60) * 100,
        unit: "connections",
        status: connections > 50 ? "critical" : connections > 40 ? "warning" : "safe",
        recommendation: connections > 50
          ? "⚠️ Muchas conexiones activas. Verificar connection pooling"
          : undefined,
      });
    }
  } catch (error) {
    console.error("Error fetching Supabase metrics:", error);
  }

  return metrics;
}

// Obtener métricas de Upstash Redis
async function getUpstashMetrics(): Promise<ResourceMetrics[]> {
  const upstashToken = process.env.UPSTASH_API_TOKEN;
  const upstashEmail = process.env.UPSTASH_EMAIL;

  if (!upstashToken || !upstashEmail) {
    return [];
  }

  const metrics: ResourceMetrics[] = [];

  try {
    // Listar todas las bases de datos
    const response = await fetch("https://api.upstash.com/v2/redis/databases", {
      headers: {
        Authorization: `Basic ${Buffer.from(`${upstashEmail}:${upstashToken}`).toString("base64")}`,
      },
    });

    if (response.ok) {
      const databases = await response.json();

      for (const db of databases) {
        // Obtener estadísticas de cada DB
        const statsResponse = await fetch(
          `https://api.upstash.com/v2/redis/stats/${db.database_id}?period=7d&stat_type=throughput`,
          {
            headers: {
              Authorization: `Basic ${Buffer.from(`${upstashEmail}:${upstashToken}`).toString("base64")}`,
            },
          }
        );

        if (statsResponse.ok) {
          const stats: UpstashStats = await statsResponse.json();

          // Commands (límite Free: 10,000/day)
          const dailyCommands = (stats.total_commands || 0) / 7; // Promedio últimos 7 días
          metrics.push({
            service: `Upstash Redis (${db.database_name})`,
            current: Math.round(dailyCommands),
            limit: 10000,
            percentage: (dailyCommands / 10000) * 100,
            unit: "commands/day",
            status: dailyCommands > 8000 ? "critical" : dailyCommands > 6000 ? "warning" : "safe",
            recommendation: dailyCommands > 8000
              ? "⚠️ Cerca del límite de comandos. Considera upgrade a Pay-as-you-go"
              : undefined,
          });

          // Memory (límite depende de la DB)
          if (stats.db_memory && stats.db_disk) {
            const memoryUsedMB = stats.db_disk / (1024 * 1024);
            const memoryLimitMB = stats.db_memory / (1024 * 1024);
            metrics.push({
              service: `Upstash Memory (${db.database_name})`,
              current: Math.round(memoryUsedMB * 100) / 100,
              limit: memoryLimitMB,
              percentage: (memoryUsedMB / memoryLimitMB) * 100,
              unit: "MB",
              status: memoryUsedMB / memoryLimitMB > 0.8 ? "critical" : memoryUsedMB / memoryLimitMB > 0.6 ? "warning" : "safe",
              recommendation: memoryUsedMB / memoryLimitMB > 0.8
                ? "⚠️ Redis memory alta. Limpiar keys antiguas o upgrade"
                : undefined,
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("Error fetching Upstash metrics:", error);
  }

  return metrics;
}

// Obtener métricas de Resend
async function getResendMetrics(): Promise<ResourceMetrics[]> {
  const metrics: ResourceMetrics[] = [];

  try {
    // Nota: Resend API no expone uso actual en el plan Free
    // Podríamos trackear esto manualmente en una tabla
    const supabase = getSupabase();

    // Contar emails enviados en el último mes
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const { count: emailsSent } = await supabase
      .from("email_logs")
      .select("*", { count: "exact", head: true })
      .gte("sent_at", lastMonth.toISOString());

    if (emailsSent !== null) {
      metrics.push({
        service: "Resend Emails",
        current: emailsSent,
        limit: 3000, // Free tier: 3,000/month
        percentage: (emailsSent / 3000) * 100,
        unit: "emails/month",
        status: emailsSent > 2500 ? "critical" : emailsSent > 2000 ? "warning" : "safe",
        recommendation: emailsSent > 2500
          ? "⚠️ Cerca del límite de emails. Upgrade a Pro ($20/mes para 50K)"
          : emailsSent > 2000
            ? "Monitorear envíos de emails"
            : undefined,
      });
    }
  } catch (error) {
    console.error("Error fetching Resend metrics:", error);
  }

  return metrics;
}

// Generar HTML del reporte
function generateReportHTML(allMetrics: ResourceMetrics[], timestamp: string): string {
  const critical = allMetrics.filter((m) => m.status === "critical");
  const warnings = allMetrics.filter((m) => m.status === "warning");
  const safe = allMetrics.filter((m) => m.status === "safe");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical":
        return "#ef4444";
      case "warning":
        return "#f59e0b";
      default:
        return "#10b981";
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case "critical":
        return "🚨";
      case "warning":
        return "⚠️";
      default:
        return "✅";
    }
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NODDO - Reporte Semanal de Recursos</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #b8973a 0%, #d4b05a 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                📊 Reporte Semanal de Recursos
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                NODDO Platform Monitoring
              </p>
            </td>
          </tr>

          <!-- Summary -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 14px;">
                Generado: ${timestamp}
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding: 15px; background-color: #f3f4f6; border-radius: 8px; text-align: center; width: 33%;">
                    <div style="font-size: 32px; font-weight: 700; color: #10b981; margin-bottom: 5px;">
                      ${safe.length}
                    </div>
                    <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
                      ✅ SAFE
                    </div>
                  </td>
                  <td style="width: 10px;"></td>
                  <td style="padding: 15px; background-color: #fef3c7; border-radius: 8px; text-align: center; width: 33%;">
                    <div style="font-size: 32px; font-weight: 700; color: #f59e0b; margin-bottom: 5px;">
                      ${warnings.length}
                    </div>
                    <div style="font-size: 12px; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px;">
                      ⚠️ WARNING
                    </div>
                  </td>
                  <td style="width: 10px;"></td>
                  <td style="padding: 15px; background-color: #fee2e2; border-radius: 8px; text-align: center; width: 33%;">
                    <div style="font-size: 32px; font-weight: 700; color: #ef4444; margin-bottom: 5px;">
                      ${critical.length}
                    </div>
                    <div style="font-size: 12px; color: #991b1b; text-transform: uppercase; letter-spacing: 0.5px;">
                      🚨 CRITICAL
                    </div>
                  </td>
                </tr>
              </table>

              ${
                critical.length > 0
                  ? `
              <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 10px 0; color: #991b1b; font-size: 16px; font-weight: 600;">
                  🚨 Atención Urgente Requerida
                </h3>
                <p style="margin: 0; color: #7f1d1d; font-size: 14px; line-height: 1.5;">
                  Hay ${critical.length} servicio(s) en estado crítico que requieren acción inmediata.
                </p>
              </div>
              `
                  : ""
              }

              <!-- Metrics List -->
              <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 18px; font-weight: 600;">
                📈 Detalle de Recursos
              </h2>

              ${allMetrics
                .sort((a, b) => b.percentage - a.percentage)
                .map(
                  (metric) => `
              <div style="margin-bottom: 20px; padding: 15px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <div>
                    <strong style="color: #111827; font-size: 14px;">
                      ${getStatusEmoji(metric.status)} ${metric.service}
                    </strong>
                  </div>
                  <div>
                    <span style="color: ${getStatusColor(metric.status)}; font-weight: 600; font-size: 14px;">
                      ${Math.round(metric.percentage)}%
                    </span>
                  </div>
                </div>

                <div style="background-color: #e5e7eb; border-radius: 9999px; height: 8px; overflow: hidden; margin-bottom: 10px;">
                  <div style="background-color: ${getStatusColor(metric.status)}; height: 100%; width: ${Math.min(metric.percentage, 100)}%; transition: width 0.3s ease;"></div>
                </div>

                <div style="font-size: 12px; color: #6b7280; margin-bottom: ${metric.recommendation ? "8px" : "0"};">
                  <strong>${metric.current.toLocaleString()}</strong> de <strong>${metric.limit.toLocaleString()}</strong> ${metric.unit}
                </div>

                ${
                  metric.recommendation
                    ? `
                <div style="background-color: #fef3c7; padding: 10px; border-radius: 4px; font-size: 12px; color: #92400e;">
                  ${metric.recommendation}
                </div>
                `
                    : ""
                }
              </div>
              `
                )
                .join("")}

              <!-- Actions -->
              <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
                <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 16px; font-weight: 600;">
                  🎯 Acciones Recomendadas
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #6b7280; font-size: 14px; line-height: 1.8;">
                  ${
                    critical.length > 0
                      ? `<li style="margin-bottom: 8px;"><strong style="color: #ef4444;">Urgente:</strong> Revisar y resolver ${critical.length} alerta(s) crítica(s)</li>`
                      : ""
                  }
                  ${
                    warnings.length > 0
                      ? `<li style="margin-bottom: 8px;"><strong style="color: #f59e0b;">Pronto:</strong> Monitorear ${warnings.length} servicio(s) en advertencia</li>`
                      : ""
                  }
                  <li style="margin-bottom: 8px;">Revisar Vercel Dashboard para detalles completos</li>
                  <li style="margin-bottom: 8px;">Verificar Supabase Dashboard para optimizaciones</li>
                  ${
                    critical.length === 0 && warnings.length === 0
                      ? `<li style="margin-bottom: 8px; color: #10b981;"><strong>✅ Todo en orden:</strong> Todos los servicios operando normalmente</li>`
                      : ""
                  }
                </ul>
              </div>

              <!-- Footer -->
              <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #e5e7eb; text-align: center;">
                <p style="margin: 0 0 10px 0; color: #9ca3af; font-size: 12px;">
                  Este reporte se genera automáticamente cada semana
                </p>
                <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                  NODDO Platform Monitoring System
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autorización
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔄 Starting weekly resource report generation...");

    // Recopilar métricas de todos los servicios
    const [vercelMetrics, supabaseMetrics, upstashMetrics, resendMetrics] = await Promise.all([
      getVercelMetrics(),
      getSupabaseMetrics(),
      getUpstashMetrics(),
      getResendMetrics(),
    ]);

    const allMetrics = [
      ...vercelMetrics,
      ...supabaseMetrics,
      ...upstashMetrics,
      ...resendMetrics,
    ];

    console.log(`📊 Collected ${allMetrics.length} metrics`);

    // Generar timestamp
    const timestamp = new Date().toLocaleString("es-CO", {
      timeZone: "America/Bogota",
      dateStyle: "full",
      timeStyle: "short",
    });

    // Generar HTML del reporte
    const html = generateReportHTML(allMetrics, timestamp);

    // Determinar el subject del email basado en el estado
    const critical = allMetrics.filter((m) => m.status === "critical");
    const warnings = allMetrics.filter((m) => m.status === "warning");

    let subject = "📊 Reporte Semanal de Recursos - NODDO";
    if (critical.length > 0) {
      subject = `🚨 URGENTE: ${critical.length} Alerta(s) Crítica(s) - NODDO`;
    } else if (warnings.length > 0) {
      subject = `⚠️ Advertencia: ${warnings.length} Servicio(s) Requieren Atención - NODDO`;
    } else {
      subject = "✅ Todo en Orden - Reporte Semanal NODDO";
    }

    // Enviar email
    const adminEmail = process.env.ADMIN_EMAIL || "juanjaramillo34@gmail.com";

    const resend = getResend();
    const { error: emailError } = await resend.emails.send({
      from: "NODDO Monitoring <noreply@noddo.io>",
      to: adminEmail,
      subject,
      html,
    });

    if (emailError) {
      console.error("❌ Error sending email:", emailError);
      return NextResponse.json(
        { error: "Failed to send email", details: emailError },
        { status: 500 }
      );
    }

    console.log("✅ Weekly resource report sent successfully");

    return NextResponse.json({
      success: true,
      metrics: allMetrics.length,
      critical: critical.length,
      warnings: warnings.length,
      timestamp,
    });
  } catch (err) {
    console.error("❌ Error generating weekly report:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
