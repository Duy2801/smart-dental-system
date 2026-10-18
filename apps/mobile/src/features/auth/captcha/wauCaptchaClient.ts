import { solvePow } from '@waucaptcha-sdk/client';

/**
 * Client WAU Captcha cho React Native (loại image_distort — nhập mã trong ảnh).
 *
 * Gọi thẳng REST API của WAU giống SDK trình duyệt: lấy challenge, giải proof of work bằng
 * `solvePow` của SDK (JavaScript thuần, chạy được trên Hermes), rồi gửi đáp án kèm dữ liệu hành vi.
 * Mọi yêu cầu gửi header `Origin` là domain web bệnh nhân, để WAU và backend coi token như được
 * giải trên web (WAU kiểm tra domain qua Origin; xem https://waucaptcha.com/docs#site-binding).
 */

export const WAU_BASE_URL = 'https://api.waucaptcha.com';
const REQUEST_TIMEOUT_MS = 10_000;

export type WauChallenge = {
  id: string;
  imageUri: string;
  width: number;
  height: number;
  expiresAt: number;
};

/** Định dạng `behavior` mà WAU đọc (giống recordBehavior của SDK trình duyệt) */
export type WauBehavior = {
  version: 1;
  elapsed_ms: number;
  pointer: Array<{ t: number; x: number; y: number }>;
  pointer_type: string;
  key_intervals_ms: number[];
  input_events: number;
  paste_events: number;
  untrusted_events: number;
  webdriver: boolean;
  hidden_ms: number;
};

export class WauCaptchaError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'WauCaptchaError';
  }
}

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Giải mã base64 thủ công (không phụ thuộc atob của môi trường) */
/* eslint-disable no-bitwise */
function decodeBase64(text: string): Uint8Array | undefined {
  const clean = text.replace(/[\s=]/g, '');
  if (/[^A-Za-z0-9+/]/.test(clean)) return undefined;
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const char of clean) {
    buffer = (buffer << 6) | BASE64_ALPHABET.indexOf(char);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return Uint8Array.from(bytes);
}
/* eslint-enable no-bitwise */

async function requestJson<T>(url: string, init: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(url, { ...init, signal: controller.signal });
  } catch {
    throw new WauCaptchaError('Không kết nối được máy chủ CAPTCHA. Kiểm tra mạng rồi thử lại.');
  } finally {
    clearTimeout(timer);
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await response.json()) as Record<string, unknown>;
  } catch {
    // Phản hồi không phải JSON
  }
  if (!response.ok) {
    const code = typeof body.code === 'string' ? body.code : typeof body.error === 'string' ? body.error : undefined;
    throw new WauCaptchaError(`CAPTCHA trả lỗi ${response.status}${code ? ` (${code})` : ''}.`, code);
  }
  return body as T;
}

type NewChallengeReply = {
  challenge_id: string;
  image: string;
  mime_type: string;
  width: number;
  height: number;
  expires_in: number;
  pow_salt?: string;
  pow_difficulty?: number;
};

type VerifyReply = { success?: boolean; token?: string };

export class NativeWauCaptchaClient {
  private readonly headers: Record<string, string>;
  /** Proof of work của từng challenge, giải ngầm ngay khi nhận challenge */
  private readonly work = new Map<string, { promise: Promise<string | undefined>; abort: AbortController }>();

  constructor(
    private readonly siteKey: string,
    origin?: string,
  ) {
    this.headers = origin ? { Origin: origin, Referer: `${origin}/` } : {};
  }

  async newChallenge(): Promise<WauChallenge> {
    const query = `site_key=${encodeURIComponent(this.siteKey)}&challenge_type=image_distort`;
    const reply = await requestJson<NewChallengeReply>(`${WAU_BASE_URL}/challenge/new?${query}`, {
      method: 'GET',
      headers: this.headers,
    });
    if (!reply.challenge_id || !reply.image) {
      throw new WauCaptchaError('Máy chủ CAPTCHA trả dữ liệu không hợp lệ.');
    }

    this.startWork(reply);
    return {
      id: reply.challenge_id,
      imageUri: `data:${reply.mime_type || 'image/png'};base64,${reply.image}`,
      width: reply.width,
      height: reply.height,
      expiresAt: Date.now() + (reply.expires_in ?? 120) * 1000,
    };
  }

  async verify(challengeId: string, answer: string, behavior: WauBehavior): Promise<string | null> {
    const powNonce = await this.work.get(challengeId)?.promise;
    this.stopWork(challengeId);
    const reply = await requestJson<VerifyReply>(`${WAU_BASE_URL}/challenge/verify`, {
      method: 'POST',
      headers: { ...this.headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challenge_id: challengeId,
        answer,
        site_key: this.siteKey,
        behavior,
        ...(powNonce !== undefined ? { pow_nonce: powNonce } : {}),
      }),
    });
    return reply.success && reply.token ? reply.token : null;
  }

  /** Bỏ challenge không dùng nữa (đổi mã / rời màn hình) */
  discard(challengeId: string) {
    this.stopWork(challengeId);
  }

  private startWork(reply: NewChallengeReply) {
    const salt = reply.pow_salt ? decodeBase64(reply.pow_salt) : undefined;
    if (!salt || reply.pow_difficulty === undefined) return;
    const abort = new AbortController();
    const promise = solvePow(salt, reply.challenge_id, reply.pow_difficulty, { signal: abort.signal }).catch(
      () => undefined,
    );
    this.work.set(reply.challenge_id, { promise, abort });
  }

  private stopWork(challengeId: string) {
    this.work.get(challengeId)?.abort.abort();
    this.work.delete(challengeId);
  }
}
