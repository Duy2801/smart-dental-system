export type PatientListStatSource = {
  hasActiveTreatmentPlan: boolean;
  upcomingVisitsInNext7Days: number;
};

export function cleanSearchText(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d");
}

export function getPatientListStats(patients: PatientListStatSource[]) {
  return {
    total: patients.length,
    active: patients.filter((patient) => patient.hasActiveTreatmentPlan).length,
    upcoming: patients.reduce(
      (total, patient) => total + patient.upcomingVisitsInNext7Days,
      0,
    ),
  };
}

export function patientQuickLinks(patientId: string) {
  const encodedPatientId = encodeURIComponent(patientId);
  return {
    records: `/doctor/patients/${encodedPatientId}/records`,
    prescription: `/doctor/prescriptions/new?patientId=${encodedPatientId}`,
    treatmentPlan: `/doctor/treatment-plans/new?patientId=${encodedPatientId}`,
  };
}

export function paginatePatients<T>(items: T[], requestedPage: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), page, totalPages };
}
