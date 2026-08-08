"use client";

import { useState } from "react";
import Link from "next/link";
import { DashboardIcon } from "../../common/DashboardIcon";
import { type HomeClinicalCase } from "../api";
import { useHomeClinicalCasesQuery } from "../hooks/useHomeQueries";
import { T } from "../../common/typography";

function ParkwayClinicalCaseCard({ item }: { item: HomeClinicalCase }) {
  return (
    <article className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-md shadow-slate-100/60 transition hover:shadow-xl sm:p-7">
      {/* Top right branding / Logo */}

      <div className="grid gap-6 md:grid-cols-12 md:items-center">
        {/* Left Column: Information */}
        <div className="flex flex-col justify-between md:col-span-7">
          <div>
            <h3 className="pr-16 text-xl font-extrabold text-[#173761] sm:text-2xl">
              {item.title}
            </h3>
            <p className="mt-1 text-xs font-bold text-[#0058bc]">
              {item.serviceName}
            </p>

            <div className="mt-4 space-y-3 text-xs leading-relaxed">
              <div>
                <span className="font-bold text-slate-900">Trước điều trị:</span>
                <p className="mt-0.5 text-slate-600">{item.description}</p>
              </div>

              <div>
                <span className="font-bold text-slate-900">Sau điều trị:</span>
                <ul className="mt-1 space-y-1 text-slate-600">
                  <li className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#0058bc]" />
                    Sắp đều răng, khớp cắn chuẩn
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#0058bc]" />
                    Chức năng ăn nhai ổn định
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#0058bc]" />
                    Khuôn cười tươi tắn, tự tin
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-3.5 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <DashboardIcon name="user" className="h-3.5 w-3.5 text-[#0058bc]" />
              {item.doctorName}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-medium text-slate-700">
              <DashboardIcon name="clock" className="h-3.5 w-3.5 text-[#0058bc]" />
              {item.duration}
            </span>
          </div>
        </div>

        {/* Right Column: Stacked Before & After Images */}
        <div className="flex flex-col gap-3 md:col-span-5">
          {/* Top Image: Before */}
          <div className="relative overflow-hidden rounded-2xl bg-slate-100 shadow-xs aspect-[16/10]">
            <img
              src={item.beforeImageUrl}
              alt={`${item.title} trước điều trị`}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-black/70 py-1.5 text-center text-[11px] font-bold text-white backdrop-blur-xs">
              Trước điều trị
            </div>
          </div>

          {/* Bottom Image: After */}
          <div className="relative overflow-hidden rounded-2xl bg-slate-100 shadow-xs aspect-[16/10]">
            <img
              src={item.afterImageUrl}
              alt={`${item.title} sau điều trị`}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-black/75 py-1.5 text-center text-[11px] font-bold text-white backdrop-blur-xs">
              Sau điều trị
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function ClinicalCaseSkeleton() {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
      <div className="grid gap-6 md:grid-cols-12">
        <div className="space-y-4 md:col-span-7">
          <div className="h-7 w-2/3 animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
          <div className="h-16 animate-pulse rounded bg-slate-100" />
          <div className="h-12 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="space-y-3 md:col-span-5">
          <div className="aspect-[16/10] animate-pulse rounded-2xl bg-slate-100" />
          <div className="aspect-[16/10] animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </div>
    </article>
  );
}

export function ClinicalCasesSection() {
  const { data: cases = [], isLoading: loading } = useHomeClinicalCasesQuery();

  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? Math.max(0, cases.length - 2) : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= cases.length - 2 ? 0 : prev + 1));
  };

  const visibleCases = cases.length > 2 ? cases.slice(currentIndex, currentIndex + 2) : cases;

  return (
    <section className="relative">
      <div className="relative mx-auto max-w-3xl text-center mb-10">
        <p className={`${T.overline} text-[#0058bc]`}>
          Kết quả điều trị
        </p>
        <h2 className="mx-auto mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#173761] sm:text-4xl">
          Kiệt tác Nụ cười
        </h2>
        <p className={`mx-auto mt-3 max-w-2xl ${T.body}`}>
          Hình ảnh trước và sau từ các ca điều trị thực tế đã được bệnh nhân đồng ý công khai.
        </p>
      </div>

      {loading ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <ClinicalCaseSkeleton key={index} />
          ))}
        </div>
      ) : cases.length ? (
        <div className="relative px-2 sm:px-4">
          {cases.length > 2 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Ca điều trị trước"
                className="absolute -left-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-lg transition hover:bg-slate-50 hover:text-[#0058bc] sm:-left-5"
              >
                &#8249;
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Ca điều trị tiếp theo"
                className="absolute -right-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-lg transition hover:bg-slate-50 hover:text-[#0058bc] sm:-right-5"
              >
                &#8250;
              </button>
            </>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {visibleCases.map((item) => (
              <ParkwayClinicalCaseCard key={item.id} item={item} />
            ))}
          </div>

          {/* <div className="mt-8 flex justify-center">
            <Link
              href="/records"
              className="inline-flex items-center gap-2 rounded-xl border border-[#0058bc] bg-white px-6 py-3 text-xs font-bold text-[#0058bc] shadow-sm transition hover:bg-[#0058bc] hover:text-white"
            >
              Xem tất cả album ca lâm sàng
            </Link>
          </div> */}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Chưa có case lâm sàng được phép công khai.
        </div>
      )}
    </section>
  );
}
