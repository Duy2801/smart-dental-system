import { AdminButton, AdminModal } from "@/src/components/admin/common";

type ConfirmCancelDayModalProps = {
  isOpen: boolean;
  dayName: string;
  onClose: () => void;
  onConfirm: () => void;
};

export function ConfirmCancelDayModal({
  isOpen,
  dayName,
  onClose,
  onConfirm,
}: ConfirmCancelDayModalProps) {
  if (!isOpen) return null;

  return (
    <AdminModal onClose={onClose} title="Cảnh báo ngưng hoạt động ngày làm việc">
      <div className="mt-3 space-y-5">
        <div className="flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-600">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="space-y-1.5 text-sm text-amber-950">
            <p className="font-bold text-base text-amber-900">
              Xác nhận ngưng hoạt động / Hủy lịch làm việc ({dayName})
            </p>
            <p className="leading-relaxed text-amber-800">
              Việc chuyển <strong className="font-bold text-amber-950">{dayName}</strong> sang trạng thái ngưng hoạt động (Đóng cửa) có thể ảnh hưởng trực tiếp tới:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs font-medium text-amber-900">
              <li>Lịch hẹn đã đặt của bệnh nhân vào ngày này.</li>
              <li>Lịch làm việc / ca trực đã phân công cho các bác sĩ và nhân viên.</li>
            </ul>
            <p className="pt-1 text-xs text-amber-700 italic">
              Nếu bạn tiếp tục, hệ thống sẽ ngưng nhận lịch đặt mới vào ngày này.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
          >
            Quay lại / Không hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-red-700"
          >
            Xác nhận Hủy / Đóng cửa
          </button>
        </div>
      </div>
    </AdminModal>
  );
}
