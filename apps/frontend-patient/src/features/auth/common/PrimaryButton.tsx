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
      className={`group relative flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#0863c5] to-[#0284c7] px-4 text-xs sm:text-sm font-bold text-white shadow-sm shadow-blue-600/20 transition-all duration-200 hover:from-[#0756ad] hover:to-[#0369a1] hover:shadow-md hover:shadow-blue-600/25 focus:outline-none focus:ring-4 focus:ring-blue-500/15 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-65 disabled:shadow-none ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
