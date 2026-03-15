import { getAuthContext } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const ALL_FEATURES = [
  "cotizador",
  "webhooks",
  "custom_domain",
  "tour_360",
  "video_hosting",
  "brochure",
  "analytics",
] as const;

export async function GET() {
  const auth = await getAuthContext();
  if (!auth || !auth.isPlatformAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const admin = createAdminClient();

  // Queries en paralelo
  const [projectsRes, featureFlagsRes] = await Promise.all([
    admin.from("proyectos").select("id", { count: "exact", head: true }),
    admin.from("project_features").select("*"),
  ]);

  const totalProjects = projectsRes.count ?? 0;
  const featureFlags = featureFlagsRes.data ?? [];

  // Calcular stats por feature
  const stats = ALL_FEATURES.map((feature) => {
    const enabledCount = featureFlags.filter((f) => f.feature === feature && f.enabled).length;
    const adoptionRate = totalProjects > 0 ? (enabledCount / totalProjects) * 100 : 0;

    // Obtener proyectos que usan este feature
    const projectsUsingFeature = featureFlags
      .filter((f) => f.feature === feature && f.enabled)
      .map((f) => f.proyecto_id);

    return {
      feature,
      enabled_count: enabledCount,
      adoption_rate: adoptionRate,
      projects_using: projectsUsingFeature,
    };
  });

  // Proyectos con más features habilitadas
  const projectFeatureCounts: Record<string, number> = {};
  featureFlags
    .filter((f) => f.enabled)
    .forEach((f) => {
      projectFeatureCounts[f.proyecto_id] = (projectFeatureCounts[f.proyecto_id] || 0) + 1;
    });

  const topProjects = Object.entries(projectFeatureCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([projectId, count]) => ({
      proyecto_id: projectId,
      features_count: count,
    }));

  return NextResponse.json({
    total_projects: totalProjects,
    features: stats,
    top_projects: topProjects,
  });
}
