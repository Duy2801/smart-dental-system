import apiClient from "@/src/lib/api/client";
import type { PatientDetail, VisitMedicalRecord, VisitedPatient } from "./types";

/** Chỉ lấy bệnh nhân đã có ít nhất một lần khám hoàn tất tại phòng khám */
export async function getVisitedPatients(search: string) {
  const response = await apiClient.get<VisitedPatient[]>("/patients", {
    params: { search: search.trim() || undefined },
  });
  return (response.data ?? []).filter((patient) => patient.totalVisits > 0);
}

export async function getPatientDetail(id: string) {
  const response = await apiClient.get<PatientDetail>(`/patients/${id}`);
  return response.data;
}

export async function getVisitMedicalRecord(id: string) {
  const response = await apiClient.get<VisitMedicalRecord>(`/medical-records/${id}`);
  return response.data;
}
