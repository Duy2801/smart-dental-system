/**
 * Tiện ích giờ Việt Nam (UTC+7, không có giờ mùa hè).
 *
 * Ca làm việc, ngày khuyến mãi, mã lịch hẹn... đều được hiểu theo giờ VN, còn
 * `Date#toISOString()`/`getUTC*()` trả về giờ UTC. Dùng nhầm sẽ lệch 7 tiếng
 * (từ 0h đến 7h sáng còn lệch sang ngày hôm trước). Các hàm dưới đây không phụ
 * thuộc biến môi trường TZ của server.
 */
export const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

const shift = (date: Date) => new Date(date.getTime() + VN_OFFSET_MS);

/** 'YYYY-MM-DD' theo giờ VN */
export function vnDateId(date: Date = new Date()): string {
  return shift(date).toISOString().slice(0, 10);
}

/** 'YYYYMMDD' theo giờ VN, dùng làm tiền tố mã (APT-, INV-, ...) */
export function vnDateCompact(date: Date = new Date()): string {
  return vnDateId(date).replaceAll('-', '');
}

/** 'HH:mm' theo giờ VN */
export function vnTimeHHmm(date: Date): string {
  return shift(date).toISOString().slice(11, 16);
}

/** Thứ trong tuần theo giờ VN (0 = Chủ nhật ... 6 = Thứ bảy) */
export function vnDayOfWeek(date: Date): number {
  return shift(date).getUTCDay();
}

/** Thời điểm tương ứng với ngày 'YYYY-MM-DD' và giờ 'HH:mm' theo giờ VN */
export function vnDateTime(dateId: string, time = '00:00'): Date {
  return new Date(`${dateId}T${time}:00.000+07:00`);
}

/** Thời điểm cuối ngày (23:59:59.999) theo giờ VN */
export function vnEndOfDay(dateId: string): Date {
  return new Date(`${dateId}T23:59:59.999+07:00`);
}
