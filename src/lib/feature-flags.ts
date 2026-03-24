/**
 * Project feature flags for the platform admin panel.
 * Features are stored in the `project_features` table (per-project toggles).
 */

export const ALL_FEATURES = [
  "analytics",
  "cotizador",
  "tour_360",
  "brochure",
  "videos",
] as const;

export type ProjectFeature = (typeof ALL_FEATURES)[number];

export const FEATURE_LABELS: Record<ProjectFeature, { es: string; en: string }> = {
  analytics: { es: "Analíticas", en: "Analytics" },
  cotizador: { es: "Cotizador", en: "Quotation Tool" },
  tour_360: { es: "Tour 360°", en: "360° Tour" },
  brochure: { es: "Brochure", en: "Brochure" },
  videos: { es: "Videos", en: "Videos" },
};
