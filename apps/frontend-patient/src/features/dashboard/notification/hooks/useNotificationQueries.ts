import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  fetchUnreadNotificationCount,
  fetchUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../api";
import type { PaginatedNotificationsResponse } from "../types";

export const notificationQueryKeys = {
  all: ["notifications"] as const,
  list: (filter?: string, page?: number) => ["notifications", "list", filter, page] as const,
  infinite: (filter?: string) => ["notifications", "infinite", filter] as const,
  unreadCount: () => ["notifications", "unread-count"] as const,
};

export function useUserNotifications(filterType?: string, page = 1, enabled = true) {
  return useQuery({
    queryKey: notificationQueryKeys.list(filterType, page),
    queryFn: () =>
      fetchUserNotifications({
        type: filterType === "ALL" || filterType === "UNREAD" ? undefined : filterType,
        unreadOnly: filterType === "UNREAD",
        page,
        limit: 20,
      }),
    staleTime: 30 * 1000,
    enabled,
  });
}

export function useUserNotificationsInfinite(filterType?: string, enabled = true) {
  const apiType = filterType === "ALL" || filterType === "UNREAD" ? undefined : filterType;
  const unreadOnly = filterType === "UNREAD";

  return useInfiniteQuery({
    queryKey: notificationQueryKeys.infinite(filterType),
    queryFn: ({ pageParam = 1 }) =>
      fetchUserNotifications({
        type: apiType,
        unreadOnly,
        page: pageParam,
        limit: 15,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.meta.hasMore ? lastPage.meta.page + 1 : undefined),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled,
  });
}

export function useUnreadNotificationCount(enabled = true) {
  return useQuery({
    queryKey: notificationQueryKeys.unreadCount(),
    queryFn: fetchUnreadNotificationCount,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: false,
    enabled,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: notificationQueryKeys.all });

      const previousQueries = queryClient.getQueriesData<unknown>({
        queryKey: notificationQueryKeys.all,
      });

      let wasUnread = false;

      // Update infinite query data
      queryClient.setQueriesData<InfiniteData<PaginatedNotificationsResponse>>(
        {
          queryKey: notificationQueryKeys.all,
          predicate: (query) => query.queryKey[1] === "infinite",
        },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              data: page.data.map((item) => {
                if (item.id === id) {
                  if (!item.read) wasUnread = true;
                  return { ...item, read: true, readAt: new Date().toISOString() };
                }
                return item;
              }),
            })),
          };
        },
      );

      // Update list query data
      queryClient.setQueriesData<PaginatedNotificationsResponse>(
        {
          queryKey: notificationQueryKeys.all,
          predicate: (query) => query.queryKey[1] === "list",
        },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: oldData.data.map((item) => {
              if (item.id === id) {
                if (!item.read) wasUnread = true;
                return { ...item, read: true, readAt: new Date().toISOString() };
              }
              return item;
            }),
          };
        },
      );

      if (wasUnread) {
        queryClient.setQueryData<{ unreadCount: number }>(
          notificationQueryKeys.unreadCount(),
          (old) => ({
            unreadCount: Math.max(0, (old?.unreadCount ?? 1) - 1),
          }),
        );
      }

      return { previousQueries };
    },
    onError: (_err, _id, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
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

      const previousQueries = queryClient.getQueriesData<unknown>({
        queryKey: notificationQueryKeys.all,
      });

      // Update infinite query data
      queryClient.setQueriesData<InfiniteData<PaginatedNotificationsResponse>>(
        {
          queryKey: notificationQueryKeys.all,
          predicate: (query) => query.queryKey[1] === "infinite",
        },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              data: page.data.map((item) => ({
                ...item,
                read: true,
                readAt: new Date().toISOString(),
              })),
            })),
          };
        },
      );

      // Update list query data
      queryClient.setQueriesData<PaginatedNotificationsResponse>(
        {
          queryKey: notificationQueryKeys.all,
          predicate: (query) => query.queryKey[1] === "list",
        },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: oldData.data.map((item) => ({
              ...item,
              read: true,
              readAt: new Date().toISOString(),
            })),
          };
        },
      );

      queryClient.setQueryData<{ unreadCount: number }>(
        notificationQueryKeys.unreadCount(),
        { unreadCount: 0 },
      );

      return { previousQueries };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
    },
  });
}
