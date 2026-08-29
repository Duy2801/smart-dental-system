"use client";

import { usePatientServicesQuery } from "../../service";
import { ServiceGroupBrowser } from "../../service/components/ServiceGroupBrowser";
import { T } from "../../common/typography";

function ServiceSkeleton() {
  return (
    <div className="space-y-9">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-8">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="flex min-h-[150px] animate-pulse flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center"
          >
            <div className="h-20 w-20 rounded-full bg-slate-200/80" />
            <div className="mt-3 h-4 w-3/4 rounded-md bg-slate-200/80" />
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7 space-y-4">
        <div className="mx-auto space-y-2 text-center max-w-md">
          <div className="mx-auto h-3 w-28 animate-pulse rounded-full bg-slate-200" />
          <div className="mx-auto h-7 w-64 animate-pulse rounded-xl bg-slate-200" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 pt-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-72 animate-pulse rounded-2xl border border-slate-100 bg-slate-100"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function HomeServicesSection() {
  const { data: services = [], isLoading: loading } = usePatientServicesQuery();

  return (
    <section id="services" className="scroll-mt-24">
      <div className="relative mx-auto mb-6 sm:mb-10 max-w-3xl text-center">
        <p className={`${T.overline} text-[#0058bc]`}>
          Dịch vụ nổi bật
        </p>
        <h2 className="mx-auto mt-3 text-3xl font-black text-[#07366f] sm:text-4xl">
          Danh sách dịch vụ nha khoa
        </h2>
        <p className={`mx-auto mt-3 max-w-2xl ${T.body}`}>
          Chọn nhóm dịch vụ để xem các dịch vụ, chi phí và quy trình điều trị chi tiết.
        </p>
      </div>

      {loading ? (
        <ServiceSkeleton />
      ) : services.length ? (
        <>
          <ServiceGroupBrowser services={services} compact />
        </>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Chưa có dịch vụ đang hoạt động để hiển thị.
        </div>
      )}
    </section>
  );
}
