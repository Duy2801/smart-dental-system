export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";
export type PromotionStatusFilter = "ALL" | "ACTIVE" | "EXPIRED" | "PAUSED";
export type PromotionStatusId = Exclude<PromotionStatusFilter, "ALL">;

export type TreatmentMethodOption = {
  id: string;
  name: string;
  category?: string;
  basePrice?: number;
  serviceId?: string;
  imageUrl?: string | null;
};

export type ServiceOption = {
  id: string;
  name: string;
  category: string;
  slug?: string;
  treatmentMethods?: TreatmentMethodOption[];
};

export type Promotion = {
  id: string;
  code: string;
  name: string;
  description?: string;
  image_url?: string | null;
  applicable_service_slug?: string | null;
  applicable_treatment_method_id?: string | null;
  applicable_treatment_method?: TreatmentMethodOption | null;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount?: number;
  max_uses: number;
  used_count: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
};

export type PromotionStatusInfo = {
  id: PromotionStatusId;
  label: string;
  color: string;
};

export type SavePromotionPayload = {
  code: string;
  name: string;
  description?: string;
  image_url?: string;
  applicable_service_slug?: string;
  applicable_treatment_method_id?: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount?: number;
  max_uses: number;
  start_date: string;
  end_date: string;
  is_active?: boolean;
  broadcast_notification?: boolean;
};
