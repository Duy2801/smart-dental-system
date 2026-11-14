export type Gender = "MALE" | "FEMALE" | "OTHER" | string | null;

/** Một dòng trong GET /patients */
export type VisitedPatient = {
  id: string;
  patientCode: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  gender: Gender;
  age: number | null;
  dateOfBirth: string | null;
  allergies?: string[];
  lastVisit: string | null;
  totalVisits: number;
};

export type PatientVisit = {
  id: string;
  appointmentCode: string;
  scheduledAt: string;
  status: string;
  serviceName: string;
  doctorName: string;
  recordId: string | null;
  type: "OFFLINE" | "ONLINE";
};

/** GET /patients/:id */
export type PatientDetail = {
  id: string;
  patientCode: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  gender: Gender;
  age: number | null;
  dateOfBirth: string | null;
  address: string | null;
  medicalHistory: string | null;
  allergies?: string[];
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  finance?: {
    billedTotal: number;
    paidTotal: number;
    debtTotal: number;
    invoiceCount: number;
  };
  activeTreatmentPlan: {
    id: string;
    title: string;
    status: string;
    totalSteps: number;
    completedSteps: number;
  } | null;
  totalVisits: number;
  totalAppointments: number;
  appointments: PatientVisit[];
};

/** GET /medical-records/:id (các trường admin cần xem) */
export type VisitMedicalRecord = {
  id: string;
  doctorName: string | null;
  serviceName: string | null;
  chiefComplaint: string | null;
  diagnosis: string | null;
  treatmentNotes: string | null;
  followUpDate: string | null;
  prescriptions: Array<{
    id: string;
    notes: string | null;
    items: Array<{
      medicineName: string;
      dosage: string;
      frequency?: string | null;
      duration?: string | null;
      instruction?: string | null;
    }>;
  }>;
};
