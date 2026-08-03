export type ServiceCategory = "all" | string;

export type ServiceMedia = {
  id: string;
  url: string;
  alt?: string | null;
  type: string;
  sortOrder: number;
};

export type ServiceProcedureStep = {
  id: string;
  stepOrder: number;
  title: string;
  description: string;
  durationMinutes?: number | null;
};

export type ServiceFaq = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
};

export type TreatmentMethod = {
  id: string;
  serviceId: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  basePrice: number | string;
  durationMinutes?: number | null;
  displayOrder?: number;
  isActive?: boolean;
  bookingCount?: number;
  _count?: {
    appointments?: number;
  };
  media?: ServiceMedia[];
  procedureSteps?: ServiceProcedureStep[];
  faqs?: ServiceFaq[];
};

export type DentalService = {
  id: string;
  title: string;
  name: string;
  slug?: string | null;
  icon?: string | null;
  description: string;
  shortDescription: string;
  detailSummary?: string | null;
  category: string;
  price: string;
  priceValue: number;
  durationMinutes: number;
  displayOrder?: number;
  image: string;
  imageAlt: string;
  badge?: string;
  highlights?: ServiceHighlight[] | null;
  suitableFor?: string[] | null;
  includedItems?: string[] | null;
  preparationNotes?: string[] | null;
  aftercareNotes?: string[] | null;
  importantNotes?: string[] | null;
  pricingNote?: string | null;
  treatmentMethods?: TreatmentMethod[];
  media: ServiceMedia[];
  procedureSteps: ServiceProcedureStep[];
  faqs: ServiceFaq[];
};

export type ServiceHighlight = {
  title: string;
  description: string;
  icon: "shield" | "sparkles" | "checkup" | "clock" | string;
};

export type ServiceFilter = {
  id: ServiceCategory;
  label: string;
};
