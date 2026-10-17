import { AdminConfirmModal } from "@/src/components/admin/common";

type ConfirmReplaceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  doctorName?: string;
};

export function ConfirmReplaceModal({
  isOpen,
  onClose,
  onConfirm,
  doctorName,
}: ConfirmReplaceModalProps) {
  return (
    <AdminConfirmModal
      isOpen={isOpen}
      title="Lịch làm việc đã tồn tại"
      description={
        <>
          <p>
            {doctorName ? (
              <>
                Bác sĩ <strong className="font-semibold text-slate-900">{doctorName}</strong> đã có
              </>
            ) : (
              "Bác sĩ đã có"
            )}{" "}
            lịch làm việc vào (các) ngày bạn đã chọn.
          </p>
          <p className="mt-2 font-medium text-slate-800">
            Bạn có muốn thay thế lịch cũ bằng lịch mới vừa chọn không?
          </p>
        </>
      }
      confirmText="Thay thế lịch"
      cancelText="Hủy bỏ"
      variant="warning"
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}
