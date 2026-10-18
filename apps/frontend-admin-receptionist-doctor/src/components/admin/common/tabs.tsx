"use client";

import { cn } from "@/src/lib/utils/cn";

type Tab = { id: string; label: string };

type TabsProps = {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
};

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div
      role="tablist"
      className="inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-100/80 p-1"
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30",
              isActive
                ? "bg-white text-brand shadow-sm ring-1 ring-slate-900/5"
                : "text-slate-500 hover:bg-white/60 hover:text-slate-800",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
