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
      totalAppointments: 5,
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

  it('combines offline appointments and video consultations in findPatientDetail', async () => {
    const prisma = {
      appointment: {
        findFirst: jest.fn().mockResolvedValue({ id: 'appt-1' }),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'appt-1',
            appointmentCode: 'APT-001',
            scheduledAt: new Date('2026-09-01T08:00:00.000Z'),
            status: 'COMPLETED',
            service: { name: 'Trong rang Implant' },
            doctor: { user: { fullName: 'ThS.BS. Le Hoang Nam' } },
            medicalRecords: [{ id: 'record-1' }],
          },
          {
            id: 'appt-2',
            appointmentCode: 'APT-002',
            scheduledAt: new Date('2026-09-10T08:00:00.000Z'),
            status: 'CONFIRMED',
            service: { name: 'Kiem tra rang' },
            doctor: { user: { fullName: 'ThS.BS. Le Hoang Nam' } },
            medicalRecords: [],
          },
        ]),
      },
      videoConsultation: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'vc-1',
            scheduledAt: new Date('2026-09-02T10:00:00.000Z'),
            status: 'COMPLETED',
            durationMinutes: 30,
            meetingUrl: 'https://meet.jit.si/test-vc-1',
            doctor: { user: { fullName: 'ThS.BS. Le Hoang Nam' } },
          },
        ]),
      },
      treatmentPlan: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      medicalRecord: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      invoice: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      patient: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'patient-1',
          patientCode: 'PAT-001',
          fullName: 'Nguyen Van An',
          phone: '0901234567',
          email: 'patient01@smartdental.test',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'MALE',
          address: 'TP.HCM',
          medicalHistory: null,
          emergencyContactName: null,
          emergencyContactPhone: null,
          user: null,
          treatmentPlans: [],
        }),
      },
    };

    const service = new PatientService(
      prisma as never,
      {} as never,
      {} as never,
    );

    const detail = await service.findPatientDetail('patient-1', 'doctor-1');

    expect(detail.totalAppointments).toBe(3);
    expect(detail.totalVisits).toBe(2);
    expect(detail.appointments).toHaveLength(3);
    expect(detail.appointments.some((a) => a.type === 'ONLINE')).toBe(true);
    expect(detail.appointments.some((a) => a.type === 'OFFLINE')).toBe(true);
  });

  it('only includes patients with confirmed/completed appointments or active consultations', async () => {
    const findManyMock = jest.fn().mockResolvedValue([]);
    const prisma = {
      patient: {
        findMany: findManyMock,
      },
    };
    const service = new PatientService(
      prisma as never,
      {} as never,
      {} as never,
    );

    await service.findPatientsByDoctor('doctor-1');

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            {
              appointments: {
                some: {
                  doctorId: 'doctor-1',
                  status: {
                    in: ['CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED'],
                  },
                },
              },
            },
            {
              videoConsultations: {
                some: {
                  doctorId: 'doctor-1',
                  status: {
                    in: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'],
                  },
                },
              },
            },
            { treatmentPlans: { some: { doctorId: 'doctor-1' } } },
            { medicalRecords: { some: { doctorId: 'doctor-1' } } },
          ],
        }),
      }),
    );
  });
});

