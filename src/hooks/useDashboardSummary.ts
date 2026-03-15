"use client";

import { useState, useEffect, useCallback } from "react";
import type { DashboardSummary } from "@/types";
import { useRetry } from "@/components/ui/ErrorBoundary";

export function useDashboardSummary() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    const res = await fetch("/api/dashboard/summary");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }, []);

  const { execute: refresh, loading: retrying } = useRetry(fetchSummary, {
    maxRetries: 3,
    delay: 1000,
    backoff: 2,
    onSuccess: (json) => {
      setData(json);
      setError(null);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Error al cargar resumen");
    },
    onFinally: () => {
      setLoading(false);
    },
  });

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading: loading || retrying, error, refresh };
}
