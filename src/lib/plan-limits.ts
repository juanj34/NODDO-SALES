/**
 * Plan limits and labels for the platform admin user management.
 */

export const PLANS = ["trial", "proyecto", "studio", "enterprise"] as const;
export type PlanType = (typeof PLANS)[number];

export const PLAN_DEFAULTS: Record<PlanType, {
  max_projects: number;
  max_units_per_project: number;
  max_collaborators: number;
}> = {
  trial: { max_projects: 1, max_units_per_project: 20, max_collaborators: 0 },
  proyecto: { max_projects: 1, max_units_per_project: 200, max_collaborators: 3 },
  studio: { max_projects: 5, max_units_per_project: 500, max_collaborators: 5 },
  enterprise: { max_projects: 50, max_units_per_project: 2000, max_collaborators: 20 },
};

export const PLAN_LABELS: Record<string, string> = {
  trial: "Trial",
  proyecto: "Proyecto",
  studio: "Studio",
  enterprise: "Enterprise",
};

export const PLAN_COLORS: Record<string, string> = {
  trial: "text-neutral-400 bg-neutral-500/15 border-neutral-500/20",
  proyecto: "text-[var(--site-primary)] bg-[rgba(184,151,58,0.15)] border-[rgba(184,151,58,0.25)]",
  studio: "text-[#d4b05a] bg-[rgba(212,176,90,0.15)] border-[rgba(212,176,90,0.25)]",
  enterprise: "text-[var(--site-primary)] bg-[rgba(var(--site-primary-rgb),0.15)] border-[rgba(var(--site-primary-rgb),0.25)]",
};
