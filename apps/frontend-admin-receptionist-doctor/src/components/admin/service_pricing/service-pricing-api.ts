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
    slug: form.slug || undefined,
    shortDescription: form.shortDescription || undefined,
    description: form.description || undefined,
    thumbnailUrl: form.thumbnailUrl || undefined,
    durationMinutes: Number(form.durationMinutes),
    basePrice: Number(form.basePrice),
    displayOrder: Number(form.displayOrder),
    media: form.media
      .filter((media) => media.url.trim())
      .map((media, index) => ({
        url: media.url.trim(),
        alt: media.alt.trim() || undefined,
        type: media.type.trim() || "BANNER",
        sortOrder: Number(media.sortOrder) || index + 1,
      })),
    procedureSteps: form.procedureSteps
      .filter((step) => step.title.trim() || step.description.trim())
      .map((step, index) => ({
        stepOrder: Number(step.stepOrder) || index + 1,
        title: step.title.trim(),
        description: step.description.trim(),
        durationMinutes:
          step.durationMinutes === ""
            ? undefined
            : Number(step.durationMinutes),
      })),
    faqs: form.faqs
      .filter((faq) => faq.question.trim() || faq.answer.trim())
      .map((faq, index) => ({
        question: faq.question.trim(),
        answer: faq.answer.trim(),
        sortOrder: Number(faq.sortOrder) || index + 1,
      })),
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
