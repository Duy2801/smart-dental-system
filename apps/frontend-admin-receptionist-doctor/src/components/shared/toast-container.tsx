"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle,
  WarningCircle,
  Warning,
  Info,
  X,
} from "@phosphor-icons/react";
import { toast, ToastItem } from "@/src/lib/toast";

const styleConfig = {
  success: {
    icon: CheckCircle,
    containerClass:
      "border-emerald-200 bg-white text-emerald-950 shadow-emerald-500/10",
    iconClass: "text-emerald-500 bg-emerald-50",
    badge: "Thành công",
    badgeClass: "text-emerald-700 bg-emerald-100/70",
  },
  error: {
    icon: WarningCircle,
    containerClass: "border-rose-200 bg-white text-rose-950 shadow-rose-500/10",
    iconClass: "text-rose-500 bg-rose-50",
    badge: "Lỗi",
    badgeClass: "text-rose-700 bg-rose-100/70",
  },
  warning: {
    icon: Warning,
    containerClass:
      "border-amber-200 bg-white text-amber-950 shadow-amber-500/10",
    iconClass: "text-amber-500 bg-amber-50",
    badge: "Cảnh báo",
    badgeClass: "text-amber-700 bg-amber-100/70",
  },
  info: {
    icon: Info,
    containerClass: "border-sky-200 bg-white text-sky-950 shadow-sky-500/10",
    iconClass: "text-sky-500 bg-sky-50",
    badge: "Thông báo",
    badgeClass: "text-sky-700 bg-sky-100/70",
  },
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return toast.subscribe((updatedToasts) => {
      setToasts(updatedToasts);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Thông báo hệ thống"
      className="fixed top-5 right-5 z-[9999] flex w-full max-w-sm flex-col gap-2.5 pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((item) => {
        const config = styleConfig[item.type] || styleConfig.info;
        const IconComponent = config.icon;

        return (
          <div
            key={item.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-top-3 ${config.containerClass}`}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${config.iconClass}`}
            >
              <IconComponent size={22} weight="fill" />
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${config.badgeClass}`}
                >
                  {config.badge}
                </span>
              </div>
              <p className="text-sm font-medium leading-relaxed text-slate-800 break-words">
                {item.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => toast.dismiss(item.id)}
              className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              title="Đóng thông báo"
            >
              <X size={16} weight="bold" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
