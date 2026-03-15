"use client";

import { useState, useEffect, useCallback } from "react";
import type { Proyecto, ProyectoCompleto } from "@/types";
import { useRetry } from "@/components/ui/ErrorBoundary";

export function useProjects() {
  const [projects, setProjects] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    const res = await fetch("/api/proyectos");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }, []);

  const { execute: refresh, loading: retrying } = useRetry(fetchProjects, {
    maxRetries: 3,
    delay: 1000,
    backoff: 2,
    onSuccess: (data) => {
      setProjects(data);
      setError(null);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Error al cargar proyectos");
    },
    onFinally: () => {
      setLoading(false);
    },
  });

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { projects, loading: loading || retrying, error, refresh };
}

export function useProject(id: string) {
  const [project, setProject] = useState<ProyectoCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    const res = await fetch(`/api/proyectos/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }, [id]);

  const { execute: refresh, loading: retrying } = useRetry(fetchProject, {
    maxRetries: 3,
    delay: 1000,
    backoff: 2,
    onSuccess: (data) => {
      setProject(data);
      setError(null);
      setLoading(false);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Error al cargar proyecto");
      setLoading(false);
    },
  });

  useEffect(() => {
    requestAnimationFrame(() => setLoading(true));
    refresh();
  }, [refresh]);

  const save = useCallback(async (data: Partial<Proyecto>) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/proyectos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        setProject((prev) => (prev ? { ...prev, ...updated } : prev));
        setSaving(false);
        return true;
      }
      setSaving(false);
      return false;
    } catch {
      setSaving(false);
      return false;
    }
  }, [id]);

  const updateLocal = useCallback(
    (updater: (prev: ProyectoCompleto) => ProyectoCompleto) => {
      setProject((prev) => (prev ? updater(prev) : prev));
    },
    []
  );

  return { project, loading: loading || retrying, saving, error, save, refresh, updateLocal };
}
