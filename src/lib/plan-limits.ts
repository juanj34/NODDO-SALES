/**
 * Plan limits and labels for the platform admin user management.
 *
 * Re-exports from plan-config.ts where possible. Maintains backward
 * compatibility with existing imports in admin pages and API routes.
 */

import { PROJECT_PLANS, PLAN_TIERS, type ProjectPlan } from "./plan-config";

export { PROJECT_PLANS, type ProjectPlan } from "./plan-config";

// Legacy plan types — kept for user_plans table which still supports enterprise
export const PLANS = ["basico", "pro", "enterprise"] as const;
export type PlanType = (typeof PLANS)[number];

export const PLAN_DEFAULTS: Record<PlanType, {
  max_projects: number;
  max_units_per_project: number;
  max_collaborators: number;
}> = {
  basico: { max_projects: 1, max_units_per_project: 200, max_collaborators: PLAN_TIERS.basico.max_collaborators },
  pro: { max_projects: 5, max_units_per_project: 500, max_collaborators: PLAN_TIERS.pro.max_collaborators },
  enterprise: { max_projects: 50, max_units_per_project: 2000, max_collaborators: 20 },
};

export const PLAN_LABELS: Record<string, string> = {
  basico: "Básico",
  pro: "Pro",
  enterprise: "Enterprise",
};

export const PLAN_COLORS: Record<string, string> = {
  basico: "text-neutral-400 bg-neutral-500/15 border-neutral-500/20",
  pro: "text-[var(--site-primary)] bg-[rgba(184,151,58,0.15)] border-[rgba(184,151,58,0.25)]",
  enterprise: "text-[#d4b05a] bg-[rgba(212,176,90,0.15)] border-[rgba(212,176,90,0.25)]",
};
