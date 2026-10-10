"use client";

import { useState } from "react";
import Image from "next/image";
import { type HomeClinicalCase } from "../api";
import { useHomeClinicalCasesQuery } from "../hooks/useHomeQueries";
import { T } from "../../common/typography";

function ParkwayClinicalCaseCard({ item }: { item: HomeClinicalCase }) {
  return (
    <article className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm transition-all duration-300 hover:border-blue-200 hover:shadow-xl">
      <div className="grid gap-5 md:grid-cols-12 md:items-center">
        {/* Left Column: Information */}
        <div className="flex flex-col justify-between md:col-span-7 space-y-4">
          <div>
            {/* Service Tag */}
            <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-100 px-3 py-0.5 text-xs font-bold text-[#0058bc]">
              {item.serviceName}
            </span>

            {/* Title */}
            <h3 className="mt-2 text-base sm:text-xl font-black text-slate-900 leading-snug tracking-tight group-hover:text-[#0058bc] transition-colors">
              {item.title}
            </h3>

            {/* Condition & Result Cards */}
            <div className="mt-3.5 space-y-2.5 text-xs">
              {/* Tình trạng ban đầu */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Tình trạng ban đầu
                </span>
                <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Kết quả sau điều trị */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0058bc]">
                  Kết quả sau điều trị
                </span>
                <ul className="mt-1.5 space-y-1.5 text-xs text-slate-700 font-medium">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#0058bc]" />
                    <span>Sắp đều răng, khớp cắn chuẩn</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#0058bc]" />
                    <span>Khôi phục chức năng ăn nhai 100%</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#0058bc]" />
                    <span>Khuôn cười tươi tắn, rạng rỡ</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer: Doctor & Duration */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
            <span className="flex items-center gap-1.5 font-bold text-slate-800">
              <span className="text-slate-400">👨‍⚕️</span> {item.doctorName}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
              <span>⏱️</span> {item.duration}
            </span>
          </div>
        </div>

        {/* Right Column: Before & After Photo Frames */}
        <div className="grid grid-cols-2 gap-2.5 md:flex md:flex-col md:col-span-5">
          {/* Top/Left Image: Before */}
          <div className="group/img relative overflow-hidden rounded-2xl bg-slate-100 border border-slate-200/90 shadow-2xs aspect-[4/3]">
            {item.beforeImageUrl ? (
              <Image
                src={item.beforeImageUrl}
                alt={`${item.title} trước điều trị`}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover/img:scale-105"
              />
            ) : null}
            <span className="absolute top-2.5 left-2.5 rounded-full bg-slate-900/80 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xs backdrop-blur-xs">
              Trước
            </span>
          </div>

          {/* Bottom/Right Image: After */}
          <div className="group/img relative overflow-hidden rounded-2xl bg-slate-100 border border-blue-200/80 shadow-2xs aspect-[4/3]">
            {item.afterImageUrl ? (
              <Image
                src={item.afterImageUrl}
                alt={`${item.title} sau điều trị`}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover/img:scale-105"
              />
            ) : null}
            <span className="absolute top-2.5 left-2.5 rounded-full bg-[#0058bc] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xs backdrop-blur-xs">
              Sau
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function ClinicalCaseSkeleton() {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
      <div className="grid gap-6 md:grid-cols-12">
        <div className="space-y-4 md:col-span-7">
          <div className="h-6 w-24 animate-pulse rounded-full bg-slate-100" />
          <div className="h-7 w-2/3 animate-pulse rounded bg-slate-100" />
          <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
        </div>
        <div className="grid grid-cols-2 gap-2.5 md:flex md:flex-col md:col-span-5">
          <div className="aspect-[4/3] animate-pulse rounded-2xl bg-slate-100" />
          <div className="aspect-[4/3] animate-pulse rounded-2xl bg-slate-100" />
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
      <div className="relative mx-auto max-w-3xl text-center mb-6 sm:mb-10">
        <h2 className="mx-auto text-2xl font-black tracking-tight text-[#173761] sm:text-4xl">
          Kiệt tác Nụ cười
        </h2>
        <p className={`mx-auto mt-2 text-xs sm:text-base ${T.body}`}>
          Hình ảnh thực tế trước và sau điều trị đã được bệnh nhân đồng ý công khai.
        </p>
      </div>

      {loading ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <ClinicalCaseSkeleton key={index} />
          ))}
        </div>
      ) : cases.length ? (
        <div className="relative">
          {cases.length > 2 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Ca điều trị trước"
                className="hidden sm:grid absolute -left-5 lg:-left-6 top-1/2 z-20 h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md transition hover:scale-105 hover:bg-slate-50 hover:text-[#0058bc] hover:border-blue-200 active:scale-95 cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Ca điều trị tiếp theo"
                className="hidden sm:grid absolute -right-5 lg:-right-6 top-1/2 z-20 h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md transition hover:scale-105 hover:bg-slate-50 hover:text-[#0058bc] hover:border-blue-200 active:scale-95 cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          <div className="grid gap-5 sm:gap-6 lg:grid-cols-2">
            {visibleCases.map((item) => (
              <ParkwayClinicalCaseCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Chưa có case lâm sàng được phép công khai.
        </div>
      )}
    </section>
  );
}
