/**
 * Yêu cầu hoàn tiền do hệ thống tự tạo (bác sĩ vắng mặt, bác sĩ/phòng khám huỷ, bệnh
 * nhân huỷ) chưa có số tài khoản nhận tiền. Bệnh nhân cập nhật qua
 * PATCH /refund-requests/:id/bank-account; lễ tân không được đánh dấu "đã hoàn tiền"
 * khi thông tin còn là giá trị chờ.
 */
export const REFUND_BANK_PLACEHOLDER = {
  bankName: 'Cần bệnh nhân cung cấp STK',
  accountNumber: 'Chờ cập nhật',
} as const;

// Giá trị cũ của job "bác sĩ vắng mặt", vẫn có thể còn trong DB
const LEGACY_PLACEHOLDER_ACCOUNTS = new Set([
  REFUND_BANK_PLACEHOLDER.accountNumber,
  'Tự động hoàn tiền',
]);

export function isRefundBankInfoMissing(request: {
  accountNumber?: string | null;
  bankName?: string | null;
}) {
  const accountNumber = request.accountNumber?.trim() ?? '';
  const bankName = request.bankName?.trim() ?? '';
  return (
    !accountNumber ||
    LEGACY_PLACEHOLDER_ACCOUNTS.has(accountNumber) ||
    bankName === REFUND_BANK_PLACEHOLDER.bankName ||
    bankName === 'Hệ thống tự động'
  );
}
