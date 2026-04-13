import { getAuthContext, requirePermission } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/analytics/ai-usage
 * Returns AI usage statistics with real token counts and cost from Gemini API.
 * Supports breakdown by feature, user, and daily trend.
 */

// Gemini 2.5 Pro pricing (per 1M tokens, ≤200K context tier)
const PRICE_INPUT_PER_M = 1.25;
const PRICE_OUTPUT_PER_M = 10.0;

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const denied = requirePermission(auth, "financiero.read");
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d";

    const now = new Date();
    let daysAgo = 30;
    if (period === "7d") daysAgo = 7;
    if (period === "90d") daysAgo = 90;
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    const { data: logs, error: fetchError } = await auth.supabase
      .from("ai_usage_logs")
      .select("*")
      .gte("created_at", startDate.toISOString());

    if (fetchError) throw fetchError;

    const allLogs = logs ?? [];
    const total = allLogs.length;
    const cached = allLogs.filter((l) => l.cached).length;
    const geminiCalls = total - cached;
    const cacheHitRate = total > 0 ? (cached / total) * 100 : 0;

    // Token totals — use real tokens when available, fallback to chars÷4
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalCostUsd = 0;

    for (const log of allLogs) {
      if (log.cached) continue;

      if (log.prompt_tokens != null && log.completion_tokens != null) {
        // Real token data
        totalPromptTokens += log.prompt_tokens;
        totalCompletionTokens += log.completion_tokens;
        totalCostUsd += Number(log.cost_usd ?? 0);
      } else {
        // Legacy fallback: estimate from chars
        const estInput = (log.input_length ?? 0) / 4;
        const estOutput = (log.output_length ?? 0) / 4;
        totalPromptTokens += estInput;
        totalCompletionTokens += estOutput;
        totalCostUsd +=
          (estInput / 1_000_000) * PRICE_INPUT_PER_M +
          (estOutput / 1_000_000) * PRICE_OUTPUT_PER_M;
      }
    }

    // Breakdown by feature
    const featureBreakdown: Record<string, { count: number; tokens: number; cost: number }> = {};
    for (const log of allLogs) {
      const f = log.feature || "unknown";
      if (!featureBreakdown[f]) featureBreakdown[f] = { count: 0, tokens: 0, cost: 0 };
      featureBreakdown[f].count++;
      if (!log.cached) {
        featureBreakdown[f].tokens += log.total_tokens ?? Math.round(((log.input_length ?? 0) + (log.output_length ?? 0)) / 4);
        featureBreakdown[f].cost += Number(log.cost_usd ?? 0);
      }
    }

    // Breakdown by style (for improve-text backward compat)
    const styleBreakdown: Record<string, { count: number; avgInputLength: number; avgOutputLength: number }> = {};
    for (const log of allLogs) {
      const s = log.style || "unknown";
      if (!styleBreakdown[s]) styleBreakdown[s] = { count: 0, avgInputLength: 0, avgOutputLength: 0 };
      styleBreakdown[s].count++;
      styleBreakdown[s].avgInputLength += log.input_length ?? 0;
      styleBreakdown[s].avgOutputLength += log.output_length ?? 0;
    }
    for (const s of Object.keys(styleBreakdown)) {
      const st = styleBreakdown[s];
      st.avgInputLength = Math.round(st.avgInputLength / st.count);
      st.avgOutputLength = Math.round(st.avgOutputLength / st.count);
    }

    // Top users by token consumption
    const userTokens: Record<string, { email: string; tokens: number; cost: number; calls: number }> = {};
    for (const log of allLogs) {
      if (log.cached) continue;
      const uid = log.user_id ?? "unknown";
      if (!userTokens[uid]) userTokens[uid] = { email: log.user_email ?? uid, tokens: 0, cost: 0, calls: 0 };
      userTokens[uid].tokens += log.total_tokens ?? 0;
      userTokens[uid].cost += Number(log.cost_usd ?? 0);
      userTokens[uid].calls++;
    }
    const topUsers = Object.values(userTokens)
      .sort((a, b) => b.tokens - a.tokens)
      .slice(0, 10);

    // Daily usage trend
    const trendDays = Math.min(daysAgo, 14);
    const dailyUsage = Array.from({ length: trendDays }, (_, i) => {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      const dayLogs = allLogs.filter((l) => l.created_at.startsWith(date));
      const dayTokens = dayLogs
        .filter((l) => !l.cached)
        .reduce((sum, l) => sum + (l.total_tokens ?? 0), 0);
      const dayCost = dayLogs
        .filter((l) => !l.cached)
        .reduce((sum, l) => sum + Number(l.cost_usd ?? 0), 0);
      return {
        date,
        total: dayLogs.length,
        cached: dayLogs.filter((l) => l.cached).length,
        gemini: dayLogs.filter((l) => !l.cached).length,
        tokens: dayTokens,
        cost: Math.round(dayCost * 10000) / 10000,
      };
    }).reverse();

    return NextResponse.json({
      period,
      summary: {
        total,
        cached,
        geminiCalls,
        cacheHitRate: Math.round(cacheHitRate * 10) / 10,
        totalPromptTokens: Math.round(totalPromptTokens),
        totalCompletionTokens: Math.round(totalCompletionTokens),
        totalTokens: Math.round(totalPromptTokens + totalCompletionTokens),
        estimatedCostUsd: Math.round(totalCostUsd * 10000) / 10000,
      },
      featureBreakdown,
      styleBreakdown,
      topUsers,
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
