import { getAuthContext } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await getAuthContext();
  if (!auth || !auth.isPlatformAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const admin = createAdminClient();

  try {
    // Queries en paralelo
    const [dbConnections, storageData, webhookLogsData, healthMetrics] = await Promise.all([
      // DB connections (pg_stat_activity)
      admin.rpc("get_db_connection_count").then((res) => res, () => ({ data: null, error: null })),

      // Storage usage
      admin
        .from("proyectos")
        .select("storage_images_bytes, storage_videos_bytes, storage_renders_bytes")
        .then((res) => {
          if (res.error || !res.data) return { totalBytes: 0, totalGB: 0 };
          const totalBytes = res.data.reduce(
            (sum, p) =>
              sum +
              (p.storage_images_bytes || 0) +
              (p.storage_videos_bytes || 0) +
              (p.storage_renders_bytes || 0),
            0,
          );
          return { totalBytes, totalGB: (totalBytes / 1024 / 1024 / 1024).toFixed(2) };
        }),

      // Webhook failures (last 24 hours)
      admin
        .from("webhook_logs")
        .select("id, delivered", { count: "exact" })
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .then((res) => {
          const total = res.count ?? 0;
          const failed = res.data?.filter((l) => !l.delivered).length ?? 0;
          const failureRate = total > 0 ? (failed / total) * 100 : 0;
          return { total, failed, failureRate };
        }),

      // Recent health metrics (últimas 100 de cada tipo)
      admin
        .from("system_health_metrics")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    // DB connections check
    const dbConnectionCount = dbConnections.data ?? 0;
    const dbStatus =
      dbConnectionCount >= 80
        ? "critical"
        : dbConnectionCount >= 50
          ? "warning"
          : "healthy";

    // Storage check (supongamos límite de 100GB)
    const storageGB = Number(storageData.totalGB);
    const storageStatus =
      storageGB >= 90 ? "critical" : storageGB >= 75 ? "warning" : "healthy";

    // Webhook failures check
    const webhookStatus =
      webhookLogsData.failureRate >= 30
        ? "critical"
        : webhookLogsData.failureRate >= 10
          ? "warning"
          : "healthy";

    // API errors (placeholder - no tenemos tabla de errores)
    const apiErrorsStatus = "healthy";

    // Calcular últimos incidentes críticos
    const criticalIncidents =
      healthMetrics.data
        ?.filter((m: Record<string, unknown>) => m.status === "critical")
        .slice(0, 10)
        .map((m: Record<string, unknown>) => ({
          id: m.id,
          metric_type: m.metric_type,
          value: m.value,
          created_at: m.created_at,
          metadata: m.metadata,
        })) ?? [];

    return NextResponse.json({
      database: {
        status: dbStatus,
        value: dbConnectionCount,
        max: 100,
        label: "DB Connections",
      },
      storage: {
        status: storageStatus,
        value: storageGB,
        max: 100,
        label: "Storage (GB)",
      },
      webhooks: {
        status: webhookStatus,
        value: webhookLogsData.failureRate.toFixed(1),
        max: 100,
        label: "Webhook Failure Rate (%)",
        metadata: {
          total: webhookLogsData.total,
          failed: webhookLogsData.failed,
        },
      },
      api_errors: {
        status: apiErrorsStatus,
        value: 0,
        max: 100,
        label: "API Errors (24h)",
      },
      critical_incidents: criticalIncidents,
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json({ error: "Error al obtener health metrics" }, { status: 500 });
  }
}
