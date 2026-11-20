import type { RedisService } from '../modules/redis/redis.service';
import { vnDateCompact } from './vn-time';

const SEQUENCE_TTL_SECONDS = 2 * 24 * 60 * 60;

/**
 * Sinh mã dạng `PREFIX-YYYYMMDD-0001` (ngày theo giờ VN).
 *
 * Cách cũ `count + 1` có hai lỗi: hai request đồng thời đọc cùng một count nên sinh
 * trùng mã (vi phạm unique, trả 500), và xoá bản ghi làm count giảm nên sinh lại mã
 * đã tồn tại. Ở đây số thứ tự lấy bằng Redis INCR (nguyên tử), khởi tạo từ số lớn
 * nhất đang có trong DB.
 *
 * @param findLatestCode trả về mã lớn nhất đang có với tiền tố đã cho (hoặc null)
 */
export async function nextDailyCode(
  redis: Pick<RedisService, 'setIfAbsent' | 'incr' | 'set'>,
  prefix: string,
  findLatestCode: (codePrefix: string) => Promise<string | null>,
): Promise<string> {
  const codePrefix = `${prefix}-${vnDateCompact()}`;
  const latest = await findLatestCode(`${codePrefix}-`);
  const latestSeq = latest ? Number(latest.split('-').pop()) || 0 : 0;

  const key = `code-seq:${codePrefix}`;
  await redis.setIfAbsent(key, String(latestSeq), SEQUENCE_TTL_SECONDS);
  let seq = await redis.incr(key);
  // Redis mất kết nối (bộ nhớ tạm của RedisService) hoặc bị xoá: không bao giờ lùi số
  if (seq <= latestSeq) {
    seq = latestSeq + 1;
    await redis.set(key, String(seq), SEQUENCE_TTL_SECONDS);
  }
  return `${codePrefix}-${String(seq).padStart(4, '0')}`;
}
