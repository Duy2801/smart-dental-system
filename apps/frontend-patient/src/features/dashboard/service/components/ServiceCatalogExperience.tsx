"use client";

import { Suspense } from "react";
import { usePatientServicesQuery } from "../hooks";
import { PatientGridSkeleton } from "../../common/PatientSkeleton";
import { DashboardIcon } from "../../common/DashboardIcon";
import { ServiceGroupBrowser } from "./ServiceGroupBrowser";

export function ServiceCatalogExperience() {
  const {
    data: services = [],
    isLoading,
    isError,
    refetch,
  } = usePatientServicesQuery();

  return (
    <main className="mx-auto w-full max-w-[1360px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8 space-y-8">
      {/* Intro Header Section (Left-aligned, renders instantly) */}
      <section className="py-2 space-y-3">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#0058bc]">
            <DashboardIcon name="sparkles" className="h-3.5 w-3.5 text-[#0058bc]" />
            Chăm Sóc Nụ Cười Toàn Diện
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          Danh Sách Dịch Vụ Nha Khoa
        </h1>

        <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
          Chọn nhóm dịch vụ bên dưới để xem các phương pháp điều trị, chi phí và quy trình chi tiết.
        </p>
      </section>

      {isLoading ? (
        <PatientGridSkeleton />
      ) : isError ? (
        <section className="rounded-2xl border border-red-100 bg-red-50 p-10 text-center">
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
      ) : services.length ? (
        <section aria-live="polite">
          <Suspense fallback={<PatientGridSkeleton />}>
            <ServiceGroupBrowser services={services} hideHeader />
          </Suspense>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <h2 className="text-lg font-bold text-slate-900">
            Chưa có dịch vụ phù hợp
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Vui lòng quay lại sau khi phòng khám cập nhật danh mục dịch vụ.
          </p>
        </section>
      )}
    </main>
  );
}
