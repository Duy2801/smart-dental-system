import axios from 'axios';

const messages: Record<string, string> = {
  'auth.invalid_credentials': 'Email hoặc mật khẩu không chính xác',
  'auth.email_exists': 'Email này đã được đăng ký',
  'auth.email_not_verified': 'Email chưa được xác thực',
  'auth.account_inactive': 'Tài khoản hiện không hoạt động',
  'auth.account_google_only': 'Tài khoản này cần đăng nhập bằng Google',
  'auth.google_invalid_token': 'Xác thực tài khoản Google không thành công',
  'auth.google_token_required': 'Ứng dụng chưa nhận được token Google',
  'auth.captcha_required': 'Vui lòng xác minh CAPTCHA trước khi đăng nhập',
  'auth.captcha_invalid': 'CAPTCHA không hợp lệ hoặc đã hết hạn. Vui lòng thử lại',
  'auth.captcha_unavailable': 'Chưa thể xác minh CAPTCHA. Vui lòng thử lại sau',
  'auth.captcha_puzzle_required': 'Vui lòng giải câu đố xác minh bên dưới rồi đăng nhập lại',
  'otp.expired_or_invalid': 'Mã OTP đã hết hạn hoặc không hợp lệ',
  'otp.incorrect': 'Mã OTP không chính xác',
  'otp.too_many_requests': 'Bạn đã yêu cầu quá nhiều mã OTP',
};

/** Mã lỗi thô backend trả về, ví dụ 'auth.captcha_puzzle_required' */
export const getAuthErrorCode = (error: unknown): string | null => {
  if (!axios.isAxiosError(error)) return null;
  const response = error.response?.data as { message?: string | string[] } | undefined;
  const raw = Array.isArray(response?.message) ? response.message[0] : response?.message;
  return typeof raw === 'string' ? raw : null;
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
    if (error.response?.status === 401) {
      return messages['auth.invalid_credentials'];
    }

    if (error.response?.status === 403) {
      return 'Bạn không có quyền truy cập chức năng này';
    }

    if (error.response) {
      return `Máy chủ trả về lỗi ${error.response.status}`;
    }

    return error.code === 'ECONNABORTED'
      ? 'Kết nối máy chủ quá thời gian'
      : 'Không thể kết nối đến máy chủ';
  }
  return messages[rawMessage] || rawMessage;
};
