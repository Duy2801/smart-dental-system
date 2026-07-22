import { cn } from "@/src/lib/utils/cn";

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"
  | "RESCHEDULED";

const STATUS_MAP: Record<
  AppointmentStatus,
  { label: string; className: string; pulse?: boolean }
> = {
  PENDING: {
    label: "Chờ xác nhận",
    className: "bg-amber-50 text-amber-700 ring-amber-600/20",
  },
  CONFIRMED: {
    label: "Đã xác nhận",
    className: "bg-blue-50 text-blue-700 ring-blue-600/20",
  },
  CHECKED_IN: {
    label: "Đã Check-in",
    className: "bg-brand-light text-brand ring-brand/20",
    pulse: true,
  },
  IN_PROGRESS: {
    label: "Đang khám",
    className: "bg-violet-50 text-violet-700 ring-violet-600/20",
  },
  COMPLETED: {
    label: "Hoàn thành",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  },
  CANCELLED: {
    label: "Đã hủy",
    className: "bg-slate-100 text-slate-600 ring-slate-500/10",
  },
  NO_SHOW: {
    label: "Vắng mặt",
    className: "bg-red-50 text-red-700 ring-red-600/10",
  },
  RESCHEDULED: {
    label: "Đổi lịch",
    className: "bg-orange-50 text-orange-700 ring-orange-600/20",
  },
};

interface AppointmentStatusBadgeProps {
  status: AppointmentStatus;
  className?: string;
}

export function AppointmentStatusBadge({
  status,
  className,
}: AppointmentStatusBadgeProps) {
  const { label, className: statusClass, pulse } = STATUS_MAP[status] ?? {
    label: status,
    className: "bg-slate-100 text-slate-600 ring-slate-500/10",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-wider ring-1 ring-inset",
        statusClass,
        pulse && "animate-pulse",
        className,
      )}
    >
      {label}
    </span>
  );
}
