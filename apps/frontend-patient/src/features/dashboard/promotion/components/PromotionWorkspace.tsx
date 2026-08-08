"use client";

import { useMemo, useState } from "react";
import { DashboardIcon } from "@/features/dashboard/common/DashboardIcon";
import { AuthRequireModal } from "@/features/dashboard/common/AuthRequireModal";
import { toast } from "@/features/dashboard/common/toast";
import { useAppSelector } from "@/providers";
import { usePromotions } from "../hooks/usePromotions";
import { PromotionCard, PromotionCardSkeleton } from "./PromotionCard";
import { PromotionDetailModal } from "./PromotionDetailModal";
import type { PromotionDto } from "../types";

type FilterTab = "all" | "percentage" | "fixed" | "expiring";

export function PromotionWorkspace() {
  const { promotions: dbPromotions, services, isLoading } = usePromotions();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [selectedPromotion, setSelectedPromotion] = useState<PromotionDto | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const isAuthenticated =
    useAppSelector((state) => state.login.isAuthenticated) ||
    Boolean(
      typeof window !== "undefined" &&
        (localStorage.getItem("access_token") || localStorage.getItem("patient_auth")),
    );

  // Filter promotions based on search query & active tab
  const filteredPromotions = useMemo(() => {
    return dbPromotions.filter((item) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.code.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      if (activeTab === "percentage") {
        return item.discount_type === "PERCENTAGE";
      }
      if (activeTab === "fixed") {
        return item.discount_type === "FIXED_AMOUNT";
      }
      if (activeTab === "expiring") {
        const daysLeft =
          (new Date(item.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return daysLeft >= 0 && daysLeft <= 30;
      }

      return true;
    });
  }, [dbPromotions, searchQuery, activeTab]);

  const handleApplyPromotion = (promo: PromotionDto) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    setSelectedPromotion(promo);
  };

  return (
    <div className="mx-auto w-full max-w-[1360px] space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      {/* Centered Intro Header Section (Clean layout, no blue background box) */}
      <section className="text-center py-4 space-y-4 max-w-3xl mx-auto">
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#0058bc]">
          <DashboardIcon name="sparkles" className="h-4 w-4 text-[#0058bc]" />
          Đặc quyền cho bệnh nhân
        </span>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          Chương Trình Ưu Đãi & Voucher Nha Khoa
        </h1>

        <p className="text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Khám phá các mã giảm giá và chương trình ưu đãi đặc biệt từ Smart Dental. Áp dụng mã trực tiếp khi đặt lịch khám để tiết kiệm chi phí điều trị tối đa.
        </p>

        {/* Search input bar */}
        <div className="pt-2 max-w-lg mx-auto">
          <div className="relative flex items-center">
            <DashboardIcon
              name="search"
              className="absolute left-4 h-5 w-5 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm mã ưu đãi, dịch vụ hoặc chương trình..."
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-semibold text-slate-800 shadow-sm placeholder:text-slate-400 outline-none ring-2 ring-transparent focus:border-[#0058bc] focus:ring-blue-100 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Xóa
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Filter Tabs & Counter Bar (Centered & Balanced) */}
      <div className="flex flex-col items-center gap-4 border-b border-slate-200/80 pb-4">
        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {[
            { id: "all", label: "Tất cả ưu đãi" },
            { id: "percentage", label: "Giảm phần trăm (%)" },
            { id: "fixed", label: "Giảm số tiền" },
            { id: "expiring", label: "Sắp hết hạn" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as FilterTab)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === tab.id
                  ? "bg-[#0058bc] text-white shadow-md shadow-blue-500/20"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Counter */}
        <p className="text-xs font-bold text-slate-500">
          Hiển thị <strong className="text-slate-800">{filteredPromotions.length}</strong> ưu đãi khả dụng
        </p>
      </div>

      {/* Grid of Promotions (Compact 4-column layout) */}
      {isLoading ? (
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <PromotionCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredPromotions.length > 0 ? (
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredPromotions.map((promo) => (
            <PromotionCard
              key={promo.id}
              promotion={promo}
              onViewDetail={(item) => setSelectedPromotion(item)}
              onApplyPromotion={handleApplyPromotion}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-blue-50 text-[#0058bc]">
            <DashboardIcon name="info" className="h-8 w-8" />
          </span>
          <h3 className="mt-4 text-base font-bold text-slate-800">
            Không tìm thấy ưu đãi phù hợp
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc khác để xem danh sách khuyến mãi khả dụng.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setActiveTab("all");
            }}
            className="mt-4 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
          >
            Đặt lại tìm kiếm
          </button>
        </div>
      )}

      {/* Detail & Apply Modal */}
      <PromotionDetailModal
        promotion={selectedPromotion}
        services={services}
        onClose={() => setSelectedPromotion(null)}
      />

      {/* Login Requirement Modal */}
      <AuthRequireModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        returnUrl="/promotions"
      />
    </div>
  );
}
