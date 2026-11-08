/**
 * Các trường không bao giờ được trả ra API. Nhiều query Prisma dùng
 * `include: { user: true }` nên bản ghi User đầy đủ (kể cả passwordHash)
 * có thể lọt vào response; bộ lọc này chặn ở tầng phản hồi chung.
 */
const SENSITIVE_KEYS = new Set(['passwordHash', 'password_hash']);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function sanitizeResponse<T>(value: T, seen = new WeakMap<object, unknown>()): T {
  if (Array.isArray(value)) {
    if (seen.has(value)) return seen.get(value) as T;
    const out: unknown[] = [];
    seen.set(value, out);
    for (const item of value) out.push(sanitizeResponse(item, seen));
    return out as T;
  }

  // Date, Prisma Decimal, Buffer... giữ nguyên để không làm hỏng cách serialize
  if (!isPlainObject(value)) return value;

  if (seen.has(value)) return seen.get(value) as T;
  const out: Record<string, unknown> = {};
  seen.set(value, out);
  for (const [key, child] of Object.entries(value)) {
    if (SENSITIVE_KEYS.has(key)) continue;
    out[key] = sanitizeResponse(child, seen);
  }
  return out as T;
}
