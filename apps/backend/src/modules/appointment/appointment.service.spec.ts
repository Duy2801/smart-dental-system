import { AppointmentStatus } from '../../../prisma/generated/enums';
import { AppointmentService } from './appointment.service';

describe('AppointmentService clinic-time rules', () => {
  const prisma = {
    appointment: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    service: { findMany: jest.fn() },
    doctor: { findMany: jest.fn() },
    doctorAvailability: { findMany: jest.fn() },
    videoConsultation: { findMany: jest.fn() },
  };
  const clinicConfig = {
    getClinicScheduleConfig: jest.fn(),
  };
  const redis = {
    del: jest.fn(),
    delByPrefix: jest.fn(),
    rememberJson: jest.fn(
      (_key: string, _ttl: number, loader: () => Promise<unknown>) => loader(),
    ),
  };
  const service = new AppointmentService(
    prisma as never,
    clinicConfig as never,
    { createNotification: jest.fn() } as never,
    redis as never,
    { add: jest.fn() } as never,
  );

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-09T03:00:00.000Z'));
    jest.clearAllMocks();
    redis.rememberJson.mockImplementation(
      (_key: string, _ttl: number, loader: () => Promise<unknown>) => loader(),
    );
  });

  afterEach(() => jest.useRealTimers());

  it('rejects confirmation for an appointment before the current clinic date', async () => {
    prisma.appointment.findUnique.mockResolvedValue({
      id: 'past',
      status: AppointmentStatus.PENDING,
      scheduledAt: new Date('2026-09-08T02:00:00.000Z'),
    });

    await expect(service.confirmAppointment('past')).rejects.toThrow(
      'appointment.cannot_confirm_past_appointment',
    );
  });

  it('rejects check-in outside the current clinic date', async () => {
    prisma.appointment.findUnique.mockResolvedValue({
      id: 'future',
      status: AppointmentStatus.CONFIRMED,
      scheduledAt: new Date('2026-09-10T02:00:00.000Z'),
      notes: null,
    });

    await expect(
      service.checkInAppointment('future', undefined, true),
    ).rejects.toThrow('appointment.check_in_today_only');
  });

  it('rejects check-in more than 30 minutes before the appointment', async () => {
    prisma.appointment.findUnique.mockResolvedValue({
      id: 'too-early',
      status: AppointmentStatus.CONFIRMED,
      scheduledAt: new Date('2026-09-09T04:00:01.000Z'),
      notes: null,
    });

    await expect(
      service.checkInAppointment('too-early', undefined, true),
    ).rejects.toThrow('appointment.check_in_too_early');
  });

  it('requires medical-history confirmation before check-in', async () => {
    await expect(service.checkInAppointment('appointment-1')).rejects.toThrow(
      'appointment.medical_history_confirmation_required',
    );
    expect(prisma.appointment.findUnique).not.toHaveBeenCalled();
  });

  it('claims the check-in transition atomically', async () => {
    prisma.appointment.findUnique
      .mockResolvedValueOnce({
        id: 'appointment-1',
        status: AppointmentStatus.CONFIRMED,
        scheduledAt: new Date('2026-09-09T02:00:00.000Z'),
        notes: null,
      })
      .mockResolvedValueOnce({
        id: 'appointment-1',
        status: AppointmentStatus.CHECKED_IN,
        scheduledAt: new Date('2026-09-09T02:00:00.000Z'),
        createdBy: 'staff-1',
        patientId: null,
        patient: null,
        doctor: null,
        treatmentMethod: null,
        service: null,
        medicalRecords: [],
        invoices: [],
      });
    prisma.appointment.updateMany.mockResolvedValue({ count: 1 });

    await service.checkInAppointment('appointment-1', 'Đã đối chiếu', true);

    expect(prisma.appointment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'appointment-1',
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      }),
    );
  });

  it('rejects reminders after the appointment time', async () => {
    prisma.appointment.findUnique.mockResolvedValue({
      id: 'past',
      scheduledAt: new Date('2026-09-09T02:00:00.000Z'),
      patient: null,
      createdBy: 'staff-1',
    });

    await expect(service.sendManualReminder('past')).rejects.toThrow(
      'appointment.cannot_remind_past_appointment',
    );
  });

  it('rejects starting treatment outside the current clinic date', async () => {
    prisma.appointment.findUnique.mockResolvedValue({
      id: 'future',
      status: AppointmentStatus.CHECKED_IN,
      scheduledAt: new Date('2026-09-10T02:00:00.000Z'),
    });

    await expect(service.startAppointment('future')).rejects.toThrow(
      'appointment.start_today_only',
    );
  });

  it('rejects a staff appointment in the past', async () => {
    await expect(
      service.createAppointmentForReceptionist('staff-1', {
        patientId: '11111111-1111-4111-8111-111111111111',
        doctorId: '22222222-2222-4222-8222-222222222222',
        treatmentMethodId: '33333333-3333-4333-8333-333333333333',
        scheduledAt: '2026-09-08T03:00:00.000Z',
      }),
    ).rejects.toThrow('appointment.time_in_past');
  });

  it('only permits walk-in appointments on the current clinic date', async () => {
    await expect(
      service.createAppointmentForReceptionist('staff-1', {
        patientId: '11111111-1111-4111-8111-111111111111',
        doctorId: '22222222-2222-4222-8222-222222222222',
        treatmentMethodId: '33333333-3333-4333-8333-333333333333',
        scheduledAt: '2026-09-10T03:00:00.000Z',
        walkIn: true,
      }),
    ).rejects.toThrow('appointment.walk_in_today_only');
  });

  it('does not offer slots for a doctor without an approved work schedule', async () => {
    clinicConfig.getClinicScheduleConfig.mockResolvedValue({
      businessHours: [
        { dayOfWeek: 4, isOpen: true, start: '08:00', end: '17:00' },
      ],
      specialDates: [],
      slotIntervalMinutes: 30,
    });
    prisma.service.findMany.mockResolvedValue([
      {
        id: 'service-1',
        specializationId: null,
        treatmentMethods: [{ id: 'method-1', durationMinutes: 30 }],
      },
    ]);
    prisma.doctor.findMany.mockResolvedValue([
      {
        id: 'doctor-1',
        user: { fullName: 'Bác sĩ A', status: 'ACTIVE' },
        specializations: [],
      },
    ]);
    prisma.doctorAvailability.findMany.mockResolvedValue([]);
    prisma.appointment.findMany.mockResolvedValue([]);
    prisma.videoConsultation.findMany.mockResolvedValue([]);

    const result = (await service.getBookingOptions({
      serviceId: 'service-1',
      date: '2026-09-10',
    })) as {
      timeSlots: string[];
      doctors: Array<{ availableTimeSlots: string[] }>;
    };

    expect(result.timeSlots).toEqual([]);
    expect(result.doctors[0].availableTimeSlots).toEqual([]);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const videoQuery = prisma.videoConsultation.findMany.mock.calls[0][0] as {
      where: {
        status: { in: string[] };
        scheduledAt: { gt: Date; lt: Date };
      };
    };
    expect(videoQuery.where.status.in).toEqual([
      'PENDING_PAYMENT',
      'SCHEDULED',
      'IN_PROGRESS',
    ]);
    expect(videoQuery.where.scheduledAt.gt.toISOString()).toBe(
      '2026-09-08T16:00:00.000Z',
    );
  });

  it('does not silently replace an unavailable requested service', async () => {
    clinicConfig.getClinicScheduleConfig.mockResolvedValue({
      businessHours: [],
      specialDates: [],
      slotIntervalMinutes: 30,
    });
    prisma.service.findMany.mockResolvedValue([
      {
        id: 'service-1',
        specializationId: null,
        treatmentMethods: [{ id: 'method-1', durationMinutes: 30 }],
      },
    ]);
    prisma.doctor.findMany.mockResolvedValue([]);

    const result = await service.getBookingOptions({
      serviceId: 'service-not-supported',
      date: '2026-09-10',
    });

    expect(result.selectedServiceId).toBeNull();
    expect(result.selectedTreatmentMethodId).toBeNull();
    expect(result.timeSlots).toEqual([]);
  });
});
