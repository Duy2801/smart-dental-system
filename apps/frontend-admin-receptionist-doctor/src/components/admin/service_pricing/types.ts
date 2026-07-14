export type DentalService = {
  id: string;
  category: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  basePrice: number | string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
  description: string;
  durationMinutes: number;
  basePrice: number;
  isActive: boolean;
};
