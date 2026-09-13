import type { LunchBreakDto } from './dto/update-clinic-config.dto';

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export function overlapsLunchBreak(
  startMinutes: number,
  endMinutes: number,
  lunchBreak: LunchBreakDto,
) {
  if (!lunchBreak.isEnabled) return false;

  const lunchStart = timeToMinutes(lunchBreak.start);
  const lunchEnd = timeToMinutes(lunchBreak.end);
  return startMinutes < lunchEnd && endMinutes > lunchStart;
}
