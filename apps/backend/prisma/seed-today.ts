import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});
const timeZone = 'Asia/Bangkok';
const today = Object.fromEntries(
  new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .formatToParts(new Date())
    .map(({ type, value }) => [type, value]),
);
const date = `${today.year}-${today.month}-${today.day}`;
const codeDate = `${today.year}${today.month}${today.day}`;
const at = (hour: number, minute = 0) =>
  new Date(
    `${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+07:00`,
  );

const cases = [
  {
    doctor: 'DOC-SEED-001',
    patient: 'PAT-SEED-001',
    method: 'implant-single',
    hour: 8,
    status: 'COMPLETED',
  },
  {
    doctor: 'DOC-SEED-001',
    patient: 'PAT-SEED-002',
    method: 'wisdom-tooth-lower',
    hour: 9,
    status: 'IN_PROGRESS',
  },
  {
    doctor: 'DOC-SEED-001',
    patient: 'PAT-SEED-003',
    method: 'implant-single',
    hour: 10,
    status: 'CHECKED_IN',
  },
  {
    doctor: 'DOC-SEED-001',
    patient: 'PAT-SEED-004',
    method: 'wisdom-tooth-lower',
    hour: 11,
    status: 'CONFIRMED',
  },
  {
    doctor: 'DOC-SEED-001',
    patient: 'PAT-SEED-005',
    method: 'implant-single',
    hour: 12,
    status: 'PENDING',
  },
  {
    doctor: 'DOC-SEED-002',
    patient: 'PAT-SEED-006',
    method: 'veneer-emax',
    hour: 8,
    minute: 30,
    status: 'COMPLETED',
  },
  {
    doctor: 'DOC-SEED-002',
    patient: 'PAT-SEED-001',
    method: 'clear-aligner-full',
    hour: 10,
    status: 'CHECKED_IN',
  },
  {
    doctor: 'DOC-SEED-002',
    patient: 'PAT-SEED-002',
    method: 'clear-aligner-full',
    hour: 11,
    status: 'PENDING',
  },
] as const;

async function main() {
  const receptionist = await prisma.user.findUnique({
    where: { email: 'receptionist@smartdental.test' },
    select: { id: true },
  });
  const doctors = await prisma.doctor.findMany({
    where: { doctorCode: { in: [...new Set(cases.map((row) => row.doctor))] } },
    select: { id: true, doctorCode: true },
  });
  const patients = await prisma.patient.findMany({
    where: {
      patientCode: { in: [...new Set(cases.map((row) => row.patient))] },
    },
    select: { id: true, patientCode: true },
  });
  const methods = await prisma.treatmentMethod.findMany({
    where: { slug: { in: [...new Set(cases.map((row) => row.method))] } },
    select: {
      id: true,
      slug: true,
      name: true,
      serviceId: true,
      durationMinutes: true,
      basePrice: true,
    },
  });
  if (
    !receptionist ||
    doctors.length !== 2 ||
    patients.length !== 6 ||
    methods.length !== 4
  ) {
    throw new Error(
      'Thiếu dữ liệu nền. Chạy `pnpm --filter backend prisma:seed` trước.',
    );
  }

  const doctorByCode = new Map(doctors.map((row) => [row.doctorCode, row]));
  const patientByCode = new Map(patients.map((row) => [row.patientCode, row]));
  const methodBySlug = new Map(methods.map((row) => [row.slug, row]));

  for (const [index, row] of cases.entries()) {
    const appointmentCode = `APT-TEST-${codeDate}-${String(index + 1).padStart(2, '0')}`;
    const existing = await prisma.appointment.findUnique({
      where: { appointmentCode },
      select: { id: true },
    });
    if (existing) continue; // Preserve status and records changed while testing.

    const doctor = doctorByCode.get(row.doctor)!;
    const patient = patientByCode.get(row.patient)!;
    const method = methodBySlug.get(row.method)!;
    const scheduledAt = at(row.hour, 'minute' in row ? row.minute : 0);
    const completed = row.status === 'COMPLETED';
    const started = completed || row.status === 'IN_PROGRESS';
    const checkedIn = started || row.status === 'CHECKED_IN';
    const confirmed = checkedIn || row.status === 'CONFIRMED';

    await prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.create({
        data: {
          appointmentCode,
          patientId: patient.id,
          doctorId: doctor.id,
          serviceId: method.serviceId,
          treatmentMethodId: method.id,
          scheduledAt,
          endAt: new Date(
            scheduledAt.getTime() + (method.durationMinutes ?? 30) * 60_000,
          ),
          status: row.status,
          bookingSource: 'RECEPTIONIST',
          paymentOption: 'PAY_AT_COUNTER',
          paymentStatus:
            completed && index === 5
              ? 'COUNTER_PAID'
              : 'PAY_AT_COUNTER_SELECTED',
          scheduleConfirmedAt: confirmed ? scheduledAt : null,
          checkedInAt: checkedIn ? scheduledAt : null,
          completedAt: completed ? scheduledAt : null,
          notes: 'Dữ liệu thử nghiệm lễ tân và bác sĩ hôm nay',
          createdBy: receptionist.id,
        },
      });

      if (started) {
        await tx.medicalRecord.create({
          data: {
            appointmentId: appointment.id,
            patientId: patient.id,
            doctorId: doctor.id,
            chiefComplaint: completed
              ? 'Đau răng khi nhai'
              : 'Cần bác sĩ khám và ghi nhận triệu chứng',
            diagnosis: completed ? 'Đã khám và điều trị theo kế hoạch' : null,
            treatmentNotes: completed
              ? 'Điều trị hoàn tất, hẹn tái khám nếu còn đau.'
              : null,
          },
        });
      }

      if (completed) {
        const paid = index === 5;
        const invoice = await tx.invoice.create({
          data: {
            invoiceCode: `INV-TEST-${codeDate}-${String(index + 1).padStart(2, '0')}`,
            patientId: patient.id,
            appointmentId: appointment.id,
            invoiceType: 'SERVICE',
            items: [
              {
                service_id: method.serviceId,
                treatment_method_id: method.id,
                description: method.name,
                qty: 1,
                unit_price: Number(method.basePrice),
                amount: Number(method.basePrice),
                type: 'SERVICE',
              },
            ],
            subtotal: method.basePrice,
            finalAmount: method.basePrice,
            status: paid ? 'PAID' : 'ISSUED',
            issuedAt: scheduledAt,
            createdBy: receptionist.id,
          },
        });
        if (paid) {
          await tx.payment.create({
            data: {
              invoiceId: invoice.id,
              amount: method.basePrice,
              paymentMethod: 'CASH',
              transactionRef: `TEST-PAY-${codeDate}-${index + 1}`,
              status: 'SUCCESS',
              paidAt: scheduledAt,
              receivedBy: receptionist.id,
            },
          });
        }
      }
    });
  }

  const consultationNote = `Tư vấn trực tuyến thử nghiệm ngày ${date}`;
  if (
    !(await prisma.videoConsultation.findFirst({
      where: { notes: consultationNote },
      select: { id: true },
    }))
  ) {
    await prisma.videoConsultation.create({
      data: {
        patientId: patientByCode.get('PAT-SEED-006')!.id,
        doctorId: doctorByCode.get('DOC-SEED-001')!.id,
        scheduledAt: at(15),
        durationMinutes: 30,
        status: 'SCHEDULED',
        fee: 100000,
        isPaid: true,
        notes: consultationNote,
      },
    });
  }

  const seeded = await prisma.appointment.findMany({
    where: { appointmentCode: { startsWith: `APT-TEST-${codeDate}-` } },
    select: {
      appointmentCode: true,
      status: true,
      doctor: { select: { user: { select: { email: true } } } },
      scheduledAt: true,
    },
    orderBy: { appointmentCode: 'asc' },
  });
  if (seeded.length !== cases.length)
    throw new Error(
      `Expected ${cases.length} appointments, found ${seeded.length}`,
    );
  console.log(
    `Seed hôm nay ${date}: ${seeded.length} lịch hẹn, 1 lịch tư vấn trực tuyến`,
  );
  console.table(
    seeded.map((row) => ({
      code: row.appointmentCode,
      doctor: row.doctor.user.email,
      time: row.scheduledAt.toLocaleTimeString('vi-VN', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: row.status,
    })),
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
