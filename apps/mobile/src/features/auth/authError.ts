import axios from 'axios';

const messages: Record<string, string> = {
  'auth.invalid_credentials': 'Email hoặc mật khẩu không chính xác',
  'auth.email_exists': 'Email này đã được đăng ký',
  'auth.email_not_verified': 'Email chưa được xác thực',
  'auth.account_inactive': 'Tài khoản hiện không hoạt động',
  'auth.account_google_only': 'Tài khoản này cần đăng nhập bằng Google',
  'otp.expired_or_invalid': 'Mã OTP đã hết hạn hoặc không hợp lệ',
  'otp.incorrect': 'Mã OTP không chính xác',
  'otp.too_many_requests': 'Bạn đã yêu cầu quá nhiều mã OTP',
};

export const getAuthErrorMessage = (error: unknown) => {
  if (!axios.isAxiosError(error)) return 'Đã có lỗi xảy ra, vui lòng thử lại';
  const response = error.response?.data as
    | { message?: string | string[]; error?: string }
    | undefined;
  const rawMessage = Array.isArray(response?.message)
    ? response.message[0]
    : response?.message || response?.error;

  if (!rawMessage) {
    return error.code === 'ECONNABORTED'
      ? 'Kết nối máy chủ quá thời gian'
      : 'Không thể kết nối đến máy chủ';
  }
  return messages[rawMessage] || rawMessage;
};
