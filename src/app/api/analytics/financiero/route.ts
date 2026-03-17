import { getAuthContext } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";
import type {
  FinancieroResponse,
  FinancieroProjectBreakdown,
  FinancialMetrics,
  MonthlyRevenue,
  UnitSoldDetail,
  Currency,
} from "@/types";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from =
      searchParams.get("from") ||
      new Date(Date.now() - 30 * 86400000).toISOString();
    const to = searchParams.get("to") || new Date().toISOString();
    const projectId = searchParams.get("projectId");

    // Fetch projects owned by user
    const { data: projects } = await auth.supabase
      .from("proyectos")
      .select("id, nombre, moneda_base")
      .eq("user_id", auth.adminUserId)
      .order("nombre");

    if (!projects || projects.length === 0) {
      const empty: FinancieroResponse = {
        total_revenue: 0,
        total_available_value: 0,
        total_reservada_value: 0,
        avg_sales_velocity: 0,
        total_units: 0,
        total_disponible: 0,
        total_proximamente: 0,
        total_separado: 0,
        total_reservada: 0,
        total_vendida: 0,
        sell_through_rate: 0,
        projects: [],
        monthly_revenue: [],
        units_sold_detail: [],
        primary_currency: "COP",
      };
      return NextResponse.json(empty);
    }

    // If a specific project is selected, only fetch that one
    const targetProjects =
      projectId && projectId !== "all"
        ? projects.filter((p) => p.id === projectId)
        : projects;

    // Fetch financial data for each project in parallel
    const financialResults = await Promise.all(
      targetProjects.map((p) =>
        auth.supabase.rpc("analytics_financial_summary", {
          p_proyecto_id: p.id,
          p_from: from,
          p_to: to,
        })
      )
    );

    // Also fetch separado and proximamente counts (the RPC doesn't include them)
    const { data: additionalCounts } = await auth.supabase
      .from("unidades")
      .select("proyecto_id, estado")
      .in("estado", ["separado", "proximamente"])
      .in(
        "proyecto_id",
        targetProjects.map((p) => p.id)
      );

    const separadoByProject = new Map<string, number>();
    const proximamenteByProject = new Map<string, number>();
    for (const u of additionalCounts || []) {
      if (u.estado === "separado") {
        separadoByProject.set(
          u.proyecto_id,
          (separadoByProject.get(u.proyecto_id) || 0) + 1
        );
      } else if (u.estado === "proximamente") {
        proximamenteByProject.set(
          u.proyecto_id,
          (proximamenteByProject.get(u.proyecto_id) || 0) + 1
        );
      }
    }

    // Build per-project breakdown
    const projectBreakdowns: FinancieroProjectBreakdown[] = [];
    let totalRevenue = 0;
    let totalAvailableValue = 0;
    let totalReservadaValue = 0;
    let totalUnits = 0;
    let totalDisponible = 0;
    let totalProximamente = 0;
    let totalSeparado = 0;
    let totalReservada = 0;
    let totalVendida = 0;
    let velocitySum = 0;
    const allMonthlyRevenue: MonthlyRevenue[] = [];
    const allUnitsSold: UnitSoldDetail[] = [];

    for (let i = 0; i < targetProjects.length; i++) {
      const project = targetProjects[i];
      const result = financialResults[i];
      const data: FinancialMetrics | null = result.data || null;

      if (!data) continue;

      const separado = separadoByProject.get(project.id) || 0;
      const proximamente = proximamenteByProject.get(project.id) || 0;

      const financial: FinancialMetrics = {
        total_revenue: data.total_revenue || 0,
        available_inventory_value: data.available_inventory_value || 0,
        reservada_inventory_value: data.reservada_inventory_value || 0,
        sales_velocity: data.sales_velocity || 0,
        monthly_revenue: data.monthly_revenue || [],
        units_sold_detail: data.units_sold_detail || [],
        currency: (data.currency as Currency) || (project.moneda_base as Currency) || "COP",
        total_units: (data.total_units || 0) + separado + proximamente,
        disponible_count: data.disponible_count || 0,
        vendida_count: data.vendida_count || 0,
        reservada_count: data.reservada_count || 0,
      };

      projectBreakdowns.push({
        id: project.id,
        nombre: project.nombre,
        currency: financial.currency,
        financial,
      });

      totalRevenue += financial.total_revenue;
      totalAvailableValue += financial.available_inventory_value;
      totalReservadaValue += financial.reservada_inventory_value;
      totalUnits += financial.total_units;
      totalDisponible += financial.disponible_count;
      totalProximamente += proximamente;
      totalSeparado += separado;
      totalReservada += financial.reservada_count;
      totalVendida += financial.vendida_count;
      velocitySum += financial.sales_velocity;

      allMonthlyRevenue.push(...financial.monthly_revenue);
      allUnitsSold.push(...financial.units_sold_detail);
    }

    // Merge monthly revenue by month
    const monthMap = new Map<string, { revenue: number; count: number }>();
    for (const mr of allMonthlyRevenue) {
      const existing = monthMap.get(mr.month);
      if (existing) {
        existing.revenue += mr.revenue;
        existing.count += mr.count;
      } else {
        monthMap.set(mr.month, { revenue: mr.revenue, count: mr.count });
      }
    }
    const mergedMonthlyRevenue: MonthlyRevenue[] = Array.from(
      monthMap.entries()
    )
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Sort units sold by date descending
    allUnitsSold.sort(
      (a, b) =>
        new Date(b.sold_at).getTime() - new Date(a.sold_at).getTime()
    );

    const totalWithUnits = totalUnits || 1;
    const response: FinancieroResponse = {
      total_revenue: totalRevenue,
      total_available_value: totalAvailableValue,
      total_reservada_value: totalReservadaValue,
      avg_sales_velocity:
        Math.round((velocitySum / (targetProjects.length || 1)) * 10) / 10,
      total_units: totalUnits,
      total_disponible: totalDisponible,
      total_proximamente: totalProximamente,
      total_separado: totalSeparado,
      total_reservada: totalReservada,
      total_vendida: totalVendida,
      sell_through_rate:
        Math.round((totalVendida / totalWithUnits) * 1000) / 10,
      projects: projectBreakdowns,
      monthly_revenue: mergedMonthlyRevenue,
      units_sold_detail: allUnitsSold,
      primary_currency:
        (targetProjects[0]?.moneda_base as Currency) || "COP",
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[financiero]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
