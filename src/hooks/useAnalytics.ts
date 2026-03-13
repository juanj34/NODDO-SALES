"use client";

import { useState, useEffect, useCallback } from "react";
import type { AnalyticsResponse } from "@/types";

export function useAnalytics(
  projectId: string,
  from: Date,
  to: Date
): {
  data: AnalyticsResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
} {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        from: from.toISOString(),
        to: to.toISOString(),
      });
      const res = await fetch(`/api/proyectos/${projectId}/analytics?${params}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al cargar analytics");
      }
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [projectId, from, to]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}
