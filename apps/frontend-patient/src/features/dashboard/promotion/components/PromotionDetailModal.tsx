"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardIcon } from "@/features/dashboard/common/DashboardIcon";
import { T } from "@/features/dashboard/common/typography";
import { buildRoute } from "@/features/dashboard/common/routes";
import { toast } from "@/features/dashboard/common/toast";
import { AuthRequireModal } from "@/features/dashboard/common/AuthRequireModal";
import { useAppSelector } from "@/providers";
import { formatCurrency, formatDate } from "@/utils/helpers";
import type { PromotionDto, ServiceOption } from "../types";

type PromotionDetailModalProps = {
  promotion: PromotionDto | null;
  services: ServiceOption[];
  onClose: () => void;
};

export function PromotionDetailModal({
  promotion,
  services,
  onClose,
}: PromotionDetailModalProps) {
  const router = useRouter();
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const isAuthenticated =
    useAppSelector((state) => state.login.isAuthenticated) ||
    Boolean(
      typeof window !== "undefined" &&
        (localStorage.getItem("access_token") || localStorage.getItem("patient_auth")),
    );

  // Lock body & html scroll completely when modal is active
  useEffect(() => {
    if (promotion) {
      const originalBodyStyle = document.body.style.cssText;
      const originalHtmlStyle = document.documentElement.style.cssText;

      document.body.style.setProperty("overflow", "hidden", "important");
      document.documentElement.style.setProperty("overflow", "hidden", "important");

      return () => {
        document.body.style.cssText = originalBodyStyle;
        document.documentElement.style.cssText = originalHtmlStyle;
      };
    }
  }, [promotion]);

  // Filter applicable services by exact relational mapping or slug
  const applicableServices = useMemo(() => {
    if (!promotion) return [];

    // 1. Direct DB relational treatment method mapping
    if (promotion.applicable_treatment_method) {
      const tm = promotion.applicable_treatment_method;
      return [
        {
          id: tm.id,
          serviceId: tm.serviceId,
          serviceSlug: tm.serviceSlug ?? null,
          name: tm.name,
          slug: tm.slug ?? null,
          category: tm.category || "DỊCH VỤ NHA KHOA",
          basePrice: tm.basePrice,
          description: tm.description ?? null,
          shortDescription: tm.description ?? null,
          imageUrl: tm.imageUrl ?? null,
        },
      ];
    }

    if (services && services.length > 0 && promotion.applicable_treatment_method_id) {
      const directMatch = services.find((s) => s.id === promotion.applicable_treatment_method_id);
      if (directMatch) return [directMatch];
    }

    if (!services || services.length === 0) return [];

    if (promotion.applicable_service_slug && promotion.applicable_service_slug.toLowerCase() !== "all") {
      const targetSlug = promotion.applicable_service_slug.toLowerCase();
      const filteredBySlug = services.filter(
        (s) =>
          s.slug?.toLowerCase() === targetSlug ||
          s.serviceSlug?.toLowerCase() === targetSlug ||
          s.category.toLowerCase() === targetSlug ||
          s.id.toLowerCase() === targetSlug ||
          s.serviceId?.toLowerCase() === targetSlug
      );
      if (filteredBySlug.length > 0) {
        return filteredBySlug;
      }
    }

    return services;
  }, [promotion, services]);

  // Pre-select first applicable service
  useEffect(() => {
    if (applicableServices.length > 0) {
      setSelectedServiceId(applicableServices[0].id);
    }
  }, [applicableServices]);

  if (!promotion) return null;

  const isPercentage = promotion.discount_type === "PERCENTAGE";
  const discountLabel = isPercentage
    ? `Giảm ${promotion.discount_value}%`
    : `Giảm ${formatCurrency(promotion.discount_value)}`;

  const selectedService = applicableServices.find((s) => s.id === selectedServiceId) || applicableServices[0];

  // Calculate discount for selected service
  let calculatedDiscount = 0;
  let finalPrice = 0;

  if (selectedService) {
    const basePrice = selectedService.basePrice;
    if (isPercentage) {
      calculatedDiscount = Math.round((basePrice * promotion.discount_value) / 100);
    } else {
      calculatedDiscount = Math.min(basePrice, promotion.discount_value);
    }
    finalPrice = Math.max(0, basePrice - calculatedDiscount);
  }

  const handleCopyCode = () => {
    void navigator.clipboard.writeText(promotion.code);
    setCopied(true);
    toast.success("Đã sao chép mã ưu đãi!", `Mã ${promotion.code} đã lưu vào bộ nhớ tạm.`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBookNow = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    const targetUrl = buildRoute.appointmentBooking(selectedServiceId);
    onClose();
    router.push(targetUrl);
  };

  const startDateFormatted = formatDate(promotion.start_date);
  const endDateFormatted = formatDate(promotion.end_date);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200/80 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="relative flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-blue-950 via-[#0058bc] to-blue-700 px-6 py-4 text-white shrink-0">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/15 backdrop-blur">
              <DashboardIcon name="sparkles" className="h-5 w-5 text-yellow-300" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-200">
                Chi tiết chương trình ưu đãi
              </p>
              <h2 className="text-lg sm:text-xl font-black text-white leading-tight">{promotion.name}</h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <DashboardIcon name="close" className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body Content (Spacious 2-Column Grid) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Left Column: Image, Info & Conditions (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Promotion Banner Image */}
              {promotion.image_url && (
                <div className="relative w-full overflow-hidden rounded-2xl border border-slate-100 shadow-sm bg-slate-50">
                  <img
                    src={promotion.image_url}
                    alt={promotion.name}
                    className="h-64 sm:h-72 w-full object-cover"
                  />
                </div>
              )}

              {/* Main Discount & Validity Info */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="inline-block rounded-full bg-[#0058bc] px-4 py-1.5 text-xs font-black uppercase text-white shadow-xs">
                  {discountLabel}
                </span>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 rounded-full px-3 py-1">
                  Hiệu lực: <strong className="text-slate-800">{startDateFormatted} – {endDateFormatted}</strong>
                </span>
              </div>

              {/* Description Section */}
              <div className="space-y-2">
                <h3 className={`${T.sectionTitle} text-slate-900`}>Nội dung ưu đãi</h3>
                <p className={`${T.body} text-slate-600 leading-relaxed text-sm`}>
                  {promotion.description}
                </p>
              </div>

              {/* Conditions Grid */}
              <div className="grid gap-3 sm:grid-cols-2 pt-2">
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                  <p className={`${T.fieldLabel} text-slate-400`}>Đơn hàng tối thiểu</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {promotion.min_order_amount && promotion.min_order_amount > 0
                      ? formatCurrency(promotion.min_order_amount)
                      : "Không giới hạn"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                  <p className={`${T.fieldLabel} text-slate-400`}>Lượt sử dụng còn lại</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {promotion.max_uses > 0
                      ? `${promotion.max_uses - promotion.used_count} / ${promotion.max_uses} lượt`
                      : "Không giới hạn số lượt"}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Code Box, Service Selection & Price Breakdown (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Voucher Code Box */}
              <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/80 to-cyan-50/40 p-5 shadow-xs">
                <p className="text-xs font-bold uppercase tracking-wider text-[#0058bc] mb-2">Mã ưu đãi của bạn</p>
                <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-white p-3 shadow-xs">
                  <span className="text-lg sm:text-xl font-black text-[#0058bc] tracking-wide">{promotion.code}</span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="rounded-xl bg-[#0058bc] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#004698] shadow-xs"
                  >
                    {copied ? "Đã sao chép" : "Sao chép mã"}
                  </button>
                </div>
              </div>

              {/* Service Application & Calculation Breakdown */}
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className={`${T.cardTitle} text-slate-900 text-sm`}>
                    Chọn dịch vụ muốn áp dụng
                  </h3>
                </div>

                {applicableServices.length > 0 ? (
                  <div className="space-y-4">
                    <select
                      value={selectedServiceId}
                      onChange={(e) => setSelectedServiceId(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#0058bc] focus:bg-white focus:ring-4 focus:ring-blue-100"
                    >
                      {applicableServices.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name} — {formatCurrency(service.basePrice)}
                        </option>
                      ))}
                    </select>

                    {/* Calculation Breakdown Card */}
                    {selectedService && (
                      <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 space-y-2.5 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Giá gốc ({selectedService.name}):</span>
                          <span className="font-semibold text-slate-800">
                            {formatCurrency(selectedService.basePrice)}
                          </span>
                        </div>

                        <div className="flex justify-between text-emerald-600 font-bold">
                          <span>Ưu đãi áp dụng ({promotion.code}):</span>
                          <span>
                            -{formatCurrency(calculatedDiscount)}
                          </span>
                        </div>

                        <div className="flex justify-between border-t border-blue-200/60 pt-2.5 text-sm font-black text-[#0058bc]">
                          <span>Chi phí thanh toán dự kiến:</span>
                          <span className="text-base text-[#0058bc]">
                            {formatCurrency(finalPrice)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Đang tải danh sách dịch vụ...</p>
                )}

                <button
                  type="button"
                  onClick={handleBookNow}
                  className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0058bc] py-3.5 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-[#004698] hover:shadow-xl"
                >
                  <DashboardIcon name="calendar" className="h-4 w-4" />
                  Đặt dịch vụ ngay với mã ưu đãi
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Login Requirement Modal */}
      <AuthRequireModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        returnUrl={buildRoute.appointmentBooking(selectedServiceId)}
      />
    </div>
  );
}
