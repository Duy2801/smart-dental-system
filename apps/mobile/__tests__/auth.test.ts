import { AxiosError, AxiosHeaders } from 'axios';
import {
  getAuthErrorCode,
  getAuthErrorMessage,
} from '../src/features/auth/authError';
import {
  isValidEmail,
  normalizeEmail,
  validateLogin,
  validateRegister,
} from '../src/features/auth/validation';

const apiError = (status: number, message?: string | string[]) =>
  new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: message === undefined ? {} : { message },
  });

describe('auth validation', () => {
  it('normalizes and validates email', () => {
    expect(normalizeEmail('  User@Mail.COM ')).toBe('user@mail.com');
    expect(isValidEmail('user@mail.com')).toBe(true);
    expect(isValidEmail('user@mail')).toBe(false);
  });

  it('requires email and password on login', () => {
    expect(validateLogin('', '')).toEqual({
      email: 'Vui lòng nhập email',
      password: 'Vui lòng nhập mật khẩu',
    });
    expect(validateLogin('user@mail.com', 'x')).toEqual({});
  });

  it('applies the same password rule as the backend on register', () => {
    const base = {
      fullName: 'Nguyễn Văn A',
      email: 'a@mail.com',
      confirmPassword: '',
      acceptedTerms: true,
    };
    const weak = validateRegister({ ...base, password: 'password1' });
    expect(weak.password).toBeDefined();

    const ok = validateRegister({
      ...base,
      password: 'Password1',
      confirmPassword: 'Password1',
    });
    expect(ok).toEqual({});
  });
});

describe('auth error messages', () => {
  it('maps backend error codes to Vietnamese messages', () => {
    expect(getAuthErrorCode(apiError(400, 'otp.too_many_attempts'))).toBe(
      'otp.too_many_attempts',
    );
    expect(getAuthErrorMessage(apiError(400, 'otp.too_many_attempts'))).toBe(
      'Bạn đã nhập sai OTP quá nhiều lần, vui lòng gửi lại mã mới',
    );
    expect(
      getAuthErrorMessage(apiError(401, ['auth.google_email_not_verified'])),
    ).toBe('Email Google chưa được xác minh');
  });

  it('falls back to a generic message for non-HTTP errors', () => {
    expect(getAuthErrorMessage(new Error('boom'))).toBe(
      'Đã có lỗi xảy ra, vui lòng thử lại',
    );
  });
});
