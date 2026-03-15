import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { fetchAndCacheExchangeRates } from "@/lib/currency";

const EXCHANGERATE_API_KEY = process.env.EXCHANGERATE_API_KEY!;
const CACHE_DURATION_HOURS = 24;

/**
 * GET /api/exchange-rates
 *
 * Returns latest exchange rates from Supabase cache or fetches fresh if stale.
 * Public endpoint (no auth) — microsite visitors need rates.
 *
 * Response:
 * {
 *   rates: ExchangeRate[],
 *   timestamp: string,
 *   cached: boolean
 * }
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Check if we have fresh rates (within last 24h)
    const cutoff = new Date(
      Date.now() - CACHE_DURATION_HOURS * 60 * 60 * 1000
    ).toISOString();

    const { data: cachedRates, error } = await supabase
      .from("exchange_rates")
      .select("*")
      .eq("base_currency", "USD")
      .gte("fetched_at", cutoff)
      .order("fetched_at", { ascending: false })
      .limit(200); // Fetch all supported currencies

    if (error) {
      console.error("[exchange-rates] Supabase query error:", error);
      throw error;
    }

    // Return cached rates if available
    if (cachedRates && cachedRates.length > 0) {
      return NextResponse.json({
        rates: cachedRates,
        timestamp: cachedRates[0].fetched_at,
        cached: true,
      });
    }

    // No fresh cache — fetch from API
    if (!EXCHANGERATE_API_KEY) {
      console.error("[exchange-rates] EXCHANGERATE_API_KEY not configured");
      return NextResponse.json(
        { error: "Exchange rate API not configured" },
        { status: 500 }
      );
    }

    console.log("[exchange-rates] Cache miss, fetching fresh rates from API...");
    const freshRates = await fetchAndCacheExchangeRates(EXCHANGERATE_API_KEY);

    // Insert into Supabase for caching
    const { error: insertError } = await supabase
      .from("exchange_rates")
      .insert(freshRates);

    if (insertError) {
      console.error("[exchange-rates] Failed to cache rates in Supabase:", insertError);
      // Don't fail the request — still return the rates
    } else {
      console.log(`[exchange-rates] Cached ${freshRates.length} fresh rates`);
    }

    return NextResponse.json({
      rates: freshRates,
      timestamp: freshRates[0]?.fetched_at || new Date().toISOString(),
      cached: false,
    });
  } catch (error) {
    console.error("[exchange-rates] Unexpected error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch exchange rates",
      },
      { status: 500 }
    );
  }
}
