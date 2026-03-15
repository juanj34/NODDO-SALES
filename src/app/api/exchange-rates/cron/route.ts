import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { fetchAndCacheExchangeRates } from "@/lib/currency";

/**
 * GET /api/exchange-rates/cron
 *
 * Vercel Cron job to refresh exchange rates daily.
 * Called automatically at 00:00 UTC via vercel.json config.
 *
 * Security: Requires Authorization header with CRON_SECRET
 */
export async function GET(request: Request) {
  // Verify cron secret (Vercel sets Authorization header)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.warn("[exchange-rates/cron] Unauthorized request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const apiKey = process.env.EXCHANGERATE_API_KEY;

    if (!apiKey) {
      console.error("[exchange-rates/cron] EXCHANGERATE_API_KEY not configured");
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    console.log("[exchange-rates/cron] Starting daily exchange rate refresh...");
    const rates = await fetchAndCacheExchangeRates(apiKey);

    const supabase = await createClient();
    const { error } = await supabase.from("exchange_rates").insert(rates);

    if (error) {
      console.error("[exchange-rates/cron] Failed to insert rates:", error);
      throw error;
    }

    console.log(`[exchange-rates/cron] ✓ Successfully cached ${rates.length} rates`);

    return NextResponse.json({
      success: true,
      count: rates.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[exchange-rates/cron] Fatal error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Update failed",
      },
      { status: 500 }
    );
  }
}
