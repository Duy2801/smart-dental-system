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
