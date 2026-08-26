import apiClient from "@/lib/axios";

export type PatientRecordsResponse = {
  patient: {
    id: string;
    patientCode: string;
    fullName: string;
    phone: string | null;
    email: string;
    gender: "MALE" | "FEMALE" | "OTHER" | "UNKNOWN";
    dateOfBirth: string | null;
    age: number | null;
    address: string | null;
    medicalHistory: string | null;
    lastVisitAt: string | null;
  };
  treatmentPlans: TreatmentPlanRecord[];
  medicalRecords: Array<{
    id: string;
    createdAt: string;
    doctor: string;
    service: string;
    chiefComplaint?: string | null;
    diagnosis: string | null;
    treatmentNotes: string | null;
    followUpDate: string | null;
    images?: ClinicalImageRecord[] | null;
  }>;
};

export type ClinicalImageRecord = {
  id?: string;
  type?: string;
  title?: string;
  url?: string | null;
  imageUrl?: string | null;
  src?: string | null;
};

export type TreatmentPlanRecord = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  startDate: string | null;
  expectedEndDate: string | null;
  doctor: {
    id: string;
    name: string;
    specialty: string;
  };
  depositAmount: number;
  schedulePaymentStatus: string;
  invoices: InvoiceSummary[];
  steps: TreatmentPlanStepRecord[];
};

export type TreatmentPlanStepRecord = {
  id: string;
  order: number;
  title: string;
  description: string | null;
  targetTooth: string | null;
  status: string;
  estimatedCost: number;
  paymentAmount: number;
  paymentStatus: string;
  expectedDate: string | null;
  completedAt: string | null;
  appointments: Array<{
    id: string;
    scheduledAt: string;
    endAt: string;
    status: string;
    service: string;
    doctor: string;
  }>;
  medicalRecords: Array<{
    id: string;
    chiefComplaint: string | null;
    diagnosis: string | null;
    treatmentNotes: string | null;
    followUpDate: string | null;
    dentalChart: unknown;
    images: ClinicalImageRecord[] | null;
    prescriptions: Array<{
      id: string;
      notes: string | null;
      items: Array<{
        medicineName: string;
        dosage: string;
        frequency: string | null;
        duration: string | null;
        instruction: string | null;
      }>;
    }>;
  }>;
  invoices: InvoiceSummary[];
};

export type InvoiceSummary = {
  id: string;
  invoiceCode: string;
  invoiceType: string;
  finalAmount: number;
  status: string;
  paidAmount: number;
  paidAt: string | null;
};

export async function getPatientRecords(patientId?: string) {
  const response = await apiClient.get<PatientRecordsResponse>(
    "/patients/me/records",
    { params: patientId ? { patientId } : undefined },
  );
  return response.data;
}
