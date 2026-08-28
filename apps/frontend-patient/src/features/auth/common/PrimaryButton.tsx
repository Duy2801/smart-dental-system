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
      className={`group relative flex h-10 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#0863c5] via-blue-600 to-indigo-600 px-4 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-600/25 transition-all duration-200 hover:brightness-110 hover:shadow-lg hover:shadow-blue-600/35 focus:outline-none focus:ring-3 focus:ring-blue-500/20 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-65 disabled:shadow-none ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
