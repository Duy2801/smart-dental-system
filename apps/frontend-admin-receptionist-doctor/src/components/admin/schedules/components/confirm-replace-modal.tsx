import { AdminButton, AdminModal } from "@/src/components/admin/common";

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
  if (!isOpen) return null;

  return (
    <AdminModal
      onClose={onClose}
      title="Xác nhận thay thế lịch làm việc"
    >
      <div className="mt-2 space-y-5">
        <div className="flex items-start gap-4 rounded-xl border border-amber-200 bg-amber-50/80 p-4">
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
          <div className="space-y-1 text-sm text-amber-900">
            <p className="font-bold text-base text-amber-950">
              Lịch làm việc đã tồn tại
            </p>
            <p className="text-amber-800 leading-relaxed">
              {doctorName ? (
                <>
                  Bác sĩ <strong className="font-semibold">{doctorName}</strong> đã có lịch làm việc được thiết lập trước đó vào (các) ngày bạn đã chọn.
                </>
              ) : (
                "Bác sĩ đã có lịch làm việc được thiết lập trước đó vào (các) ngày bạn đã chọn."
              )}
            </p>
            <p className="mt-2 font-medium text-amber-900">
              Bạn có muốn THAY THẾ lịch cũ bằng lịch mới vừa chọn không?
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <AdminButton
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Hủy bỏ
          </AdminButton>
          <AdminButton
            type="button"
            onClick={onConfirm}
            className="bg-brand hover:bg-brand-dark"
          >
            Thay thế lịch
          </AdminButton>
        </div>
      </div>
    </AdminModal>
  );
}
