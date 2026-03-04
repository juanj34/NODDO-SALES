"use client";

import { useState, useEffect, useCallback } from "react";
import type { Proyecto, ProyectoCompleto } from "@/types";

export function useProjects() {
  const [projects, setProjects] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/proyectos");
    if (res.ok) {
      const data = await res.json();
      setProjects(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { projects, loading, refresh };
}

export function useProject(id: string) {
  const [project, setProject] = useState<ProyectoCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/proyectos/${id}`);
    if (res.ok) {
      setProject(await res.json());
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = async (data: Partial<Proyecto>) => {
    setSaving(true);
    const res = await fetch(`/api/proyectos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      setProject((prev) => (prev ? { ...prev, ...updated } : prev));
    }
    setSaving(false);
    return res.ok;
  };

  return { project, loading, saving, save, refresh };
}
