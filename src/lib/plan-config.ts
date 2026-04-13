/**
 * Plan configuration — single source of truth for Básico / Pro feature tiers.
 *
 * Each project is assigned a plan ("basico" | "pro"). This module defines
 * what each plan includes and provides helpers to check feature availability.
 */

/* ── Plan types ─────────────────────────────────────────────────────────── */

export const PROJECT_PLANS = ["basico", "pro"] as const;
export type ProjectPlan = (typeof PROJECT_PLANS)[number];

/* ── Gated features (only these can be locked per plan) ─────────────────── */

export const GATED_FEATURES = [
  "cotizador",              // Cotizador tool + cotizaciones management
  "correos_branded",        // Branded email templates (constructora logo/colors)
  "estadisticas_avanzadas", // Advanced analytics dashboard
] as const;

export type GatedFeature = (typeof GATED_FEATURES)[number];

/* ── Feature labels (for UI) ────────────────────────────────────────────── */

export const GATED_FEATURE_LABELS: Record<GatedFeature, { es: string; en: string; description_es: string; description_en: string }> = {
  cotizador: {
    es: "NodDo Quote integrado",
    en: "Integrated NodDo Quote",
    description_es: "Genera cotizaciones en PDF y envíalas automáticamente a compradores con toda la información del proyecto.",
    description_en: "Generate PDF quotations and automatically send them to buyers with all project information.",
  },
  correos_branded: {
    es: "Correos personalizados",
    en: "Branded Emails",
    description_es: "Personaliza las notificaciones de leads y cotizaciones con el logo y colores de tu constructora.",
    description_en: "Customize lead and quotation notifications with your construction company's logo and colors.",
  },
  estadisticas_avanzadas: {
    es: "Estadísticas avanzadas",
    en: "Advanced Analytics",
    description_es: "Accede a gráficos detallados de leads, dispositivos, búsquedas y tendencias de tu proyecto.",
    description_en: "Access detailed charts on leads, devices, searches, and trends for your project.",
  },
};

/* ── Plan tier definitions ──────────────────────────────────────────────── */

export interface PlanTierConfig {
  name: { es: string; en: string };
  price: number;
  currency: "USD";
  features: ReadonlySet<GatedFeature>;
  storage_bytes: number;
  max_collaborators: number;
}

const BASICO_FEATURES: ReadonlySet<GatedFeature> = new Set([]);

const PRO_FEATURES: ReadonlySet<GatedFeature> = new Set([
  "cotizador",
  "correos_branded",
  "estadisticas_avanzadas",
]);

export const PLAN_TIERS: Record<ProjectPlan, PlanTierConfig> = {
  basico: {
    name: { es: "Básico", en: "Basic" },
    price: 199,
    currency: "USD",
    features: BASICO_FEATURES,
    storage_bytes: 10 * 1024 ** 3,  // 10 GB
    max_collaborators: 3,
  },
  pro: {
    name: { es: "Pro", en: "Pro" },
    price: 249,
    currency: "USD",
    features: PRO_FEATURES,
    storage_bytes: 50 * 1024 ** 3,  // 50 GB
    max_collaborators: 10,
  },
};

/* ── Helpers ─────────────────────────────────────────────────────────────── */

/** Check if a gated feature is available for a given plan */
export function isFeatureAvailable(plan: ProjectPlan, feature: GatedFeature): boolean {
  return PLAN_TIERS[plan]?.features.has(feature) ?? false;
}

/** Get the list of features that are locked (unavailable) for a plan */
export function getLockedFeatures(plan: ProjectPlan): GatedFeature[] {
  return GATED_FEATURES.filter((f) => !isFeatureAvailable(plan, f));
}

/** Get full tier config for a plan */
export function getPlanTier(plan: ProjectPlan): PlanTierConfig {
  return PLAN_TIERS[plan] ?? PLAN_TIERS.basico;
}
