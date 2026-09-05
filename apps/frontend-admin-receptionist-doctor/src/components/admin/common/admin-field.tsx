import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";
import { cn } from "@/src/lib/utils/cn";

type FieldShellProps = {
  children: ReactNode;
  label: string;
  required?: boolean;
};

function FieldShell({ children, label, required = false }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-brand-dark">
        {label}
        {required && (
          <span className="ml-1 text-rose-500" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

export function AdminSelect({
  label,
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
}) {
  return (
    <FieldShell label={label} required={Boolean(props.required)}>
      <select
        className={cn(
          "h-12 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand disabled:cursor-not-allowed disabled:bg-muted",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
}

export function AdminInput({
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
}) {
  return (
    <FieldShell label={label} required={Boolean(props.required)}>
      <input
        className={cn(
          "h-12 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand",
          className,
        )}
        {...props}
      />
    </FieldShell>
  );
}
