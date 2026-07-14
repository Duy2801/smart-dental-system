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
    <div className="flex gap-1 overflow-x-auto border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
            active === tab.id
              ? "border-brand text-brand"
              : "border-transparent text-muted-foreground hover:text-brand-dark",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
