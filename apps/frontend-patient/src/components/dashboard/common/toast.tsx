"use client";

import { useEffect, useState } from "react";
import { DashboardIcon } from "./DashboardIcon";

type ToastType = "success" | "error" | "info";

type ToastItem = {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
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

export const toast = {
  success: (title: string, description?: string) =>
    emitToast({ type: "success", title, description }),
  error: (title: string, description?: string) =>
    emitToast({ type: "error", title, description }),
  info: (title: string, description?: string) =>
    emitToast({ type: "info", title, description }),
};

const toastStyles: Record<ToastType, string> = {
  success: "border-emerald-100 bg-emerald-50 text-emerald-800",
  error: "border-rose-100 bg-rose-50 text-rose-800",
  info: "border-blue-100 bg-blue-50 text-blue-800",
};

const iconStyles: Record<ToastType, string> = {
  success: "bg-emerald-100 text-emerald-600",
  error: "bg-rose-100 text-rose-600",
  info: "bg-blue-100 text-blue-600",
};

export function ToastProvider() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    function handleToast(event: Event) {
      const detail = (event as CustomEvent<ToastInput>).detail;
      const id = crypto.randomUUID();
      setItems((current) => [...current, { ...detail, id }].slice(-4));
      window.setTimeout(() => {
        setItems((current) => current.filter((item) => item.id !== id));
      }, 4200);
    }

    window.addEventListener(TOAST_EVENT, handleToast);
    return () => window.removeEventListener(TOAST_EVENT, handleToast);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed right-4 top-20 z-[80] grid w-[min(380px,calc(100vw-2rem))] gap-3">
      {items.map((item) => (
        <div
          key={item.id}
          className={`flex gap-3 rounded-2xl border p-4 shadow-xl shadow-slate-200/70 backdrop-blur ${toastStyles[item.type]}`}
        >
          <span
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${iconStyles[item.type]}`}
          >
            <DashboardIcon
              name={item.type === "error" ? "shield" : "sparkles"}
              className="h-4 w-4"
            />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold">{item.title}</p>
            {item.description ? (
              <p className="mt-1 text-xs leading-5 opacity-80">
                {item.description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() =>
              setItems((current) =>
                current.filter((currentItem) => currentItem.id !== item.id),
              )
            }
            className="ml-auto text-sm font-bold opacity-50 transition hover:opacity-90"
            aria-label="Đóng thông báo"
          >
            x
          </button>
        </div>
      ))}
    </div>
  );
}
