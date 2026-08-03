"use client";

import { useEffect, useState } from "react";
import { DashboardIcon } from "./DashboardIcon";

export type ToastType = "success" | "error" | "info" | "warning";

export type ToastItem = {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
};

type ToastInput = Omit<ToastItem, "id">;

const TOAST_EVENT = "smart-dental-toast";

function emitToast(input: ToastInput) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ToastInput>(TOAST_EVENT, {
      detail: input,
    }),
  );
}

/**
 * Standardized system-wide Toast notification helper.
 * Usage:
 *   toast.success("Áp dụng mã thành công!", "Mã giảm giá đã được thêm vào đơn hàng của bạn.");
 *   toast.error("Lỗi đăng nhập", "Tài khoản hoặc mật khẩu không chính xác.");
 *   toast.info("Thông báo", "Vui lòng hoàn tất thông tin cá nhân.");
 */
export const toast = {
  success: (title: string, description?: string, duration = 4000) =>
    emitToast({ type: "success", title, description, duration }),
  error: (title: string, description?: string, duration = 5000) =>
    emitToast({ type: "error", title, description, duration }),
  info: (title: string, description?: string, duration = 4000) =>
    emitToast({ type: "info", title, description, duration }),
  warning: (title: string, description?: string, duration = 4500) =>
    emitToast({ type: "warning", title, description, duration }),
};

const containerStyles: Record<ToastType, string> = {
  success: "border-emerald-200 bg-white/95 text-emerald-950 shadow-emerald-500/10 ring-1 ring-emerald-500/20",
  error: "border-rose-200 bg-white/95 text-rose-950 shadow-rose-500/10 ring-1 ring-rose-500/20",
  info: "border-blue-200 bg-white/95 text-blue-950 shadow-blue-500/10 ring-1 ring-blue-500/20",
  warning: "border-amber-200 bg-white/95 text-amber-950 shadow-amber-500/10 ring-1 ring-amber-500/20",
};

const badgeStyles: Record<ToastType, string> = {
  success: "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30",
  error: "bg-rose-500 text-white shadow-sm shadow-rose-500/30",
  info: "bg-[#0058bc] text-white shadow-sm shadow-blue-500/30",
  warning: "bg-amber-500 text-white shadow-sm shadow-amber-500/30",
};

const barStyles: Record<ToastType, string> = {
  success: "bg-emerald-500",
  error: "bg-rose-500",
  info: "bg-[#0058bc]",
  warning: "bg-amber-500",
};

const iconNames: Record<ToastType, "sparkles" | "shield" | "info" | "check"> = {
  success: "sparkles",
  error: "shield",
  info: "info",
  warning: "info",
};

export function ToastProvider() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    function handleToast(event: Event) {
      const detail = (event as CustomEvent<ToastInput>).detail;
      const id = crypto.randomUUID();
      const newItem = { ...detail, id };
      setItems((current) => [...current, newItem].slice(-4));

      const timer = window.setTimeout(() => {
        setItems((current) => current.filter((item) => item.id !== id));
      }, detail.duration || 4000);

      return () => window.clearTimeout(timer);
    }

    window.addEventListener(TOAST_EVENT, handleToast);
    return () => window.removeEventListener(TOAST_EVENT, handleToast);
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed right-4 top-20 z-[100] grid w-[min(400px,calc(100vw-2rem))] gap-3 pointer-events-none"
    >
      {items.map((item) => (
        <div
          key={item.id}
          className={`pointer-events-auto relative overflow-hidden flex items-start gap-3.5 rounded-2xl border p-4 shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${containerStyles[item.type]}`}
        >
          <span
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl font-bold ${badgeStyles[item.type]}`}
          >
            <DashboardIcon name={iconNames[item.type]} className="h-5 w-5" />
          </span>

          <div className="min-w-0 flex-1 pr-2 pt-0.5">
            <h4 className="text-xs font-extrabold tracking-tight text-slate-900">
              {item.title}
            </h4>
            {item.description ? (
              <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600">
                {item.description}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() =>
              setItems((current) => current.filter((i) => i.id !== item.id))
            }
            className="grid h-6 w-6 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            aria-label="Đóng thông báo"
          >
            <DashboardIcon name="close" className="h-3.5 w-3.5" />
          </button>

          {/* Bottom Progress Bar Indicator */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100/60 overflow-hidden">
            <div
              className={`h-full w-full animate-toast-progress ${barStyles[item.type]}`}
              style={{ animationDuration: `${item.duration || 4000}ms` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
