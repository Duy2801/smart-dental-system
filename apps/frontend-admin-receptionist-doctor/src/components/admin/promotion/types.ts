export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";
export type PromotionStatusFilter = "ALL" | "ACTIVE" | "EXPIRED" | "PAUSED";
export type PromotionStatusId = Exclude<PromotionStatusFilter, "ALL">;

export type Promotion = {
  id: string;
  code: string;
  name: string;
  description?: string;
  discount_type: DiscountType;
  discount_value: number;
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
