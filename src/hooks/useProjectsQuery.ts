"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Proyecto, ProyectoCompleto, AnalyticsResponse, DashboardSummary, FinancieroResponse } from "@/types";

/**
 * Query keys for React Query caching
 * Follow hierarchical pattern: ['resource', id, 'sub-resource']
 */
export const projectKeys = {
  all: ["proyectos"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  analytics: (id: string) => [...projectKeys.detail(id), "analytics"] as const,
  unidades: (id: string) => [...projectKeys.detail(id), "unidades"] as const,
  leads: (id: string) => [...projectKeys.detail(id), "leads"] as const,
};

/**
 * Fetch all user projects (cached for 5 minutes)
 *
 * Features:
 * - Auto-refetch on window focus (disabled by default)
 * - Background refetch when data becomes stale
 * - Instant navigation (data served from cache)
 *
 * Usage:
 * ```tsx
 * const { data: projects, isLoading, error, refetch } = useProjects();
 * ```
 */
export function useProjects() {
  return useQuery({
    queryKey: projectKeys.lists(),
    queryFn: async () => {
      const res = await fetch("/api/proyectos");
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return (await res.json()) as Proyecto[];
    },
    // Data is fresh for 5 minutes
    staleTime: 5 * 60 * 1000,
    // Retry failed queries once
    retry: 1,
  });
}

/**
 * Fetch single project with all related data (cached for 5 minutes)
 *
 * Features:
 * - Optimistic updates (updateLocal)
 * - Automatic invalidation on mutations
 * - Background refetch when stale
 *
 * Usage:
 * ```tsx
 * const { data: project, isLoading, updateLocal } = useProject(id);
 * ```
 */
export function useProject(id: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: async () => {
      const res = await fetch(`/api/proyectos/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return (await res.json()) as ProyectoCompleto;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
    // Don't fetch if no ID provided
    enabled: !!id,
  });

  /**
   * Update project data optimistically (before server response)
   * Useful for immediate UI updates
   */
  const updateLocal = (updater: (prev: ProyectoCompleto) => ProyectoCompleto) => {
    queryClient.setQueryData<ProyectoCompleto>(
      projectKeys.detail(id),
      (old) => (old ? updater(old) : old)
    );
  };

  return {
    ...query,
    project: query.data,
    loading: query.isLoading,
    error: query.error?.message ?? null,
    refresh: query.refetch,
    updateLocal,
  };
}

/**
 * Update project mutation with automatic cache invalidation
 *
 * Features:
 * - Optimistic updates (optional)
 * - Auto-invalidate project cache on success
 * - Auto-invalidate projects list
 *
 * Usage:
 * ```tsx
 * const { mutate: save, isPending: saving } = useUpdateProject(id);
 * save({ nombre: "New Name" });
 * ```
 */
export function useUpdateProject(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Proyecto>) => {
      const res = await fetch(`/api/proyectos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return (await res.json()) as Proyecto;
    },
    onSuccess: (updatedProject) => {
      // Update single project cache
      queryClient.setQueryData<ProyectoCompleto>(
        projectKeys.detail(id),
        (old) => (old ? { ...old, ...updatedProject } : old)
      );

      // Invalidate projects list to refetch
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

/**
 * Create new project mutation
 *
 * Features:
 * - Auto-invalidate projects list on success
 * - Returns created project data
 *
 * Usage:
 * ```tsx
 * const { mutate: create, isPending } = useCreateProject();
 * create({ nombre: "New Project", slug: "new-project" }, {
 *   onSuccess: (project) => router.push(`/editor/${project.id}`)
 * });
 * ```
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Proyecto> & { nombre: string; slug: string }) => {
      const res = await fetch("/api/proyectos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return (await res.json()) as Proyecto;
    },
    onSuccess: () => {
      // Invalidate projects list to show new project
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

/**
 * Delete project mutation
 *
 * Features:
 * - Auto-invalidate all project caches on success
 * - Optimistic removal from list
 *
 * Usage:
 * ```tsx
 * const { mutate: deleteProject } = useDeleteProject();
 * deleteProject(projectId);
 * ```
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/proyectos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return await res.json();
    },
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: projectKeys.detail(deletedId) });

      // Invalidate list to refetch
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

/**
 * Prefetch project data (for hover effects, etc.)
 *
 * Usage:
 * ```tsx
 * const prefetchProject = usePrefetchProject();
 * <Link onMouseEnter={() => prefetchProject(id)} />
 * ```
 */
export function usePrefetchProject() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: projectKeys.detail(id),
      queryFn: async () => {
        const res = await fetch(`/api/proyectos/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      },
      staleTime: 5 * 60 * 1000,
    });
  };
}

/**
 * Fetch analytics data for a project (cached for 2 minutes)
 *
 * Features:
 * - Reactive to date range changes
 * - Cached per project + date range combination
 * - Auto-refetch when date range changes
 *
 * Usage:
 * ```tsx
 * const { data, isLoading } = useAnalytics(projectId, from, to);
 * ```
 */
export function useAnalytics(projectId: string, from: Date, to: Date) {
  return useQuery({
    queryKey: [
      ...projectKeys.analytics(projectId),
      from.toISOString(),
      to.toISOString(),
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: from.toISOString(),
        to: to.toISOString(),
      });
      const res = await fetch(`/api/proyectos/${projectId}/analytics?${params}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al cargar analytics");
      }
      return (await res.json()) as AnalyticsResponse;
    },
    // Analytics data is fresh for 2 minutes (more volatile than project data)
    staleTime: 2 * 60 * 1000,
    retry: 1,
    enabled: !!projectId,
  });
}

/**
 * Fetch dashboard summary data (cached for 3 minutes)
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Background refetch when stale
 * - Shared cache across dashboard views
 *
 * Usage:
 * ```tsx
 * const { data: summary, isLoading } = useDashboardSummary();
 * ```
 */
export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/summary");
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return (await res.json()) as DashboardSummary;
    },
    // Summary data is fresh for 3 minutes
    staleTime: 3 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Fetch financial summary data for one or all projects (cached for 2 minutes)
 *
 * @param projectId - project UUID or "all" for aggregate
 * @param from - start date
 * @param to - end date
 */
export function useFinancialSummary(projectId: string, from: Date, to: Date) {
  return useQuery({
    queryKey: [
      "financiero",
      projectId,
      from.toISOString(),
      to.toISOString(),
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: from.toISOString(),
        to: to.toISOString(),
      });
      if (projectId && projectId !== "all") {
        params.set("projectId", projectId);
      }
      const res = await fetch(`/api/analytics/financiero?${params}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al cargar datos financieros");
      }
      return (await res.json()) as FinancieroResponse;
    },
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
}
