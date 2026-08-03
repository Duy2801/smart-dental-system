"use client";

import { useState } from "react";
import { DashboardIcon } from "@/features/dashboard/common/DashboardIcon";
import { T } from "@/features/dashboard/common/typography";
import type { PromotionDto } from "../types";

type PromotionCardProps = {
  promotion: PromotionDto;
  onViewDetail: (promotion: PromotionDto) => void;
  onApplyPromotion: (promotion: PromotionDto) => void;
};

export function PromotionCard({
  promotion,
  onViewDetail,
  onApplyPromotion,
}: PromotionCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    void navigator.clipboard.writeText(promotion.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPercentage = promotion.discount_type === "PERCENTAGE";
  const discountLabel = isPercentage
    ? `Giảm ${promotion.discount_value}%`
    : `Giảm ${new Intl.NumberFormat("vi-VN").format(promotion.discount_value)}đ`;

  const endDateFormatted = new Date(promotion.end_date).toLocaleDateString(
    "vi-VN",
    { day: "2-digit", month: "2-digit", year: "numeric" },
  );

  const usagePercent =
    promotion.max_uses > 0
      ? Math.min(100, Math.round((promotion.used_count / promotion.max_uses) * 100))
      : 0;

  const isExpired = new Date(promotion.end_date) < new Date();
  const isOutOfUses = promotion.max_uses > 0 && promotion.used_count >= promotion.max_uses;
  const isAvailable = promotion.is_active && !isExpired && !isOutOfUses;

  const defaultCardImage =
    promotion.image_url ||
    "/pomotion/banner-nieng-rang.png";

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg">
      <div className="space-y-3">
        {/* Square Image Container - Full Card Header Fit (1:1 Aspect Ratio) */}
        <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-slate-100 bg-slate-100">
          <img
            src={defaultCardImage}
            alt={promotion.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </div>

        {/* Card Content */}
        <div className="space-y-1.5 px-0.5">
          <h3 className={`${T.cardTitle} text-slate-900 line-clamp-1 group-hover:text-[#0058bc] transition-colors text-sm font-bold`}>
            {promotion.name}
          </h3>

          <p className={`${T.body} text-slate-500 line-clamp-2 text-[11px] leading-relaxed`}>
            {promotion.description}
          </p>

          {/* Usage Progress Bar */}
          {promotion.max_uses > 0 && (
            <div className="pt-1 space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                <span>Lượt đã dùng</span>
                <span className="text-slate-700">
                  {promotion.used_count}/{promotion.max_uses}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full transition-all duration-500 ${usagePercent >= 90 ? "bg-amber-500" : "bg-[#0058bc]"
                    }`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Expiry Date */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-1 text-slate-500">
              <DashboardIcon name="calendar" className="h-3 w-3 text-slate-400" />
              <span>HSD: <strong>{endDateFormatted}</strong></span>
            </div>
            {promotion.min_order_amount && promotion.min_order_amount > 0 ? (
              <span className="text-[10px] font-bold text-slate-500">
                Đơn từ {new Intl.NumberFormat("vi-VN").format(promotion.min_order_amount)}đ
              </span>
            ) : (
              <span className="text-[10px] font-bold text-emerald-600">Mọi đơn</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="flex justify-center pt-3">
        <button
          type="button"
          onClick={() => onViewDetail(promotion)}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 py-2 text-[11px] font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-[#0058bc]"
        >
          <DashboardIcon name="info" className="h-3.5 w-3.5" />
          Chi tiết
        </button>
      </div>
    </div>
  );
}

export function PromotionCardSkeleton() {
  return (
    <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-sm animate-pulse">
      <div className="space-y-3">
        {/* Square Image Container Skeleton */}
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-100" />

        {/* Card Content Skeleton */}
        <div className="space-y-2 px-0.5">
          <div className="h-4 w-3/4 rounded-md bg-slate-100" />
          <div className="space-y-1">
            <div className="h-3 w-full rounded bg-slate-100" />
            <div className="h-3 w-4/5 rounded bg-slate-100" />
          </div>

          {/* Usage Progress Bar Skeleton */}
          <div className="pt-2 space-y-1">
            <div className="flex justify-between">
              <div className="h-2.5 w-16 rounded bg-slate-100" />
              <div className="h-2.5 w-10 rounded bg-slate-100" />
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100" />
          </div>

          {/* Expiry Date Skeleton */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
            <div className="h-3 w-24 rounded bg-slate-100" />
            <div className="h-3 w-14 rounded bg-slate-100" />
          </div>
        </div>
      </div>

      {/* Button Skeleton */}
      <div className="pt-3">
        <div className="h-8 w-full rounded-lg bg-slate-100" />
      </div>
    </div>
  );
}
