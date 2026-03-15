import { getAuthContext } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await getAuthContext();
  if (!auth || !auth.isPlatformAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const admin = createAdminClient();

  // Queries en paralelo
  const [projectsRes, logsRes] = await Promise.all([
    admin
      .from("proyectos")
      .select("id, nombre, slug, webhook_config")
      .not("webhook_config", "is", null),
    admin
      .from("webhook_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const projects = projectsRes.data ?? [];
  const logs = logsRes.data ?? [];

  // Calcular success rate global (últimos 7 días)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentLogs = logs.filter((l) => new Date(l.created_at) >= sevenDaysAgo);
  const successCount = recentLogs.filter((l) => l.delivered).length;
  const successRate = recentLogs.length > 0 ? (successCount / recentLogs.length) * 100 : 0;

  // Success rate por proyecto
  const projectStats = projects.map((project) => {
    const projectLogs = logs.filter((l) => l.proyecto_id === project.id);
    const projectSuccessCount = projectLogs.filter((l) => l.delivered).length;
    const projectSuccessRate =
      projectLogs.length > 0 ? (projectSuccessCount / projectLogs.length) * 100 : 0;

    return {
      proyecto_id: project.id,
      nombre: project.nombre,
      slug: project.slug,
      total_webhooks: projectLogs.length,
      success_rate: projectSuccessRate,
      last_delivery: projectLogs[0]?.created_at ?? null,
    };
  });

  return NextResponse.json({
    total_projects_with_webhooks: projects.length,
    total_deliveries: logs.length,
    global_success_rate: successRate,
    project_stats: projectStats,
    recent_logs: logs.slice(0, 50), // Últimos 50 logs
  });
}
