import { getAuthContext } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await getAuthContext();
  if (!auth || !auth.isPlatformAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  // Queries en paralelo
  const [paymentsRes, plansRes, completedPaymentsRes, revenueOverTimeRes, upcomingRenewalsRes] =
    await Promise.all([
      // Todos los payments
      admin.from("payments").select("*").order("created_at", { ascending: false }),

      // Planes de usuarios
      admin.from("user_plans").select("*"),

      // Completed payments para MRR
      admin
        .from("payments")
        .select("amount, currency, billing_period_end")
        .eq("status", "completed")
        .gte("billing_period_end", now.toISOString()),

      // Revenue over time (último año)
      admin
        .from("payments")
        .select("amount, currency, created_at")
        .eq("status", "completed")
        .gte("created_at", oneYearAgo.toISOString())
        .order("created_at", { ascending: true }),

      // Upcoming renewals (próximos 30 días)
      admin
        .from("user_plans")
        .select("*, user:auth.users(email)")
        .not("expires_at", "is", null)
        .gte("expires_at", now.toISOString())
        .lte(
          "expires_at",
          new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
        ),
    ]);

  const payments = paymentsRes.data ?? [];
  const plans = plansRes.data ?? [];
  const completedPayments = completedPaymentsRes.data ?? [];
  const revenueData = revenueOverTimeRes.data ?? [];
  const upcomingRenewals = upcomingRenewalsRes.data ?? [];

  // Calcular MRR (Monthly Recurring Revenue)
  const mrr = completedPayments
    .filter((p) => p.currency === "USD")
    .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

  // ARR (Annual Recurring Revenue)
  const arr = mrr * 12;

  // Trial conversions (últimos 30 días)
  const recentPlans = plans.filter(
    (p) => new Date(p.created_at) >= thirtyDaysAgo
  );
  const trialsStarted = recentPlans.filter((p) => p.status === "trial").length;
  const trialsConverted = recentPlans.filter(
    (p) => p.status === "active" && new Date(p.started_at) >= thirtyDaysAgo
  ).length;
  const trialConversionRate =
    trialsStarted > 0 ? (trialsConverted / trialsStarted) * 100 : 0;

  // Churn rate (últimos 30 días)
  const activePlansStart = plans.filter(
    (p) =>
      p.status === "active" &&
      new Date(p.started_at) < thirtyDaysAgo
  ).length;
  const churnedPlans = plans.filter(
    (p) =>
      (p.status === "cancelled" || p.status === "suspended") &&
      new Date(p.started_at) >= thirtyDaysAgo
  ).length;
  const churnRate = activePlansStart > 0 ? (churnedPlans / activePlansStart) * 100 : 0;

  // Revenue over time (agrupar por mes)
  const revenueByMonth: Record<string, number> = {};
  revenueData.forEach((payment) => {
    const month = new Date(payment.created_at).toISOString().slice(0, 7); // YYYY-MM
    const amount = parseFloat(payment.amount.toString());
    revenueByMonth[month] = (revenueByMonth[month] || 0) + amount;
  });

  const revenueOverTime = Object.entries(revenueByMonth)
    .map(([month, revenue]) => ({
      month,
      revenue,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return NextResponse.json({
    mrr,
    arr,
    trial_conversion_rate: trialConversionRate,
    churn_rate: churnRate,
    revenue_over_time: revenueOverTime,
    upcoming_renewals: upcomingRenewals.slice(0, 10),
    total_payments: payments.length,
    completed_payments: completedPayments.length,
  });
}
