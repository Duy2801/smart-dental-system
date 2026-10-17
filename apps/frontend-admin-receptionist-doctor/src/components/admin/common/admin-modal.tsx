"use client";

import { useEffect, useId, type ReactNode } from "react";
import { X } from "@phosphor-icons/react";
import { cn } from "@/src/lib/utils/cn";

type AdminModalSize = "sm" | "md" | "lg" | "xl";

type AdminModalProps = {
  children: ReactNode;
  description?: ReactNode;
  onClose: () => void;
  title: ReactNode;
  /** Icon nhỏ hiển thị cạnh tiêu đề */
  icon?: ReactNode;
  size?: AdminModalSize;
  /** Thanh nút cố định ở đáy modal (dùng thuộc tính form="id" để submit form bên trong) */
  footer?: ReactNode;
};

const sizes: Record<AdminModalSize, string> = {
  sm: "max-w-lg",
  md: "max-w-2xl",
  lg: "max-w-3xl",
  xl: "max-w-4xl",
};

export function AdminModal({
  children,
  description,
  onClose,
  title,
  icon,
  size = "xl",
  footer,
}: AdminModalProps) {
  const titleId = useId();

  // Đóng bằng phím Esc và khóa cuộn trang nền khi modal mở
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Đóng"
        tabIndex={-1}
        className="absolute inset-0 animate-overlay-in bg-slate-950/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative flex max-h-[92vh] w-full animate-modal-in flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5",
          sizes[size],
        )}
      >
        <div className="flex shrink-0 items-start gap-3 border-b border-slate-100 px-6 py-5">
          {icon ? (
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-light text-brand">
              {icon}
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <h3 id={titleId} className="text-lg font-bold leading-snug text-slate-900">
              {title}
            </h3>
            {description ? (
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="-mr-1.5 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-1">
          {children}
        </div>

        {footer ? (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
