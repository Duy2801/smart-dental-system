import { AdminModal } from "@/src/components/admin/common";
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
      title="Cảnh báo xung đột lịch hẹn bệnh nhân"
    >

      <div className="space-y-4">
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
          <p className="font-semibold">
            Thao tác &quot;{actionName}&quot; bị xung đột với {conflicts.length} lịch hẹn hiện có của bệnh nhân:
          </p>
          <p className="mt-1 text-xs text-amber-700">
            Vui lòng kiểm tra danh sách bệnh nhân bị ảnh hưởng bên dưới. Bạn có thể buộc lưu và liên hệ sắp xếp lại lịch hẹn cho bệnh nhân sau.
          </p>
        </div>

        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
          {conflicts.map((item) => (
            <div key={item.id} className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs flex justify-between items-center">
              <div>
                <div className="font-semibold text-slate-800">
                  {item.patientName} - {item.patientPhone}
                </div>
                <div className="text-slate-600">
                  Mã: <span className="font-mono">{item.appointmentCode}</span> | Dịch vụ: {item.serviceName}
                </div>
                <div className="text-brand font-medium mt-0.5">
                  Thời gian: {new Date(item.scheduledAt).toLocaleString("vi-VN")} - {new Date(item.endAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirmForce}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 transition-colors"
          >
            Vẫn tiếp tục (Xác nhận ép lưu)
          </button>
        </div>
      </div>
    </AdminModal>
  );
}
