import type { SupabaseClient } from "@supabase/supabase-js";

export type Plan = "proyecto" | "studio" | "enterprise";

interface PlanLimits {
  plan: Plan;
  max_projects: number;
  max_units_per_project: number | null;
  max_collaborators: number;
  storage_limit_gb?: number;
}

export const PLAN_DEFAULTS: Record<Plan, Omit<PlanLimits, "plan">> = {
  proyecto: {
    max_projects: 1,
    max_units_per_project: null, // unlimited
    max_collaborators: 999, // unlimited
    storage_limit_gb: 50,
  },
  studio: {
    max_projects: 5,
    max_units_per_project: null, // unlimited
    max_collaborators: 999, // unlimited
    storage_limit_gb: 250,
  },
  enterprise: {
    max_projects: 999, // unlimited
    max_units_per_project: null, // unlimited
    max_collaborators: 999, // unlimited
    storage_limit_gb: 500,
  },
};

const DEFAULT_LIMITS: PlanLimits = {
  plan: "proyecto",
  ...PLAN_DEFAULTS.proyecto,
};

export async function getPlanLimits(
  supabase: SupabaseClient,
  userId: string
): Promise<PlanLimits> {
  const { data } = await supabase
    .from("user_plans")
    .select("plan, max_projects, max_units_per_project, max_collaborators")
    .eq("user_id", userId)
    .single();

  return data || DEFAULT_LIMITS;
}

export async function checkProjectLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<{ allowed: boolean; current: number; max: number }> {
  const limits = await getPlanLimits(supabase, userId);

  const { count } = await supabase
    .from("proyectos")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  const current = count ?? 0;
  return {
    allowed: current < limits.max_projects,
    current,
    max: limits.max_projects,
  };
}

export async function checkUnitLimit(
  supabase: SupabaseClient,
  userId: string,
  projectId: string
): Promise<{ allowed: boolean; current: number; max: number | null }> {
  const limits = await getPlanLimits(supabase, userId);

  // null = unlimited
  if (limits.max_units_per_project === null) {
    return { allowed: true, current: 0, max: null };
  }

  const { count } = await supabase
    .from("unidades")
    .select("id", { count: "exact", head: true })
    .eq("proyecto_id", projectId);

  const current = count ?? 0;
  return {
    allowed: current < limits.max_units_per_project,
    current,
    max: limits.max_units_per_project,
  };
}

export async function checkCollaboratorLimit(
  supabase: SupabaseClient,
  adminUserId: string
): Promise<{ allowed: boolean; current: number; max: number }> {
  const limits = await getPlanLimits(supabase, adminUserId);

  const { count } = await supabase
    .from("colaboradores")
    .select("id", { count: "exact", head: true })
    .eq("admin_user_id", adminUserId)
    .in("estado", ["pendiente", "activo"]);

  const current = count ?? 0;
  return {
    allowed: current < limits.max_collaborators,
    current,
    max: limits.max_collaborators,
  };
}
