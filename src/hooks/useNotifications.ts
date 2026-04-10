"use client";

import { useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuthRole } from "@/hooks/useAuthContext";

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  title_en: string | null;
  body: string | null;
  body_en: string | null;
  metadata: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export const notificationKeys = {
  all: ["notifications"] as const,
  list: () => [...notificationKeys.all, "list"] as const,
};

export function useNotifications() {
  const queryClient = useQueryClient();
  const { user } = useAuthRole();
  const userId = user?.id;

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: notificationKeys.list(),
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as Notification[];
    },
    staleTime: 60_000,
    retry: 1,
    enabled: !!userId,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Supabase Realtime subscription for live updates
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload: { new: unknown }) => {
          // Prepend new notification to cache
          queryClient.setQueryData(
            notificationKeys.list(),
            (old: Notification[] | undefined) => [
              payload.new as Notification,
              ...(old || []),
            ]
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  const markAsReadMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error("Failed to mark as read");
    },
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.list() });
      queryClient.setQueryData(
        notificationKeys.list(),
        (old: Notification[] | undefined) =>
          (old || []).map((n) =>
            ids.includes(n.id) ? { ...n, read: true } : n
          )
      );
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (!res.ok) throw new Error("Failed to mark all read");
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.list() });
      queryClient.setQueryData(
        notificationKeys.list(),
        (old: Notification[] | undefined) =>
          (old || []).map((n) => ({ ...n, read: true }))
      );
    },
  });

  const markAsRead = useCallback(
    (id: string) => markAsReadMutation.mutate([id]),
    [markAsReadMutation]
  );

  const markAllRead = useCallback(
    () => markAllReadMutation.mutate(),
    [markAllReadMutation]
  );

  return { notifications, unreadCount, markAsRead, markAllRead, isLoading };
}
