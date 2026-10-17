"use client";

import { CheckCircle, Info, WarningCircle, XCircle } from "@phosphor-icons/react";
import { cn } from "@/src/lib/utils/cn";

type AdminAlertVariant = "error" | "success" | "warning" | "info";

type AdminAlertProps = {
  message: string | null;
  variant?: AdminAlertVariant;
};

const styles = {
  error: { box: "border-red-200 bg-red-50 text-red-700", icon: XCircle, iconClass: "text-red-500" },
  success: { box: "border-emerald-200 bg-emerald-50 text-emerald-800", icon: CheckCircle, iconClass: "text-emerald-500" },
  warning: { box: "border-amber-200 bg-amber-50 text-amber-800", icon: WarningCircle, iconClass: "text-amber-500" },
  info: { box: "border-sky-200 bg-sky-50 text-sky-800", icon: Info, iconClass: "text-sky-500" },
} as const;

export function AdminAlert({ message, variant = "error" }: AdminAlertProps) {
  if (!message) return null;
  const { box, icon: AlertIcon, iconClass } = styles[variant];

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn("flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium", box)}
    >
      <AlertIcon size={18} weight="fill" className={cn("mt-px shrink-0", iconClass)} />
      <span className="leading-relaxed">{message}</span>
    </div>
  );
}
