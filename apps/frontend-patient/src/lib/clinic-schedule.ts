export type ClinicLunchBreak = {
  isEnabled: boolean;
  start: string;
  end: string;
};

export const DEFAULT_CLINIC_LUNCH_BREAK: ClinicLunchBreak = {
  isEnabled: true,
  start: "12:00",
  end: "13:30",
};

function timeToMinutes(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;

  return hours * 60 + minutes;
}

export function normalizeClinicLunchBreak(
  value?: Partial<ClinicLunchBreak> | null,
): ClinicLunchBreak {
  if (
    typeof value?.isEnabled !== "boolean" ||
    typeof value.start !== "string" ||
    typeof value.end !== "string" ||
    timeToMinutes(value.start) === null ||
    timeToMinutes(value.end) === null
  ) {
    return DEFAULT_CLINIC_LUNCH_BREAK;
  }

  return {
    isEnabled: value.isEnabled,
    start: value.start,
    end: value.end,
  };
}

export function overlapsClinicLunchBreak(
  startTime: string,
  durationMinutes: number,
  lunchBreak: ClinicLunchBreak,
) {
  if (!lunchBreak.isEnabled) return false;

  const slotStart = timeToMinutes(startTime);
  const lunchStart = timeToMinutes(lunchBreak.start);
  const lunchEnd = timeToMinutes(lunchBreak.end);
  if (slotStart === null || lunchStart === null || lunchEnd === null) {
    return false;
  }

  const slotEnd = slotStart + Math.max(1, durationMinutes || 30);
  return slotStart < lunchEnd && slotEnd > lunchStart;
}

export function filterSlotsOutsideLunchBreak(
  slots: string[],
  durationMinutes: number,
  lunchBreak: ClinicLunchBreak,
) {
  return slots.filter(
    (slot) => !overlapsClinicLunchBreak(slot, durationMinutes, lunchBreak),
  );
}
