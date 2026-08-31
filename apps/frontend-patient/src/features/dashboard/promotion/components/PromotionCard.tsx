"use client";

import { useState } from "react";
import { DashboardIcon } from "@/features/dashboard/common/DashboardIcon";
import { T } from "@/features/dashboard/common/typography";
import { formatCurrency, formatDate } from "@/utils/helpers";
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
    : `Giảm ${formatCurrency(promotion.discount_value)}`;

  const endDateFormatted = formatDate(promotion.end_date);

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
    <div className="group grid h-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition duration-300 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md sm:grid-cols-[180px_1fr]">
      {/* Left Column: Image Container (Square / 4:3 on mobile) */}
      <div className="relative aspect-[4/3] sm:aspect-square w-full sm:w-[180px] overflow-hidden bg-slate-100 shrink-0">
        <img
          src={defaultCardImage}
          alt={promotion.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        {/* Discount Badge on Image */}
        <span className="absolute top-2.5 left-2.5 rounded-lg bg-[#0058bc] px-2.5 py-1 text-[11px] font-black uppercase text-white shadow-xs">
          {discountLabel}
        </span>
      </div>

      {/* Right Column: Card Details */}
      <div className="flex min-w-0 flex-col justify-between p-4 sm:p-4.5">
        <div className="space-y-1.5">
          {/* Header row: Code badge & Expiry */}
          <div className="flex items-center justify-between text-[11px] gap-2">
            <span className="rounded-md bg-blue-50 border border-blue-100 px-2 py-0.5 font-mono font-bold text-[#0058bc]">
              MÃ: {promotion.code}
            </span>
            <span className="text-slate-500 font-semibold flex items-center gap-1">
              <DashboardIcon name="calendar" className="h-3 w-3 text-slate-400" />
              HSD: {endDateFormatted}
            </span>
          </div>

          {/* Title */}
          <h3 className="line-clamp-1 text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#0058bc] transition-colors">
            {promotion.name}
          </h3>

          {/* Description */}
          <p className="line-clamp-2 text-xs text-slate-500 leading-relaxed">
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
                  className={`h-full transition-all duration-500 ${
                    usagePercent >= 90 ? "bg-amber-500" : "bg-[#0058bc]"
                  }`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions Row */}
        <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <span className="text-[11px] font-bold text-slate-500 truncate">
            {promotion.min_order_amount && promotion.min_order_amount > 0
              ? `Đơn từ ${formatCurrency(promotion.min_order_amount)}`
              : "Áp dụng mọi đơn"}
          </span>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onViewDetail(promotion)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-[#0058bc]"
            >
              Chi tiết
            </button>
            <button
              type="button"
              onClick={handleCopyCode}
              disabled={!isAvailable}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer ${
                copied
                  ? "bg-emerald-600 text-white"
                  : isAvailable
                  ? "bg-[#0058bc] text-white hover:bg-[#004899]"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              {copied ? "Đã chép mã!" : "Sao chép mã"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PromotionCardSkeleton() {
  return (
    <div className="grid h-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs animate-pulse sm:grid-cols-[180px_1fr]">
      <div className="relative aspect-[4/3] sm:aspect-square w-full sm:w-[180px] bg-slate-100 shrink-0" />
      <div className="flex flex-col justify-between p-4 space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-4 w-20 rounded bg-slate-100" />
            <div className="h-4 w-24 rounded bg-slate-100" />
          </div>
          <div className="h-4 w-3/4 rounded bg-slate-100" />
          <div className="h-3 w-full rounded bg-slate-100" />
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="h-3 w-20 rounded bg-slate-100" />
          <div className="flex gap-2">
            <div className="h-7 w-16 rounded-lg bg-slate-100" />
            <div className="h-7 w-24 rounded-lg bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
