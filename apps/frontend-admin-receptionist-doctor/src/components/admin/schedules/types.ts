export type Doctor = {
  id: string;
  doctorCode: string;
  specialization: string;
  isActive: boolean;
  user: {
    fullName: string;
    email: string;
  };
};

export type AvailabilityRecordType = "WEEKLY" | "DATE_OVERRIDE" | "TIME_OFF";

export type AvailabilityRecord = {
  id: string;
  doctorId: string;
  recordType: AvailabilityRecordType;
  dayOfWeek: number | null;
  specificDate: string | null;
  startTime: string;
  endTime: string;
  reason: string | null;
  isActive: boolean;
};

export type WeeklyAvailability = {
  dayOfWeek: number;
  label: string;
  shifts: AvailabilityRecord[];
  timeOff: AvailabilityRecord[];
};

export type AvailabilityResponse = {
  doctorId: string;
  records: AvailabilityRecord[];
  weekly: WeeklyAvailability[];
};

export type ScheduleFormState = {
  recordType: "WEEKLY" | "TIME_OFF";
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  reason: string;
  autoSchedule: boolean;
  selectedDays: number[];
  autoMode: "REPLACE" | "APPEND";
  autoShifts: { startTime: string; endTime: string }[];
};
