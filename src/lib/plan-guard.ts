/**
 * Server-side plan feature guard.
 *
 * Use in API routes to block access to features that aren't
 * available in the project's current plan tier.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isFeatureAvailable,
  GATED_FEATURE_LABELS,
  type ProjectPlan,
  type GatedFeature,
} from "./plan-config";

export class PlanFeatureError extends Error {
  public feature: GatedFeature;
  public plan: ProjectPlan;
  public statusCode = 403;

  constructor(feature: GatedFeature, plan: ProjectPlan) {
    const label = GATED_FEATURE_LABELS[feature]?.es ?? feature;
    super(`La función "${label}" no está disponible en el plan ${plan}. Actualiza a Pro para acceder.`);
    this.name = "PlanFeatureError";
    this.feature = feature;
    this.plan = plan;
  }
}

/** Fetch a project's plan from the database */
export async function getProjectPlan(
  supabase: SupabaseClient,
  projectId: string
): Promise<ProjectPlan> {
  const { data } = await supabase
    .from("proyectos")
    .select("plan")
    .eq("id", projectId)
    .single();
  return (data?.plan as ProjectPlan) ?? "basico";
}

/**
 * Throws PlanFeatureError if the feature is not available on the project's plan.
 * Use at the top of API route handlers to gate access.
 */
export async function requireFeature(
  supabase: SupabaseClient,
  projectId: string,
  feature: GatedFeature
): Promise<void> {
  const plan = await getProjectPlan(supabase, projectId);
  if (!isFeatureAvailable(plan, feature)) {
    throw new PlanFeatureError(feature, plan);
  }
}
