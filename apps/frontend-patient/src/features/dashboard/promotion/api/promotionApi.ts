import apiClient, { getWithSummaryFallback } from "@/lib/axios";
import type { PromotionDto, ServiceOption } from "../types";

type TreatmentMethodDto = {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  basePrice: string | number;
  durationMinutes?: number;
};

type PaginatedServicesResponse = {
  data: {
    id: string;
    category: string;
    name: string;
    slug?: string | null;
    description?: string | null;
    shortDescription?: string | null;
    badge?: string | null;
    image?: string | null;
    basePrice: string | number;
    treatmentMethods?: TreatmentMethodDto[];
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
    const response = await getWithSummaryFallback<PaginatedServicesResponse>(
      "/services",
      {
        params: {
          isActive: true,
          limit: 100,
        },
      },
    );

    if (response.data && Array.isArray(response.data.data)) {
      const options: ServiceOption[] = [];

      for (const service of response.data.data) {
        const methods =
          service.treatmentMethods ||
          (service as unknown as { treatment_methods?: TreatmentMethodDto[] })
            .treatment_methods;
        if (methods && methods.length > 0) {
          for (const tm of methods) {
            options.push({
              id: tm.id,
              serviceId: service.id,
              serviceSlug: service.slug ?? null,
              name: tm.name,
              slug: tm.slug ?? service.slug ?? null,
              category: service.category || service.name,
              basePrice: Number(tm.basePrice || 0),
              description: tm.description ?? service.description ?? null,
              shortDescription:
                tm.description ?? service.shortDescription ?? null,
              badge: service.badge ?? null,
              imageUrl: tm.imageUrl ?? service.image ?? null,
            });
          }
        } else {
          options.push({
            id: service.id,
            serviceId: service.id,
            serviceSlug: service.slug ?? null,
            name: service.name,
            slug: service.slug ?? null,
            category: service.category,
            basePrice: Number(service.basePrice || 0),
            description: service.description ?? null,
            shortDescription: service.shortDescription ?? null,
            badge: service.badge ?? null,
            imageUrl: service.image ?? null,
          });
        }
      }

      return options;
    }
    return [];
  } catch (error) {
    console.error("Error fetching services for promotions:", error);
    return [];
  }
}
