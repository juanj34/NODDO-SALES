import type { Currency, ExchangeRate, CurrencyConversionResult } from "@/types";

// Re-export Currency type for convenience
export type { Currency } from "@/types";

/**
 * Currency configuration with locale mapping and display settings
 */
export const CURRENCY_CONFIG: Record<
  Currency,
  {
    locale: string;
    symbol: string;
    name: string;
    decimalPlaces: number;
  }
> = {
  COP: {
    locale: "es-CO",
    symbol: "$",
    name: "Peso Colombiano",
    decimalPlaces: 0,
  },
  USD: {
    locale: "en-US",
    symbol: "$",
    name: "US Dollar",
    decimalPlaces: 0,
  },
  AED: {
    locale: "ar-AE",
    symbol: "د.إ",
    name: "UAE Dirham",
    decimalPlaces: 0,
  },
  MXN: {
    locale: "es-MX",
    symbol: "$",
    name: "Peso Mexicano",
    decimalPlaces: 0,
  },
  EUR: {
    locale: "de-DE",
    symbol: "€",
    name: "Euro",
    decimalPlaces: 0,
  },
};

/**
 * Format currency amount with proper locale and symbol
 *
 * @example
 * formatCurrency(1500000, "COP") // "$1,500,000"
 * formatCurrency(1500000, "COP", { compact: true }) // "$1.5M"
 * formatCurrency(150.50, "USD", { decimalPlaces: 2 }) // "$150.50"
 */
export function formatCurrency(
  amount: number,
  currency: Currency,
  options?: {
    locale?: string;
    compact?: boolean;
    decimalPlaces?: number;
  }
): string {
  const config = CURRENCY_CONFIG[currency];
  const locale = options?.locale || config.locale;
  const decimalPlaces = options?.decimalPlaces ?? config.decimalPlaces;

  // Compact notation for large numbers (dashboard)
  if (options?.compact && amount >= 1_000_000) {
    if (amount >= 1_000_000_000) {
      return `${config.symbol}${(amount / 1_000_000_000).toFixed(1)}B`;
    }
    return `${config.symbol}${(amount / 1_000_000).toFixed(1)}M`;
  }

  // Standard Intl.NumberFormat
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(amount);
}

/**
 * Convert currency using exchange rates
 *
 * Supports:
 * - Direct conversion (rate exists for from → to)
 * - Cross-rate via USD (from → USD → to)
 * - Fallback to original amount if no rate found
 *
 * @example
 * const rates = [{ base_currency: "USD", target_currency: "COP", rate: 4200, ... }];
 * convertCurrency(100, "USD", "COP", rates) // { amount: 420000, rate: 4200, ... }
 */
export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  rates: ExchangeRate[]
): CurrencyConversionResult {
  // Same currency — no conversion needed
  if (fromCurrency === toCurrency) {
    return {
      amount,
      fromCurrency,
      toCurrency,
      rate: 1,
      timestamp: new Date().toISOString(),
    };
  }

  // Try direct rate (from → to)
  const directRate = rates.find(
    (r) => r.base_currency === fromCurrency && r.target_currency === toCurrency
  );

  if (directRate) {
    return {
      amount: amount * directRate.rate,
      fromCurrency,
      toCurrency,
      rate: directRate.rate,
      timestamp: directRate.fetched_at,
    };
  }

  // Try reverse rate (to → from, then invert)
  const reverseRate = rates.find(
    (r) => r.base_currency === toCurrency && r.target_currency === fromCurrency
  );

  if (reverseRate) {
    const invertedRate = 1 / reverseRate.rate;
    return {
      amount: amount * invertedRate,
      fromCurrency,
      toCurrency,
      rate: invertedRate,
      timestamp: reverseRate.fetched_at,
    };
  }

  // Try cross-rate via USD (from → USD → to)
  const fromUSD = rates.find(
    (r) => r.base_currency === "USD" && r.target_currency === fromCurrency
  );
  const toUSD = rates.find(
    (r) => r.base_currency === "USD" && r.target_currency === toCurrency
  );

  if (fromUSD && toUSD) {
    // Cross-rate formula: (1 / fromRate) * toRate
    const crossRate = toUSD.rate / fromUSD.rate;
    return {
      amount: amount * crossRate,
      fromCurrency,
      toCurrency,
      rate: crossRate,
      timestamp: new Date().toISOString(),
    };
  }

  // Fallback: No rate found — return original amount with warning
  console.warn(
    `[convertCurrency] No exchange rate found for ${fromCurrency} → ${toCurrency}`
  );
  return {
    amount,
    fromCurrency,
    toCurrency,
    rate: 1,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Fetch latest exchange rates from ExchangeRate-API.io and normalize
 *
 * ⚠️ SERVER-SIDE ONLY — Call from API routes, not client components
 *
 * @param apiKey - ExchangeRate-API.io API key
 * @param baseCurrency - Base currency for rates (default: "USD")
 * @returns Array of normalized ExchangeRate objects
 *
 * @example
 * const rates = await fetchAndCacheExchangeRates(process.env.EXCHANGERATE_API_KEY);
 */
export async function fetchAndCacheExchangeRates(
  apiKey: string,
  baseCurrency: string = "USD"
): Promise<Partial<ExchangeRate>[]> {
  const response = await fetch(
    `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${baseCurrency}`
  );

  if (!response.ok) {
    throw new Error(`Exchange rate API error: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.result !== "success") {
    throw new Error(`Exchange rate API returned: ${data["error-type"] || "unknown error"}`);
  }

  // Normalize to ExchangeRate[] format
  const rates: Partial<ExchangeRate>[] = Object.entries(
    data.conversion_rates as Record<string, number>
  ).map(([target, rate]) => ({
    base_currency: baseCurrency,
    target_currency: target as string,
    rate: rate as number,
    fetched_at: new Date().toISOString(),
    source: "exchangerate-api.io",
  }));

  return rates;
}
