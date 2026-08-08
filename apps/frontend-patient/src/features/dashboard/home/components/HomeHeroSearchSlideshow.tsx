"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { DashboardIcon } from "../../common/DashboardIcon";
import { getHomeServices } from "../api";
import { ROUTES, buildRoute } from "../../common/routes";
import Image from "next/image";
const SEARCH_PLACEHOLDER = "Tìm kiếm theo dịch vụ, bác sĩ, triệu chứng...";

export function HomeHeroSearchSlideshow() {
  const router = useRouter();
  const searchCardRef = useRef<HTMLDivElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["patient", "home", "services"],
    queryFn: getHomeServices,
  });

  const [activeSlide, setActiveSlide] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [placeholder, setPlaceholder] = useState("");

  const slides = useMemo(() => {
    if (!services.length) return [];
    return services.map((service) => ({
      id: service.id,
      title: service.title,
      description: service.description,
      price: service.price,
      durationMinutes: service.durationMinutes,
      imageUrl: service.imageUrl || "/bannerservice.png",
      href: buildRoute.serviceDetail(service.id),
      badge: (service as { badge?: string }).badge || "Dịch vụ nổi bật",
    }));
  }, [services]);

  const totalPages = Math.ceil(slides.length / 2) || 1;

  useEffect(() => {
    if (totalPages <= 1) return;
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % totalPages);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [totalPages]);

  useEffect(() => {
    let index = 0;
    const timer = window.setInterval(() => {
      index = index >= SEARCH_PLACEHOLDER.length ? 0 : index + 1;
      setPlaceholder(SEARCH_PLACEHOLDER.slice(0, index));
    }, 95);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    function updateDockedSearch() {
      const node = searchButtonRef.current ?? searchCardRef.current;
      const docked = node ? node.getBoundingClientRect().top <= 76 : false;
      window.dispatchEvent(
        new CustomEvent("home-search-dock", { detail: { docked } }),
      );
    }

    updateDockedSearch();
    window.addEventListener("scroll", updateDockedSearch, { passive: true });
    window.addEventListener("resize", updateDockedSearch);

    return () => {
      window.removeEventListener("scroll", updateDockedSearch);
      window.removeEventListener("resize", updateDockedSearch);
      window.dispatchEvent(
        new CustomEvent("home-search-dock", { detail: { docked: false } }),
      );
    };
  }, []);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = keyword.trim();
    router.push(
      trimmed
        ? `${ROUTES.service}?keyword=${encodeURIComponent(trimmed)}`
        : ROUTES.service,
    );
  }

  const handlePrev = () => {
    setActiveSlide((prev) => (prev === 0 ? totalPages - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveSlide((prev) => (prev >= totalPages - 1 ? 0 : prev + 1));
  };

  if (isLoading) {
    return (
      <section className="relative w-full pb-12">
        <div className="h-[360px] animate-pulse bg-gradient-to-r from-amber-100 via-blue-50 to-amber-100" />
      </section>
    );
  }

  const suggestions = services.slice(0, 8).map((s) => s.title);

  return (
    <section className="relative w-full pb-12">
      {/* Top Banner Section with bannerhome.png (Full Width) */}
      <div className="relative w-full overflow-hidden bg-gradient-to-b from-[#0058bc] via-blue-50/40 to-[#f6f8fc] pb-20 sm:pb-28">
        <img
          src="/bannerhome.png"
          alt="Smart Dental Banner"
          className="h-auto w-full object-cover min-h-[240px] max-h-[480px] sm:max-h-[580px]"
        />
      </div>

      {/* Floating White Search Card (Matching Image 1) */}
      <div
        ref={searchCardRef}
        onClick={(event) => event.stopPropagation()}
        className="relative z-20 mx-auto -mt-24 w-[calc(100%-2rem)] max-w-[960px] overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-900/15 ring-1 ring-slate-200/80 sm:-mt-32 lg:-mt-36"
      >
        <form
          onSubmit={handleSearch}
          className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/50 px-4 py-3.5 sm:px-6"
        >
          <DashboardIcon name="search" className="h-5 w-5 shrink-0 text-slate-400" />
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 sm:text-base"
            placeholder={placeholder || SEARCH_PLACEHOLDER}
            aria-label="Tìm kiếm dịch vụ nha khoa"
          />
          <button
            ref={searchButtonRef}
            type="submit"
            className="shrink-0 rounded-xl bg-[#0058bc] px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#004699] sm:text-sm"
          >
            Tìm kiếm
          </button>
        </form>

        {/* Popular Tags / Keywords from DB */}
        {suggestions.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-3 text-xs text-slate-600 sm:px-6">
            <span className="font-semibold text-slate-400">Gợi ý:</span>
            {suggestions.map((item) => (
              <Link
                key={item}
                href={`${ROUTES.service}?keyword=${encodeURIComponent(item)}`}
                className="transition hover:text-[#0058bc] hover:underline"
              >
                {item}
              </Link>
            ))}
          </div>
        )}

        {/* Quick Contact & Clinic Location Links (Image 1 Bottom Row) */}
        <div className="grid divide-y divide-slate-100 border-t border-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <Link
            href={ROUTES.contact}
            className="flex items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-blue-50/50 sm:px-6"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-100 text-[#0058bc]">
                <DashboardIcon name="user" className="h-4 w-4" />
              </span>
              <span className="text-xs font-bold text-slate-800 sm:text-sm">
                Liên hệ bác sĩ tư vấn
              </span>
            </div>
            <DashboardIcon name="chevron" className="h-4 w-4 text-slate-400" />
          </Link>

          <Link
            href={ROUTES.appointment}
            className="flex items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-blue-50/50 sm:px-6"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-cyan-100 text-[#0058bc]">
                <DashboardIcon name="calendar" className="h-4 w-4" />
              </span>
              <span className="text-xs font-bold text-slate-800 sm:text-sm">
                Đặt lịch khám nhanh
              </span>
            </div>
            <DashboardIcon name="chevron" className="h-4 w-4 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* Dual Banner Slideshow Section (Matching Image 2 Layout) */}
      {slides.length > 0 && (
        <div className="mx-auto mt-10 max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="relative">
            {/* Nav Arrows */}
            {totalPages > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute -left-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white text-lg font-bold text-slate-700 shadow-lg transition hover:bg-slate-50 hover:text-[#0058bc] sm:-left-5"
                  aria-label="Previous Slide"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute -right-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white text-lg font-bold text-slate-700 shadow-lg transition hover:bg-slate-50 hover:text-[#0058bc] sm:-right-5"
                  aria-label="Next Slide"
                >
                  ›
                </button>
              </>
            )}

            {/* Banner Cards Grid (2 Banners side by side) */}
            <div className="grid gap-5 sm:grid-cols-2">
              {slides
                .slice(activeSlide * 2, activeSlide * 2 + 2)
                .map((slide) => (
                  <Link
                    key={slide.id}
                    href={slide.href}
                    className="group relative flex min-h-[210px] flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 p-6 text-white shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:min-h-[250px] sm:p-7"
                  >
                    <div className="relative h-full w-full">
                      {slide.imageUrl && (
                        <Image
                          src={slide.imageUrl}
                          alt={slide.title}
                          fill
                          className="object-cover opacity-35 transition duration-500 group-hover:scale-105 group-hover:opacity-45"
                        />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />

                    <div className="relative z-10">
                      {slide.badge && (
                        <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                          {slide.badge}
                        </span>
                      )}
                      <h3 className="mt-3 text-xl font-black tracking-tight text-white sm:text-2xl">
                        {slide.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs text-blue-100 sm:text-sm">
                        {slide.description}
                      </p>
                    </div>

                    <div className="relative z-10 mt-4 flex items-center justify-between">
                      <span className="text-sm font-bold text-white sm:text-base">
                        {slide.price}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-xl bg-white px-4 py-2 text-xs font-extrabold text-[#0058bc] shadow-md transition group-hover:bg-blue-50">
                        Xem dịch vụ ›
                      </span>
                    </div>
                  </Link>
                ))}
            </div>

            {/* Pagination Dots */}
            {totalPages > 1 && (
              <div className="mt-5 flex justify-center gap-2">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveSlide(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${idx === activeSlide
                      ? "w-6 bg-slate-800"
                      : "w-2 bg-slate-300 hover:bg-slate-400"
                      }`}
                    aria-label={`Go to slide page ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Chat/CSKH Button (Bottom Right of Image 1 & 2) */}
      <Link
        href={ROUTES.contact}
        className="fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#0058bc] text-white shadow-2xl transition hover:scale-110 hover:bg-[#004699] active:scale-95"
        title="Tư vấn trực tuyến"
      >
        <DashboardIcon name="chat" className="h-6 w-6" />
      </Link>
    </section>
  );
}
