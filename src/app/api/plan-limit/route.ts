import { getAuthContext } from "@/lib/auth-context";
import { PLAN_DEFAULTS } from "@/lib/plan-limits";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Fetch the user's plan to get max_collaborators
    const { data: userPlan } = await auth.supabase
      .from("user_plans")
      .select("plan, max_collaborators")
      .eq("user_id", auth.adminUserId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (userPlan) {
      return NextResponse.json({
        max_collaborators: userPlan.max_collaborators ?? PLAN_DEFAULTS[userPlan.plan as keyof typeof PLAN_DEFAULTS]?.max_collaborators ?? 3,
      });
    }

    // No plan found — default to "proyecto" plan limits
    return NextResponse.json({
      max_collaborators: PLAN_DEFAULTS.proyecto.max_collaborators,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
