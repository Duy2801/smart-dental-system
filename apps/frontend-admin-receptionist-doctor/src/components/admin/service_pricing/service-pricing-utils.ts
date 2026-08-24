import type { DentalService, ServiceFormState, TreatmentMethodFormItem } from "./types";

export const emptyServiceForm: ServiceFormState = {
  category: "",
  name: "",
  slug: "",
  shortDescription: "",
  description: "",
  detailSummary: "",
  thumbnailUrl: "",
  durationMinutes: 30,
  basePrice: 0,
  highlights: [],
  suitableFor: [],
  includedItems: [],
  preparationNotes: [],
  aftercareNotes: [],
  importantNotes: [],
  pricingNote: "",
  isFeatured: false,
  displayOrder: 0,
  isActive: true,
  treatmentMethods: [],
  media: [],
  procedureSteps: [],
  faqs: [],
};

export function toServiceFormState(service: DentalService): ServiceFormState {
  const primaryMethod = service.treatmentMethods?.[0];
  const mediaList = service.media ?? primaryMethod?.media ?? [];
  const procedureStepList = service.procedureSteps ?? primaryMethod?.procedureSteps ?? [];
  const faqList = service.faqs ?? primaryMethod?.faqs ?? [];

  const basePrice =
    service.basePrice !== undefined && service.basePrice !== null
      ? Number(service.basePrice)
      : Number(primaryMethod?.basePrice ?? 0);

  const durationMinutes =
    service.durationMinutes ?? primaryMethod?.durationMinutes ?? 30;

  const rawMethods = service.treatmentMethods ?? [];
  const treatmentMethods: TreatmentMethodFormItem[] =
    rawMethods.length > 0
      ? rawMethods.map((method, index) => ({
          id: method.id,
          name: method.name,
          slug: method.slug ?? "",
          description: method.description ?? "",
          imageUrl: method.imageUrl ?? "",
          basePrice: Number(method.basePrice ?? 0),
          durationMinutes: method.durationMinutes ?? 30,
          displayOrder: method.displayOrder ?? index + 1,
          isActive: method.isActive ?? true,
          media: (method.media ?? []).map((m, idx) => ({
            url: m.url,
            alt: m.alt ?? "",
            type: m.type ?? "BANNER",
            sortOrder: m.sortOrder ?? idx + 1,
          })),
          procedureSteps: (method.procedureSteps ?? []).map((s, idx) => ({
            stepOrder: s.stepOrder ?? idx + 1,
            title: s.title,
            description: s.description,
            durationMinutes: s.durationMinutes ?? "",
          })),
          faqs: (method.faqs ?? []).map((f, idx) => ({
            question: f.question,
            answer: f.answer,
            sortOrder: f.sortOrder ?? idx + 1,
          })),
        }))
      : [];

  return {
    category: service.category,
    name: service.name,
    slug: service.slug ?? "",
    shortDescription: service.shortDescription ?? "",
    description: service.description ?? "",
    detailSummary: service.detailSummary ?? "",
    thumbnailUrl: service.thumbnailUrl ?? primaryMethod?.imageUrl ?? "",
    durationMinutes,
    basePrice,
    highlights: service.highlights ?? [],
    suitableFor: service.suitableFor ?? [],
    includedItems: service.includedItems ?? [],
    preparationNotes: service.preparationNotes ?? [],
    aftercareNotes: service.aftercareNotes ?? [],
    importantNotes: service.importantNotes ?? [],
    pricingNote: service.pricingNote ?? "",
    isFeatured: service.isFeatured ?? false,
    displayOrder: service.displayOrder ?? 0,
    isActive: service.isActive ?? true,
    treatmentMethods,
    media: mediaList.map((media, index) => ({
      url: media.url,
      alt: media.alt ?? "",
      type: media.type ?? "BANNER",
      sortOrder: media.sortOrder ?? index + 1,
    })),
    procedureSteps: procedureStepList.map((step, index) => ({
      stepOrder: step.stepOrder ?? index + 1,
      title: step.title,
      description: step.description,
      durationMinutes: step.durationMinutes ?? "",
    })),
    faqs: faqList.map((faq, index) => ({
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
