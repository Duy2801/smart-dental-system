"use client";

import { Lightning, Receipt, Ticket, WarningCircle } from "@phosphor-icons/react";
import { AdminStatCard } from "@/src/components/admin/common";
import { calculatePromotionAnalytics } from "../promotion-utils";
import type { Promotion } from "../types";

export function PromotionAnalyticsCards({
  promotions,
}: {
  promotions: Promotion[];
}) {
  const { totalCount, activeCount, totalRedemptions, expiringSoonCount } =
    calculatePromotionAnalytics(promotions);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <AdminStatCard
        label="Tổng số chiến dịch"
        value={totalCount}
        hint="Mã khuyến mãi đã tạo"
        icon={<Ticket size={22} weight="duotone" />}
        tone="brand"
      />
      <AdminStatCard
        label="Đang diễn ra"
        value={activeCount}
        hint="Đang kích hoạt cho bệnh nhân"
        icon={<Lightning size={22} weight="duotone" />}
        tone="emerald"
      />
      <AdminStatCard
        label="Tổng lượt áp dụng"
        value={totalRedemptions.toLocaleString("vi-VN")}
        hint="Lượt dùng thành công"
        icon={<Receipt size={22} weight="duotone" />}
        tone="indigo"
      />
      <AdminStatCard
        label="Cần lưu ý / Sắp hết"
        value={expiringSoonCount}
        hint="Còn < 7 ngày hoặc gần hết lượt"
        icon={<WarningCircle size={22} weight="duotone" />}
        tone="amber"
      />
    </div>
  );
}
