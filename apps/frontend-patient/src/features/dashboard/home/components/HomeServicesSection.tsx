"use client";

import { usePatientServicesQuery } from "../../service";
import { ServiceGroupBrowser } from "../../service/components/ServiceGroupBrowser";
import { T } from "../../common/typography";

function ServiceSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="min-h-[184px] animate-pulse rounded-[22px] border-4 border-slate-200 bg-white p-4 sm:min-h-[210px]"
        >
          <div className="mx-auto h-24 w-24 rounded-2xl bg-slate-100" />
          <div className="mt-8 h-9 rounded-xl bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function HomeServicesSection() {
  const { data: services = [], isLoading: loading } = usePatientServicesQuery();

  return (
    <section id="services" className="scroll-mt-24">
      <div className="relative mx-auto mb-10 max-w-3xl text-center">
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
