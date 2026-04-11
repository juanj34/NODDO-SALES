import { createAdminClient } from "@/lib/supabase/admin";
import { shouldThrottleAlert, sendSecurityAlert } from "@/lib/security-alerts";
import type { AIUsageMetadata } from "@/lib/ai";

/**
 * Centralized AI usage tracker for NODDO.
 *
 * Logs every AI call to `ai_usage_logs` with real token counts from Gemini,
 * calculates cost, and sends abuse alerts when a user exceeds thresholds.
 *
 * Fire-and-forget: never throws, never breaks the AI response.
 */

/* ── Gemini 2.5 Pro pricing (per 1M tokens, ≤200K context tier) ────── */

const PRICE_INPUT_PER_M = 1.25;   // $1.25 per 1M input tokens
const PRICE_OUTPUT_PER_M = 10.0;  // $10.00 per 1M output tokens

function calculateCost(usage: AIUsageMetadata): number {
  const inputCost = (usage.promptTokens / 1_000_000) * PRICE_INPUT_PER_M;
  const outputCost = (usage.completionTokens / 1_000_000) * PRICE_OUTPUT_PER_M;
  return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000; // 6 decimal precision
}

/* ── Abuse thresholds ────────────────────────────────────────────────── */

const DAILY_TOKEN_LIMIT = 50_000;   // alert if user exceeds 50K tokens/day
const DAILY_COST_ALERT = 0.50;      // alert if user costs > $0.50/day

/* ── Main tracker ────────────────────────────────────────────────────── */

export interface TrackAIParams {
  userId: string;
  userEmail: string;
  feature: string;
  usage: AIUsageMetadata;
  cached?: boolean;
  inputLength?: number;
  outputLength?: number;
  style?: string;
}

export async function trackAIUsage(params: TrackAIParams): Promise<void> {
  try {
    const cost = params.cached ? 0 : calculateCost(params.usage);
    const admin = createAdminClient();

    // 1. Insert log
    await admin.from("ai_usage_logs").insert({
      user_id: params.userId,
      user_email: params.userEmail,
      feature: params.feature,
      style: params.style ?? null,
      input_length: params.inputLength ?? 0,
      output_length: params.outputLength ?? 0,
      cached: params.cached ?? false,
      prompt_tokens: params.usage.promptTokens,
      completion_tokens: params.usage.completionTokens,
      total_tokens: params.usage.totalTokens,
      cost_usd: cost,
      model: "gemini-2.5-pro",
    });

    // 2. Check for abuse (skip for cached responses)
    if (!params.cached) {
      checkAbuseThreshold(admin, params.userId, params.userEmail).catch(() => {});
    }
  } catch (err) {
    console.error("[ai-tracker] Failed to track:", err);
  }
}

/* ── Abuse detection ─────────────────────────────────────────────────── */

async function checkAbuseThreshold(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  userEmail: string
): Promise<void> {
  // Don't spam alerts — throttle per user
  if (shouldThrottleAlert("suspicious_activity", `ai-abuse:${userId}`)) return;

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data } = await admin
    .from("ai_usage_logs")
    .select("total_tokens, cost_usd")
    .eq("user_id", userId)
    .gte("created_at", since)
    .eq("cached", false);

  if (!data || data.length === 0) return;

  const totalTokens = data.reduce((sum, r) => sum + (r.total_tokens ?? 0), 0);
  const totalCost = data.reduce((sum, r) => sum + Number(r.cost_usd ?? 0), 0);
  const callCount = data.length;

  if (totalTokens > DAILY_TOKEN_LIMIT || totalCost > DAILY_COST_ALERT) {
    await sendSecurityAlert({
      type: "suspicious_activity",
      severity: totalCost > 1.0 ? "high" : "medium",
      details: {
        alert: "AI usage abuse detected",
        user_email: userEmail,
        user_id: userId,
        last_24h: {
          calls: callCount,
          total_tokens: totalTokens,
          estimated_cost_usd: `$${totalCost.toFixed(4)}`,
        },
        thresholds: {
          daily_token_limit: DAILY_TOKEN_LIMIT,
          daily_cost_alert: `$${DAILY_COST_ALERT}`,
        },
      },
    });
  }
}
