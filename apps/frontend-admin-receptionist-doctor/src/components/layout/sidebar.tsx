import Link from "next/link";
import { ROUTES } from "@/src/constants/routes";
import { siteConfig } from "@/src/config/site";
import { cn } from "@/src/lib/utils/cn";

type NavItem = {
  label: string;
  href: string;
};

type SidebarProps = {
  title: string;
  items: NavItem[];
  pathname: string;
};

/** Route gốc dashboard chỉ active khi pathname khớp chính xác (tránh /admin/* làm sáng "Tổng quan"). */
function isNavItemActive(pathname: string, href: string) {
  if (pathname === href) return true;

  const exactOnlyRoots = ["/admin", "/receptionist", "/doctor"];
  if (exactOnlyRoots.includes(href)) return false;

  return pathname.startsWith(`${href}/`);
}

export function Sidebar({ title, items, pathname }: SidebarProps) {
  return (
    <aside className="flex w-64 shrink-0 flex-col bg-brand-dark text-white">
      <div className="border-b border-white/10 px-6 py-5">
        <p className="text-xs font-medium uppercase tracking-wide text-white/60">
          {siteConfig.name}
        </p>
        <h2 className="mt-1 text-lg font-semibold text-white">{title}</h2>
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
      </nav>
      <div className="border-t border-white/10 p-4">
        <Link
          href={ROUTES.LOGIN}
          className="block rounded-lg px-3 py-2 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
        >
          Đăng xuất
        </Link>
      </div>
    </aside>
  );
}
