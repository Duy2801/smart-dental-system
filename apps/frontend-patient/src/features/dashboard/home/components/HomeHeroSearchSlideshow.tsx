"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { DashboardIcon } from "../../common/DashboardIcon";
import { useHomeBannersQuery, useHomeServicesQuery, useHomeDoctorsQuery } from "../hooks/useHomeQueries";
import { ROUTES, buildRoute } from "../../common/routes";

const SEARCH_PLACEHOLDER = "Tìm kiếm theo dịch vụ, bác sĩ, triệu chứng...";

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function HomeHeroSearchSlideshow() {
  const router = useRouter();
  const searchCardRef = useRef<HTMLDivElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);

  const { data: banners = [], isLoading: isLoadingBanners } = useHomeBannersQuery();
  const { data: services = [], isLoading: isLoadingServices } = useHomeServicesQuery();
  const { data: doctors = [], isLoading: isLoadingDoctors } = useHomeDoctorsQuery();

  const [activeSlide, setActiveSlide] = useState(0);
  const [heroIndex, setHeroIndex] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [placeholder, setPlaceholder] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const activeBanners = useMemo(() => {
    return Array.isArray(banners) ? banners.filter((b) => b && b.isActive !== false) : [];
  }, [banners]);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % activeBanners.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [activeBanners.length]);

  const slides = useMemo(() => {
    if (!Array.isArray(services) || !services.length) return [];
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

  // Filter doctors & services for autocomplete dropdown
  const searchResults = useMemo(() => {
    const trimmed = keyword.trim();
    if (!trimmed) return { doctorMatches: [], serviceMatches: [] };

    const norm = normalizeText(trimmed);

    const docMatches = Array.isArray(doctors)
      ? doctors.filter((doc) => {
          const haystack = normalizeText(`${doc.name} ${doc.specialization} ${doc.position || ""}`);
          return haystack.includes(norm);
        })
      : [];

    const svcMatches = Array.isArray(services)
      ? services.filter((svc) => {
          const haystack = normalizeText(`${svc.title} ${svc.description || ""}`);
          return haystack.includes(norm);
        })
      : [];

    return {
      doctorMatches: docMatches.slice(0, 4),
      serviceMatches: svcMatches.slice(0, 4),
    };
  }, [keyword, doctors, services]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = keyword.trim();
    if (!trimmed) {
      setIsFocused(false);
      return;
    }

    const norm = normalizeText(trimmed);
    const isDoctorKeyword =
      norm.includes("bac si") ||
      norm.includes("bác sĩ") ||
      norm.includes("bs") ||
      norm.includes("thac si") ||
      norm.includes("tien si") ||
      norm.includes("bác sỹ");

    // Check exact doctor match
    const exactDoctor = doctors.find((d) => normalizeText(d.name) === norm);
    if (exactDoctor) {
      router.push(buildRoute.doctorDetail(exactDoctor.id));
      setIsFocused(false);
      return;
    }

    // Check exact service match
    const exactService = services.find((s) => normalizeText(s.title) === norm);
    if (exactService) {
      router.push(buildRoute.serviceDetail(exactService.id));
      setIsFocused(false);
      return;
    }

    if (isDoctorKeyword || searchResults.doctorMatches.length > searchResults.serviceMatches.length) {
      router.push(`${ROUTES.doctor}?keyword=${encodeURIComponent(trimmed)}`);
    } else {
      router.push(`${ROUTES.service}?keyword=${encodeURIComponent(trimmed)}`);
    }
    setIsFocused(false);
  }

  const handlePrev = () => {
    setActiveSlide((prev) => (prev === 0 ? totalPages - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveSlide((prev) => (prev >= totalPages - 1 ? 0 : prev + 1));
  };

  const suggestions = useMemo(() => {
    const items: Array<{ id: string; label: string; href: string }> = [];
    services.slice(0, 6).forEach((s) => {
      items.push({ id: s.id, label: s.title, href: buildRoute.serviceDetail(s.id) });
    });
    doctors.slice(0, 2).forEach((d) => {
      items.push({ id: d.id, label: `BS. ${d.name}`, href: buildRoute.doctorDetail(d.id) });
    });
    return items;
  }, [services, doctors]);

  const currentHeroBanner = activeBanners.length ? activeBanners[heroIndex % activeBanners.length] : null;
  const showDropdown = isFocused && keyword.trim().length > 0;

  return (
    <section className="relative w-full pb-2 sm:pb-8">
      {/* Dynamic Top Banner Section from DB */}
      <div className="relative w-full overflow-hidden pb-6 sm:pb-28">
        {isLoadingBanners ? (
          <div className="w-full h-36 animate-pulse bg-blue-400/30 sm:h-[420px]" />
        ) : currentHeroBanner ? (
          <img
            src={currentHeroBanner.imageUrl}
            alt={currentHeroBanner.title || "Smart Dental Banner"}
            className="w-full h-auto block object-cover sm:max-h-[520px] transition-all duration-700 cursor-default select-none"
          />
        ) : (
          <img
            src="/bannerhome.png"
            alt="Smart Dental Banner"
            className="w-full h-auto block object-cover sm:max-h-[520px] cursor-default select-none"
          />
        )}
      </div>

      {/* Floating White Search Card */}
      <div
        ref={searchCardRef}
        onClick={(event) => event.stopPropagation()}
        className="relative z-30 mx-auto -mt-5 xs:-mt-8 sm:-mt-24 lg:-mt-36 w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] max-w-[960px] overflow-visible rounded-2xl sm:rounded-3xl bg-white shadow-2xl shadow-slate-900/15 ring-1 ring-slate-200/80"
      >
        <div className="relative">
          <form
            onSubmit={handleSearch}
            className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/50 px-4 py-3.5 sm:px-6 rounded-t-3xl"
          >
            <DashboardIcon name="search" className="h-5 w-5 shrink-0 text-slate-400" />
            <input
              value={keyword}
              onChange={(event) => {
                setKeyword(event.target.value);
                setIsFocused(true);
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                // Short delay to allow clicking dropdown links
                setTimeout(() => setIsFocused(false), 200);
              }}
              className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 sm:text-base"
              placeholder={placeholder || SEARCH_PLACEHOLDER}
              aria-label="Tìm kiếm dịch vụ nha khoa hoặc bác sĩ"
            />
            <button
              ref={searchButtonRef}
              type="submit"
              className="shrink-0 rounded-xl bg-[#0058bc] px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#004699] sm:text-sm"
            >
              Tìm kiếm
            </button>
          </form>

          {/* Autocomplete Results Dropdown */}
          {showDropdown && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[420px] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-200">
              {searchResults.doctorMatches.length === 0 && searchResults.serviceMatches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <div className="relative mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
                    <svg
                      className="h-9 w-9 text-slate-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                      />
                    </svg>
                  </div>
                  <div className="text-base font-extrabold text-slate-900">
                    Không tìm thấy dịch vụ hoặc bác sĩ
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Hãy thử tìm kiếm từ khóa dịch vụ hoặc tên bác sĩ khác
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Doctor Results Section */}
                  {searchResults.doctorMatches.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0058bc]">
                        🩺 Bác sĩ phù hợp ({searchResults.doctorMatches.length})
                      </div>
                      <div className="mt-1 space-y-1">
                        {searchResults.doctorMatches.map((doc) => (
                          <Link
                            key={doc.id}
                            href={buildRoute.doctorDetail(doc.id)}
                            onClick={() => setIsFocused(false)}
                            className="flex items-center justify-between rounded-xl px-3 py-2.5 transition hover:bg-blue-50/70"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-blue-100 bg-blue-50">
                                {doc.avatarUrl ? (
                                  <img src={doc.avatarUrl} alt={doc.name} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="grid h-full w-full place-items-center text-xs font-bold text-[#0058bc]">
                                    BS
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-slate-900">{doc.name}</div>
                                <div className="text-xs text-slate-500">{doc.specialization} · {doc.position || "Bác sĩ chuyên khoa"}</div>
                              </div>
                            </div>
                            <span className="rounded-lg bg-blue-100 px-2.5 py-1 text-[11px] font-bold text-[#0058bc]">
                              Chi tiết bác sĩ ›
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Service Results Section */}
                  {searchResults.serviceMatches.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0058bc]">
                        🦷 Dịch vụ nha khoa ({searchResults.serviceMatches.length})
                      </div>
                      <div className="mt-1 space-y-1">
                        {searchResults.serviceMatches.map((svc) => (
                          <Link
                            key={svc.id}
                            href={buildRoute.serviceDetail(svc.id)}
                            onClick={() => setIsFocused(false)}
                            className="flex items-center justify-between rounded-xl px-3 py-2.5 transition hover:bg-blue-50/70"
                          >
                            <div className="flex items-center gap-3">
                              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-50 text-cyan-600">
                                {svc.icon ? (
                                  <img src={svc.icon} alt={svc.title} className="h-6 w-6 object-contain" />
                                ) : (
                                  <DashboardIcon name="sparkles" className="h-5 w-5 text-[#0058bc]" />
                                )}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-slate-900">{svc.title}</div>
                                <div className="text-xs text-slate-500 line-clamp-1">{svc.description}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-extrabold text-[#0058bc]">{svc.price} đ</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Popular Tags / Keywords from DB */}
        {isLoadingServices || isLoadingDoctors ? (
          <div className="flex items-center gap-2 overflow-x-auto px-4 py-2.5 sm:px-6 text-xs no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden border-b border-slate-100/60">
            <span className="font-bold text-slate-400 shrink-0">Gợi ý:</span>
            <span className="h-6 w-20 shrink-0 animate-pulse rounded-full bg-slate-200/80" />
            <span className="h-6 w-28 shrink-0 animate-pulse rounded-full bg-slate-200/80" />
            <span className="h-6 w-24 shrink-0 animate-pulse rounded-full bg-slate-200/80" />
          </div>
        ) : suggestions.length > 0 ? (
          <div className="flex items-center gap-2 overflow-x-auto px-4 py-2.5 sm:px-6 text-xs text-slate-600 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden border-b border-slate-100/60">
            <span className="font-extrabold text-slate-400 shrink-0 text-[11px] uppercase tracking-wider">Gợi ý:</span>
            {suggestions.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="shrink-0 rounded-full bg-slate-100/90 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200/60 transition hover:bg-blue-50 hover:text-[#0058bc] hover:border-blue-200 active:scale-95"
              >
                {item.label}
              </Link>
            ))}
          </div>
        ) : null}

        {/* Quick Contact & Clinic Location Links */}
        <div className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <Link
            href={ROUTES.consultation}
            className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 transition hover:bg-blue-50/50"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-100 text-[#0058bc]">
                <DashboardIcon name="user" className="h-4 w-4" />
              </span>
              <span className="text-xs font-bold text-slate-800 sm:text-sm">
                Liên hệ bác sĩ tư vấn
              </span>
            </div>
            <DashboardIcon name="chevron" className="h-4 w-4 text-slate-400 shrink-0" />
          </Link>

          <Link
            href={ROUTES.appointment}
            className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 transition hover:bg-blue-50/50"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cyan-100 text-[#0058bc]">
                <DashboardIcon name="calendar" className="h-4 w-4" />
              </span>
              <span className="text-xs font-bold text-slate-800 sm:text-sm">
                Đặt lịch khám nhanh
              </span>
            </div>
            <DashboardIcon name="chevron" className="h-4 w-4 text-slate-400 shrink-0" />
          </Link>
        </div>
      </div>

      {/* Dual Banner Slideshow Section */}
      {isLoadingServices ? (
        <div className="mx-auto mt-6 sm:mt-10 max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-[190px] animate-pulse rounded-2xl border border-slate-200/80 bg-slate-200/60 sm:h-[250px]" />
            <div className="h-[190px] animate-pulse rounded-2xl border border-slate-200/80 bg-slate-200/60 sm:h-[250px]" />
          </div>
        </div>
      ) : slides.length > 0 ? (
        <div className="mx-auto mt-4 sm:mt-10 max-w-[1280px] px-4 sm:px-6 lg:px-8 pb-2 sm:pb-8">
          <div className="relative">
            {/* Desktop Nav Arrows (Hidden on Mobile for visual cleanliness) */}
            {totalPages > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="hidden sm:grid absolute -left-4 top-1/2 z-20 h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white text-lg font-bold text-slate-700 shadow-lg transition hover:bg-slate-50 hover:text-[#0058bc]"
                  aria-label="Previous Slide"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="hidden sm:grid absolute -right-4 top-1/2 z-20 h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white text-lg font-bold text-slate-700 shadow-lg transition hover:bg-slate-50 hover:text-[#0058bc]"
                  aria-label="Next Slide"
                >
                  ›
                </button>
              </>
            )}

            {/* Banner Cards Grid (2 Banners side by side on desktop, stacked neatly on mobile) */}
            <div className="grid gap-4 sm:grid-cols-2">
              {slides
                .slice(activeSlide * 2, activeSlide * 2 + 2)
                .map((slide) => (
                  <Link
                    key={slide.id}
                    href={slide.href}
                    className="group relative flex min-h-[190px] flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 p-5 text-white shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:min-h-[250px] sm:p-7"
                  >
                    {slide.imageUrl && (
                      <div className="absolute inset-0 pointer-events-none">
                        <img
                          src={slide.imageUrl}
                          alt={slide.title}
                          className="h-full w-full object-cover opacity-30 transition duration-500 group-hover:scale-105 group-hover:opacity-40"
                        />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-transparent pointer-events-none" />

                    <div className="relative z-10">
                      {slide.badge && (
                        <span className="inline-block rounded-full bg-white/20 px-3 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                          {slide.badge}
                        </span>
                      )}
                      <h3 className="mt-2.5 text-lg font-black tracking-tight text-white sm:text-2xl">
                        {slide.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs text-blue-100 sm:text-sm">
                        {slide.description}
                      </p>
                    </div>

                    <div className="relative z-10 mt-4 flex items-center justify-between">
                      <span className="text-xs font-bold text-white sm:text-base">
                        {slide.price}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-xl bg-white px-3.5 py-1.5 text-xs font-extrabold text-[#0058bc] shadow-md transition group-hover:bg-blue-50">
                        Xem dịch vụ ›
                      </span>
                    </div>
                  </Link>
                ))}
            </div>

            {/* Pagination Dots */}
            {totalPages > 1 && (
              <div className="mt-4 sm:mt-5 flex justify-center gap-2">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveSlide(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${idx === activeSlide
                      ? "w-6 bg-[#0058bc]"
                      : "w-2 bg-slate-300 hover:bg-slate-400"
                      }`}
                    aria-label={`Go to slide page ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

    </section>
  );
}
