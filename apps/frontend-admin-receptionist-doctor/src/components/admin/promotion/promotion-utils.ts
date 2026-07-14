import type {
  DiscountType,
  Promotion,
  PromotionStatusFilter,
  PromotionStatusInfo,
} from "./types";

export function getPromotionStatus(promotion: Promotion): PromotionStatusInfo {
  const now = new Date().getTime();
  const endDate = new Date(promotion.end_date).getTime();

  if (!promotion.is_active) {
    return {
      id: "PAUSED",
      label: "Tam ngung",
      color: "border-gray-200 bg-gray-50 text-gray-600",
    };
  }

  if (promotion.used_count >= promotion.max_uses) {
    return {
      id: "EXPIRED",
      label: "Het luot",
      color: "border-orange-200 bg-orange-50 text-orange-700",
    };
  }

  if (now > endDate) {
    return {
      id: "EXPIRED",
      label: "Da ket thuc",
      color: "border-red-200 bg-red-50 text-red-700",
    };
  }

  return {
    id: "ACTIVE",
    label: "Dang dien ra",
    color: "border-green-200 bg-green-50 text-green-700",
  };
}

export function formatPromotionValue(type: DiscountType, value: number) {
  if (type === "PERCENTAGE") {
    return `${value}%`;
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

export function filterPromotions(
  promotions: Promotion[],
  search: string,
  statusFilter: PromotionStatusFilter,
) {
  return promotions.filter((promotion) => {
    const status = getPromotionStatus(promotion);
    const matchStatus = statusFilter === "ALL" || status.id === statusFilter;
    const query = search.toLowerCase();
    const matchSearch =
      !query ||
      promotion.code.toLowerCase().includes(query) ||
      promotion.name.toLowerCase().includes(query);

    return matchStatus && matchSearch;
  });
}

export function getPromotionUsageProgress(promotion: Promotion) {
  return Math.min(
    100,
    Math.round((promotion.used_count / promotion.max_uses) * 100),
  );
}
