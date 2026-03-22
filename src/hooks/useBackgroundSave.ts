"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { projectKeys } from "@/hooks/useProjectsQuery";
import { useToast } from "@/components/dashboard/Toast";
import type { ProyectoCompleto, Tipologia, Unidad } from "@/types";

/**
 * Background save for sub-entities (tipologías, videos, etc.).
 *
 * - Applies optimistic update to React Query cache immediately
 * - Fires API call in background (survives page unmounts)
 * - On success: merges server response into cache
 * - On failure: rolls back to snapshot + toast error
 *
 * Works after component unmount because fetch() promises and
 * queryClient.setQueryData() are not tied to component lifecycle.
 */
export function useBackgroundSave(projectId: string) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const queryKey = projectKeys.detail(projectId);

  /** Save a tipología field immediately (no debounce). */
  const saveTipologia = useCallback(
    (options: {
      tipologiaId: string;
      payload: Record<string, unknown>;
      optimisticUpdate: (prev: ProyectoCompleto) => ProyectoCompleto;
    }) => {
      const { tipologiaId, payload, optimisticUpdate } = options;

      // 1. Snapshot for rollback
      const snapshot = queryClient.getQueryData<ProyectoCompleto>(queryKey);

      // 2. Optimistic update — instant UI feedback
      queryClient.setQueryData<ProyectoCompleto>(queryKey, (old) =>
        old ? optimisticUpdate(old) : old
      );

      // 3. Fire-and-forget API call
      fetch(`/api/tipologias/${tipologiaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(async (res) => {
          if (!res.ok) {
            const text = await res.text().catch(() => "Error desconocido");
            throw new Error(text || res.statusText);
          }
          const updated = (await res.json()) as Tipologia;

          // 4a. Merge authoritative server response
          queryClient.setQueryData<ProyectoCompleto>(queryKey, (old) =>
            old
              ? {
                  ...old,
                  tipologias: old.tipologias.map((t) =>
                    t.id === tipologiaId ? { ...t, ...updated } : t
                  ),
                }
              : old
          );
        })
        .catch((err: Error) => {
          // 4b. Rollback + toast
          if (snapshot) {
            queryClient.setQueryData<ProyectoCompleto>(queryKey, snapshot);
          }
          toast.error(`Error al guardar: ${err.message}`);
        });
    },
    [queryClient, queryKey, toast]
  );

  /** Generic save for any sub-entity (videos, gallery, etc.). */
  const saveEntity = useCallback(
    <T>(options: {
      url: string;
      method?: "PUT" | "POST" | "DELETE";
      payload?: Record<string, unknown>;
      optimisticUpdate: (prev: ProyectoCompleto) => ProyectoCompleto;
      /** Merge the server response into cache. If omitted, no merge is done. */
      onServerResponse?: (
        data: T
      ) => (prev: ProyectoCompleto) => ProyectoCompleto;
    }) => {
      const { url, method = "PUT", payload, optimisticUpdate, onServerResponse } =
        options;

      const snapshot = queryClient.getQueryData<ProyectoCompleto>(queryKey);

      queryClient.setQueryData<ProyectoCompleto>(queryKey, (old) =>
        old ? optimisticUpdate(old) : old
      );

      fetch(url, {
        method,
        headers: payload ? { "Content-Type": "application/json" } : undefined,
        body: payload ? JSON.stringify(payload) : undefined,
      })
        .then(async (res) => {
          if (!res.ok) {
            const text = await res.text().catch(() => "Error");
            throw new Error(text || res.statusText);
          }
          if (onServerResponse) {
            const data = (await res.json()) as T;
            queryClient.setQueryData<ProyectoCompleto>(queryKey, (old) =>
              old ? onServerResponse(data)(old) : old
            );
          }
        })
        .catch((err: Error) => {
          if (snapshot) {
            queryClient.setQueryData<ProyectoCompleto>(queryKey, snapshot);
          }
          toast.error(`Error al guardar: ${err.message}`);
        });
    },
    [queryClient, queryKey, toast]
  );

  /** Save a unidad field immediately (no debounce). */
  const saveUnidad = useCallback(
    (options: {
      unidadId: string;
      payload: Record<string, unknown>;
      optimisticUpdate: (prev: ProyectoCompleto) => ProyectoCompleto;
    }) => {
      const { unidadId, payload, optimisticUpdate } = options;

      const snapshot = queryClient.getQueryData<ProyectoCompleto>(queryKey);

      queryClient.setQueryData<ProyectoCompleto>(queryKey, (old) =>
        old ? optimisticUpdate(old) : old
      );

      fetch(`/api/unidades/${unidadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(async (res) => {
          if (!res.ok) {
            const text = await res.text().catch(() => "Error");
            throw new Error(text || res.statusText);
          }
          const updated = (await res.json()) as Unidad;

          queryClient.setQueryData<ProyectoCompleto>(queryKey, (old) =>
            old
              ? {
                  ...old,
                  unidades: old.unidades.map((u) =>
                    u.id === unidadId ? { ...u, ...updated } : u
                  ),
                }
              : old
          );
        })
        .catch((err: Error) => {
          if (snapshot) {
            queryClient.setQueryData<ProyectoCompleto>(queryKey, snapshot);
          }
          toast.error(`Error al guardar: ${err.message}`);
        });
    },
    [queryClient, queryKey, toast]
  );

  return { saveTipologia, saveEntity, saveUnidad };
}
