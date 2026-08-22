import type { ButtonHTMLAttributes, ReactNode } from "react";

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function PrimaryButton({
  children,
  className = "",
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      type="submit"
      className={`group relative flex h-9.5 w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm shadow-blue-500/25 transition-all duration-200 hover:bg-blue-700 hover:shadow-md hover:shadow-blue-500/30 focus:outline-none focus:ring-3 focus:ring-blue-500/20 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
