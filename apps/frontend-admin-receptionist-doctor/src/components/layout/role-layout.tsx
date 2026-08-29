"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { List, X } from "@phosphor-icons/react";
import { Sidebar } from "@/src/components/layout/sidebar";
import { ClinicSidebarBrand } from "./clinic-brand";

type NavItem = {
  label: string;
  href: string;
};

type RoleLayoutProps = {
  title: string;
  items: NavItem[];
  children: React.ReactNode;
};

export function RoleLayout({ title, items, children }: RoleLayoutProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Auto close mobile menu drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-muted flex-col md:flex-row">
      {/* Mobile Top Header Bar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-brand-dark px-4 py-3 text-white md:hidden shrink-0">
        <ClinicSidebarBrand title={title} />
        <button
          type="button"
          onClick={() => setIsMobileOpen((prev) => !prev)}
          className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          {isMobileOpen ? <X size={24} /> : <List size={24} />}
        </button>
      </div>

      {/* Mobile Sidebar Slide-over Drawer */}
      {isMobileOpen ? (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative z-10 flex w-72 max-w-[80vw] flex-col bg-brand-dark text-white shadow-2xl h-full">
            <Sidebar
              title={title}
              items={items}
              pathname={pathname}
              onItemClick={() => setIsMobileOpen(false)}
              onCloseMobile={() => setIsMobileOpen(false)}
              className="w-full h-full flex-1"
            />
          </div>
        </div>
      ) : null}


      {/* Desktop Permanent Sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar title={title} items={items} pathname={pathname} />
      </div>

      {/* Main Page Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}

