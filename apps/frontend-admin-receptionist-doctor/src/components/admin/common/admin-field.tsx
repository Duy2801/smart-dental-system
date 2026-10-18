"use client";

import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { CaretDown } from "@phosphor-icons/react";
import { cn } from "@/src/lib/utils/cn";

/** Class dùng chung cho mọi ô nhập liệu (không gồm chiều cao/rộng để nơi dùng tự đặt) */
export const adminControlClass =
  "rounded-xl border bg-white px-3.5 text-sm text-slate-900 shadow-2xs outline-none transition placeholder:text-slate-400 focus:ring-3 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

/** Màu viền theo trạng thái (tách riêng để không trùng class) */
export function adminControlTone(hasError = false) {
  return hasError
    ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
    : "border-slate-200 hover:border-slate-300 focus:border-brand focus:ring-brand/15";
}

type FieldShellProps = {
  children: ReactNode;
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
};

function FieldShell({ children, label, htmlFor, required = false, hint, error }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[13px] font-semibold text-slate-700">
        {label}
        {required && (
          <span className="ml-1 text-rose-500" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-rose-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

type ExtraFieldProps = {
  label: string;
  hint?: ReactNode;
  error?: ReactNode;
};

export function AdminSelect({
  label,
  hint,
  error,
  className,
  children,
  id,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & ExtraFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;

  return (
    <FieldShell label={label} htmlFor={fieldId} required={Boolean(props.required)} hint={hint} error={error}>
      <div className="relative">
        <select
          id={fieldId}
          aria-invalid={error ? true : undefined}
          className={cn(
            adminControlClass,
            "h-11 w-full cursor-pointer appearance-none pr-10",
            adminControlTone(Boolean(error)),
            className,
          )}
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
    </FieldShell>
  );
}

export function AdminInput({
  label,
  hint,
  error,
  className,
  onChange,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & ExtraFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (props.type === "number") {
      // Bỏ số 0 thừa ở đầu, ví dụ "036" -> "36", nhưng vẫn giữ một số "0"
      if (event.target.value.length > 1 && /^0\d+/.test(event.target.value)) {
        event.target.value = event.target.value.replace(/^0+(?=\d)/, "");
      }
    }
    onChange?.(event);
  };

  return (
    <FieldShell label={label} htmlFor={fieldId} required={Boolean(props.required)} hint={hint} error={error}>
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        className={cn(
          adminControlClass,
          "h-11 w-full",
          adminControlTone(Boolean(error)),
          className,
        )}
        onChange={handleChange}
        {...props}
      />
    </FieldShell>
  );
}

/** Nhóm các trường trong form, có tiêu đề nhỏ và mô tả */
export function AdminFormSection({
  title,
  description,
  icon,
  children,
  className,
}: {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={cn("space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4 sm:p-5", className)}>
      <legend className="sr-only">{title}</legend>
      <div className="flex items-start gap-2.5">
        {icon ? (
          <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-light text-brand">
            {icon}
          </span>
        ) : null}
        <div>
          <p className="text-sm font-bold text-slate-900">{title}</p>
          {description ? <p className="mt-0.5 text-xs text-slate-500">{description}</p> : null}
        </div>
      </div>
      {children}
    </fieldset>
  );
}
