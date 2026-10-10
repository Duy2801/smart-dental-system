import type { Prisma } from '../../../prisma/generated/client';

/** Serialize schedule writes for one doctor across appointments and consultations. */
export async function lockDoctorSchedule(
  tx: Prisma.TransactionClient,
  doctorId: string,
): Promise<void> {
  await tx.$queryRaw`SELECT id FROM doctors WHERE id = ${doctorId}::uuid FOR UPDATE`;
}

/** Keep one patient from booking overlapping doctors concurrently. */
export async function lockPatientSchedule(
  tx: Prisma.TransactionClient,
  patientId: string,
): Promise<void> {
  await tx.$queryRaw`SELECT id FROM patients WHERE id = ${patientId}::uuid FOR UPDATE`;
}
