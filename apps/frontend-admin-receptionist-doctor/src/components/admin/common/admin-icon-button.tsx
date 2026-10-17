import type { ReactNode } from "react";
import { cn } from "@/src/lib/utils/cn";

type IconButtonTone = "neutral" | "brand" | "sky" | "amber" | "emerald" | "red";

const tones: Record<IconButtonTone, string> = {
  neutral: "hover:border-slate-200 hover:bg-slate-50 hover:text-slate-800",
  brand: "hover:border-brand/20 hover:bg-brand-light hover:text-brand",
  sky: "hover:border-sky-200 hover:bg-sky-50 hover:text-sky-600",
  amber: "hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600",
  emerald: "hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600",
  red: "hover:border-red-200 hover:bg-red-50 hover:text-red-600",
};

type AdminIconButtonProps = {
  /** Mô tả hành động, dùng cho tooltip và trình đọc màn hình */
  label: string;
  onClick: () => void;
  children: ReactNode;
  tone?: IconButtonTone;
  disabled?: boolean;
};

/** Nút icon nhỏ cho thao tác trên từng dòng của bảng */
export function AdminIconButton({
  label,
  onClick,
  children,
  tone = "brand",
  disabled,
}: AdminIconButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-lg border border-transparent text-slate-500 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-50",
        tones[tone],
      )}
    >
      {children}
    </button>
  );
}

/** Nhóm các nút icon thành một thanh có viền */
export function AdminIconButtonGroup({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs">
      {children}
    </div>
  );
}

export function AdminIconButtonDivider() {
  return <span aria-hidden="true" className="mx-0.5 h-4 w-px bg-slate-200" />;
}
