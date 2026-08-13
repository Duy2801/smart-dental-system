"use client";

import { DashboardIcon } from "@/features/dashboard/common/DashboardIcon";
import type { PromotionDto } from "../types";
import { formatDate } from "../utils/promotionUtils";

interface PromotionHeroSectionProps {
  promotion: PromotionDto;
  discountLabel: string;
  onBookNow: () => void;
}

export function PromotionHeroSection({
  promotion,
  discountLabel,
  onBookNow,
}: PromotionHeroSectionProps) {
  const startDateFormatted = formatDate(promotion.start_date);
  const endDateFormatted = formatDate(promotion.end_date);

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-7 lg:p-8">
      <div className="grid items-center gap-7 lg:grid-cols-[400px_1fr] xl:grid-cols-[440px_1fr]">
        <div className="group relative flex min-h-[280px] items-center justify-center overflow-hidden rounded-2xl border border-blue-100/80 bg-gradient-to-br from-blue-50/70 via-slate-50 to-indigo-50/40 p-4 shadow-inner sm:min-h-[320px] sm:p-6 lg:min-h-[360px]">
          {promotion.image_url ? (
            <img
              src={promotion.image_url}
              alt={promotion.name}
              className="h-full w-full rounded-xl object-cover shadow-md transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="p-6 text-center">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white text-[#0863c5] shadow-md">
                <DashboardIcon name="sparkles" className="h-8 w-8 text-yellow-500" />
              </span>
              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                Khuyến mãi nha khoa
              </p>
              <p className="mt-1 text-lg font-black text-[#0863c5]">
                {promotion.code}
              </p>
            </div>
          )}
          <div className="absolute left-4 top-4 rounded-full bg-[#0863c5] px-3.5 py-1 text-xs font-black text-white shadow-md">
            {discountLabel}
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#0863c5]">
              Chương trình ưu đãi
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              Hiệu lực: {startDateFormatted} - {endDateFormatted}
            </span>
          </div>

          <div>
            <h1 className="text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
              {promotion.name}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {promotion.description}
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50/50 p-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Mã ưu đãi
              </p>
              <p className="text-xl font-black tracking-wide text-[#0863c5]">
                {promotion.code}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Mã này sẽ có trong danh sách ưu đãi khi bạn đặt lịch.
              </p>
            </div>

            <button
              type="button"
              onClick={onBookNow}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0863c5] px-5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-[#0753a8]"
            >
              <DashboardIcon name="calendar" className="h-4 w-4" />
              Đặt lịch dùng mã
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
