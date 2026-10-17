import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/src/lib/utils/cn";

type AdminButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "plain";
type AdminButtonSize = "sm" | "md";

type AdminButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: AdminButtonVariant;
  size?: AdminButtonSize;
  /** Hiện vòng xoay và khóa nút khi đang xử lý */
  loading?: boolean;
};

const variants: Record<AdminButtonVariant, string> = {
  primary:
    "bg-brand text-white shadow-sm shadow-brand/25 hover:bg-[#0084e0] hover:shadow-md hover:shadow-brand/30",
  secondary:
    "border border-slate-200 bg-white text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900",
  ghost: "text-brand hover:bg-brand-light hover:text-brand-dark",
  danger:
    "border border-red-200 bg-white text-red-600 shadow-2xs hover:border-red-300 hover:bg-red-50",
  /** Không có màu mặc định, tự truyền màu qua className */
  plain: "",
};

const sizes: Record<AdminButtonSize, string> = {
  sm: "h-9 gap-1.5 px-3 text-xs",
  md: "h-11 gap-2 px-4 text-sm",
};

export function AdminButton({
  children,
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  type = "button",
  ...props
}: AdminButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-semibold transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/25 disabled:pointer-events-none disabled:opacity-55",
        sizes[size],
        variants[variant],
        className,
      )}
      {...props}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      ) : null}
      {children}
    </button>
  );
}
