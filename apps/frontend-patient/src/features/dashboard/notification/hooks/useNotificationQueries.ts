import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchUnreadNotificationCount,
  fetchUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../api";
import type { NotificationItem } from "../types";

export const notificationQueryKeys = {
  all: ["notifications"] as const,
  list: (filter?: string) => ["notifications", "list", filter] as const,
  unreadCount: () => ["notifications", "unread-count"] as const,
};

export function useUserNotifications(filterType?: string) {
  return useQuery({
    queryKey: notificationQueryKeys.list(filterType),
    queryFn: () =>
      fetchUserNotifications({
        type: filterType === "ALL" || filterType === "UNREAD" ? undefined : filterType,
        unreadOnly: filterType === "UNREAD",
      }),
    staleTime: 30 * 1000,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationQueryKeys.unreadCount(),
    queryFn: fetchUnreadNotificationCount,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: notificationQueryKeys.all });

      queryClient.setQueriesData<NotificationItem[]>(
        { queryKey: notificationQueryKeys.all },
        (oldData) => {
          if (!oldData) return [];
          return oldData.map((item) =>
            item.id === id ? { ...item, read: true, readAt: new Date().toISOString() } : item,
          );
        },
      );

      queryClient.setQueryData<{ unreadCount: number }>(
        notificationQueryKeys.unreadCount(),
        (old) => ({
          unreadCount: Math.max(0, (old?.unreadCount ?? 1) - 1),
        }),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationQueryKeys.all });

      queryClient.setQueriesData<NotificationItem[]>(
        { queryKey: notificationQueryKeys.all },
        (oldData) => {
          if (!oldData) return [];
          return oldData.map((item) => ({
            ...item,
            read: true,
            readAt: new Date().toISOString(),
          }));
        },
      );

      queryClient.setQueryData<{ unreadCount: number }>(
        notificationQueryKeys.unreadCount(),
        { unreadCount: 0 },
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
    },
  });
}
