import type { DentalService, ServiceFormState } from "./types";

export const emptyServiceForm: ServiceFormState = {
  category: "",
  name: "",
  slug: "",
  shortDescription: "",
  description: "",
  thumbnailUrl: "",
  durationMinutes: 30,
  basePrice: 0,
  isFeatured: false,
  displayOrder: 0,
  isActive: true,
  media: [],
  procedureSteps: [],
  faqs: [],
};

export function toServiceFormState(service: DentalService): ServiceFormState {
  return {
    category: service.category,
    name: service.name,
    slug: service.slug ?? "",
    shortDescription: service.shortDescription ?? "",
    description: service.description ?? "",
    thumbnailUrl: service.thumbnailUrl ?? "",
    durationMinutes: service.durationMinutes,
    basePrice: Number(service.basePrice),
    isFeatured: service.isFeatured,
    displayOrder: service.displayOrder,
    isActive: service.isActive,
    media: service.media.map((media, index) => ({
      url: media.url,
      alt: media.alt ?? "",
      type: media.type,
      sortOrder: media.sortOrder ?? index + 1,
    })),
    procedureSteps: service.procedureSteps.map((step, index) => ({
      stepOrder: step.stepOrder ?? index + 1,
      title: step.title,
      description: step.description,
      durationMinutes: step.durationMinutes ?? "",
    })),
    faqs: service.faqs.map((faq, index) => ({
      question: faq.question,
      answer: faq.answer,
      sortOrder: faq.sortOrder ?? index + 1,
    })),
  };
}

export function groupServicesByCategory(services: DentalService[]) {
  return services.reduce<Record<string, DentalService[]>>((acc, service) => {
    if (!acc[service.category]) acc[service.category] = [];
    acc[service.category].push(service);
    return acc;
  }, {});
}

export function formatVND(amount: number | string) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(amount));
}

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
