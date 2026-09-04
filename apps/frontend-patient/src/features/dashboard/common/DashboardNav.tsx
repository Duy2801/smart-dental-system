"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { DashboardIcon } from "./DashboardIcon";
import { MAIN_NAV, ROUTES, buildRoute } from "./routes";
import { useAppSelector } from "@/providers";
import { useLogout } from "@/features/auth/useLogout";
import { useHomeServicesQuery, useHomeDoctorsQuery, useClinicConfigQuery } from "../home/hooks/useHomeQueries";

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getInitials(name?: string) {
  if (!name || name.trim() === "" || name.toLowerCase().includes("khách hàng")) {
    return "KH";
  }
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const MOBILE_NAV_ITEMS = [
  { label: "Trang chủ", href: ROUTES.home, icon: "home" },
  { label: "Đặt lịch khám", href: ROUTES.appointment, icon: "calendar" },
  { label: "Tư vấn Telehealth", href: ROUTES.consultation, icon: "chat" },
  { label: "Dịch vụ nha khoa", href: ROUTES.service, icon: "sparkles" },
  { label: "Đội ngũ Bác sĩ", href: ROUTES.doctor, icon: "user" },
  { label: "Hồ sơ bệnh án", href: ROUTES.records, icon: "document" },
  { label: "Khuyến mãi & Ưu đãi HOT", href: ROUTES.promotions, icon: "sparkles" },
] as const;

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const keywordFromUrl = searchParams.get("keyword") || "";

  const { handleLogout } = useLogout();
  const { user, isAuthenticated } = useAppSelector((state) => state.login);

  const [mounted, setMounted] = useState(false);
  const [homeSearchDocked, setHomeSearchDocked] = useState(false);
  const [keyword, setKeyword] = useState(keywordFromUrl);
  const [isFocused, setIsFocused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const showNavbarSearchBar =
    Boolean(keywordFromUrl) ||
    (pathname === ROUTES.home && homeSearchDocked);
  const { data: services = [] } = useHomeServicesQuery(showNavbarSearchBar);
  const { data: doctors = [] } = useHomeDoctorsQuery(showNavbarSearchBar);
  const { data: clinic } = useClinicConfigQuery();

  const displayName = user?.fullName || "Khách hàng";
  const initials = getInitials(user?.fullName);
  const clinicPhone = clinic?.phone || "1900 1234";

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile dropdown and reset docked search on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setHomeSearchDocked(false);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [pathname]);

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

  const showDropdown = isFocused && keyword.trim().length > 0;

  return (
    <div className="flex h-full items-center">
      {/* Desktop Main Navigation Links */}
      {!showNavbarSearchBar ? (
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
      ) : (
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
      )}

      {/* Mobile Pharmacity-Style Header Trigger (Grid Icon Button + Brand Name) */}
      <div className="relative md:hidden flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#0058bc] text-white shadow-xs hover:bg-[#004899] active:scale-95 transition ring-2 ring-blue-100/50"
          aria-expanded={mobileMenuOpen}
          aria-label="Danh mục điều hướng"
        >
          <DashboardIcon name="grid" className="h-5 w-5 text-white" />
        </button>

        <Link href={ROUTES.home} className="flex flex-col text-left leading-tight group">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#0058bc]">NHA KHOA</span>
          <span className="text-sm font-black tracking-tight text-slate-900 group-hover:text-[#0058bc] transition">
            Smart<span className="text-[#0058bc]">Dental</span>
          </span>
        </Link>
      </div>

      {/* Fullscreen Body Portal Drawer (Pharmacity Style matching Image 2) */}
      {mounted &&
        mobileMenuOpen &&
        createPortal(
          <>
            {/* Dark Backdrop Overlay */}
            <div
              className="fixed inset-0 z-[99] bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Full height Slide-over Left Drawer Panel */}
            <div className="fixed inset-y-0 left-0 z-[100] flex h-dvh w-[310px] max-w-[85vw] flex-col bg-white shadow-2xl animate-in slide-in-from-left duration-250 ease-out">
              {/* Header Dark Blue Banner matching Image 2 */}
              <div className="flex items-center justify-between bg-[#0058bc] px-4.5 py-4 text-white shadow-sm shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  {isAuthenticated ? (
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/20 text-xs font-black text-white ring-2 ring-white/30">
                      {initials}
                    </div>
                  ) : (
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/20 text-white ring-2 ring-white/20">
                      <DashboardIcon name="user" className="h-5 w-5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-blue-100">
                      {isAuthenticated ? "Xin chào," : "Hello"}
                    </p>
                    {isAuthenticated ? (
                      <p className="text-sm font-extrabold text-white truncate">
                        {displayName}
                      </p>
                    ) : (
                      <Link
                        href={ROUTES.login}
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-sm font-extrabold text-white hover:underline block truncate"
                      >
                        Đăng nhập/ Đăng ký
                      </Link>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Đóng menu"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-xl font-bold text-white transition hover:bg-white/20 active:scale-95"
                >
                  ✕
                </button>
              </div>

              {/* Sub-banner App Promo Box matching Image 2 */}
              <div className="p-3 bg-blue-50/50 border-b border-slate-100 shrink-0">
                <div className="rounded-xl border border-blue-100 bg-white p-3 shadow-2xs">
                  <p className="text-[11px] font-medium leading-relaxed text-slate-600">
                    Tải ứng dụng Smart Dental để tận hưởng trải nghiệm dịch vụ nha khoa AI tốt hơn và nhận nhiều ưu đãi hấp dẫn.
                  </p>
                  <Link
                    href={ROUTES.appointment}
                    onClick={() => setMobileMenuOpen(false)}
                    className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#0058bc] py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#004899] active:scale-95"
                  >
                    <DashboardIcon name="calendar" className="h-3.5 w-3.5" />
                    Đặt lịch ngay
                  </Link>
                </div>
              </div>

              {/* Vertical Menu Navigation List matching Image 2 */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 bg-white py-1">
                {MOBILE_NAV_ITEMS.map((item) => {
                  const active =
                    item.href === ROUTES.service
                      ? pathname === item.href
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-4.5 py-3.5 text-xs font-extrabold transition ${
                        active
                          ? "bg-blue-50/80 text-[#0058bc]"
                          : "text-slate-700 hover:bg-slate-50 hover:text-[#0058bc]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg transition ${
                            active ? "bg-[#0058bc] text-white shadow-2xs" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <DashboardIcon name={item.icon} className="h-3.5 w-3.5" />
                        </div>
                        <span className="truncate">{item.label}</span>
                      </div>
                      <svg
                        className={`h-4 w-4 shrink-0 transition-transform ${
                          active ? "text-[#0058bc]" : "text-slate-400"
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.2"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  );
                })}
              </div>

              {/* Bottom Phone Contact & Logout Footer matching Image 2 */}
              <div className="border-t border-slate-100 bg-slate-50 p-4 pb-20 sm:pb-4 shrink-0 space-y-3">
                <a
                  href={`tel:${clinicPhone}`}
                  className="flex items-center justify-center gap-2 text-xs font-bold text-slate-700 hover:text-[#0058bc] transition"
                >
                  <svg className="h-4 w-4 text-[#0058bc]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>Đặt khám miễn phí</span>
                  <span className="font-extrabold text-[#0058bc] text-sm">{clinicPhone}</span>
                </a>

                {isAuthenticated && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      void handleLogout();
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50/90 py-2.5 text-xs font-extrabold text-rose-600 transition hover:bg-rose-100 active:scale-95 shadow-2xs"
                  >
                    <DashboardIcon name="logout" className="h-4 w-4 text-rose-500" />
                    <span>Đăng xuất tài khoản</span>
                  </button>
                )}
              </div>
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
