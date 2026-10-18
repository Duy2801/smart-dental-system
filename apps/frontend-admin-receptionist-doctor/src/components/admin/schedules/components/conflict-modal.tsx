"use client";

import { CalendarX, Clock, Phone, WarningCircle } from "@phosphor-icons/react";
import { AdminButton, AdminModal } from "@/src/components/admin/common";
import type { AppointmentConflictItem } from "../types";

type ConflictModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirmForce: () => void;
  conflicts: AppointmentConflictItem[];
  actionName: string;
};

export function ConflictModal({
  isOpen,
  onClose,
  onConfirmForce,
  conflicts,
  actionName,
}: ConflictModalProps) {
  if (!isOpen) return null;

  return (
    <AdminModal
      onClose={onClose}
      title="Xung đột với lịch hẹn của bệnh nhân"
      icon={<CalendarX size={20} weight="duotone" />}
      size="md"
      footer={
        <>
          <AdminButton variant="secondary" onClick={onClose}>
            Hủy bỏ
          </AdminButton>
          <AdminButton variant="plain" onClick={onConfirmForce} className="bg-rose-600 text-white shadow-sm shadow-rose-600/25 hover:bg-rose-700">
            Vẫn tiếp tục lưu
          </AdminButton>
        </>
      }
    >
      <div className="mt-4 space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900">
          <WarningCircle size={18} weight="fill" className="mt-0.5 shrink-0 text-amber-500" />
          <div>
            <p className="font-semibold">
              Thao tác &quot;{actionName}&quot; xung đột với {conflicts.length} lịch hẹn hiện có.
            </p>
            <p className="mt-1 text-xs text-amber-800">
              Bạn có thể vẫn lưu và liên hệ sắp xếp lại lịch hẹn cho các bệnh nhân bên dưới.
            </p>
          </div>
        </div>

        <ul className="custom-scrollbar max-h-72 space-y-2 overflow-y-auto pr-1">
          {conflicts.map((item) => (
            <li key={item.id} className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-bold text-slate-900">{item.patientName}</span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-600">
                  {item.appointmentCode}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <Phone size={12} />
                  {item.patientPhone}
                </span>
                <span>{item.serviceName}</span>
              </div>
              <div className="mt-1.5 inline-flex items-center gap-1 font-semibold text-brand">
                <Clock size={12} weight="bold" />
                {new Date(item.scheduledAt).toLocaleString("vi-VN")} -{" "}
                {new Date(item.endAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </AdminModal>
  );
}
