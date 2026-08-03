import apiClient from "@/lib/axios";
import type { DentalService, ServiceFaq, ServiceMedia, ServiceProcedureStep, TreatmentMethod } from "./types";

type ServiceDto = {
  id: string;
  category: string;
  name: string;
  slug?: string | null;
  icon?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  detailSummary?: string | null;
  thumbnailUrl?: string | null;
  durationMinutes: number;
  basePrice: string | number;
  displayOrder?: number;
  isActive: boolean;
  isFeatured: boolean;
  highlights?: DentalService["highlights"];
  suitableFor?: string[] | null;
  includedItems?: string[] | null;
  preparationNotes?: string[] | null;
  aftercareNotes?: string[] | null;
  importantNotes?: string[] | null;
  pricingNote?: string | null;
  treatmentMethods?: TreatmentMethod[];
  media?: ServiceMedia[];
  procedureSteps?: ServiceProcedureStep[];
  faqs?: ServiceFaq[];
};

type ServiceListDto = {
  data: ServiceDto[];
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=85";

export function formatServicePrice(value: string | number) {
  return `${new Intl.NumberFormat("vi-VN").format(Number(value ?? 0))} đ`;
}

function mapService(item: ServiceDto): DentalService {
  const treatmentMethods = (item.treatmentMethods ?? []).map((method) => ({
    ...method,
    bookingCount: method.bookingCount ?? method._count?.appointments ?? 0,
  }));
  const aggregatedMedia = item.media ?? treatmentMethods.flatMap((m) => m.media ?? []);
  const aggregatedSteps = item.procedureSteps ?? treatmentMethods.flatMap((m) => m.procedureSteps ?? []);
  const aggregatedFaqs = item.faqs ?? treatmentMethods.flatMap((m) => m.faqs ?? []);

  const image = item.thumbnailUrl || aggregatedMedia?.[0]?.url || FALLBACK_IMAGE;
  const description =
    item.description ||
    item.shortDescription ||
    "Dịch vụ nha khoa chuyên nghiệp, được cá nhân hóa theo tình trạng răng miệng của bạn.";

  return {
    id: item.id,
    title: item.name,
    name: item.name,
    slug: item.slug,
    icon: item.icon,
    description,
    shortDescription: item.shortDescription || description,
    detailSummary: item.detailSummary ?? null,
    category: item.category,
    price: formatServicePrice(item.basePrice),
    priceValue: Number(item.basePrice ?? 0),
    durationMinutes: item.durationMinutes,
    displayOrder: item.displayOrder,
    image,
    imageAlt: aggregatedMedia?.[0]?.alt || item.name,
    badge: item.isFeatured ? "Nổi bật" : undefined,
    highlights: item.highlights ?? null,
    suitableFor: item.suitableFor ?? null,
    includedItems: item.includedItems ?? null,
    preparationNotes: item.preparationNotes ?? null,
    aftercareNotes: item.aftercareNotes ?? null,
    importantNotes: item.importantNotes ?? null,
    pricingNote: item.pricingNote ?? null,
    treatmentMethods,
    media: aggregatedMedia,
    procedureSteps: aggregatedSteps,
    faqs: aggregatedFaqs,
  };
}

export async function getPatientServices() {
  const response = await apiClient.get<ServiceListDto>("/services", {
    params: { isActive: true, limit: 100 },
  });

  return response.data.data.map(mapService);
}

export async function getPatientServiceDetail(serviceId: string) {
  const response = await apiClient.get<ServiceDto>(`/services/${serviceId}`);
  return mapService(response.data);
}
