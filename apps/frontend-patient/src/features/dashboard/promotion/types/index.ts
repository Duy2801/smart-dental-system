export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

export type PromotionDto = {
  id: string;
  code: string;
  name: string;
  description: string;
  image_url?: string | null;
  applicable_service_slug?: string | null;
  applicable_treatment_method_id?: string | null;
  applicable_treatment_method?: {
    id: string;
    name: string;
    slug?: string | null;
    description?: string | null;
    imageUrl?: string | null;
    basePrice: number;
    durationMinutes?: number | null;
    serviceId: string;
    category?: string | null;
    serviceSlug?: string | null;
  } | null;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number | null;
  max_uses: number;
  used_count: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
};

export type ServiceOption = {
  id: string;
  serviceId?: string;
  serviceSlug?: string | null;
  name: string;
  slug?: string | null;
  category: string;
  basePrice: number;
  imageUrl?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  badge?: string | null;
};
