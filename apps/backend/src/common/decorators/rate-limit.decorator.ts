import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rateLimit';

export type RateLimitOptions = {
  /** Số request tối đa trong một cửa sổ thời gian */
  limit: number;
  /** Độ dài cửa sổ (giây) */
  windowSeconds: number;
};

/**
 * Giới hạn số lần gọi route theo IP (đếm trên Redis, dùng chung cho mọi instance).
 * Dùng cho route công khai dễ bị lạm dụng: đăng nhập, OTP, quên mật khẩu, chatbot...
 */
export const RateLimit = (limit: number, windowSeconds: number) =>
  SetMetadata(RATE_LIMIT_KEY, {
    limit,
    windowSeconds,
  } satisfies RateLimitOptions);
