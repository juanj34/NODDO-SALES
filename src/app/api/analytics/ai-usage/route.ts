import { getAuthContext } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/analytics/ai-usage
 * Returns AI text improvement usage statistics for analytics dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (auth.role !== "admin") {
      return NextResponse.json(
        { error: "Solo administradores" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d"; // 7d, 30d, 90d

    // Calculate date range
    const now = new Date();
    let daysAgo = 30;
    if (period === "7d") daysAgo = 7;
    if (period === "90d") daysAgo = 90;
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    // Query 1: Total usage stats
    const { data: totalStats, error: totalError } = await auth.supabase
      .from("ai_usage_logs")
      .select("*")
      .gte("created_at", startDate.toISOString());

    if (totalError) throw totalError;

    // Calculate aggregated stats
    const total = totalStats?.length || 0;
    const cached = totalStats?.filter((log) => log.cached).length || 0;
    const geminiCalls = total - cached;
    const cacheHitRate = total > 0 ? (cached / total) * 100 : 0;

    // Total characters processed
    const totalInputChars = totalStats?.reduce(
      (sum, log) => sum + (log.input_length || 0),
      0
    ) || 0;
    const totalOutputChars = totalStats?.reduce(
      (sum, log) => sum + (log.output_length || 0),
      0
    ) || 0;

    // Estimated cost (Gemini Flash pricing)
    // Input: ~$0.00001 per 1K tokens (~4 chars per token)
    // Output: ~$0.00003 per 1K tokens
    const inputTokens = totalInputChars / 4;
    const outputTokens = totalOutputChars / 4;
    const estimatedCost =
      (inputTokens / 1000) * 0.00001 + (outputTokens / 1000) * 0.00003;

    // Query 2: Usage by style
    const styleBreakdown = totalStats?.reduce(
      (acc, log) => {
        const style = log.style || "unknown";
        if (!acc[style]) {
          acc[style] = { count: 0, avgInputLength: 0, avgOutputLength: 0 };
        }
        acc[style].count++;
        acc[style].avgInputLength += log.input_length || 0;
        acc[style].avgOutputLength += log.output_length || 0;
        return acc;
      },
      {} as Record<
        string,
        { count: number; avgInputLength: number; avgOutputLength: number }
      >
    );

    // Calculate averages
    Object.keys(styleBreakdown || {}).forEach((style) => {
      const stats = styleBreakdown![style];
      stats.avgInputLength = Math.round(stats.avgInputLength / stats.count);
      stats.avgOutputLength = Math.round(stats.avgOutputLength / stats.count);
    });

    // Query 3: Daily usage trend (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      return date.toISOString().split("T")[0];
    }).reverse();

    const dailyUsage = last7Days.map((date) => {
      const dayLogs = totalStats?.filter((log) =>
        log.created_at.startsWith(date)
      );
      return {
        date,
        total: dayLogs?.length || 0,
        cached: dayLogs?.filter((log) => log.cached).length || 0,
        gemini: dayLogs?.filter((log) => !log.cached).length || 0,
      };
    });

    return NextResponse.json({
      period,
      summary: {
        total,
        cached,
        geminiCalls,
        cacheHitRate: Math.round(cacheHitRate * 10) / 10,
        totalInputChars,
        totalOutputChars,
        estimatedCost: Math.round(estimatedCost * 100) / 100,
      },
      styleBreakdown,
      dailyUsage,
    });
  } catch (err) {
    console.error("AI analytics error:", err);
    return NextResponse.json(
      { error: "Error al obtener analytics" },
      { status: 500 }
    );
  }
}
