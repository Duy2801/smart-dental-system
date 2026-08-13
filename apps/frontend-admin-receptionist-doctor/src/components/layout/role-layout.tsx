"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/src/components/layout/sidebar";

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

  return (
    <div className="flex h-screen overflow-hidden bg-muted">
      <Sidebar title={title} items={items} pathname={pathname} />
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
