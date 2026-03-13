import type { SupabaseClient } from "@supabase/supabase-js";

interface PlanLimits {
  plan: string;
  max_projects: number;
  max_units_per_project: number | null;
}

const DEFAULT_LIMITS: PlanLimits = {
  plan: "trial",
  max_projects: 1,
  max_units_per_project: 200,
};

export async function getPlanLimits(
  supabase: SupabaseClient,
  userId: string
): Promise<PlanLimits> {
  const { data } = await supabase
    .from("user_plans")
    .select("plan, max_projects, max_units_per_project")
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
