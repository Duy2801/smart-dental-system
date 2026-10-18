import { cn } from "@/src/lib/utils/cn";

type StatusBadgeProps = {
  label: string;
  variant?: "success" | "warning" | "danger" | "neutral" | "brand";
};

const variants = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  danger: "bg-red-50 text-red-600 ring-red-200",
  neutral: "bg-slate-100 text-slate-600 ring-slate-200",
  brand: "bg-brand-light text-brand-dark ring-brand/20",
};

export function StatusBadge({ label, variant = "neutral" }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        variants[variant],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
