import type { SupabaseClient } from "@supabase/supabase-js";

export const ALL_FEATURES = [
  "cotizador",
  "webhooks",
  "custom_domain",
  "tour_360",
  "video_hosting",
  "brochure",
  "analytics",
] as const;

export type ProjectFeature = (typeof ALL_FEATURES)[number];

export const FEATURE_LABELS: Record<ProjectFeature, { es: string; en: string }> = {
  cotizador: { es: "Cotizador", en: "Quotation Tool" },
  webhooks: { es: "Webhooks", en: "Webhooks" },
  custom_domain: { es: "Dominio personalizado", en: "Custom Domain" },
  tour_360: { es: "Tour 360", en: "360 Tour" },
  video_hosting: { es: "Video Hosting", en: "Video Hosting" },
  brochure: { es: "Brochure", en: "Brochure" },
  analytics: { es: "Analytics", en: "Analytics" },
};

/**
 * Get all feature flags for a project.
 * Missing features default to false.
 */
export async function getProjectFeatures(
  supabase: SupabaseClient,
  projectId: string
): Promise<Record<ProjectFeature, boolean>> {
  const result: Record<string, boolean> = {};
  for (const f of ALL_FEATURES) {
    result[f] = false;
  }

  const { data } = await supabase
    .from("project_features")
    .select("feature, enabled")
    .eq("proyecto_id", projectId);

  if (data) {
    for (const row of data) {
      if (row.feature in result) {
        result[row.feature] = row.enabled;
      }
    }
  }

  return result as Record<ProjectFeature, boolean>;
}

/**
 * Check if a single feature is enabled for a project.
 */
export async function checkFeature(
  supabase: SupabaseClient,
  projectId: string,
  feature: ProjectFeature
): Promise<boolean> {
  const { data } = await supabase
    .from("project_features")
    .select("enabled")
    .eq("proyecto_id", projectId)
    .eq("feature", feature)
    .maybeSingle();

  return data?.enabled === true;
}

/**
 * Set multiple features for a project (admin only).
 * Uses upsert to create or update.
 */
export async function setProjectFeatures(
  supabase: SupabaseClient,
  projectId: string,
  features: Partial<Record<ProjectFeature, boolean>>
): Promise<void> {
  const rows = Object.entries(features).map(([feature, enabled]) => ({
    proyecto_id: projectId,
    feature,
    enabled: enabled ?? false,
  }));

  if (rows.length === 0) return;

  await supabase
    .from("project_features")
    .upsert(rows, { onConflict: "proyecto_id,feature" });
}
