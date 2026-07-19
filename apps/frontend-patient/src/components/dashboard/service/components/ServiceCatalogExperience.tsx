"use client";

import { useMemo, useState } from "react";
import { usePatientServicesQuery } from "../hooks";
import type { ServiceCategory, ServiceFilter } from "../types";
import { ServiceCard } from "./ServiceCard";
import { ServiceFilters } from "./ServiceFilters";
import { ServiceHero } from "./ServiceHero";

function ServiceGridSkeleton() {
  return (
    <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="h-[430px] animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="h-52 rounded-t-2xl bg-slate-100" />
          <div className="space-y-4 p-5">
            <div className="h-5 w-3/4 rounded bg-slate-100" />
            <div className="h-4 w-full rounded bg-slate-100" />
            <div className="h-4 w-2/3 rounded bg-slate-100" />
            <div className="h-12 rounded bg-slate-100" />
            <div className="h-11 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </section>
  );
}

function getCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    general: "Tổng quát",
    cleaning: "Vệ sinh răng",
    endodontics: "Nội nha",
    whitening: "Tẩy trắng",
    cosmetic: "Thẩm mỹ",
    orthodontics: "Chỉnh nha",
    implant: "Implant",
    restoration: "Phục hình",
    surgery: "Tiểu phẫu",
    pediatric: "Nha khoa trẻ em",
  };

  return labels[category] || category;
}

export function ServiceCatalogExperience() {
  const [selectedCategory, setSelectedCategory] =
    useState<ServiceCategory>("all");
  const {
    data: services = [],
    isLoading,
    isError,
    refetch,
  } = usePatientServicesQuery();

  const filters = useMemo<ServiceFilter[]>(() => {
    const categories = Array.from(
      new Set(services.map((service) => service.category).filter(Boolean)),
    );

    return [
      { id: "all", label: "Tất cả" },
      ...categories.map((category) => ({
        id: category,
        label: getCategoryLabel(category),
      })),
    ];
  }, [services]);

  const visibleServices = useMemo(
    () =>
      selectedCategory === "all"
        ? services
        : services.filter((service) => service.category === selectedCategory),
    [selectedCategory, services],
  );

  return (
    <main className="mx-auto w-full max-w-[1360px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
      <ServiceHero />

      <div className="mt-10">
        <ServiceFilters
          filters={filters}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </div>

      {isLoading ? (
        <ServiceGridSkeleton />
      ) : isError ? (
        <section className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-10 text-center">
          <h2 className="text-lg font-bold text-red-700">
            Không tải được danh sách dịch vụ
          </h2>
          <p className="mt-2 text-sm text-red-600">
            Vui lòng thử lại, hoặc kiểm tra kết nối tới hệ thống.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-5 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700"
          >
            Tải lại
          </button>
        </section>
      ) : visibleServices.length ? (
        <section
          className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          aria-live="polite"
        >
          {visibleServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </section>
      ) : (
        <section className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <h2 className="text-lg font-bold text-slate-900">
            Chưa có dịch vụ phù hợp
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Vui lòng chọn nhóm dịch vụ khác hoặc quay lại sau.
          </p>
        </section>
      )}
    </main>
  );
}
