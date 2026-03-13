"use client";

import { useState, useEffect, useCallback } from "react";
import type { DashboardSummary } from "@/types";

export function useDashboardSummary() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/dashboard/summary");
      if (!res.ok) throw new Error("Error fetching dashboard summary");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  return { data, loading, error, refresh: fetch_ };
}
