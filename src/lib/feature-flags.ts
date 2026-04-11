/**
 * Project feature flags.
 *
 * Features are now derived from the plan-config system. The project_features
 * table in the database can still be used as per-project overrides for
 * enterprise customers.
 */

import { GATED_FEATURES, GATED_FEATURE_LABELS, type GatedFeature } from "./plan-config";

export { GATED_FEATURES, type GatedFeature } from "./plan-config";

// Keep backward compat: ALL_FEATURES + ProjectFeature
export const ALL_FEATURES = GATED_FEATURES;
export type ProjectFeature = GatedFeature;

export const FEATURE_LABELS: Record<GatedFeature, { es: string; en: string }> = {
  cotizador: { es: GATED_FEATURE_LABELS.cotizador.es, en: GATED_FEATURE_LABELS.cotizador.en },
  correos_branded: { es: GATED_FEATURE_LABELS.correos_branded.es, en: GATED_FEATURE_LABELS.correos_branded.en },
  estadisticas_avanzadas: { es: GATED_FEATURE_LABELS.estadisticas_avanzadas.es, en: GATED_FEATURE_LABELS.estadisticas_avanzadas.en },
};
