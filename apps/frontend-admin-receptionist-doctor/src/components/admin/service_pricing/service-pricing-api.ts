import apiClient from "@/src/lib/api/client";
import type {
  DentalService,
  ServiceFormState,
  ServiceListResponse,
} from "./types";

type ServiceQuery = {
  search?: string;
};

function toPayload(form: ServiceFormState) {
  return {
    category: form.category,
    name: form.name,
    description: form.description || undefined,
    durationMinutes: Number(form.durationMinutes),
    basePrice: Number(form.basePrice),
    isActive: form.isActive,
  };
}

export async function getServices(query: ServiceQuery) {
  const response = await apiClient.get<ServiceListResponse>("/services", {
    params: {
      page: 1,
      limit: 100,
      search: query.search || undefined,
    },
  });

  return response.data.data;
}

export async function createService(form: ServiceFormState) {
  const response = await apiClient.post<DentalService>(
    "/services",
    toPayload(form),
  );
  return response.data;
}

export async function updateService(id: string, form: ServiceFormState) {
  const response = await apiClient.patch<DentalService>(
    `/services/${id}`,
    toPayload(form),
  );
  return response.data;
}

export async function updateServiceStatus(id: string, isActive: boolean) {
  const response = await apiClient.patch<DentalService>(
    `/services/${id}/status`,
    {
      isActive,
    },
  );
  return response.data;
}

export async function deleteService(id: string) {
  await apiClient.delete(`/services/${id}`);
}
