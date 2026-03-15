import type { SupabaseClient } from "@supabase/supabase-js";
import { getPlanLimits, type Plan } from "./plan-limits";

export type Feature =
  | "galeria"
  | "cotizador"
  | "video_hosting"
  | "custom_domain"
  | "tour_360"
  | "brochure"
  | "analytics"
  | "webhooks"
  | "white_label"
  | "api_access"
  | "csv_import"
  | "ai_content";

/**
 * Maps each feature to the minimum plans that have access to it
 * All plans (Proyecto, Studio, Enterprise) include ALL core features.
 * Only Enterprise has exclusive advanced features (white-label, API, etc.)
 */
const FEATURE_PLANS: Record<Feature, Plan[]> = {
  // Core features - available in ALL plans (Proyecto, Studio, Enterprise)
  galeria: ["proyecto", "studio", "enterprise"],
  cotizador: ["proyecto", "studio", "enterprise"],
  brochure: ["proyecto", "studio", "enterprise"],
  video_hosting: ["proyecto", "studio", "enterprise"],
  custom_domain: ["proyecto", "studio", "enterprise"],
  tour_360: ["proyecto", "studio", "enterprise"],
  analytics: ["proyecto", "studio", "enterprise"],

  // Enterprise-only features
  webhooks: ["enterprise"],
  white_label: ["enterprise"],
  api_access: ["enterprise"],
  csv_import: ["enterprise"],
  ai_content: ["enterprise"],
};

/**
 * Feature descriptions for upgrade prompts
 */
export const FEATURE_LABELS: Record<Feature, { es: string; en: string }> = {
  galeria: {
    es: "Galería de imágenes ilimitada",
    en: "Unlimited image gallery",
  },
  cotizador: {
    es: "Calculadora de cotización",
    en: "Quotation calculator",
  },
  video_hosting: {
    es: "Videos inmersivos (Cloudflare Stream)",
    en: "Immersive videos (Cloudflare Stream)",
  },
  custom_domain: {
    es: "Dominio personalizado",
    en: "Custom domain",
  },
  tour_360: {
    es: "Tours 360° (Matterport/Kuula)",
    en: "360° tours (Matterport/Kuula)",
  },
  brochure: {
    es: "Brochure PDF",
    en: "PDF brochure",
  },
  analytics: {
    es: "Analytics avanzado",
    en: "Advanced analytics",
  },
  webhooks: {
    es: "API + Webhooks",
    en: "API + Webhooks",
  },
  white_label: {
    es: "Sin marca NODDO (white-label)",
    en: "No NODDO branding (white-label)",
  },
  api_access: {
    es: "Acceso a API REST",
    en: "REST API access",
  },
  csv_import: {
    es: "Importación CSV masiva",
    en: "Bulk CSV import",
  },
  ai_content: {
    es: "Asistencia IA para contenido",
    en: "AI content assistance",
  },
};

/**
 * Check if a user has access to a specific feature based on their plan
 */
export async function checkFeatureAccess(
  supabase: SupabaseClient,
  userId: string,
  feature: Feature
): Promise<{ allowed: boolean; currentPlan: Plan; requiredPlan?: Plan; reason?: string }> {
  const { plan } = await getPlanLimits(supabase, userId);

  const allowedPlans = FEATURE_PLANS[feature];

  if (allowedPlans.includes(plan)) {
    return { allowed: true, currentPlan: plan };
  }

  // Find the minimum required plan
  const requiredPlan = allowedPlans[0]; // First plan in the list is the minimum

  return {
    allowed: false,
    currentPlan: plan,
    requiredPlan,
    reason: `Feature "${feature}" requires ${requiredPlan} plan or higher`,
  };
}

/**
 * Get the minimum plan required for a feature
 */
export function getRequiredPlan(feature: Feature): Plan {
  return FEATURE_PLANS[feature][0];
}

/**
 * Check if a plan has access to a feature (without DB call)
 */
export function planHasFeature(plan: Plan, feature: Feature): boolean {
  return FEATURE_PLANS[feature].includes(plan);
}
