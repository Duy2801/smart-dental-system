"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { DashboardIcon } from "../../common/DashboardIcon";
import { getHomeClinicalCases, type HomeClinicalCase } from "../api";

function CaseImagePair({ item }: { item: HomeClinicalCase }) {
  return (
    <div className="grid h-60 grid-cols-2">
      <figure className="relative overflow-hidden bg-slate-100">
        <img
          src={item.beforeImageUrl}
          alt={`${item.title} trước điều trị`}
          className="h-full w-full object-cover"
        />
        <figcaption className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-[10px] font-bold uppercase text-white">
          Trước
        </figcaption>
      </figure>
      <figure className="relative overflow-hidden bg-slate-100">
        <img
          src={item.afterImageUrl}
          alt={`${item.title} sau điều trị`}
          className="h-full w-full object-cover"
        />
        <figcaption className="absolute bottom-3 right-3 rounded-full bg-[#0058bc] px-3 py-1 text-[10px] font-bold uppercase text-white">
          Sau
        </figcaption>
      </figure>
    </div>
  );
}

function ClinicalCaseSkeleton() {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="h-60 animate-pulse bg-slate-100" />
      <div className="p-5">
        <div className="h-5 w-3/4 animate-pulse rounded bg-slate-100" />
        <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-slate-100" />
      </div>
    </article>
  );
}

export function ClinicalCasesSection() {
  const { data: cases = [], isLoading: loading } = useQuery({
    queryKey: ["patient", "home", "clinical-cases"],
    queryFn: getHomeClinicalCases,
  });

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 sm:text-[28px]">
            Kiệt tác Nụ cười
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Hình ảnh trước và sau từ các ca điều trị đã được bệnh nhân đồng ý
            công khai.
          </p>
        </div>
        <Link
          href="/records"
          className="hidden text-xs font-bold text-[#0058bc] sm:block"
        >
          Xem thêm album
        </Link>
      </div>

      {loading ? (
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <ClinicalCaseSkeleton key={index} />
          ))}
        </div>
      ) : cases.length ? (
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {cases.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-xl"
            >
              <CaseImagePair item={item} />
              <div className="p-5">
                <p className="mb-2 text-[10px] font-bold uppercase text-[#0058bc]">
                  {item.serviceName}
                </p>
                <h3 className="font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <DashboardIcon name="user" className="h-4 w-4" />
                  {item.doctorName} · {item.duration}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Chưa có case lâm sàng được phép công khai.
        </div>
      )}
    </section>
  );
}
