export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

export type PromotionDto = {
  id: string;
  code: string;
  name: string;
  description: string;
  image_url?: string | null;
  applicable_service_slug?: string | null;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount?: number;
  max_uses: number;
  used_count: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
};

export type ServiceOption = {
  id: string;
  name: string;
  slug?: string | null;
  category: string;
  basePrice: number;
  imageUrl?: string | null;
};
