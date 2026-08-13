"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardIcon } from "@/features/dashboard/common/DashboardIcon";
import { PatientPageSkeleton } from "@/features/dashboard/common/PatientSkeleton";
import { AuthRequireModal } from "@/features/dashboard/common/AuthRequireModal";
import { ROUTES, buildRoute } from "@/features/dashboard/common/routes";
import { useAppSelector } from "@/providers";
import { formatCurrency } from "@/utils/helpers";

import { usePromotions } from "../hooks/usePromotions";
import type { PromotionDto } from "../types";
import { PromotionHeroSection } from "./PromotionHeroSection";
import { PromotionServicesList } from "./PromotionServicesList";
import { PromotionCalculatorSidebar } from "./PromotionCalculatorSidebar";
import { PromotionInstructions } from "./PromotionInstructions";

export function PromotionDetailExperience({ promotionId }: { promotionId: string }) {
  const router = useRouter();
  const { promotions, services, isLoading } = usePromotions();

  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [showAuthModal, setShowAuthModal] = useState(false);

  const isAuthenticated =
    useAppSelector((state) => state.login.isAuthenticated) ||
    Boolean(
      typeof window !== "undefined" &&
        (localStorage.getItem("access_token") || localStorage.getItem("patient_auth"))
    );

  // Find promotion by id or code
  const promotion = useMemo(() => {
    if (!promotions || promotions.length === 0) return null;
    const term = promotionId.trim().toLowerCase();
    return (
      promotions.find(
        (p) =>
          p.id.toLowerCase() === term ||
          p.code.toLowerCase() === term ||
          p.name.toLowerCase() === term
      ) ?? null
    );
  }, [promotions, promotionId]);

  // Filter services & treatment methods using database-level promotion relationship
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
          category: tm.category || "NHA KHOA TỔNG QUÁT",
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

    // 2. Fallback: Filter by applicable_service_slug if defined
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

  // Selected service object
  const selectedService = useMemo(() => {
    if (!applicableServices || applicableServices.length === 0) return null;
    if (selectedServiceId) {
      return applicableServices.find((s) => s.id === selectedServiceId) ?? applicableServices[0];
    }
    return applicableServices[0];
  }, [applicableServices, selectedServiceId]);

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-[1360px] px-4 py-8 sm:px-6 lg:px-8">
        <PatientPageSkeleton />
      </main>
    );
  }

  if (!promotion) {
    return (
      <main className="mx-auto grid min-h-[60vh] w-full max-w-[960px] place-items-center px-4 py-10 text-center">
        <div>
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-50 text-amber-600">
            <DashboardIcon name="sparkles" className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900">
            Không tìm thấy chương trình ưu đãi
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Mã ưu đãi này có thể đã hết hạn hoặc không còn áp dụng trên hệ thống.
          </p>
          <Link
            href={ROUTES.promotions}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0058bc] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#004698]"
          >
            <DashboardIcon name="arrow" className="h-4 w-4 rotate-180" />
            Xem danh sách ưu đãi khác
          </Link>
        </div>
      </main>
    );
  }

  const discountLabel =
    promotion.discount_type === "PERCENTAGE"
      ? `Giảm ${promotion.discount_value}%`
      : `Giảm ${formatCurrency(promotion.discount_value)}`;

  const handleBookNow = () => {
    const targetServiceId = selectedService?.id || services[0]?.id;
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    const targetUrl = buildRoute.applyPromotion(promotion.code, targetServiceId);
    router.push(targetUrl);
  };

  return (
    <main className="mx-auto w-full max-w-[1360px] px-4 py-7 sm:px-6 lg:px-8 space-y-7">
      {/* Breadcrumb Navigation */}
      <nav className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <Link href={ROUTES.home} className="hover:text-[#0058bc] transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <Link href={ROUTES.promotions} className="hover:text-[#0058bc] transition-colors">
          Ưu đãi & Khuyến mãi
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-900 line-clamp-1">{promotion.name}</span>
      </nav>

      {/* Hero Section */}
      <PromotionHeroSection
        promotion={promotion}
        discountLabel={discountLabel}
        onBookNow={handleBookNow}
      />

      {/* Detailed Workspace Grid */}
      <div className="grid items-start gap-7 lg:grid-cols-[1fr_380px]">
        {/* Left Column: Services & Instructions */}
        <div className="space-y-7">
          <PromotionInstructions promotion={promotion} />

          <PromotionServicesList
            promotion={promotion}
            applicableServices={applicableServices}
            selectedServiceId={selectedService?.id || ""}
            onSelectService={setSelectedServiceId}
            onBookNow={handleBookNow}
          />
        </div>

        {/* Right Column: Sticky Sidebar Calculator */}
        <PromotionCalculatorSidebar
          promotion={promotion}
          applicableServices={applicableServices}
          selectedService={selectedService}
          onSelectService={setSelectedServiceId}
          onBookNow={handleBookNow}
        />
      </div>

      {/* Login Requirement Modal */}
      <AuthRequireModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        returnUrl={buildRoute.applyPromotion(promotion.code, selectedService?.id)}
      />
    </main>
  );
}



