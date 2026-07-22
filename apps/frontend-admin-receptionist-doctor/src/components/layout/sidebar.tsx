"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/src/constants/routes";
import { cn } from "@/src/lib/utils/cn";
import { ClinicSidebarBrand } from "./clinic-brand";

type NavItem = {
  label: string;
  href: string;
};

type SidebarProps = {
  title: string;
  items: NavItem[];
  pathname: string;
};

function isNavItemActive(pathname: string, href: string) {
  if (pathname === href) return true;

  const exactOnlyRoots = ["/admin", "/receptionist", "/doctor"];
  if (exactOnlyRoots.includes(href)) return false;

  return pathname.startsWith(`${href}/`);
}

function removeCookie(name: string) {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

export function Sidebar({ title, items, pathname }: SidebarProps) {
  const router = useRouter();

  const handleLogout = () => {
    ["access_token", "refresh_token", "role", "session", "user_info"].forEach(
      removeCookie,
    );
    router.replace(ROUTES.LOGIN);
    router.refresh();
  };

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-brand-dark text-white">
      <div className="border-b border-white/10 px-6 py-5">
        <ClinicSidebarBrand title={title} />
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
        {items.map((item) => {
          const isActive = isNavItemActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand text-white"
                  : "text-white/75 hover:bg-white/10 hover:text-white",
              )}
            >
              {item.label}
            </Link>
          );
        })}

        <button
          type="button"
          onClick={handleLogout}
          className="mt-1 rounded-lg px-3 py-2 text-left text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
        >
          Đăng xuất
        </button>
      </nav>
    </aside>
  );
}
