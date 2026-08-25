import apiClient from "@/src/lib/api/client";
import type {
  DentalService,
  ServiceFormState,
  ServiceListResponse,
  TreatmentMethod,
  TreatmentMethodFormItem,
} from "./types";

type ServiceQuery = {
  search?: string;
};

function toPayload(form: ServiceFormState) {
  const treatmentMethods = form.treatmentMethods.map((tm, tmIndex) => ({
        id: tm.id || undefined,
        name: tm.name.trim(),
        slug: tm.slug.trim() || undefined,
        description: tm.description.trim() || undefined,
        imageUrl: tm.imageUrl.trim() || undefined,
        basePrice: Number(tm.basePrice) || 0,
        durationMinutes: Number(tm.durationMinutes) || 30,
        displayOrder: Number(tm.displayOrder) || tmIndex + 1,
        isActive: tm.isActive ?? true,
        media: tm.media
          ?.filter((m) => m.url.trim())
          .map((m, mIdx) => ({
            url: m.url.trim(),
            alt: m.alt.trim() || undefined,
            type: m.type.trim() || "BANNER",
            sortOrder: Number(m.sortOrder) || mIdx + 1,
          })),
        procedureSteps: tm.procedureSteps
          ?.filter((s) => s.title.trim() || s.description.trim())
          .map((s, sIdx) => ({
            stepOrder: Number(s.stepOrder) || sIdx + 1,
            title: s.title.trim(),
            description: s.description.trim(),
            durationMinutes:
              s.durationMinutes === "" ? undefined : Number(s.durationMinutes),
          })),
        faqs: tm.faqs
          ?.filter((f) => f.question.trim() || f.answer.trim())
          .map((f, fIdx) => ({
            question: f.question.trim(),
            answer: f.answer.trim(),
            sortOrder: Number(f.sortOrder) || fIdx + 1,
          })),
      }));

  return {
    category: form.category,
    name: form.name,
    slug: form.slug || undefined,
    shortDescription: form.shortDescription || undefined,
    description: form.description || undefined,
    detailSummary: form.detailSummary || undefined,
    durationMinutes: Number(form.durationMinutes),
    basePrice: Number(form.basePrice),
    displayOrder: Number(form.displayOrder),
    isActive: form.isActive,
    treatmentMethods,
    highlights: form.highlights
      .filter((item) => item.title.trim() || item.description.trim())
      .map((item) => ({
        title: item.title.trim(),
        description: item.description.trim(),
        icon: item.icon.trim() || "shield",
      })),
    suitableFor: form.suitableFor.map((item) => item.trim()).filter(Boolean),
    includedItems: form.includedItems.map((item) => item.trim()).filter(Boolean),
    preparationNotes: form.preparationNotes
      .map((item) => item.trim())
      .filter(Boolean),
    aftercareNotes: form.aftercareNotes
      .map((item) => item.trim())
      .filter(Boolean),
    importantNotes: form.importantNotes
      .map((item) => item.trim())
      .filter(Boolean),
    pricingNote: form.pricingNote || undefined,
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

export async function updateTreatmentMethod(
  serviceId: string,
  methodId: string,
  form: TreatmentMethodFormItem,
) {
  const response = await apiClient.patch<TreatmentMethod>(
    `/services/${serviceId}/treatment-methods/${methodId}`,
    {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      description: form.description.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      basePrice: Number(form.basePrice),
      durationMinutes: Number(form.durationMinutes),
      displayOrder: Number(form.displayOrder),
      isActive: form.isActive,
    },
  );
  return response.data;
}

export async function deleteTreatmentMethod(
  serviceId: string,
  methodId: string,
) {
  await apiClient.delete(
    `/services/${serviceId}/treatment-methods/${methodId}`,
  );
}

export async function deleteService(id: string) {
  await apiClient.delete(`/services/${id}`);
}
