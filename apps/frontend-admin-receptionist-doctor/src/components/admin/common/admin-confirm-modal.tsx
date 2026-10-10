import type { ReactNode } from "react";
import { AdminButton } from "./admin-button";

export type AdminConfirmModalProps = {
  isOpen: boolean;
  title: string;
  description: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "primary";
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
};

export function AdminConfirmModal({
  isOpen,
  title,
  description,
  confirmText = "Xác nhận",
  cancelText = "Hủy bỏ",
  variant = "primary",
  isLoading = false,
  onConfirm,
  onClose,
}: AdminConfirmModalProps) {
  if (!isOpen) return null;

  const iconContainerClass = {
    danger: "bg-red-100 text-red-600",
    warning: "bg-amber-100 text-amber-600",
    primary: "bg-blue-100 text-blue-600",
  }[variant];

  const confirmButtonClass = {
    danger: "bg-red-600 text-white hover:bg-red-700",
    warning: "bg-amber-600 text-white hover:bg-amber-700",
    primary: "bg-brand text-white hover:bg-brand-dark",
  }[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Đóng"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        disabled={isLoading}
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-4">
          <div
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${iconContainerClass}`}
          >
            {variant === "danger" ? (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            ) : variant === "warning" ? (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                />
              </svg>
            )}
          </div>
          <div className="flex-1 space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900 leading-snug">{title}</h3>
            <div className="text-sm text-slate-600 leading-relaxed">{description}</div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-2">
          <AdminButton
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="h-10 px-4 text-xs font-semibold"
          >
            {cancelText}
          </AdminButton>
          <AdminButton
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`h-10 px-5 text-xs font-semibold ${confirmButtonClass}`}
          >
            {isLoading ? "Đang xử lý..." : confirmText}
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
