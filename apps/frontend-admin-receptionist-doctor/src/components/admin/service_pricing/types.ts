export type DentalService = {
  id: string;
  category: string;
  name: string;
  slug: string | null;
  shortDescription: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  durationMinutes: number;
  basePrice: number | string;
  isFeatured: boolean;
  displayOrder: number;
  isActive: boolean;
  media: ServiceMedia[];
  procedureSteps: ServiceProcedureStep[];
  faqs: ServiceFaq[];
  createdAt: string;
  updatedAt: string;
};

export type ServiceMedia = {
  id?: string;
  url: string;
  alt: string | null;
  type: string;
  sortOrder: number;
};

export type ServiceProcedureStep = {
  id?: string;
  stepOrder: number;
  title: string;
  description: string;
  durationMinutes: number | null;
};

export type ServiceFaq = {
  id?: string;
  question: string;
  answer: string;
  sortOrder: number;
};

export type ServiceListResponse = {
  data: DentalService[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ServiceFormState = {
  category: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  thumbnailUrl: string;
  durationMinutes: number;
  basePrice: number;
  isFeatured: boolean;
  displayOrder: number;
  isActive: boolean;
  media: Array<{
    url: string;
    alt: string;
    type: string;
    sortOrder: number;
  }>;
  procedureSteps: Array<{
    stepOrder: number;
    title: string;
    description: string;
    durationMinutes: number | "";
  }>;
  faqs: Array<{
    question: string;
    answer: string;
    sortOrder: number;
  }>;
};
