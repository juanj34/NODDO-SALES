"use client";

import { useCallback } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/lib/currency";

/**
 * Hook for microsite pages to format prices with automatic currency conversion.
 *
 * Converts from the project's base currency to the visitor's selected display currency
 * using cached exchange rates, then formats with the correct locale/symbol.
 */
export function useSiteFormatCurrency() {
  const { displayCurrency, baseCurrency, convertPrice } = useCurrency();

  const isConverted = displayCurrency !== baseCurrency;

  const siteFormat = useCallback(
    (amount: number, options?: { compact?: boolean; decimalPlaces?: number }) => {
      const converted = convertPrice(amount);
      return formatCurrency(converted, displayCurrency, options);
    },
    [convertPrice, displayCurrency]
  );

  return { siteFormat, isConverted, displayCurrency, baseCurrency };
}
