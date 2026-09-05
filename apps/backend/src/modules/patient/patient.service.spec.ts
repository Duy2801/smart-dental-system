import { PatientService } from './patient.service';

describe('PatientService doctor patient list', () => {
  it('reports completed care separately from upcoming and cancelled appointments', async () => {
    const prisma = {
      patient: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'patient-1',
            patientCode: 'PAT-001',
            dateOfBirth: new Date('2000-12-31T00:00:00.000Z'),
            gender: 'MALE',
            medicalHistory: null,
            user: { fullName: 'Nguyen Van A', phone: null, email: null },
            treatmentPlans: [{ id: 'plan-1' }],
            appointments: [
              {
                scheduledAt: new Date('2026-09-01T02:00:00.000Z'),
                status: 'COMPLETED',
                service: { name: 'Kham tong quat' },
              },
              {
                scheduledAt: new Date('2026-09-06T02:00:00.000Z'),
                status: 'CANCELLED',
                service: { name: 'Trong rang' },
              },
              {
                scheduledAt: new Date('2026-09-07T02:00:00.000Z'),
                status: 'CONFIRMED',
                service: { name: 'Tay trang' },
              },
            ],
            videoConsultations: [
              {
                scheduledAt: new Date('2026-08-20T02:00:00.000Z'),
                status: 'COMPLETED',
                durationMinutes: 30,
              },
              {
                scheduledAt: new Date('2026-09-08T02:00:00.000Z'),
                status: 'SCHEDULED',
                durationMinutes: 20,
              },
            ],
          },
        ]),
      },
    };
    const service = new PatientService(
      prisma as never,
      {} as never,
      {} as never,
    );

    const [patient] = await service.findPatientsByDoctor(
      'doctor-1',
      undefined,
      new Date('2026-09-05T15:00:00.000Z'),
    );

    expect(patient).toMatchObject({
      lastVisitDate: new Date('2026-09-01T02:00:00.000Z'),
      lastService: 'Kham tong quat',
      lastStatus: 'COMPLETED',
      totalVisits: 2,
      hasActiveTreatmentPlan: true,
      upcomingVisitsInNext7Days: 2,
    });
  });

  it('calculates age only after the birthday has occurred', async () => {
    const prisma = {
      patient: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'patient-1',
            patientCode: 'PAT-001',
            dateOfBirth: new Date('2000-12-31T00:00:00.000Z'),
            gender: null,
            medicalHistory: null,
            user: { fullName: 'Nguyen Van A', phone: null, email: null },
            treatmentPlans: [],
            appointments: [],
            videoConsultations: [],
          },
        ]),
      },
    };
    const service = new PatientService(
      prisma as never,
      {} as never,
      {} as never,
    );

    const [patient] = await service.findPatientsByDoctor(
      'doctor-1',
      undefined,
      new Date('2026-09-05T00:00:00.000Z'),
    );

    expect(patient.age).toBe(25);
  });
});
