"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { DashboardIcon } from "./DashboardIcon";
import { MAIN_NAV, ROUTES, buildRoute } from "./routes";
import { useHomeServicesQuery, useHomeDoctorsQuery } from "../home/hooks/useHomeQueries";

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const keywordFromUrl = searchParams.get("keyword") || "";

  const { data: services = [] } = useHomeServicesQuery();
  const { data: doctors = [] } = useHomeDoctorsQuery();

  const [homeSearchDocked, setHomeSearchDocked] = useState(false);
  const [keyword, setKeyword] = useState(keywordFromUrl);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setKeyword(keywordFromUrl);
  }, [keywordFromUrl]);

  useEffect(() => {
    function handleDock(event: Event) {
      const detail = (event as CustomEvent<{ docked?: boolean }>).detail;
      setHomeSearchDocked(Boolean(detail?.docked));
    }

    window.addEventListener("home-search-dock", handleDock);
    return () => window.removeEventListener("home-search-dock", handleDock);
  }, []);

  useEffect(() => {
    if (pathname !== ROUTES.home) setHomeSearchDocked(false);
  }, [pathname]);

  // Compute live search matches for autocomplete dropdown
  const searchResults = useMemo(() => {
    const trimmed = keyword.trim();
    if (!trimmed) return { doctorMatches: [], serviceMatches: [] };

    const norm = normalizeText(trimmed);

    const docMatches = doctors.filter((doc) => {
      const haystack = normalizeText(`${doc.name} ${doc.specialization} ${doc.position || ""}`);
      return haystack.includes(norm);
    });

    const svcMatches = services.filter((svc) => {
      const haystack = normalizeText(`${svc.title} ${svc.description || ""}`);
      return haystack.includes(norm);
    });

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

    const exactDoctor = doctors.find((d) => normalizeText(d.name) === norm);
    if (exactDoctor) {
      router.push(buildRoute.doctorDetail(exactDoctor.id));
      setIsFocused(false);
      return;
    }

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

  const showNavbarSearchBar =
    Boolean(keywordFromUrl) ||
    (pathname === ROUTES.home && homeSearchDocked);

  const showDropdown = isFocused && keyword.trim().length > 0;

  if (showNavbarSearchBar) {
    return (
      <div className="relative hidden md:flex items-center">
        <form
          onSubmit={handleSearch}
          className="h-11 w-[min(46vw,560px)] items-center gap-3 rounded-full border border-blue-100 bg-blue-50/80 px-4 shadow-2xs md:flex transition focus-within:bg-white focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100"
        >
          <DashboardIcon name="search" className="h-5 w-5 text-[#0863c5] shrink-0" />
          <input
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value);
              setIsFocused(true);
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setTimeout(() => setIsFocused(false), 200);
            }}
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
            placeholder="Bạn đang tìm kiếm dịch vụ gì?"
            aria-label="Tìm kiếm dịch vụ nha khoa"
          />
          {keyword && (
            <button
              type="button"
              onClick={() => {
                setKeyword("");
                if (pathname === ROUTES.service || pathname === ROUTES.doctor) {
                  router.push(pathname);
                }
              }}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1"
            >
              ✕
            </button>
          )}
        </form>

        {/* Autocomplete Suggestions Dropdown */}
        {showDropdown && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[420px] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-200">
            {searchResults.doctorMatches.length === 0 && searchResults.serviceMatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                <div className="relative mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50">
                  <svg
                    className="h-6 w-6 text-slate-300"
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
                <div className="text-sm font-bold text-slate-900">
                  Không tìm thấy dịch vụ hoặc bác sĩ
                </div>
                <div className="mt-0.5 text-xs text-slate-500">
                  Hãy thử tìm kiếm từ khóa dịch vụ hoặc tên bác sĩ khác
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Doctor Matches */}
                {searchResults.doctorMatches.length > 0 && (
                  <div>
                    <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0058bc]">
                      🩺 Bác sĩ phù hợp ({searchResults.doctorMatches.length})
                    </div>
                    <div className="mt-1 space-y-1">
                      {searchResults.doctorMatches.map((doc) => (
                        <Link
                          key={doc.id}
                          href={buildRoute.doctorDetail(doc.id)}
                          onClick={() => setIsFocused(false)}
                          className="flex items-center justify-between rounded-xl px-3 py-2 transition hover:bg-blue-50/70"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-blue-100 bg-blue-50">
                              {doc.avatarUrl ? (
                                <img src={doc.avatarUrl} alt={doc.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="grid h-full w-full place-items-center text-xs font-bold text-[#0058bc]">
                                  BS
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900">{doc.name}</div>
                              <div className="text-[11px] text-slate-500">{doc.specialization}</div>
                            </div>
                          </div>
                          <span className="rounded-lg bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-[#0058bc]">
                            Xem bác sĩ ›
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Service Matches */}
                {searchResults.serviceMatches.length > 0 && (
                  <div>
                    <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0058bc]">
                      🦷 Dịch vụ nha khoa ({searchResults.serviceMatches.length})
                    </div>
                    <div className="mt-1 space-y-1">
                      {searchResults.serviceMatches.map((svc) => (
                        <Link
                          key={svc.id}
                          href={buildRoute.serviceDetail(svc.id)}
                          onClick={() => setIsFocused(false)}
                          className="flex items-center justify-between rounded-xl px-3 py-2 transition hover:bg-blue-50/70"
                        >
                          <div className="flex items-center gap-3">
                            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-cyan-50 text-cyan-600">
                              {svc.icon ? (
                                <img src={svc.icon} alt={svc.title} className="h-5 w-5 object-contain" />
                              ) : (
                                <DashboardIcon name="sparkles" className="h-4 w-4 text-[#0058bc]" />
                              )}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900">{svc.title}</div>
                              {svc.price ? (
                                <div className="text-[11px] font-semibold text-[#0058bc]">
                                  {svc.price}
                                </div>
                              ) : (
                                <div className="text-[11px] text-slate-500">Liên hệ tư vấn</div>
                              )}
                            </div>
                          </div>
                          <span className="rounded-lg bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-[#0058bc]">
                            Chi tiết dịch vụ ›
                          </span>
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
    );
  }

  return (
    <nav
      aria-label="Điều hướng chính"
      className="hidden h-full items-center justify-center gap-6 md:flex lg:gap-8 xl:gap-12"
    >
      {MAIN_NAV.map((item) => {
        const active =
          item.href === ROUTES.service
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            aria-current={active ? "page" : undefined}
            className={`relative flex h-full items-center px-1 text-sm font-semibold transition-colors duration-200 hover:text-[#0863c5] ${
              active ? "text-[#0863c5] font-bold" : "text-slate-600"
            }`}
          >
            <span>{item.label}</span>
            {active && (
              <span className="absolute bottom-0 inset-x-0 h-[3px] rounded-t-full bg-[#0863c5]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
