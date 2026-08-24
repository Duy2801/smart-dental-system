import apiClient from "@/src/lib/api/client";
import type { Banner, TargetType } from "./types";

export type CreateBannerPayload = {
  title: string;
  description?: string;
  imageUrl: string;
  linkUrl?: string;
  targetType?: TargetType | string;
  targetId?: string;
  displayOrder?: number;
  isActive?: boolean;
};

export type UpdateBannerPayload = Partial<CreateBannerPayload>;

export async function getBanners() {
  const response = await apiClient.get<Banner[]>("/banners");
  return response.data;
}

export async function createBanner(payload: CreateBannerPayload) {
  const response = await apiClient.post<Banner>("/banners", payload);
  return response.data;
}

export async function updateBanner({
  id,
  data,
}: {
  id: string;
  data: UpdateBannerPayload;
}) {
  const response = await apiClient.patch<Banner>(`/banners/${id}`, data);
  return response.data;
}

export async function deleteBanner(id: string) {
  await apiClient.delete(`/banners/${id}`);
}
