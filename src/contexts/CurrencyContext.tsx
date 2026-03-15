"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";
import { useSiteProject } from "@/hooks/useSiteProject";
import { convertCurrency } from "@/lib/currency";
import type { Currency, ExchangeRate } from "@/types";

interface CurrencyContextValue {
  baseCurrency: Currency;
  displayCurrency: Currency;
  setDisplayCurrency: (currency: Currency) => void;
  exchangeRates: ExchangeRate[];
  loading: boolean;
  lastUpdated: string | null;
  convertPrice: (amount: number) => number;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const proyecto = useSiteProject();
  const baseCurrency = proyecto.moneda_base;

  // Persist user's currency preference per project in localStorage
  const [displayCurrency, setDisplayCurrency] = usePersistedState<Currency>(
    "currency",
    baseCurrency,
    proyecto.slug
  );

  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Fetch exchange rates on mount with caching
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const cacheKey = `noddo:exchange-rates:${today}`;

    // Try localStorage cache first (daily cache)
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { rates, timestamp } = JSON.parse(cached);
        requestAnimationFrame(() => {
          setExchangeRates(rates);
          setLastUpdated(timestamp);
          setLoading(false);
        });
        return;
      } catch {
        // Invalid cache, fetch fresh
      }
    }

    // Fetch from API endpoint (public read from Supabase)
    fetch("/api/exchange-rates")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setExchangeRates(data.rates);
        setLastUpdated(data.timestamp);

        // Cache for 24h
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            rates: data.rates,
            timestamp: data.timestamp,
          })
        );
      })
      .catch((err) => {
        console.error("Failed to fetch exchange rates:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  // Helper to convert price from base to display currency
  const convertPrice = (amount: number): number => {
    if (baseCurrency === displayCurrency) return amount;

    const result = convertCurrency(amount, baseCurrency, displayCurrency, exchangeRates);
    return result.amount;
  };

  return (
    <CurrencyContext.Provider
      value={{
        baseCurrency,
        displayCurrency,
        setDisplayCurrency,
        exchangeRates,
        loading,
        lastUpdated,
        convertPrice,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return ctx;
}
