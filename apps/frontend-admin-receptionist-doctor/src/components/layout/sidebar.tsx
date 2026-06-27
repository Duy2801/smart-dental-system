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

export function Sidebar({ title, items, pathname }: SidebarProps) {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 px-6 py-5 dark:border-zinc-800">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          {siteConfig.name}
        </p>
        <h2 className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {title}
        </h2>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
        <Link
          href={ROUTES.LOGIN}
          className="block rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
        >
          Đăng xuất
        </Link>
      </div>
    </aside>
  );
}
