import { cn } from "@/src/lib/utils/cn";
import { formatDate } from "@/src/lib/utils/date";
import { roleConfig } from "../constants";
import type { Role, StaffUser } from "../types";
import { EditIcon, LockIcon, TrashIcon, UnlockIcon } from "./personnel-icons";

type StaffRowProps = {
  onEdit: (user: StaffUser) => void;
  onRemove: (user: StaffUser) => void;
  onToggleLock: (user: StaffUser) => void;
  user: StaffUser;
};

export function StaffRow({
  onEdit,
  onRemove,
  onToggleLock,
  user,
}: StaffRowProps) {
  const role = user.role as Role;
  const isActive = user.status === "ACTIVE";
  const initials = user.fullName
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="group relative flex items-center justify-between p-4 transition-colors hover:bg-muted/20">
      <div className="flex items-center gap-3 pr-4 sm:w-[35%]">
        {user.doctorProfile?.avatarUrl ? (
          <img
            src={user.doctorProfile.avatarUrl}
            alt={user.fullName}
            className="h-11 w-11 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-light text-xs font-bold text-brand">
            {initials || "NV"}
          </span>
        )}
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-brand-dark">
            {user.fullName}
          </span>
          <span className="mt-0.5 truncate text-sm text-muted-foreground">
            {user.email}
          </span>
          {user.phone ? (
            <span className="mt-0.5 text-xs text-muted-foreground">
              SDT: {user.phone}
            </span>
          ) : null}
        </div>
      </div>

      <div className="hidden w-[20%] shrink-0 flex-col sm:flex">
        <span
          className={cn(
            "inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
            roleConfig[role].color,
          )}
        >
          {roleConfig[role].label}
        </span>
        {role === "DOCTOR" ? (
          <span className="ml-1 mt-1.5 text-xs text-muted-foreground">
            {user.doctorProfile?.specialization}
          </span>
        ) : null}
      </div>

      <div className="hidden w-[20%] shrink-0 flex-col text-sm text-muted-foreground md:flex">
        <span className="text-xs">Ngay tham gia</span>
        <span className="text-brand-dark">{formatDate(user.createdAt)}</span>
      </div>

      <div className="flex w-[20%] shrink-0 justify-end sm:justify-start">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
            isActive
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700",
          )}
        >
          {isActive ? "Hoat dong" : "Bi khoa"}
        </span>
      </div>

      <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-lg border border-border bg-white p-1 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
        <button
          type="button"
          title="Chinh sua"
          onClick={() => onEdit(user)}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-brand-light hover:text-brand"
        >
          <EditIcon />
        </button>
        <button
          type="button"
          title={isActive ? "Khoa tai khoan" : "Mo khoa"}
          onClick={() => onToggleLock(user)}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-orange-50 hover:text-orange-600"
        >
          {isActive ? <LockIcon /> : <UnlockIcon />}
        </button>
        <div className="mx-1 h-4 w-px bg-border" />
        <button
          type="button"
          title="Xoa nhan vien"
          onClick={() => onRemove(user)}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}
