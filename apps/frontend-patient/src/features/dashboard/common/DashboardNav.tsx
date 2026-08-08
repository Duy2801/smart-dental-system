"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { DashboardIcon } from "./DashboardIcon";
import { MAIN_NAV, ROUTES, buildRoute } from "./routes";

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [homeSearchDocked, setHomeSearchDocked] = useState(false);
  const [keyword, setKeyword] = useState("");

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

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(buildRoute.serviceSearch(keyword));
  }

  if (pathname === ROUTES.home && homeSearchDocked) {
    return (
      <form
        onSubmit={handleSearch}
        className="hidden h-12 w-[min(46vw,560px)] items-center gap-3 rounded-full border border-blue-100 bg-blue-50/80 px-4 shadow-sm md:flex"
      >
        <DashboardIcon name="search" className="h-5 w-5 text-[#0863c5]" />
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
          placeholder="Bạn đang tìm kiếm dịch vụ gì?"
          aria-label="Tìm kiếm dịch vụ nha khoa"
        />
        {/* <button
          type="submit"
          className="rounded-full bg-[#0863c5] px-4 py-2 text-xs font-black uppercase text-white transition hover:bg-[#064e9b]"
        >
          Tìm
        </button> */}
      </form>
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
            className={`relative flex h-full items-center px-1 text-sm font-semibold transition-colors duration-200 hover:text-[#0863c5] ${active ? "text-[#0863c5] font-bold" : "text-slate-600"
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
