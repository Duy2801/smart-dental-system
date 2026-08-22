import type { ScheduleFormState } from "./types";

export const weekDays = [
  { label: "Thu 2", index: 1 },
  { label: "Thu 3", index: 2 },
  { label: "Thu 4", index: 3 },
  { label: "Thu 5", index: 4 },
  { label: "Thu 6", index: 5 },
  { label: "Thu 7", index: 6 },
  { label: "Chu nhat", index: 0 },
];

export const DEFAULT_SHIFT_TEMPLATES = [
  { id: "SHIFT_1", label: "Ca Sáng (08:00 - 12:00)", startTime: "08:00", endTime: "12:00" },
  { id: "SHIFT_2", label: "Ca Chiều (13:30 - 17:30)", startTime: "13:30", endTime: "17:30" },
  { id: "SHIFT_3", label: "Ca Tối (18:00 - 21:00)", startTime: "18:00", endTime: "21:00" },
  { id: "SHIFT_FULL", label: "Cả Ngày (08:00 - 17:30)", startTime: "08:00", endTime: "17:30" },
];

export const defaultScheduleForm: ScheduleFormState = {
  recordType: "WEEKLY",
  dayOfWeek: 1,
  specificDate: new Date().toISOString().slice(0, 10),
  startTime: "08:00",
  endTime: "12:00",
  reason: "",
  autoSchedule: false,
  selectedDays: [1, 2, 3, 4, 5],
  autoMode: "REPLACE",
  autoShifts: [
    { startTime: "08:00", endTime: "12:00" },
    { startTime: "13:30", endTime: "17:30" },
  ],
};

