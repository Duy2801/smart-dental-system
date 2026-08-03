"use client";

import { usePatientServicesQuery } from "../hooks";
import { PatientGridSkeleton } from "../../common/PatientSkeleton";
import { ServiceGroupBrowser } from "./ServiceGroupBrowser";

export function ServiceCatalogExperience() {
  const {
    data: services = [],
    isLoading,
    isError,
    refetch,
  } = usePatientServicesQuery();

  return (
    <main className="mx-auto w-full max-w-[1360px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
      {isLoading ? (
        <div>
          <PatientGridSkeleton />
        </div>
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
          <ServiceGroupBrowser services={services} />
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
