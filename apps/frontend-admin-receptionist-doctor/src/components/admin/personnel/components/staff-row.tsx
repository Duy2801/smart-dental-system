"use client";

import { CalendarBlank, LockSimple, LockSimpleOpen, PencilSimple, Phone, Trash } from "@phosphor-icons/react";
import {
  AdminIconButton,
  AdminIconButtonDivider,
  AdminIconButtonGroup,
} from "@/src/components/admin/common";
import { cn } from "@/src/lib/utils/cn";
import { formatDate } from "@/src/lib/utils/date";
import { roleConfig } from "../constants";
import type { Role, StaffUser } from "../types";

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
    <div className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center">
      <div className="flex min-w-0 items-center gap-3 sm:w-[34%] sm:pr-4">
        <div className="relative shrink-0">
          {user.doctorProfile?.avatarUrl ? (
            <img
              src={user.doctorProfile.avatarUrl}
              alt={user.fullName}
              className="h-11 w-11 rounded-full object-cover ring-2 ring-white shadow-sm"
            />
          ) : (
            <span className="grid h-11 w-11 place-items-center rounded-full bg-linear-to-br from-brand-light to-sky-100 text-xs font-extrabold text-brand ring-2 ring-white shadow-sm">
              {initials || "NV"}
            </span>
          )}
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white",
              isActive ? "bg-emerald-500" : "bg-slate-300",
            )}
          />
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-bold text-slate-900">{user.fullName}</span>
          <span className="truncate text-xs text-slate-500">{user.email}</span>
          {user.phone ? (
            <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-500">
              <Phone size={11} />
              {user.phone}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col sm:w-[20%]">
        <span
          className={cn(
            "inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-xs font-bold",
            roleConfig[role].color,
          )}
        >
          {roleConfig[role].label}
        </span>
        {role === "DOCTOR" && user.doctorProfile?.specialization ? (
          <span className="mt-1 truncate text-xs text-slate-500">
            {user.doctorProfile.specialization}
          </span>
        ) : null}
      </div>

      <div className="hidden items-center gap-1.5 text-xs text-slate-600 md:flex md:w-[16%]">
        <CalendarBlank size={13} className="text-slate-400" />
        <span className="font-semibold">{formatDate(user.createdAt)}</span>
      </div>

      <div className="sm:w-[14%]">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold",
            isActive
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700",
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {isActive ? "Hoạt động" : "Bị khóa"}
        </span>
      </div>

      <div className="flex flex-1 sm:justify-end">
        <AdminIconButtonGroup>
          <AdminIconButton label="Chỉnh sửa" onClick={() => onEdit(user)}>
            <PencilSimple size={16} />
          </AdminIconButton>
          <AdminIconButton
            label={isActive ? "Khóa tài khoản" : "Mở khóa"}
            tone={isActive ? "amber" : "emerald"}
            onClick={() => onToggleLock(user)}
          >
            {isActive ? <LockSimple size={16} /> : <LockSimpleOpen size={16} />}
          </AdminIconButton>
          <AdminIconButtonDivider />
          <AdminIconButton label="Vô hiệu hóa nhân viên" tone="red" onClick={() => onRemove(user)}>
            <Trash size={16} />
          </AdminIconButton>
        </AdminIconButtonGroup>
      </div>
    </div>
  );
}
