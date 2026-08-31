import apiClient from "@/lib/axios";
import type { PaginatedNotificationsResponse, UnreadCountResponse } from "./types";

export async function fetchUserNotifications(params?: {
  type?: string;
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
}) {
  const response = await apiClient.get<PaginatedNotificationsResponse>(
    "/notifications/my-notifications",
    { params },
  );
  return response.data;
}

export async function fetchUnreadNotificationCount() {
  const response = await apiClient.get<UnreadCountResponse>(
    "/notifications/unread-count",
  );
  return response.data;
}

export async function markNotificationAsRead(id: string) {
  const response = await apiClient.patch<{ message: string; id: string }>(
    `/notifications/${id}/read`,
  );
  return response.data;
}

export async function markAllNotificationsAsRead() {
  const response = await apiClient.patch<{ message: string }>(
    "/notifications/read-all",
  );
  return response.data;
}
