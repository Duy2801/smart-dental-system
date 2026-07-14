import type { ScheduleFormState } from "./types";

export const weekDays = [
  { label: "Thứ 2", index: 1 },
  { label: "Thứ 3", index: 2 },
  { label: "Thứ 4", index: 3 },
  { label: "Thứ 5", index: 4 },
  { label: "Thứ 6", index: 5 },
  { label: "Thứ 7", index: 6 },
  { label: "Chủ nhật", index: 7 },
];

export const defaultScheduleForm: ScheduleFormState = {
  recordType: "WEEKLY",
  dayOfWeek: 1,
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
