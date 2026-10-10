import Image from "next/image";
import { DashboardIcon } from "@/features/dashboard/common/DashboardIcon";
import { formatCurrency, formatDate } from "@/utils/helpers";
import type { PromotionDto } from "../types";

type PromotionCardProps = {
  promotion: PromotionDto;
  onViewDetail: (promotion: PromotionDto) => void;
  onApplyPromotion?: (promotion: PromotionDto) => void;
};

export function PromotionCard({
  promotion,
  onViewDetail,
}: PromotionCardProps) {
  const endDateFormatted = formatDate(promotion.end_date);

  const defaultCardImage =
    promotion.image_url ||
    "/pomotion/banner-nieng-rang.png";

  return (
    <div className="group grid h-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition duration-300 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md sm:grid-cols-[164px_minmax(0,1fr)]">
      <div className="flex h-44 w-full shrink-0 items-center justify-center bg-slate-50 p-4 sm:h-full sm:min-h-44 sm:w-[164px]">
        <Image
          src={defaultCardImage}
          alt={promotion.name}
          width={128}
          height={128}
          unoptimized
          className="h-32 w-32 shrink-0 rounded-xl object-cover object-center transition duration-500 group-hover:scale-105"
        />
      </div>

      {/* Right Column: Card Details */}
      <div className="flex min-w-0 flex-col justify-between p-4 sm:p-5">
        <div className="space-y-2">
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
        </div>

        {/* Footer Actions Row */}
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100/90 pt-3">
          <span className="text-xs font-bold text-slate-600 truncate">
            {promotion.min_order_amount && promotion.min_order_amount > 0
              ? `Đơn từ ${formatCurrency(promotion.min_order_amount)}`
              : "Áp dụng mọi đơn"}
          </span>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onViewDetail(promotion)}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 transition hover:border-[#0058bc] hover:bg-blue-50 hover:text-[#0058bc] shadow-2xs cursor-pointer"
            >
              Chi tiết
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PromotionCardSkeleton() {
  return (
    <div className="grid h-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs animate-pulse sm:grid-cols-[164px_minmax(0,1fr)]">
      <div className="flex h-44 w-full shrink-0 items-center justify-center bg-slate-50 p-4 sm:h-full sm:min-h-44 sm:w-[164px]">
        <div className="h-32 w-32 rounded-xl bg-slate-100" />
      </div>
      <div className="flex flex-col justify-between p-4 sm:p-5 space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-4 w-20 rounded bg-slate-100" />
            <div className="h-4 w-24 rounded bg-slate-100" />
          </div>
          <div className="h-4 w-3/4 rounded bg-slate-100" />
          <div className="h-3 w-full rounded bg-slate-100" />
        </div>
        <div className="flex items-center justify-between border-t border-slate-100/90 pt-3">
          <div className="h-3 w-20 rounded bg-slate-100" />
          <div className="flex gap-2">
            <div className="h-7 w-16 rounded-xl bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
