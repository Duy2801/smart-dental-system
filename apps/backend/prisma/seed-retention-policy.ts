export type SeedRetentionInputs = {
  prescriptionCount: number;
  clinicalCaseCount: number;
};

export function buildRetainedSeedCounts(input: SeedRetentionInputs) {
  const dependentRecordCount = Math.max(
    input.prescriptionCount,
    input.clinicalCaseCount,
  );

  return {
    patientCount: dependentRecordCount,
    appointmentCount: dependentRecordCount,
    medicalRecordCount: dependentRecordCount,
    treatmentPlanCount: input.clinicalCaseCount,
    prescriptionCount: input.prescriptionCount,
    clinicalCaseCount: input.clinicalCaseCount,
  };
}
