import apiClient from "@/src/lib/api/client";
import type { Promotion } from "./types";

export type CreatePromotionPayload = Omit<
  Promotion,
  "id" | "used_count" | "is_active"
> & {
  is_active?: boolean;
};

export async function getPromotions(search?: string) {
  const response = await apiClient.get<Promotion[]>("/promotions", {
    params: search ? { search } : undefined,
  });

  return response.data;
}

export async function createPromotion(payload: CreatePromotionPayload) {
  const response = await apiClient.post<Promotion>("/promotions", payload);
  return response.data;
}

export async function updatePromotionStatus(id: string, isActive: boolean) {
  await apiClient.patch(`/promotions/${id}/status`, { is_active: isActive });
}

export async function deletePromotion(id: string) {
  await apiClient.delete(`/promotions/${id}`);
}
