import { AdminConfirmModal } from "@/src/components/admin/common";

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
  return (
    <AdminConfirmModal
      isOpen={isOpen}
      title={`Đóng cửa ${dayName}?`}
      description={
        <>
          <p>
            Chuyển <strong className="font-semibold text-slate-900">{dayName}</strong> sang trạng thái đóng cửa có thể ảnh hưởng tới:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
            <li>Lịch hẹn đã đặt của bệnh nhân vào ngày này.</li>
            <li>Ca trực đã phân công cho bác sĩ và nhân viên.</li>
          </ul>
          <p className="mt-2 text-xs text-slate-500">
            Nếu tiếp tục, hệ thống sẽ ngưng nhận lịch đặt mới vào ngày này.
          </p>
        </>
      }
      confirmText="Xác nhận đóng cửa"
      cancelText="Quay lại"
      variant="warning"
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}
