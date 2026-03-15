import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Check if we should send a feature-blocked email to this user.
 *
 * Uses database-level throttling to prevent spam:
 * - First attempt: Send email ✅
 * - Within 7 days: Don't send ❌
 * - After 7 days: Send reminder ✅
 *
 * @param supabase - Supabase client (must have service role access)
 * @param userId - User UUID
 * @param feature - Feature key (e.g., "video_hosting", "tour_360", "webhooks")
 * @param throttleDays - Days to wait between emails (default: 7)
 * @returns true if email should be sent (and records it in DB)
 */
export async function shouldSendFeatureBlockedEmail(
  supabase: SupabaseClient,
  userId: string,
  feature: string,
  throttleDays: number = 7
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("should_send_feature_blocked_email", {
      p_user_id: userId,
      p_feature: feature,
      p_throttle_days: throttleDays,
    });

    if (error) {
      console.error("[email-throttle] RPC error:", error);
      // On error, default to NOT sending (fail safe)
      return false;
    }

    return data === true;
  } catch (err) {
    console.error("[email-throttle] Unexpected error:", err);
    return false;
  }
}
