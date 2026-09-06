import { api } from '~src/config';
import type {
  DentalService,
  ServiceFaq,
  ServiceMedia,
  ServiceProcedureStep,
  TreatmentMethod,
} from '../types';

type ServiceDto = {
  id: string;
  category: string;
  name: string;
  slug?: string | null;
  icon?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  detailSummary?: string | null;
  displayOrder?: number;
  isActive: boolean;
  isFeatured?: boolean;
  highlights?: DentalService['highlights'];
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

export function formatServicePrice(value: string | number) {
  return `${new Intl.NumberFormat('vi-VN').format(Number(value ?? 0))} đ`;
}

export function unwrapData<T>(res: any): T {
  let current = res?.data !== undefined ? res.data : res;
  while (
    current &&
    typeof current === 'object' &&
    !Array.isArray(current) &&
    'data' in current &&
    current.data !== undefined
  ) {
    current = current.data;
  }
  return current as T;
}

export function mapService(item: ServiceDto): DentalService {
  const rawMethods =
    item.treatmentMethods ??
    (item as unknown as { treatment_methods?: TreatmentMethod[] })
      .treatment_methods ??
    [];
  const treatmentMethods = (Array.isArray(rawMethods) ? rawMethods : []).map(method => ({
    ...method,
    bookingCount: method.bookingCount ?? method._count?.appointments ?? 0,
    media: Array.isArray(method.media) ? method.media : [],
    procedureSteps: Array.isArray(method.procedureSteps) ? method.procedureSteps : [],
    faqs: Array.isArray(method.faqs) ? method.faqs : [],
  }));

  const aggregatedMedia =
    Array.isArray(item.media) && item.media.length > 0
      ? item.media
      : treatmentMethods.flatMap(m => m.media ?? []);

  const aggregatedSteps =
    Array.isArray(item.procedureSteps) && item.procedureSteps.length > 0
      ? item.procedureSteps
      : treatmentMethods.flatMap(m => m.procedureSteps ?? []);

  const aggregatedFaqs =
    Array.isArray(item.faqs) && item.faqs.length > 0
      ? item.faqs
      : treatmentMethods.flatMap(m => m.faqs ?? []);

  const image =
    treatmentMethods.find(m => m.imageUrl)?.imageUrl ||
    aggregatedMedia?.[0]?.url ||
    '';

  const description =
    item.description ||
    item.shortDescription ||
    'Dịch vụ nha khoa chuyên nghiệp, được cá nhân hóa theo tình trạng răng miệng của bạn.';

  const prices = treatmentMethods
    .map(m => Number(m.basePrice ?? 0))
    .filter(p => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

  const durations = treatmentMethods
    .map(m => Number(m.durationMinutes ?? 0))
    .filter(d => d > 0);
  const minDuration = durations.length > 0 ? Math.min(...durations) : 30;

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
    price: minPrice > 0 ? `Từ ${formatServicePrice(minPrice)}` : 'Liên hệ',
    priceValue: minPrice,
    durationMinutes: minDuration,
    displayOrder: item.displayOrder,
    image,
    imageAlt: aggregatedMedia?.[0]?.alt || item.name,
    badge: item.isFeatured ? 'Nổi bật' : undefined,
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

export async function getPatientServices(): Promise<DentalService[]> {
  const response = await api.get('/services', {
    params: { isActive: true, limit: 100 },
  });

  const raw = unwrapData<any>(response);
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.items)
        ? raw.items
        : [];

  return list.map(mapService);
}

export async function getPatientServiceDetail(serviceId: string): Promise<DentalService> {
  const response = await api.get(`/services/${serviceId}`);
  const data = unwrapData<ServiceDto>(response);
  return mapService(data);
}
