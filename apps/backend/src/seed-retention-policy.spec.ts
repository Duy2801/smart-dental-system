import { buildRetainedSeedCounts } from '../prisma/seed-retention-policy';

describe('buildRetainedSeedCounts', () => {
  it('retains enough dependent records for prescriptions and image-based clinical cases', () => {
    expect(
      buildRetainedSeedCounts({
        prescriptionCount: 6,
        clinicalCaseCount: 3,
      }),
    ).toEqual({
      patientCount: 6,
      appointmentCount: 6,
      medicalRecordCount: 6,
      treatmentPlanCount: 3,
      prescriptionCount: 6,
      clinicalCaseCount: 3,
    });
  });
});
