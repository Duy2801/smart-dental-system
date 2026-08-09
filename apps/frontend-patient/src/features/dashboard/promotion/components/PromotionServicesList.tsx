"use client";

import Link from "next/link";
import { DashboardIcon } from "@/features/dashboard/common/DashboardIcon";
import { buildRoute } from "@/features/dashboard/common/routes";
import { T } from "@/features/dashboard/common/typography";
import { formatCurrency } from "@/utils/helpers";
import type { PromotionDto, ServiceOption } from "../types";
import { calculateDiscount } from "../utils/promotionUtils";

interface PromotionServicesListProps {
  promotion: PromotionDto;
  applicableServices: ServiceOption[];
  selectedServiceId: string;
  onSelectService: (serviceId: string) => void;
  onBookNow: () => void;
}

export function PromotionServicesList({
  promotion,
  applicableServices,
  selectedServiceId,
  onSelectService,
  onBookNow,
}: PromotionServicesListProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 space-y-5">
      <div>
        <p className={`${T.overline} text-[#0058bc]`}>Danh mục dịch vụ</p>
        <h2 className="mt-1 text-2xl font-extrabold text-slate-950">
          Dịch vụ nha khoa được áp dụng
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Bấm chọn dịch vụ bên dưới để xem dự toán mức giá sau khi áp mã giảm.
        </p>
      </div>

      <div className="space-y-4">
        {applicableServices.map((service) => {
          const { discountAmount: dAmt, finalPrice: fPrice } = calculateDiscount(
            promotion,
            service.basePrice
          );
          const isSelected = selectedServiceId === service.id;

          return (
            <div
              key={service.id}
              onClick={() => onSelectService(service.id)}
              className={`group relative overflow-hidden rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? "border-[#0058bc] bg-blue-50/20 shadow-md ring-2 ring-[#0058bc]/20"
                  : "border-slate-200/90 bg-white hover:border-blue-300 hover:shadow-md"
              }`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] md:grid-cols-[210px_1fr]">
                {/* Left Media Image Frame */}
                <div className="relative min-h-[150px] sm:min-h-[170px] bg-slate-100 overflow-hidden">
                  {service.imageUrl ? (
                    <img
                      src={service.imageUrl}
                      alt={service.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4 text-center">
                      <DashboardIcon name="sparkles" className="h-9 w-9 text-[#0058bc]/40" />
                      <span className="mt-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {service.category || "NHA KHOA TỔNG QUÁT"}
                      </span>
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute top-3 left-3 rounded-full bg-[#0058bc] px-2.5 py-1 text-[10px] font-extrabold text-white shadow-sm flex items-center gap-1">
                      <span>✓</span> Đã chọn
                    </div>
                  )}
                </div>

                {/* Right Service Content Body */}
                <div className="p-4 sm:p-5 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {service.category || "NHA KHOA TỔNG QUÁT"}
                    </span>
                    <h3 className="mt-0.5 text-lg font-extrabold text-slate-900 group-hover:text-[#0058bc] transition-colors">
                      {service.name}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {service.shortDescription || service.description || "Làm sạch mô tủy viêm, sát khuẩn ống tủy và trám bít để bảo tồn răng thật tối đa."}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    {/* Price Display Badge */}
                    <div className="flex items-center gap-2">
                      <span className="rounded-xl bg-blue-50 px-3 py-1 text-sm font-black text-[#0058bc]">
                        {formatCurrency(fPrice)}
                      </span>
                      {dAmt > 0 && (
                        <span className="text-xs text-slate-400 line-through">
                          {formatCurrency(service.basePrice)}
                        </span>
                      )}
                      {service.badge && (
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                          {service.badge}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Link
                        href={buildRoute.serviceDetail(service.serviceSlug || service.slug || service.serviceId || service.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        Chi tiết
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectService(service.id);
                          onBookNow();
                        }}
                        className="inline-flex items-center rounded-xl bg-[#0058bc] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#004698]"
                      >
                        Đặt lịch
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
