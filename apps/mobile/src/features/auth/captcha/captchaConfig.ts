import { NEXT_PUBLIC_WAU_CAPTCHA_ORIGIN, NEXT_PUBLIC_WAU_CAPTCHA_SITE_KEY } from '@env';

/** Site key công khai WAU Captcha, cùng key với web bệnh nhân */
export const WAU_CAPTCHA_SITE_KEY = (NEXT_PUBLIC_WAU_CAPTCHA_SITE_KEY ?? '').trim();

/** Lấy phần origin (scheme://host[:port]) của một URL, không dùng `URL` của React Native */
function toOrigin(value?: string | null): string | undefined {
  const match = value?.trim().match(/^(https?:\/\/[^/?#\s]+)/i);
  return match ? match[1].toLowerCase() : undefined;
}

/**
 * Domain web bệnh nhân dùng làm header Origin khi giải CAPTCHA, để WAU và backend coi token như được
 * giải trên web: ưu tiên NEXT_PUBLIC_WAU_CAPTCHA_ORIGIN, sau đó theo trang CAPTCHA backend trả về
 * (dựng từ FRONTEND_URL).
 */
export function getCaptchaOrigin(backendCaptchaUrl?: string | null): string | undefined {
  return toOrigin(NEXT_PUBLIC_WAU_CAPTCHA_ORIGIN) ?? toOrigin(backendCaptchaUrl);
}
