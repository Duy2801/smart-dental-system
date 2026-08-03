export type OralMetric = {
  label: string;
  value: string;
  progress: number;
  tone: "blue" | "cyan" | "indigo";
};

export type TreatmentStep = {
  title: string;
  description: string;
  date: string;
  status: "completed" | "current" | "upcoming";
  badge?: string;
};

export type ClinicalImage = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  imageAlt: string;
};

export type Prescription = {
  name: string;
  dosage: string;
  instruction: string;
};

export type MedicalHistoryRecord = {
  id: string;
  category: "Khám tổng quát" | "Nội nha" | "Phục hình" | "Chỉnh nha";
  title: string;
  description: string;
  date: string;
};

export type AppointmentReminder = {
  day: string;
  month: string;
  time: string;
  room: string;
  doctor: string;
};
