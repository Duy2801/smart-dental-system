"use client";

import Link from "next/link";
import { DashboardIcon } from "@/features/dashboard/common/DashboardIcon";
import { ROUTES } from "@/features/dashboard/common/routes";
import { T } from "@/features/dashboard/common/typography";
import { formatCurrency } from "@/utils/helpers";
import type { PromotionDto, ServiceOption } from "../types";
import { calculateDiscount } from "../utils/promotionUtils";

interface PromotionCalculatorSidebarProps {
  promotion: PromotionDto;
  applicableServices: ServiceOption[];
  selectedService: ServiceOption | null;
  onSelectService: (serviceId: string) => void;
  onBookNow: () => void;
}

export function PromotionCalculatorSidebar({
  promotion,
  applicableServices,
  selectedService,
  onSelectService,
  onBookNow,
}: PromotionCalculatorSidebarProps) {
  const { discountAmount, finalPrice } = selectedService
    ? calculateDiscount(promotion, selectedService.basePrice)
    : { discountAmount: 0, finalPrice: 0 };

  return (
    <aside className="space-y-5 lg:sticky lg:top-24">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0058bc] via-[#0863c5] to-[#02408b] p-5 text-white shadow-inner">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-blue-100 uppercase backdrop-blur-xs">
            Công cụ tính giá
          </span>
          <h2 className="mt-2 text-lg sm:text-xl font-extrabold text-white">Dự toán ưu đãi</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-blue-100/90">
            Mức giảm được tính toán tự động dựa trên dịch vụ bạn chọn.
          </p>
        </div>

        <div className="p-5 space-y-4">
          {/* Service selection dropdown */}
          {applicableServices.length > 0 && (
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                Dịch vụ áp dụng:
              </label>
              <select
                value={selectedService?.id || ""}
                onChange={(e) => onSelectService(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#0058bc]"
              >
                {applicableServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({formatCurrency(s.basePrice)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Price Calculation Card */}
          {selectedService && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Giá niêm yết:</span>
                <span className="font-semibold text-slate-800">
                  {formatCurrency(selectedService.basePrice)}
                </span>
              </div>

              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Mức giảm ({promotion.code}):</span>
                <span>
                  -{formatCurrency(discountAmount)}
                </span>
              </div>

              <div className="flex justify-between border-t border-blue-200/60 pt-2 text-sm font-black text-[#0058bc]">
                <span>Giá sau ưu đãi:</span>
                <span className="text-base text-[#0058bc]">
                  {formatCurrency(finalPrice)}
                </span>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onBookNow}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0058bc] px-5 text-xs font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-[#004ca3]"
          >
            <DashboardIcon name="calendar" className="h-4 w-4" />
            Đặt dịch vụ ngay
          </button>

          <Link
            href={ROUTES.promotions}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 px-5 text-xs font-bold text-slate-600 transition hover:border-blue-200 hover:text-[#0058bc]"
          >
            Xem ưu đãi khác
          </Link>
        </div>
      </section>

      {/* Guarantee & Support Card */}
      <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 space-y-2">
        <h2 className="flex items-center gap-2 text-xs font-bold text-slate-900">
          <DashboardIcon name="shield" className="h-4 w-4 text-emerald-600" />
          Cam kết từ Smart Dental
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Áp dụng chính xác giá ưu đãi đã thông báo, không phát sinh chi phí ẩn ngoài danh mục khám.
        </p>
      </section>
    </aside>
  );
}
