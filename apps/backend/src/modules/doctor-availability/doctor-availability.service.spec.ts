import { BadRequestException } from '@nestjs/common';
import {
  AvailabilityApprovalStatus,
  AvailabilityRecordType,
} from '../../../prisma/generated/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { DoctorAvailabilityService } from './doctor-availability.service';

describe('DoctorAvailabilityService.create', () => {
  const doctorId = '11111111-1111-4111-8111-111111111111';
  const doctorUser: AuthenticatedUser = {
    userId: '22222222-2222-4222-8222-222222222222',
    email: 'doctor@example.com',
    roles: ['DOCTOR'],
    permissions: [],
  };

  const prisma = {
    doctor: { findUnique: jest.fn() },
    appointment: { findMany: jest.fn() },
    doctorAvailability: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };
  const clinicConfig = { getConfiguredBusinessHours: jest.fn() };
  const service = new DoctorAvailabilityService(
    prisma as never,
    clinicConfig as never,
  );

  const timeOff = {
    doctorId,
    recordType: AvailabilityRecordType.TIME_OFF,
    specificDate: '2026-09-05',
    startTime: '08:00',
    endTime: '17:00',
    reason: 'Việc cá nhân',
  };

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-05T15:00:00.000Z'));
    jest.clearAllMocks();
    prisma.doctor.findUnique.mockResolvedValue({ id: doctorId });
    prisma.appointment.findMany.mockResolvedValue([]);
    prisma.doctorAvailability.findMany.mockResolvedValue([]);
    prisma.doctorAvailability.create.mockImplementation(({ data }) => data);
  });

  afterEach(() => jest.useRealTimers());

  it('rejects a time-off request whose start time has already passed in Vietnam', async () => {
    await expect(service.create(doctorUser, timeOff)).rejects.toEqual(
      new BadRequestException('availability.time_off_in_past'),
    );
    expect(prisma.doctorAvailability.create).not.toHaveBeenCalled();
  });

  it('stores a doctor time-off request as pending approval', async () => {
    const futureTimeOff = { ...timeOff, specificDate: '2026-09-06' };

    await service.create(doctorUser, futureTimeOff);

    expect(prisma.doctorAvailability.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        approvalStatus: AvailabilityApprovalStatus.PENDING,
      }),
    });
  });

  it('keeps staff-created availability approved by default', async () => {
    const adminUser: AuthenticatedUser = {
      ...doctorUser,
      roles: ['ADMIN'],
    };
    const futureTimeOff = { ...timeOff, specificDate: '2026-09-06' };

    await service.create(adminUser, futureTimeOff);

    expect(prisma.doctorAvailability.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        approvalStatus: AvailabilityApprovalStatus.APPROVED,
      }),
    });
  });
});
