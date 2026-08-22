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

export type AvailabilityApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export type AvailabilityRecord = {
  id: string;
  doctorId: string;
  recordType: AvailabilityRecordType;
  dayOfWeek: number | null;
  specificDate: string | null;
  startTime: string;
  endTime: string;
  reason: string | null;
  approvalStatus?: AvailabilityApprovalStatus;
  isActive: boolean;
};

export type WeeklyAvailability = {
  dayOfWeek: number;
  label: string;
  shifts: AvailabilityRecord[];
  dateOverrides?: AvailabilityRecord[];
  timeOff: AvailabilityRecord[];
};

export type AvailabilityResponse = {
  doctorId: string;
  records: AvailabilityRecord[];
  weekly: WeeklyAvailability[];
};

export type ScheduleFormState = {
  recordType: "WEEKLY" | "DATE_OVERRIDE" | "TIME_OFF";
  dayOfWeek: number;
  specificDate: string;
  startTime: string;
  endTime: string;
  reason: string;
  autoSchedule: boolean;
  selectedDays: number[];
  autoMode: "REPLACE" | "APPEND";
  autoShifts: { startTime: string; endTime: string }[];
};

export type DoctorShiftMatrixItem = {
  doctorId: string;
  doctorName: string;
  specialization: string;
  shifts: AvailabilityRecord[];
  dateOverrides: AvailabilityRecord[];
  timeOffs: AvailabilityRecord[];
  isAvailable: boolean;
};

export type ShiftMatrixDay = {
  dayOfWeek: number;
  label: string;
  businessHour?: { id: number; isOpen: boolean; start: string; end: string };
  isUnderstaffed: boolean;
  activeDoctorCount: number;
  doctorShifts: DoctorShiftMatrixItem[];
};

export type ShiftMatrixResponse = {
  doctors: Doctor[];
  days: ShiftMatrixDay[];
};

export type AppointmentConflictItem = {
  id: string;
  appointmentCode: string;
  scheduledAt: string;
  endAt: string;
  patientName: string;
  patientPhone: string;
  serviceName: string;
};

