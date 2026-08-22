import type {
  DiscountType,
  Promotion,
  PromotionStatusFilter,
  PromotionStatusInfo,
} from "./types";

export function getPromotionStatus(promotion: Promotion): PromotionStatusInfo {
  const now = Date.now();
  const endDate = new Date(promotion.end_date).getTime();

  if (!promotion.is_active) {
    return {
      id: "PAUSED",
      label: "Tạm ngưng",
      color: "bg-amber-50 text-amber-700 border-amber-200",
    };
  }

  if (promotion.used_count >= promotion.max_uses) {
    return {
      id: "EXPIRED",
      label: "Đã hết lượt",
      color: "bg-red-50 text-red-700 border-red-200",
    };
  }

  if (now > endDate) {
    return {
      id: "EXPIRED",
      label: "Đã hết hạn",
      color: "bg-slate-100 text-slate-600 border-slate-200",
    };
  }

  return {
    id: "ACTIVE",
    label: "Đang diễn ra",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
}

export function formatPromotionValue(
  discountType: DiscountType,
  discountValue: number
) {
  if (discountType === "PERCENTAGE") {
    return `Giảm ${discountValue}%`;
  }
  return `Giảm ${discountValue.toLocaleString("vi-VN")} đ`;
}

export function formatVND(amount?: number | null) {
  if (!amount) return "0 đ";
  return `${amount.toLocaleString("vi-VN")} đ`;
}

export function filterPromotions(
  promotions: Promotion[],
  search: string,
  statusFilter: PromotionStatusFilter
) {
  const query = search.trim().toLowerCase();

  return promotions.filter((promotion) => {
    const status = getPromotionStatus(promotion);

    if (statusFilter !== "ALL" && status.id !== statusFilter) {
      return false;
    }

    if (!query) return true;

    return (
      promotion.code.toLowerCase().includes(query) ||
      promotion.name.toLowerCase().includes(query) ||
      (promotion.description && promotion.description.toLowerCase().includes(query))
    );
  });
}

export function getPromotionUsageProgress(promotion: Promotion) {
  if (!promotion.max_uses) return 0;
  return Math.min(
    100,
    Math.round((promotion.used_count / promotion.max_uses) * 100)
  );
}

export function calculatePromotionAnalytics(promotions: Promotion[]) {
  const totalCount = promotions.length;
  let activeCount = 0;
  let totalRedemptions = 0;
  let expiringSoonCount = 0;

  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  promotions.forEach((p) => {
    const status = getPromotionStatus(p);
    totalRedemptions += p.used_count || 0;

    if (status.id === "ACTIVE") {
      activeCount += 1;
    }

    const endDate = new Date(p.end_date).getTime();
    const isExpiringSoon = endDate - now > 0 && endDate - now <= sevenDaysMs;
    const isExhaustedSoon = p.max_uses > 0 && p.used_count / p.max_uses >= 0.85;

    if (isExpiringSoon || isExhaustedSoon) {
      expiringSoonCount += 1;
    }
  });

  return {
    totalCount,
    activeCount,
    totalRedemptions,
    expiringSoonCount,
  };
}
