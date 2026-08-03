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
      className={`flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#0863c5] px-4 text-sm font-bold text-white shadow-[0_5px_14px_rgba(8,99,197,0.22)] transition hover:bg-[#0756aa] focus:outline-none focus:ring-4 focus:ring-blue-200 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-65 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
