"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardIcon } from "@/features/dashboard/common/DashboardIcon";
import { T } from "@/features/dashboard/common/typography";
import { buildRoute } from "@/features/dashboard/common/routes";
import { toast } from "@/features/dashboard/common/toast";
import { AuthRequireModal } from "@/features/dashboard/common/AuthRequireModal";
import { useAppSelector } from "@/providers";
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

  // Automatically find & pre-select the exact applicable service for this promotion!
  useEffect(() => {
    if (!promotion || services.length === 0) return;

    // 1. Try matching by applicable_service_slug directly
    if (promotion.applicable_service_slug) {
      const exactMatch = services.find(
        (s) =>
          s.slug === promotion.applicable_service_slug ||
          s.category === promotion.applicable_service_slug,
      );
      if (exactMatch) {
        setSelectedServiceId(exactMatch.id);
        return;
      }
    }

    // 2. Keyword match between promotion name/code and service name
    const promoText = (promotion.name + " " + promotion.code + " " + promotion.description).toLowerCase();
    const keywordMatch = services.find((s) => {
      const name = s.name.toLowerCase();
      const cat = s.category.toLowerCase();
      if (promoText.includes("invisalign") || promoText.includes("niềng")) {
        return name.includes("niềng") || cat.includes("nieng");
      }
      if (promoText.includes("veneer") || promoText.includes("dán sứ")) {
        return name.includes("veneer") || cat.includes("veneer") || name.includes("sứ");
      }
      if (promoText.includes("implant")) {
        return name.includes("implant") || cat.includes("implant");
      }
      if (promoText.includes("piezotome") || promoText.includes("nhổ răng")) {
        return name.includes("nhổ") || cat.includes("nho");
      }
      if (promoText.includes("cạo vôi") || promoText.includes("tổng quát") || promoText.includes("tẩy trắng")) {
        return name.includes("cạo") || name.includes("tổng quát") || cat.includes("tong-quat");
      }
      return false;
    });

    if (keywordMatch) {
      setSelectedServiceId(keywordMatch.id);
    } else {
      setSelectedServiceId(services[0].id);
    }
  }, [promotion, services]);

  if (!promotion) return null;

  const isPercentage = promotion.discount_type === "PERCENTAGE";
  const discountLabel = isPercentage
    ? `Giảm ${promotion.discount_value}%`
    : `Giảm ${new Intl.NumberFormat("vi-VN").format(promotion.discount_value)}đ`;

  const selectedService = services.find((s) => s.id === selectedServiceId);

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

  const startDateFormatted = new Date(promotion.start_date).toLocaleDateString(
    "vi-VN",
    { day: "2-digit", month: "2-digit", year: "numeric" },
  );

  const endDateFormatted = new Date(promotion.end_date).toLocaleDateString(
    "vi-VN",
    { day: "2-digit", month: "2-digit", year: "numeric" },
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200/80 animate-in zoom-in-95 duration-200"
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
                Chi tiết ưu đãi chương trình
              </p>
              <h2 className="text-lg font-black text-white leading-tight">{promotion.name}</h2>
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

        {/* Modal Body Content */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6 sm:p-7">
          {/* Promotion Banner Image - FULL UNCROPPED 1:1 DISPLAY */}
          {promotion.image_url && (
            <div className="relative w-full max-w-sm mx-auto aspect-square overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
              <img
                src={promotion.image_url}
                alt={promotion.name}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          {/* Main Discount & Voucher Code Row */}
          <div className="flex flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-block rounded-full bg-[#0058bc] px-3.5 py-1 text-xs font-black uppercase text-white">
                {discountLabel}
              </span>
              <p className="mt-2 text-xs font-medium text-slate-600">
                Thời gian hiệu lực: <strong className="text-slate-800">{startDateFormatted} – {endDateFormatted}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-blue-200 bg-white px-4 py-2.5 shadow-sm">
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mã ưu đãi</p>
                <p className="text-base font-black text-[#0058bc]">{promotion.code}</p>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="ml-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-[#0058bc] transition hover:bg-blue-100"
              >
                {copied ? "Đã chép" : "Copy"}
              </button>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-2">
            <h3 className={`${T.sectionTitle} text-slate-900`}>Mô tả chương trình</h3>
            <p className={`${T.body} text-slate-600 leading-relaxed`}>
              {promotion.description}
            </p>
          </div>

          {/* Conditions Grid */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
              <p className={`${T.fieldLabel} text-slate-400`}>Đơn hàng tối thiểu</p>
              <p className="mt-1 text-sm font-bold text-slate-800">
                {promotion.min_order_amount && promotion.min_order_amount > 0
                  ? `${new Intl.NumberFormat("vi-VN").format(promotion.min_order_amount)}đ`
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

          {/* Apply to Service Interactive Section */}
          <div className="space-y-4 rounded-2xl border border-blue-200/80 bg-gradient-to-br from-slate-50 to-blue-50/30 p-5">
            <div className="flex items-center justify-between">
              <h3 className={`${T.cardTitle} text-slate-900`}>
                Dịch vụ áp dụng khuyến mãi
              </h3>
              <span className="text-xs font-bold text-[#0058bc]">
                Đã tự động chọn dịch vụ phù hợp
              </span>
            </div>

            {/* Service Select Dropdown */}
            {services.length > 0 ? (
              <div className="space-y-3">
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#0058bc] focus:ring-4 focus:ring-blue-100"
                >
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} — {new Intl.NumberFormat("vi-VN").format(service.basePrice)}đ
                    </option>
                  ))}
                </select>

                {/* Calculation Breakdown Card */}
                {selectedService && (
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Giá niêm yết dịch vụ ({selectedService.name}):</span>
                      <span className="font-semibold text-slate-800">
                        {new Intl.NumberFormat("vi-VN").format(selectedService.basePrice)}đ
                      </span>
                    </div>

                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Mức giảm khuyến mãi ({promotion.code}):</span>
                      <span>
                        -{new Intl.NumberFormat("vi-VN").format(calculatedDiscount)}đ
                      </span>
                    </div>

                    <div className="flex justify-between border-t border-slate-100 pt-2 text-sm font-black text-[#0058bc]">
                      <span>Chi phí sau ưu đãi:</span>
                      <span className="text-base text-[#0058bc]">
                        {new Intl.NumberFormat("vi-VN").format(finalPrice)}đ
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Đang tải danh sách dịch vụ...</p>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={handleBookNow}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0058bc] px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-[#004698] hover:shadow-xl"
          >
            <DashboardIcon name="calendar" className="h-4 w-4" />
            Đặt dịch vụ ngay
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
