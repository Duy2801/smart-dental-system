import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/src/lib/utils/cn";

type AdminButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type AdminButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: AdminButtonVariant;
};

const variants: Record<AdminButtonVariant, string> = {
  primary: "bg-brand text-white hover:bg-brand-dark",
  secondary: "border border-border bg-white text-brand-dark hover:bg-muted",
  ghost: "text-brand hover:text-brand-dark",
  danger: "border border-border bg-white text-red-500 hover:bg-red-50",
};

export function AdminButton({
  children,
  className,
  variant = "primary",
  type = "button",
  ...props
}: AdminButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
