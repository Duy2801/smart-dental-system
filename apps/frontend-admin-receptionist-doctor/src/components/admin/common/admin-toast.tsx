"use client";

import { useSyncExternalStore } from "react";
import { CheckCircle, Info, WarningCircle, X, XCircle } from "@phosphor-icons/react";
import { cn } from "@/src/lib/utils/cn";

export type AdminToastVariant = "error" | "success" | "warning" | "info";

type ToastItem = {
  id: number;
  message: string;
  variant: AdminToastVariant;
};

const styles = {
  error: { icon: XCircle, iconClass: "text-red-500", bar: "bg-red-500" },
  success: { icon: CheckCircle, iconClass: "text-emerald-500", bar: "bg-emerald-500" },
  warning: { icon: WarningCircle, iconClass: "text-amber-500", bar: "bg-amber-500" },
  info: { icon: Info, iconClass: "text-sky-500", bar: "bg-sky-500" },
} as const;

const MAX_TOASTS = 4;
const DEDUPE_WINDOW_MS = 800;

// Store toast dùng chung cho toàn bộ trang admin (không cần Provider)
let toasts: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const recentMessages = new Map<string, number>();
const emptyToasts: ToastItem[] = [];

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function dismissAdminToast(id: number) {
  toasts = toasts.filter((toast) => toast.id !== id);
  emit();
}

/** Hiện thông báo dạng toast ở góc trên bên phải */
export function showAdminToast(message: string, variant: AdminToastVariant = "success") {
  if (!message) return;

  // Tránh hiện trùng (vd. effect chạy 2 lần trong StrictMode)
  const key = `${variant}:${message}`;
  const now = Date.now();
  const last = recentMessages.get(key);
  if (last && now - last < DEDUPE_WINDOW_MS) return;
  recentMessages.set(key, now);

  const id = nextId++;
  toasts = [...toasts, { id, message, variant }].slice(-MAX_TOASTS);
  emit();

  const duration = variant === "error" || variant === "warning" ? 6000 : 4000;
  window.setTimeout(() => dismissAdminToast(id), duration);
}

export function AdminToaster() {
  const items = useSyncExternalStore(
    subscribe,
    () => toasts,
    () => emptyToasts,
  );

  if (items.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed right-4 top-4 z-100 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2.5"
    >
      {items.map((toast) => {
        const { icon: ToastIcon, iconClass, bar } = styles[toast.variant];
        return (
          <div
            key={toast.id}
            role={toast.variant === "error" ? "alert" : "status"}
            className="pointer-events-auto relative flex animate-toast-in items-start gap-3 overflow-hidden rounded-xl border border-slate-200/80 bg-white py-3 pl-4 pr-3 text-sm font-medium text-slate-800 shadow-lg shadow-slate-900/10"
          >
            <span className={cn("absolute inset-y-0 left-0 w-1", bar)} />
            <ToastIcon size={20} weight="fill" className={cn("mt-px shrink-0", iconClass)} />
            <span className="min-w-0 flex-1 leading-relaxed">{toast.message}</span>
            <button
              type="button"
              aria-label="Đóng thông báo"
              onClick={() => dismissAdminToast(toast.id)}
              className="-mr-1 grid h-6 w-6 shrink-0 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={14} weight="bold" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
