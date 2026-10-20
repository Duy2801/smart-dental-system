"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarBlank,
  CalendarCheck,
  ChatsCircle,
  ClipboardText,
  CreditCard,
  FileText,
  GearSix,
  IdentificationCard,
  ListChecks,
  Megaphone,
  Pill,
  Robot,
  SignOut,
  SquaresFour,
  Ticket,
  Tooth,
  UserList,
  UsersThree,
  VideoCamera,
  Wallet,
  X,
  type Icon,
} from "@phosphor-icons/react";
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
  onItemClick?: () => void;
  className?: string;
  onCloseMobile?: () => void;
  /** href -> live count, e.g. pending support-chat conversations. */
  badges?: Record<string, number>;
};

// Icon theo route; khai báo ở client vì component icon không truyền được từ server layout
const NAV_ICONS: Record<string, Icon> = {
  [ROUTES.ADMIN.ROOT]: SquaresFour,
  [ROUTES.ADMIN.USERS]: UsersThree,
  [ROUTES.ADMIN.SCHEDULES]: CalendarBlank,
  [ROUTES.ADMIN.SERVICES]: Tooth,
  [ROUTES.ADMIN.PROMOTIONS]: Ticket,
  [ROUTES.ADMIN.FINANCE]: Wallet,
  [ROUTES.ADMIN.MARKETING]: Megaphone,
  [ROUTES.ADMIN.SETTINGS]: GearSix,
  [ROUTES.RECEPTIONIST.ROOT]: SquaresFour,
  [ROUTES.RECEPTIONIST.APPOINTMENTS]: CalendarCheck,
  [ROUTES.RECEPTIONIST.PATIENTS]: UserList,
  [ROUTES.RECEPTIONIST.CHECK_IN]: IdentificationCard,
  [ROUTES.RECEPTIONIST.BILLING]: CreditCard,
  [ROUTES.RECEPTIONIST.REQUESTS]: ClipboardText,
  [ROUTES.RECEPTIONIST.SUPPORT_INBOX]: ChatsCircle,
  [ROUTES.RECEPTIONIST.AI_ASSISTANT]: Robot,
  [ROUTES.DOCTOR.ROOT]: SquaresFour,
  [ROUTES.DOCTOR.SCHEDULE]: CalendarCheck,
  [ROUTES.DOCTOR.PATIENTS]: UserList,
  [ROUTES.DOCTOR.MEDICAL_RECORDS]: FileText,
  [ROUTES.DOCTOR.PRESCRIPTIONS]: Pill,
  [ROUTES.DOCTOR.TREATMENT_PLANS]: ListChecks,
  [ROUTES.DOCTOR.CONSULTATIONS]: VideoCamera,
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

export function Sidebar({
  title,
  items,
  pathname,
  onItemClick,
  className,
  onCloseMobile,
  badges,
}: SidebarProps) {
  const router = useRouter();

  const handleLogout = () => {
    ["access_token", "refresh_token", "role", "session", "user_info"].forEach(
      removeCookie,
    );
    if (onItemClick) onItemClick();
    router.replace(ROUTES.LOGIN);
    router.refresh();
  };

  return (
    <aside
      className={cn(
        "flex w-64 shrink-0 flex-col bg-linear-to-b from-brand-dark to-[#001a63] text-white",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
        <ClinicSidebarBrand title={title} />
        {onCloseMobile ? (
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-white/75 transition-colors hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Đóng menu"
          >
            <X size={20} />
          </button>
        ) : null}
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
          Danh mục
        </p>
        {items.map((item) => {
          const isActive = isNavItemActive(pathname, item.href);
          const badgeCount = badges?.[item.href] ?? 0;
          const ItemIcon = NAV_ICONS[item.href] ?? SquaresFour;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-white/12 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                  : "text-white/70 hover:bg-white/8 hover:text-white",
              )}
            >
              {isActive ? (
                <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand" />
              ) : null}
              <span
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors",
                  isActive
                    ? "bg-brand text-white shadow-md shadow-brand/30"
                    : "bg-white/5 text-white/70 group-hover:bg-white/10 group-hover:text-white",
                )}
              >
                <ItemIcon size={17} weight={isActive ? "fill" : "regular"} />
              </span>
              <span className="flex-1 truncate">{item.label}</span>
              {badgeCount > 0 ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                  {badgeCount > 99 ? "99+" : badgeCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-white/70 transition-colors hover:bg-rose-500/15 hover:text-rose-200"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/5 transition-colors group-hover:bg-rose-500/20">
            <SignOut size={17} />
          </span>
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
