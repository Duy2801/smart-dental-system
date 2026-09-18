import { AppointmentStatus } from '../../../prisma/generated/enums';
import { AppointmentService } from './appointment.service';

describe('AppointmentService clinic-time rules', () => {
  const prisma = {
    appointment: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };
  const service = new AppointmentService(
    prisma as never,
    {} as never,
    { createNotification: jest.fn() } as never,
    { del: jest.fn() } as never,
    { add: jest.fn() } as never,
  );

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-09T03:00:00.000Z'));
    jest.clearAllMocks();
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

    await expect(service.checkInAppointment('future', undefined, true)).rejects.toThrow(
      'appointment.check_in_today_only',
    );
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
        where: { id: 'appointment-1', status: { in: ['PENDING', 'CONFIRMED'] } },
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
});

describe('AppointmentService doctor availability rules', () => {
  type AppointmentServiceInternals = {
    isDoctorWorking(
      doctorId: string,
      startAt: Date,
      endAt: Date,
    ): Promise<boolean>;
    isDoctorBookableFromSnapshot(
      doctorId: string,
      startAt: Date,
      endAt: Date,
      recordsByDoctor: Map<string, unknown[]>,
      appointmentsByDoctor: Map<string, unknown[]>,
      dateStr: string,
    ): boolean;
  };

  const prisma = {
    doctorAvailability: { findMany: jest.fn() },
  };
  const clinicConfig = {
    getClinicScheduleConfig: jest.fn(),
  };
  const service = new AppointmentService(
    prisma as never,
    clinicConfig as never,
    {} as never,
    {} as never,
    {} as never,
  );
  const serviceInternals = service as unknown as AppointmentServiceInternals;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.doctorAvailability.findMany.mockResolvedValue([]);
    clinicConfig.getClinicScheduleConfig.mockResolvedValue({
      businessHours: [
        {
          id: 6,
          isOpen: true,
          start: '08:00',
          end: '12:00',
        },
      ],
      specialDates: [],
    });
  });

  it('does not treat clinic business hours as a doctor schedule', async () => {
    const startAt = new Date('2026-09-19T01:00:00.000Z');
    const endAt = new Date('2026-09-19T02:00:00.000Z');

    await expect(
      serviceInternals.isDoctorWorking(
        'doctor-without-schedule',
        startAt,
        endAt,
      ),
    ).resolves.toBe(false);
  });

  it('does not expose a doctor without approved availability in slot snapshots', () => {
    const startAt = new Date('2026-09-19T01:00:00.000Z');
    const endAt = new Date('2026-09-19T02:00:00.000Z');

    expect(
      serviceInternals.isDoctorBookableFromSnapshot(
        'doctor-without-schedule',
        startAt,
        endAt,
        new Map(),
        new Map(),
        '2026-09-19',
      ),
    ).toBe(false);
  });
});
