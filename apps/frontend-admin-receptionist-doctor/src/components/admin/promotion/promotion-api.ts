import apiClient from "@/src/lib/api/client";
import type { Promotion, SavePromotionPayload } from "./types";

export type { SavePromotionPayload };

export async function getPromotions(search?: string) {
  const response = await apiClient.get<Promotion[]>("/promotions", {
    params: { search: search?.trim() || undefined },
  });
  return response.data;
}

export async function createPromotion(payload: SavePromotionPayload) {
  const response = await apiClient.post<Promotion>("/promotions", payload);
  return response.data;
}

export async function updatePromotion(id: string, payload: SavePromotionPayload) {
  const response = await apiClient.put<Promotion>(`/promotions/${id}`, payload);
  return response.data;
}

export async function updatePromotionStatus(id: string, isActive: boolean) {
  await apiClient.patch(`/promotions/${id}/status`, { is_active: isActive });
}

export async function broadcastPromotionNotification(id: string) {
  const response = await apiClient.post<{ broadcast_count: number; message: string }>(
    `/promotions/${id}/broadcast`
  );
  return response.data;
}

export async function deletePromotion(id: string) {
  await apiClient.delete(`/promotions/${id}`);
}
