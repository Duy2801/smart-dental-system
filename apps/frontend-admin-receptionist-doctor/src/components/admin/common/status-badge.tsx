import { cn } from "@/src/lib/utils/cn";

type StatusBadgeProps = {
  label: string;
  variant?: "success" | "warning" | "danger" | "neutral" | "brand";
};

const variants = {
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-600",
  neutral: "bg-zinc-100 text-zinc-600",
  brand: "bg-brand-light text-brand-dark",
};

export function StatusBadge({ label, variant = "neutral" }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
      )}
    >
      {label}
    </span>
  );
}
