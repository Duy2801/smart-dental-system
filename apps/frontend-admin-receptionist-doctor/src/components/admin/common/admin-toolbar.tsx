"use client";

import type { ReactNode, SelectHTMLAttributes } from "react";
import { CaretDown, Funnel, MagnifyingGlass, X } from "@phosphor-icons/react";
import { cn } from "@/src/lib/utils/cn";

const toolbarControlClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-brand focus:bg-white focus:ring-3 focus:ring-brand/15";

/** Khung thanh công cụ (tìm kiếm + bộ lọc + nút chính) dùng chung */
export function AdminToolbar({
  children,
  actions,
  className,
}: {
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs lg:flex-row lg:items-center lg:justify-between",
        className,
      )}
    >
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">{children}</div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

type AdminSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
};

export function AdminSearchInput({
  value,
  onChange,
  placeholder = "Tìm kiếm...",
  className,
  ariaLabel,
}: AdminSearchInputProps) {
  return (
    <div className={cn("relative", className ?? "w-full sm:max-w-sm")}>
      <MagnifyingGlass
        size={16}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={cn(toolbarControlClass, "pl-10 pr-9")}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Xóa từ khóa"
          className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
        >
          <X size={13} weight="bold" />
        </button>
      ) : null}
    </div>
  );
}

type AdminFilterSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  /** Icon bên trái, mặc định là phễu lọc */
  icon?: ReactNode;
  /** Thay chiều rộng mặc định (w-full sm:w-52) */
  wrapperClassName?: string;
};

export function AdminFilterSelect({
  icon,
  wrapperClassName,
  className,
  children,
  ...props
}: AdminFilterSelectProps) {
  return (
    <div className={cn("relative", wrapperClassName ?? "w-full sm:w-52")}>
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
        {icon ?? <Funnel size={15} />}
      </span>
      <select
        className={cn(toolbarControlClass, "cursor-pointer appearance-none pl-10 pr-9", className)}
        {...props}
      >
        {children}
      </select>
      <CaretDown
        size={14}
        weight="bold"
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}
