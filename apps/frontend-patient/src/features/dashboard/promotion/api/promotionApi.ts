import apiClient from "@/lib/axios";
import type { PromotionDto, ServiceOption } from "../types";

type PaginatedServicesResponse = {
  data: {
    id: string;
    category: string;
    name: string;
    slug?: string | null;
    basePrice: string | number;
    treatmentMethods?: { imageUrl?: string | null }[];
  }[];
};

export async function fetchPromotions(): Promise<PromotionDto[]> {
  try {
    const response = await apiClient.get<PromotionDto[]>("/promotions");
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching promotions from DB:", error);
    return [];
  }
}

export async function fetchServicesForPromotions(): Promise<ServiceOption[]> {
  try {
    const response = await apiClient.get<PaginatedServicesResponse>("/services", {
      params: {
        isActive: true,
        limit: 50,
      },
    });

    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data.map((item) => ({
        id: item.id,
        name: item.name,
        slug: item.slug ?? null,
        category: item.category,
        basePrice: Number(item.basePrice || 0),
        imageUrl: item.treatmentMethods?.find((m) => m.imageUrl)?.imageUrl ?? null,
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching services for promotions:", error);
    return [];
  }
}
