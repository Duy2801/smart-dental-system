"use client";

import { Eye, EyeSlash, ImagesSquare } from "@phosphor-icons/react";
import { AdminStatCard } from "@/src/components/admin/common";

type BannerSummaryCardsProps = {
  activeBanners: number;
  inactiveBanners: number;
  totalBanners: number;
};

export function MarketingSummaryCards({
  activeBanners,
  inactiveBanners,
  totalBanners,
}: BannerSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <AdminStatCard
        label="Tổng số banner"
        value={totalBanners}
        suffix="banner"
        icon={<ImagesSquare size={22} weight="duotone" />}
        tone="brand"
      />
      <AdminStatCard
        label="Đang hiển thị"
        value={activeBanners}
        suffix="banner"
        hint="Trang chủ chỉ hiển thị tối đa 1 banner"
        icon={<Eye size={22} weight="duotone" />}
        tone="emerald"
      />
      <AdminStatCard
        label="Đã tạm ẩn"
        value={inactiveBanners}
        suffix="banner"
        icon={<EyeSlash size={22} weight="duotone" />}
        tone="amber"
      />
    </div>
  );
}
