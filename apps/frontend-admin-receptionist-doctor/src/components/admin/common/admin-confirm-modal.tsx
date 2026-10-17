"use client";

import { useEffect, type ReactNode } from "react";
import { Megaphone, Trash, WarningCircle } from "@phosphor-icons/react";
import { cn } from "@/src/lib/utils/cn";
import { AdminButton } from "./admin-button";

export type AdminConfirmModalProps = {
  isOpen: boolean;
  title: string;
  description: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "primary";
  isLoading?: boolean;
  /** Thay icon mặc định của variant */
  icon?: ReactNode;
  /** Ẩn/hiện icon ở modal */
  showIcon?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
};

const variantStyles = {
  danger: {
    icon: Trash,
    iconBox: "bg-red-50 text-red-600 ring-red-100",
    confirm: "bg-red-600 text-white shadow-sm shadow-red-600/25 hover:bg-red-700",
  },
  warning: {
    icon: WarningCircle,
    iconBox: "bg-amber-50 text-amber-600 ring-amber-100",
    confirm: "bg-amber-500 text-white shadow-sm shadow-amber-500/25 hover:bg-amber-600",
  },
  primary: {
    icon: Megaphone,
    iconBox: "bg-brand-light text-brand ring-brand/10",
    confirm: "bg-brand text-white shadow-sm shadow-brand/25 hover:bg-[#0084e0]",
  },
} as const;

export function AdminConfirmModal({
  isOpen,
  title,
  description,
  confirmText = "Xác nhận",
  cancelText = "Hủy bỏ",
  variant = "primary",
  isLoading = false,
  icon,
  showIcon = false,
  onConfirm,
  onClose,
}: AdminConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoading) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const style = variantStyles[variant];
  const VariantIcon = style.icon;
  const hasIcon = Boolean(showIcon);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Đóng"
        tabIndex={-1}
        className="absolute inset-0 animate-overlay-in bg-slate-950/50 backdrop-blur-sm"
        onClick={onClose}
        disabled={isLoading}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        className="relative w-full max-w-md animate-modal-in overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5"
      >
        {hasIcon ? (
          <div className="flex items-start gap-4 p-6">
            <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-2xl ring-4", style.iconBox)}>
              {icon ?? <VariantIcon size={24} weight="duotone" />}
            </span>
            <div className="min-w-0 flex-1 space-y-1.5 pt-0.5">
              <h3 className="text-lg font-bold leading-snug text-slate-900">{title}</h3>
              <div className="text-sm leading-relaxed text-slate-600">{description}</div>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-2">
            <h3 className="text-lg font-bold leading-snug text-slate-900">{title}</h3>
            <div className="text-sm leading-relaxed text-slate-600">{description}</div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
          <AdminButton variant="secondary" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </AdminButton>
          <AdminButton
            onClick={onConfirm}
            loading={isLoading}
            className={style.confirm}
            variant="plain"
          >
            {isLoading ? "Đang xử lý..." : confirmText}
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
