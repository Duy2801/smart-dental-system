"use client";

import { Clock, GearSix } from "@phosphor-icons/react";
import { cn } from "@/src/lib/utils/cn";
import { settingsMenuItems } from "../constants";
import type { SettingsTab } from "../types";

type SettingsSidebarProps = {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
};

const descriptions: Record<string, string> = {
  general: "Tên, logo và thông tin liên hệ",
  hours: "Giờ mở cửa, nghỉ trưa, ngày lễ",
};

export function SettingsSidebar({
  activeTab,
  onTabChange,
}: SettingsSidebarProps) {
  return (
    <aside className="w-full shrink-0 lg:w-72">
      <p className="mb-3 px-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        Cài đặt hệ thống
      </p>
      <nav className="flex gap-2 overflow-x-auto lg:flex-col">
        {settingsMenuItems.map((item) => {
          const isActive = activeTab === item.id;
          const ItemIcon = item.icon === "clock" ? Clock : GearSix;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-w-56 items-center gap-3 rounded-2xl border p-3 text-left transition-all lg:min-w-0",
                isActive
                  ? "border-brand/30 bg-white shadow-sm ring-1 ring-brand/20"
                  : "border-transparent hover:border-slate-200 hover:bg-white",
              )}
            >
              <span
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors",
                  isActive ? "bg-brand text-white shadow-md shadow-brand/25" : "bg-slate-100 text-slate-500",
                )}
              >
                <ItemIcon size={20} weight={isActive ? "fill" : "regular"} />
              </span>
              <span className="min-w-0">
                <span className={cn("block text-sm font-bold", isActive ? "text-brand" : "text-slate-800")}>
                  {item.label}
                </span>
                <span className="block truncate text-xs text-slate-500">{descriptions[item.id]}</span>
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
