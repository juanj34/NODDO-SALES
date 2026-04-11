/**
 * Maps editor tab IDs and config sub-tabs to gated features.
 *
 * If a tab ID appears here, it requires the mapped feature to be available
 * in the project's plan. Tabs NOT in this map are always accessible.
 */

import type { GatedFeature } from "./plan-config";

/** Editor sidebar tabs that are gated by plan */
export const EDITOR_TAB_FEATURE_MAP: Partial<Record<string, GatedFeature>> = {
  cotizador: "cotizador",
  cotizaciones: "cotizador",
  estadisticas: "estadisticas_avanzadas",
};

/** Config sub-tabs (inside /config page) that are gated by plan */
export const CONFIG_TAB_FEATURE_MAP: Partial<Record<string, GatedFeature>> = {
  correos: "correos_branded",
};
