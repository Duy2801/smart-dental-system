import type { PromotionDto } from "../types";
import { formatDate } from "@/utils/helpers";

export { formatDate };

export function calculateDiscount(
  promo: PromotionDto,
  basePrice: number
): { discountAmount: number; finalPrice: number } {
  if (!basePrice || basePrice <= 0) {
    return { discountAmount: 0, finalPrice: 0 };
  }

  let discount = 0;
  if (promo.discount_type === "PERCENTAGE") {
    discount = (basePrice * promo.discount_value) / 100;
    if (promo.max_discount_amount && promo.max_discount_amount > 0) {
      discount = Math.min(discount, promo.max_discount_amount);
    }
  } else {
    discount = promo.discount_value;
  }

  discount = Math.min(discount, basePrice);
  const finalPrice = Math.max(0, basePrice - discount);
  return { discountAmount: discount, finalPrice };
}
