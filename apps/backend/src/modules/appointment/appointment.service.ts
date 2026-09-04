import { InjectQueue } from '@nestjs/bull';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import type { Queue } from 'bull';
import { randomBytes } from 'crypto';
import {
  AppointmentPaymentOption,
  AppointmentPaymentStatus,
  AppointmentStatus,
  BookingSource,
  DiscountType,
  InvoiceStatus,
  InvoiceType,
} from '../../../prisma/generated/enums';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../../prisma/generated/client';
import { ClinicConfigService } from '../clinic-config/clinic-config.service';
import { NotificationService } from '../notification/notification.service';
import {
  BusinessHourDto,
  ClinicSpecialDateDto,
} from '../clinic-config/dto/update-clinic-config.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CreateStaffAppointmentDto } from './dto/create-staff-appointment.dto';

const activeAppointmentStatuses = [
  AppointmentStatus.PENDING,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.CHECKED_IN,
  AppointmentStatus.IN_PROGRESS,
];

const incompleteAppointmentStatuses = [...activeAppointmentStatuses];
const patientCancelableStatuses: AppointmentStatus[] = [
  AppointmentStatus.PENDING,
  AppointmentStatus.CONFIRMED,
];
const patientReschedulableStatuses: AppointmentStatus[] = [
  ...patientCancelableStatuses,
];
const patientCancelNoticeHours = 12;
const patientRescheduleNoticeHours = 6;
const noShowOnlineBookingBlockedThreshold = 3;

const appointmentInclude = {
  patient: { include: { user: true } },
  doctor: { include: { user: true } },
  treatmentMethod: { include: { service: true } },
  medicalRecords: { select: { id: true }, take: 1 },
  invoices: { select: { id: true, invoiceType: true, status: true, finalAmount: true } },
};

type BookingOptionQuery = {
  serviceId?: string;
  treatmentMethodId?: string;
  doctorId?: string;
  date?: string;
  time?: string;
};

type AvailabilityRecordSnapshot = {
  doctorId: string;
  recordType: 'WEEKLY' | 'DATE_OVERRIDE' | 'TIME_OFF';
  dayOfWeek: number | null;
  specificDate: Date | null;
  startTime: string;
  endTime: string;
};

type AppointmentSlotSnapshot = {
  doctorId: string;
  scheduledAt: Date;
  endAt: Date;
};

type PatientBookingPolicy = {
  noShowCount: number;
  requiresDeposit: boolean;
  onlineBookingBlocked: boolean;
};

@Injectable()
export class AppointmentService {
  private readonly logger = new Logger(AppointmentService.name);

  constructor(
    private prisma: PrismaService,
    private clinicConfigService: ClinicConfigService,
    private notificationService: NotificationService,
    @InjectQueue('mail-queue') private readonly mailQueue: Queue,
  ) { }

  private withDerivedService<T extends Record<string, any>>(
    appointment: T,
  ) {
    const service = appointment.service ?? appointment.treatmentMethod?.service ?? null;
    return {
      ...appointment,
      service,
      serviceId:
        appointment.serviceId ??
        (service && typeof service === 'object' && 'id' in service
          ? (service as { id: string }).id
          : null),
    };
  }

  private withDerivedServices<T extends Record<string, any>>(
    appointments: T[],
  ) {
    return appointments.map((appointment) =>
      this.withDerivedService(appointment),
    );
  }

  async createAppointmentForReceptionist(
    staffUserId: string,
    dto: CreateStaffAppointmentDto,
  ) {
    const appointment = await this.createAppointment({
      patientId: dto.patientId,
      doctorId: dto.doctorId,
      treatmentMethodId: dto.treatmentMethodId,
      scheduledAt: dto.scheduledAt,
      notes: dto.notes,
      paymentOption: AppointmentPaymentOption.PAY_AT_COUNTER,
      bookingSource: BookingSource.RECEPTIONIST,
      createdBy: staffUserId,
      skipOnlineBookingBlock: true,
      allowPastSchedule: true,
    });

    if (dto.walkIn) {
      const updated = await this.prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          status: AppointmentStatus.CHECKED_IN,
          checkedInAt: new Date(),
        },
        include: appointmentInclude,
      });
      return this.withDerivedService(updated);
    }

    const updated = await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: AppointmentStatus.CONFIRMED,
        scheduleConfirmedAt: new Date(),
      },
      include: appointmentInclude,
    });
    const result = this.withDerivedService(updated);
    void this.dispatchAppointmentConfirmationNotification(result);
    return result;
  }

  async createAppointmentForPatient(userId: string, dto: CreateAppointmentDto) {
    const patient = dto.patientId
      ? await this.ensureUserCanBookPatient(userId, dto.patientId)
      : await this.findOrCreatePatientProfile(userId);

    return this.createAppointment({
      patientId: patient.id,
      doctorId: dto.doctorId,
      treatmentMethodId: dto.treatmentMethodId,
      scheduledAt: dto.scheduledAt,
      notes: dto.notes,
      paymentOption: AppointmentPaymentOption.PAY_AT_COUNTER,
      promotionCode: dto.promotionCode,
      bookingSource: BookingSource.PATIENT_APP,
      createdBy: userId,
    });
  }

  async rescheduleAppointmentForPatient(
    userId: string,
    appointmentId: string,
    dto: { scheduledAt: string },
  ) {
    const ownerWhere = await this.buildPatientAppointmentOwnerWhere(userId);
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        ...ownerWhere,
      },
      include: {
        doctor: true,
        treatmentMethod: true,
      },
    });

    if (!appointment) {
      throw new BadRequestException('appointment.not_found');
    }

    if (appointment.patientId) {
      await this.ensureUserCanBookPatient(userId, appointment.patientId);
    }

    this.ensurePatientRescheduleAllowed(appointment);
    this.ensureOnlineBookingAllowed(
      await this.getPatientBookingPolicy(
        appointment.patientId,
        appointment.createdBy,
      ),
    );

    const previousSchedule = {
      scheduledAt: appointment.scheduledAt,
      endAt: appointment.endAt,
      status: appointment.status,
      changedAt: new Date(),
    };

    const rescheduleHistory = Array.isArray(appointment.rescheduleHistory)
      ? appointment.rescheduleHistory
      : [];

    if (rescheduleHistory.length >= 1) {
      throw new ConflictException('appointment.reschedule_limit_reached');
    }

    const scheduledAt = new Date(dto.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('appointment.invalid_time');
    }
    if (scheduledAt <= new Date()) {
      throw new BadRequestException('appointment.time_in_past');
    }

    const endAt = new Date(
      scheduledAt.getTime() +
      (appointment.treatmentMethod?.durationMinutes ?? 30) * 60 * 1000,
    );

    if (
      !this.hasRequiredNoticeBeforeAppointment(
        scheduledAt,
        patientRescheduleNoticeHours,
      )
    ) {
      throw new ConflictException('appointment.reschedule_deadline_passed');
    }

    await this.ensureClinicOpen(scheduledAt, endAt);
    await this.ensureDoctorAvailableForExistingAppointment(
      appointment.doctorId,
      appointment.id,
      scheduledAt,
      endAt,
    );
    await this.ensurePatientHasNoOverlappingAppointment(
      appointment.patientId,
      appointment.createdBy,
      scheduledAt,
      endAt,
      appointment.id,
    );
    await this.ensureNoConflict(
      appointment.doctorId,
      scheduledAt,
      endAt,
      appointment.id,
    );

    const updated = await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        scheduledAt,
        endAt,
        rescheduleHistory: [...rescheduleHistory, previousSchedule],
      },
      include: appointmentInclude,
    });
    const result = this.withDerivedService(updated);
    void this.dispatchAppointmentRescheduledNotification(result, previousSchedule.scheduledAt, scheduledAt);
    return result;
  }

  async cancelAppointmentForPatient(userId: string, appointmentId: string) {
    const ownerWhere = await this.buildPatientAppointmentOwnerWhere(userId);
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        ...ownerWhere,
      },
      include: appointmentInclude,
    });

    if (!appointment) {
      throw new BadRequestException('appointment.not_found');
    }

    if (appointment.patientId) {
      await this.ensureUserCanBookPatient(userId, appointment.patientId);
    }

    this.ensurePatientCancellationAllowed(appointment);

    const updated = await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: 'Cancelled by patient',
      },
      include: appointmentInclude,
    });
    const result = this.withDerivedService(updated);
    void this.dispatchAppointmentCancelledNotification(result, 'Bệnh nhân đã hủy qua ứng dụng');
    return result;
  }

  async findByDoctorAndWeek(doctorId: string, from: string, to: string) {
    const parseBound = (raw: string, endOfDay: boolean) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        const [y, m, d] = raw.split('-').map(Number);
        return endOfDay
          ? new Date(y, m - 1, d, 23, 59, 59, 999)
          : new Date(y, m - 1, d, 0, 0, 0, 0);
      }
      const value = new Date(raw);
      if (endOfDay) value.setHours(23, 59, 59, 999);
      return value;
    };

    const fromDate = parseBound(from, false);
    const toDate = parseBound(to, true);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        scheduledAt: { gte: fromDate, lte: toDate },
      },
      include: appointmentInclude,
      orderBy: { scheduledAt: 'asc' },
    });
    return this.withDerivedServices(appointments);
  }

  async findByDate(params: {
    date?: string;
    from?: string;
    to?: string;
    doctorId?: string;
    search?: string;
  }) {
    const fromRaw = params.from ?? params.date;
    const toRaw = params.to ?? params.date;
    if (!fromRaw || !toRaw) {
      throw new BadRequestException('appointment.date_required');
    }

    const parseBound = (raw: string, endOfDay: boolean) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        return endOfDay
          ? new Date(`${raw}T23:59:59.999+07:00`)
          : new Date(`${raw}T00:00:00.000+07:00`);
      }
      const value = new Date(raw);
      if (endOfDay) value.setHours(23, 59, 59, 999);
      return value;
    };

    const fromDate = parseBound(fromRaw, false);
    const toDate = parseBound(toRaw, true);
    const search = params.search?.trim();

    const appointments = await this.prisma.appointment.findMany({
      where: {
        ...(params.doctorId ? { doctorId: params.doctorId } : {}),
        scheduledAt: { gte: fromDate, lte: toDate },
        ...(search
          ? {
            OR: [
              {
                appointmentCode: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                patient: {
                  is: {
                    OR: [
                      { fullName: { contains: search, mode: 'insensitive' } },
                      { phone: { contains: search } },
                      {
                        user: {
                          is: {
                            OR: [
                              {
                                fullName: {
                                  contains: search,
                                  mode: 'insensitive',
                                },
                              },
                              { phone: { contains: search } },
                            ],
                          },
                        },
                      },
                    ],
                  },
                },
              },
            ],
          }
          : {}),
      },
      include: appointmentInclude,
      orderBy: { scheduledAt: 'asc' },
    });
    return this.withDerivedServices(appointments);
  }

  async findOne(appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: appointmentInclude,
    });
    if (!appointment) {
      throw new BadRequestException('appointment.not_found');
    }
    return this.withDerivedService(appointment);
  }

  async confirmAppointment(appointmentId: string) {
    const updated = await this.transitionAppointment(
      appointmentId,
      [AppointmentStatus.PENDING],
      {
        status: AppointmentStatus.CONFIRMED,
        scheduleConfirmedAt: new Date(),
      },
      'appointment.must_be_pending_to_confirm',
    );
    void this.dispatchAppointmentConfirmationNotification(updated);
    return updated;
  }

  async checkInAppointment(appointmentId: string, notes?: string) {
    const current = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { notes: true },
    });
    if (!current) {
      throw new BadRequestException('appointment.not_found');
    }

    const staffNote = notes?.trim();
    const mergedNotes = staffNote
      ? [current.notes, `[Check-in] ${staffNote}`].filter(Boolean).join('\n')
      : undefined;

    const updated = await this.transitionAppointment(
      appointmentId,
      [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
      {
        status: AppointmentStatus.CHECKED_IN,
        checkedInAt: new Date(),
        ...(mergedNotes ? { notes: mergedNotes } : {}),
      },
      'appointment.must_be_confirmed_to_check_in',
    );
    void this.dispatchAppointmentCheckInNotification(updated);
    return updated;
  }

  async findDoctorByUserId(userId: string) {
    return this.prisma.doctor.findUnique({
      where: { userId },
    });
  }

  async markNoShow(appointmentId: string) {
    const appt = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { scheduledAt: true },
    });
    if (!appt) {
      throw new BadRequestException('appointment.not_found');
    }
    if (new Date(appt.scheduledAt) > new Date()) {
      throw new BadRequestException('appointment.cannot_mark_future_no_show');
    }
    return this.transitionAppointment(
      appointmentId,
      [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
      { status: AppointmentStatus.NO_SHOW },
      'appointment.cannot_mark_no_show',
    );
  }

  async cancelByStaff(appointmentId: string, reason?: string) {
    const updated = await this.transitionAppointment(
      appointmentId,
      [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
      {
        status: AppointmentStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: reason || 'Cancelled by staff',
      },
      'appointment.cannot_cancel',
    );
    void this.dispatchAppointmentCancelledNotification(updated, reason || 'Phòng khám hủy lịch theo yêu cầu');
    return updated;
  }

  /** Lễ tân/admin đổi giờ — không áp hạn mức/notice của bệnh nhân. */
  async rescheduleByStaff(appointmentId: string, dto: { scheduledAt: string }) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: true,
        treatmentMethod: true,
      },
    });

    if (!appointment) {
      throw new BadRequestException('appointment.not_found');
    }

    const reschedulable: AppointmentStatus[] = [
      AppointmentStatus.PENDING,
      AppointmentStatus.CONFIRMED,
    ];
    if (!reschedulable.includes(appointment.status)) {
      throw new ConflictException('appointment.reschedule_not_allowed');
    }

    const scheduledAt = new Date(dto.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('appointment.invalid_time');
    }

    const endAt = new Date(
      scheduledAt.getTime() +
      (appointment.treatmentMethod?.durationMinutes ?? 30) * 60 * 1000,
    );

    const previousSchedule = {
      scheduledAt: appointment.scheduledAt,
      endAt: appointment.endAt,
      status: appointment.status,
      changedAt: new Date(),
    };
    const rescheduleHistory = Array.isArray(appointment.rescheduleHistory)
      ? appointment.rescheduleHistory
      : [];

    await this.ensureClinicOpen(scheduledAt, endAt);
    await this.ensureDoctorAvailableForExistingAppointment(
      appointment.doctorId,
      appointment.id,
      scheduledAt,
      endAt,
    );
    if (appointment.patientId) {
      await this.ensurePatientHasNoOverlappingAppointment(
        appointment.patientId,
        appointment.createdBy,
        scheduledAt,
        endAt,
        appointment.id,
      );
    }
    await this.ensureNoConflict(
      appointment.doctorId,
      scheduledAt,
      endAt,
      appointment.id,
    );

    const updated = await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        scheduledAt,
        endAt,
        rescheduleHistory: [...rescheduleHistory, previousSchedule].slice(-10),
      },
      include: appointmentInclude,
    });
    const result = this.withDerivedService(updated);
    void this.dispatchAppointmentRescheduledNotification(result, previousSchedule.scheduledAt, scheduledAt);
    return result;
  }

  async sendManualReminder(appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: appointmentInclude,
    });
    if (!appointment) {
      throw new BadRequestException('appointment.not_found');
    }

    const patient = appointment.patient;
    const email = patient?.email || patient?.user?.email;
    const name = patient?.fullName || patient?.user?.fullName || 'Quý khách';
    const doctorName = appointment.doctor?.user?.fullName || 'Bác sĩ chuyên khoa';
    const service = (appointment as any).service ?? appointment.treatmentMethod?.service;
    const serviceName = (service && typeof service === 'object' && 'name' in service) ? service.name : 'Khám nha khoa';
    const scheduledAt = appointment.scheduledAt;
    const code = appointment.appointmentCode;

    if (email) {
      await this.mailQueue.add('send-appointment-reminder', {
        email,
        name,
        appointmentCode: code,
        serviceName,
        doctorName,
        scheduledAt: new Date(scheduledAt).toISOString(),
        locale: 'vi',
      });
    }

    const targetUserId = patient?.userId || appointment.createdBy;
    if (targetUserId) {
      const timeStr = new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: 'Asia/Ho_Chi_Minh',
      }).format(new Date(scheduledAt));

      await this.notificationService.createNotification({
        userId: targetUserId,
        type: 'APPOINTMENT_REMINDER',
        title: 'Nhắc lịch hẹn khám sắp tới',
        content: `Quý khách có lịch hẹn #${code} (${serviceName} với ${doctorName}) lúc ${timeStr}. Vui lòng đến trước 15 phút.`,
        appointmentId: appointment.id,
      });
    }

    return {
      success: true,
      message: `Đã gửi Gmail & Thông báo nhắc lịch đến bệnh nhân ${name}`,
    };
  }

  private async dispatchAppointmentConfirmationNotification(appointment: any) {
    try {
      const patient = appointment.patient;
      const email = patient?.email || patient?.user?.email;
      const name = patient?.fullName || patient?.user?.fullName || 'Quý khách';
      const doctorName = appointment.doctor?.user?.fullName || 'Bác sĩ chuyên khoa';
      const service = appointment.service ?? appointment.treatmentMethod?.service;
      const serviceName = (service && typeof service === 'object' && 'name' in service) ? service.name : 'Khám nha khoa';
      const scheduledAt = appointment.scheduledAt;
      const code = appointment.appointmentCode;

      if (email) {
        await this.mailQueue.add('send-appointment-confirmation', {
          email,
          name,
          appointmentCode: code,
          serviceName,
          doctorName,
          scheduledAt: new Date(scheduledAt).toISOString(),
          locale: 'vi',
        });
      }

      const targetUserId = patient?.userId || appointment.createdBy;
      if (targetUserId) {
        const timeStr = new Intl.DateTimeFormat('vi-VN', {
          dateStyle: 'short',
          timeStyle: 'short',
          timeZone: 'Asia/Ho_Chi_Minh',
        }).format(new Date(scheduledAt));

        await this.notificationService.createNotification({
          userId: targetUserId,
          type: 'APPOINTMENT_CONFIRMED',
          title: 'Lịch hẹn đã được xác nhận',
          content: `Lịch hẹn khám #${code} (${serviceName} - ${doctorName}) lúc ${timeStr} đã được xác nhận.`,
          appointmentId: appointment.id,
        });
      }
    } catch (err) {
      this.logger.warn(`Failed to dispatch appointment confirmation notification: ${err}`);
    }
  }

  private async dispatchAppointmentRescheduledNotification(
    appointment: any,
    oldScheduledAt: Date,
    newScheduledAt: Date,
  ) {
    try {
      const patient = appointment.patient;
      const email = patient?.email || patient?.user?.email;
      const name = patient?.fullName || patient?.user?.fullName || 'Quý khách';
      const doctorName = appointment.doctor?.user?.fullName || 'Bác sĩ chuyên khoa';
      const service = appointment.service ?? appointment.treatmentMethod?.service;
      const serviceName = (service && typeof service === 'object' && 'name' in service) ? service.name : 'Khám nha khoa';
      const code = appointment.appointmentCode;

      if (email) {
        await this.mailQueue.add('send-appointment-rescheduled', {
          email,
          name,
          appointmentCode: code,
          serviceName,
          doctorName,
          oldScheduledAt: new Date(oldScheduledAt).toISOString(),
          newScheduledAt: new Date(newScheduledAt).toISOString(),
          locale: 'vi',
        });
      }

      const targetUserId = patient?.userId || appointment.createdBy;
      if (targetUserId) {
        const newTimeStr = new Intl.DateTimeFormat('vi-VN', {
          dateStyle: 'short',
          timeStyle: 'short',
          timeZone: 'Asia/Ho_Chi_Minh',
        }).format(new Date(newScheduledAt));

        await this.notificationService.createNotification({
          userId: targetUserId,
          type: 'APPOINTMENT_RESCHEDULED',
          title: 'Lịch hẹn đã được dời',
          content: `Lịch hẹn khám #${code} (${serviceName}) đã được dời sang ${newTimeStr}.`,
          appointmentId: appointment.id,
        });
      }
    } catch (err) {
      this.logger.warn(`Failed to dispatch appointment rescheduled notification: ${err}`);
    }
  }

  private async dispatchAppointmentCancelledNotification(appointment: any, reason?: string) {
    try {
      const patient = appointment.patient;
      const email = patient?.email || patient?.user?.email;
      const name = patient?.fullName || patient?.user?.fullName || 'Quý khách';
      const doctorName = appointment.doctor?.user?.fullName || 'Bác sĩ chuyên khoa';
      const service = appointment.service ?? appointment.treatmentMethod?.service;
      const serviceName = (service && typeof service === 'object' && 'name' in service) ? service.name : 'Khám nha khoa';
      const scheduledAt = appointment.scheduledAt;
      const code = appointment.appointmentCode;

      if (email) {
        await this.mailQueue.add('send-appointment-cancelled', {
          email,
          name,
          appointmentCode: code,
          serviceName,
          doctorName,
          scheduledAt: new Date(scheduledAt).toISOString(),
          reason,
          locale: 'vi',
        });
      }

      const targetUserId = patient?.userId || appointment.createdBy;
      if (targetUserId) {
        await this.notificationService.createNotification({
          userId: targetUserId,
          type: 'APPOINTMENT_CANCELLED',
          title: 'Lịch hẹn đã bị hủy',
          content: `Lịch hẹn khám #${code} (${serviceName}) đã được hủy. Lý do: ${reason || 'Theo yêu cầu'}.`,
          appointmentId: appointment.id,
        });
      }
    } catch (err) {
      this.logger.warn(`Failed to dispatch appointment cancelled notification: ${err}`);
    }
  }

  private async dispatchAppointmentCheckInNotification(appointment: any) {
    try {
      const patient = appointment.patient;
      const email = patient?.email || patient?.user?.email;
      const name = patient?.fullName || patient?.user?.fullName || 'Quý khách';
      const doctorName = appointment.doctor?.user?.fullName || 'Bác sĩ chuyên khoa';
      const doctorUserId = appointment.doctor?.userId;
      const service = (appointment as any).service ?? appointment.treatmentMethod?.service;
      const serviceName = (service && typeof service === 'object' && 'name' in service) ? service.name : 'Khám nha khoa';
      const code = appointment.appointmentCode;
      const queueNumber = `#${code.slice(-4)}`;

      if (email) {
        await this.mailQueue.add('send-check-in-welcome', {
          email,
          name,
          appointmentCode: code,
          queueNumber,
          doctorName,
          roomName: 'Phòng khám Smart Dental - Tầng 1',
          serviceName,
          checkedInAt: new Date().toISOString(),
        });
      }

      // In-App for Patient
      const patientUserId = patient?.userId || appointment.createdBy;
      if (patientUserId) {
        await this.notificationService.createNotification({
          userId: patientUserId,
          type: 'APPOINTMENT_CHECKED_IN',
          title: 'Tiếp nhận khám thành công',
          content: `Bạn đã check-in thành công. Số thứ tự: ${queueNumber} (${serviceName} - ${doctorName}). Vui lòng theo dõi thông báo tại sảnh chờ.`,
          appointmentId: appointment.id,
        });
      }

      // In-App for Doctor
      if (doctorUserId) {
        await this.notificationService.createNotification({
          userId: doctorUserId,
          type: 'PATIENT_WAITING',
          title: 'Bệnh nhân đã đến phòng khám',
          content: `Bệnh nhân ${name} (${serviceName}, STT ${queueNumber}) đã check-in tại quầy và đang chờ tại sảnh.`,
          appointmentId: appointment.id,
        });
      }
    } catch (err) {
      this.logger.warn(`Failed to dispatch check-in notification: ${err}`);
    }
  }

  private async dispatchAppointmentInProgressNotification(appointment: any) {
    try {
      const patient = appointment.patient;
      const doctorName = appointment.doctor?.user?.fullName || 'Bác sĩ chuyên khoa';
      const patientUserId = patient?.userId || appointment.createdBy;
      const code = appointment.appointmentCode;

      if (patientUserId) {
        await this.notificationService.createNotification({
          userId: patientUserId,
          type: 'APPOINTMENT_IN_PROGRESS',
          title: 'Đến lượt vào phòng khám',
          content: `Lịch hẹn #${code}: Mời bạn di chuyển vào phòng khám / ghế nha khoa gặp ${doctorName}.`,
          appointmentId: appointment.id,
        });
      }
    } catch (err) {
      this.logger.warn(`Failed to dispatch in-progress notification: ${err}`);
    }
  }

  private async transitionAppointment(
    appointmentId: string,
    allowed: AppointmentStatus[],
    data: Record<string, unknown>,
    errorCode: string,
  ) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });
    if (!appointment) {
      throw new BadRequestException('appointment.not_found');
    }
    if (!allowed.includes(appointment.status)) {
      throw new BadRequestException(errorCode);
    }
    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data,
      include: appointmentInclude,
    });
    return this.withDerivedService(updated);
  }

  async startAppointment(appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new BadRequestException('appointment.not_found');
    }

    if (appointment.status !== AppointmentStatus.CHECKED_IN) {
      throw new BadRequestException('appointment.must_be_checked_in_to_start');
    }

    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: AppointmentStatus.IN_PROGRESS },
      include: appointmentInclude,
    });
    const result = this.withDerivedService(updated);
    void this.dispatchAppointmentInProgressNotification(result);
    return result;
  }

  async completeAppointment(appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { treatmentMethod: { include: { service: true } } },
    });

    if (!appointment) {
      throw new BadRequestException('appointment.not_found');
    }

    if (appointment.status !== AppointmentStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'appointment.must_be_in_progress_to_complete',
      );
    }

    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.COMPLETED,
        completedAt: new Date(),
      },
      include: appointmentInclude,
    });

    // Sau khám: tạo HĐ thu tiền phù hợp (ca ngắn / phần còn lại sau cọc)
    if (appointment.patientId) {
      await this.ensureInvoiceAfterComplete(appointment);
      await this.ensureMedicalRecord(appointment);
    }

    return this.withDerivedService(updated);
  }

  /** Tạo hồ sơ bệnh án trống nếu ca khám chưa có — để bác sĩ cập nhật sau khi khám. */
  private async ensureMedicalRecord(appointment: {
    id: string;
    patientId: string | null;
    doctorId: string;
    notes?: string | null;
    treatmentPlanStepId?: string | null;
  }) {
    if (!appointment.patientId) return null;

    const existing = await this.prisma.medicalRecord.findFirst({
      where: { appointmentId: appointment.id },
    });
    if (existing) return existing;

    return this.prisma.medicalRecord.create({
      data: {
        patientId: appointment.patientId,
        appointmentId: appointment.id,
        doctorId: appointment.doctorId,
        treatmentPlanStepId: appointment.treatmentPlanStepId ?? null,
        chiefComplaint: appointment.notes?.trim() || null,
      },
    });
  }

  /** Ca ngắn → SERVICE. Có cọc → FINAL. Lịch gắn bước KH → STEP. */
  private async ensureInvoiceAfterComplete(appointment: {
    id: string;
    patientId: string | null;
    createdBy: string;
    treatmentPlanStepId?: string | null;
    treatmentMethod?: {
      id: string;
      name: string;
      basePrice: unknown;
      service: { id: string; name: string };
    } | null;
  }) {
    if (!appointment.patientId || !appointment.treatmentMethod) return;

    if (appointment.treatmentPlanStepId) {
      await this.ensureStepInvoice({
        stepId: appointment.treatmentPlanStepId,
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        createdBy: appointment.createdBy,
        fallbackServiceName: appointment.treatmentMethod.name,
        fallbackAmount: Number(appointment.treatmentMethod.basePrice),
      });
      return;
    }

    const invoices = await this.prisma.invoice.findMany({
      where: { appointmentId: appointment.id },
      select: {
        id: true,
        invoiceType: true,
        status: true,
        finalAmount: true,
      },
    });

    const openStatuses: InvoiceStatus[] = [
      InvoiceStatus.DRAFT,
      InvoiceStatus.ISSUED,
      InvoiceStatus.PARTIALLY_PAID,
    ];
    const hasOpen = invoices.some((inv) => openStatuses.includes(inv.status));
    if (hasOpen) return;

    const paidDeposit = invoices.find(
      (inv) =>
        inv.invoiceType === InvoiceType.DEPOSIT &&
        inv.status === InvoiceStatus.PAID,
    );
    const hasServiceOrFinal = invoices.some(
      (inv) =>
        inv.invoiceType === InvoiceType.SERVICE ||
        inv.invoiceType === InvoiceType.FINAL_PAYMENT ||
        inv.invoiceType === InvoiceType.STEP_PAYMENT,
    );
    if (hasServiceOrFinal) return;

    const basePrice = Number(appointment.treatmentMethod.basePrice);
    const depositPaid = paidDeposit ? Number(paidDeposit.finalAmount) : 0;
    const remaining = Number((basePrice - depositPaid).toFixed(2));

    if (remaining <= 0) return;

    const isBalance = depositPaid > 0;
    await this.prisma.invoice.create({
      data: {
        invoiceCode: await this.generateInvoiceCode(),
        patientId: appointment.patientId,
        appointmentId: appointment.id,
        invoiceType: isBalance
          ? InvoiceType.FINAL_PAYMENT
          : InvoiceType.SERVICE,
        items: [
          {
            service_id: appointment.treatmentMethod.service.id,
            treatment_method_id: appointment.treatmentMethod.id,
            description: isBalance
              ? `Phan con lai sau coc - ${appointment.treatmentMethod.name}`
              : appointment.treatmentMethod.name,
            qty: 1,
            unit_price: remaining,
            amount: remaining,
            type: isBalance ? 'BALANCE' : 'SERVICE',
          },
        ],
        subtotal: remaining,
        finalAmount: remaining,
        status: InvoiceStatus.ISSUED,
        issuedAt: new Date(),
        createdBy: appointment.createdBy,
      },
    });
  }

  /** Tạo HĐ STEP_PAYMENT cho một bước kế hoạch (idempotent). */
  async ensureStepInvoice(input: {
    stepId: string;
    appointmentId?: string | null;
    patientId: string;
    createdBy: string;
    fallbackServiceName?: string;
    fallbackAmount?: number;
  }) {
    const existing = await this.prisma.invoice.findFirst({
      where: {
        treatmentPlanStepId: input.stepId,
        status: {
          notIn: [InvoiceStatus.CANCELLED, InvoiceStatus.REFUNDED],
        },
      },
      select: { id: true },
    });
    if (existing) return existing;

    const step = await this.prisma.treatmentPlanStep.findUnique({
      where: { id: input.stepId },
      select: {
        id: true,
        title: true,
        stepOrder: true,
        estimatedCost: true,
        paymentAmount: true,
        treatmentPlanId: true,
        paymentStatus: true,
      },
    });
    if (!step) return null;

    const amount = Number(
      step.paymentAmount ?? step.estimatedCost ?? input.fallbackAmount ?? 0,
    );
    if (amount <= 0) return null;

    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceCode: await this.generateInvoiceCode(),
        patientId: input.patientId,
        appointmentId: input.appointmentId ?? null,
        treatmentPlanId: step.treatmentPlanId,
        treatmentPlanStepId: step.id,
        invoiceType: InvoiceType.STEP_PAYMENT,
        items: [
          {
            description: `Dot ${step.stepOrder}: ${step.title}`,
            qty: 1,
            unit_price: amount,
            amount,
            type: 'STEP',
          },
        ],
        subtotal: amount,
        finalAmount: amount,
        status: InvoiceStatus.ISSUED,
        issuedAt: new Date(),
        createdBy: input.createdBy,
      },
      select: { id: true },
    });

    if (step.paymentStatus === 'UNBILLED') {
      await this.prisma.treatmentPlanStep.update({
        where: { id: step.id },
        data: { paymentStatus: 'INVOICED' },
      });
    }

    return invoice;
  }

  async getBookingOptions(query: BookingOptionQuery) {
    const [doctorSpecializations, clinicConfig] = await Promise.all([
      query.doctorId
        ? this.prisma.doctorSpecialization.findMany({
          where: {
            doctorId: query.doctorId,
            specialization: { isActive: true },
          },
          select: { specializationId: true },
        })
        : Promise.resolve([]),
      this.clinicConfigService.getClinicScheduleConfig(),
    ]);
    const doctorSpecializationIds = doctorSpecializations.map(
      (item) => item.specializationId,
    );

    const services = await this.prisma.service.findMany({
      where: {
        isActive: true,
        ...(query.doctorId
          ? { specializationId: { in: doctorSpecializationIds } }
          : {}),
      },
      include: {
        treatmentMethods: {
          where: { isActive: true },
          orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        },
      },
      orderBy: [
        { isFeatured: 'desc' },
        { displayOrder: 'asc' },
        { name: 'asc' },
      ],
    });
    const selectedService =
      services.find((service) => service.id === query.serviceId) ?? services[0];
    const selectedTreatmentMethod =
      selectedService?.treatmentMethods.find(
        (method) => method.id === query.treatmentMethodId,
      ) ??
      selectedService?.treatmentMethods[0] ??
      null;

    const doctorWhere: any = {
      isActive: true,
      user: { status: 'ACTIVE' },
      ...(query.doctorId ? { id: query.doctorId } : {}),
    };

    if (selectedService?.specializationId) {
      doctorWhere.specializations = {
        some: {
          specializationId: selectedService.specializationId,
        },
      };
    }

    const rawDoctors = await this.prisma.doctor.findMany({
      where: doctorWhere,
      include: {
        user: true,
        specializations: {
          include: {
            specialization: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const doctors = rawDoctors.map((doc) => ({
      ...doc,
      specialization:
        doc.specializations
          .map((s) => s.specialization.name)
          .filter(Boolean)
          .join(', ') || 'Chuyên môn nha khoa',
    }));
    const bookingWindow = await this.getBookingWindowData(
      doctors.map((doctor) => doctor.id),
    );
    const dates = await this.buildBookingDates(
      doctors.map((doctor) => doctor.id),
      clinicConfig.businessHours,
      selectedTreatmentMethod?.durationMinutes ?? 30,
      clinicConfig.specialDates,
      clinicConfig.slotIntervalMinutes,
      bookingWindow.recordsByDoctor,
      bookingWindow.appointmentsByDoctor,
    );
    const selectedDateId =
      query.date ?? dates.find((date) => date.isOpen)?.id ?? null;
    const timeSlots =
      selectedDateId && selectedService
        ? await this.buildTimeSlots({
          dateId: selectedDateId,
          serviceDurationMinutes:
            selectedTreatmentMethod?.durationMinutes ?? 30,
          doctors,
          businessHours: clinicConfig.businessHours,
          specialDates: clinicConfig.specialDates,
          slotIntervalMinutes: clinicConfig.slotIntervalMinutes,
          recordsByDoctor: bookingWindow.recordsByDoctor,
          appointmentsByDoctor: bookingWindow.appointmentsByDoctor,
        })
        : [];
    const startAt =
      query.date && query.time
        ? this.buildDateTime(query.date, query.time)
        : null;
    const endAt =
      startAt && selectedTreatmentMethod
        ? new Date(
          startAt.getTime() +
          (selectedTreatmentMethod.durationMinutes ?? 30) * 60 * 1000,
        )
        : null;
    const selectedBusinessHour = startAt
      ? this.getBusinessHourForDate(
        startAt,
        clinicConfig.businessHours,
        clinicConfig.specialDates,
      )
      : null;

    const queryDateStr = query.date ? query.date : (startAt ? this.formatDateId(startAt) : '');
    const availableDoctors =
      startAt && endAt
        ? doctors
          .map((doctor) => ({
            doctor,
            available: this.isDoctorBookableFromSnapshot(
              doctor.id,
              startAt,
              endAt,
              bookingWindow.recordsByDoctor,
              bookingWindow.appointmentsByDoctor,
              queryDateStr,
              selectedBusinessHour?.start,
              selectedBusinessHour?.end,
            ),
          }))
          .filter((item) => item.available)
          .map((item) => item.doctor)
        : doctors;

    return {
      services,
      selectedServiceId: selectedService?.id ?? null,
      selectedTreatmentMethodId: selectedTreatmentMethod?.id ?? null,
      selectedDoctorId: query.doctorId ?? null,
      dates,
      selectedDateId,
      timeSlots,
      doctors: availableDoctors,
    };
  }

  async findUpcomingForPatient(userId: string) {
    const ownerWhere = await this.buildPatientAppointmentOwnerWhere(userId);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        ...ownerWhere,
        scheduledAt: { gte: new Date() },
        status: { in: activeAppointmentStatuses },
      },
      include: appointmentInclude,
      orderBy: { scheduledAt: 'asc' },
    });
    return this.withDerivedServices(appointments);
  }

  async findHistoryForPatient(userId: string) {
    const ownerWhere = await this.buildPatientAppointmentOwnerWhere(userId);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        AND: [
          ownerWhere,
          {
            OR: [
              {
                status: {
                  in: [
                    AppointmentStatus.COMPLETED,
                    AppointmentStatus.CANCELLED,
                    AppointmentStatus.NO_SHOW,
                    AppointmentStatus.RESCHEDULED,
                  ],
                },
              },
              { endAt: { lt: new Date() } },
            ],
          },
        ],
      },
      include: appointmentInclude,
      orderBy: { scheduledAt: 'desc' },
    });
    return this.withDerivedServices(appointments);
  }

  private async buildPatientAppointmentOwnerWhere(userId: string) {
    const managedPatients = await this.prisma.patientAccount.findMany({
      where: { userId },
      select: { patientId: true },
    });
    const patientIds = managedPatients.map((item) => item.patientId);

    return patientIds.length
      ? { OR: [{ createdBy: userId }, { patientId: { in: patientIds } }] }
      : { createdBy: userId };
  }

  private async findOrCreatePatientProfile(userId: string) {
    const existing = await this.prisma.patient.findUnique({
      where: { userId },
      select: { id: true, patientCode: true },
    });
    if (existing) {
      await this.ensurePatientAccountLink(userId, existing.id, true);
      return existing;
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { fullName: true, phone: true, email: true },
    });

    const patient = await this.prisma.patient.create({
      data: {
        userId,
        patientCode: await this.generatePatientCode(),
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
      },
      select: { id: true, patientCode: true },
    });
    await this.ensurePatientAccountLink(userId, patient.id, true);
    return patient;
  }

  private async ensureUserCanBookPatient(userId: string, patientId: string) {
    const link = await this.prisma.patientAccount.findUnique({
      where: { userId_patientId: { userId, patientId } },
      select: { canBook: true, patient: { select: { id: true, patientCode: true } } },
    });

    if (!link?.canBook) {
      throw new BadRequestException('patient.booking_permission_denied');
    }

    return link.patient;
  }

  private async ensurePatientAccountLink(
    userId: string,
    patientId: string,
    isPrimary = false,
  ) {
    await this.prisma.patientAccount.upsert({
      where: { userId_patientId: { userId, patientId } },
      update: {
        relationship: 'SELF',
        isPrimary,
        canBook: true,
      },
      create: {
        userId,
        patientId,
        relationship: 'SELF',
        isPrimary,
        canBook: true,
      },
    });
  }

  private async generatePatientCode() {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = `PAT-${new Date().getFullYear()}-${randomBytes(3)
        .toString('hex')
        .toUpperCase()}`;
      const existing = await this.prisma.patient.findUnique({
        where: { patientCode: code },
        select: { id: true },
      });
      if (!existing) return code;
    }

    return `PAT-${Date.now()}`;
  }

  private async createAppointment(input: {
    patientId: string | null;
    doctorId: string;
    treatmentMethodId: string;
    scheduledAt: string;
    notes?: string;
    paymentOption?: AppointmentPaymentOption;
    promotionCode?: string;
    bookingSource: BookingSource;
    createdBy: string;
    skipOnlineBookingBlock?: boolean;
    allowPastSchedule?: boolean;
  }) {
    const scheduledAt = new Date(input.scheduledAt);

    if (Number.isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('appointment.invalid_time');
    }

    if (!input.allowPastSchedule && scheduledAt <= new Date()) {
      throw new BadRequestException('appointment.time_in_past');
    }

    const [patient, doctor, treatmentMethod] = await Promise.all([
      input.patientId
        ? this.prisma.patient.findUnique({ where: { id: input.patientId } })
        : Promise.resolve(null),
      this.prisma.doctor.findUnique({ where: { id: input.doctorId } }),
      this.prisma.treatmentMethod.findUnique({
        where: { id: input.treatmentMethodId },
        include: { service: true },
      }),
    ]);

    if (input.patientId && !patient) {
      throw new BadRequestException('patient.not_found');
    }
    if (!doctor || !doctor.isActive) {
      throw new BadRequestException('doctor.unavailable');
    }
    if (
      !treatmentMethod ||
      !treatmentMethod.isActive ||
      !treatmentMethod.service.isActive
    ) {
      throw new BadRequestException('service.unavailable');
    }
    await this.ensureDoctorCanProvideTreatmentMethod(
      input.doctorId,
      treatmentMethod,
    );

    const bookingPolicy = await this.getPatientBookingPolicy(
      input.patientId,
      input.createdBy,
    );
    if (!input.skipOnlineBookingBlock) {
      this.ensureOnlineBookingAllowed(bookingPolicy);
    }
    const paymentOption = AppointmentPaymentOption.PAY_AT_COUNTER;
    const serviceBasePrice = Number(treatmentMethod.basePrice);
    if (input.promotionCode?.trim()) {
      await this.resolveAppointmentPromotion({
        code: input.promotionCode.trim(),
        serviceBasePrice,
        treatmentMethodId: treatmentMethod.id,
      });
    }

    const endAt = new Date(
      scheduledAt.getTime() +
      (treatmentMethod.durationMinutes ?? 30) * 60 * 1000,
    );

    await this.ensureClinicOpen(scheduledAt, endAt);

    let appointment;
    try {
      appointment = await this.prisma.$transaction(
        async (tx) => {
          await this.ensureDoctorAvailable(input.doctorId, scheduledAt, endAt);
          await this.ensurePatientHasNoOverlappingAppointment(
            input.patientId,
            input.createdBy,
            scheduledAt,
            endAt,
            undefined,
            tx,
          );
          await this.ensureNoConflict(input.doctorId, scheduledAt, endAt, undefined, tx);
          await this.ensurePatientHasNoIncompleteTreatmentMethodAppointment(
            input.patientId,
            input.createdBy,
            input.treatmentMethodId,
            tx,
          );
          await this.ensurePendingAppointmentLimit(input.patientId, input.createdBy, tx);
          await this.ensureSevenDayAppointmentLimit(
            input.patientId,
            input.createdBy,
            scheduledAt,
            tx,
          );

          const paymentStatus = AppointmentPaymentStatus.PAY_AT_COUNTER_SELECTED;

          return await tx.appointment.create({
            data: {
              appointmentCode: await this.generateAppointmentCode(),
              patientId: input.patientId,
              doctorId: input.doctorId,
              serviceId: treatmentMethod.service.id,
              treatmentMethodId: input.treatmentMethodId,
              scheduledAt,
              endAt,
              status: AppointmentStatus.PENDING,
              bookingSource: input.bookingSource,
              paymentOption,
              paymentStatus,
              depositPercent: 0,
              depositAmount: null,
              scheduleConfirmedAt: new Date(),
              notes: input.notes,
              createdBy: input.createdBy,
            },
            include: appointmentInclude,
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034'
      ) {
        throw new ConflictException('appointment.doctor_time_conflict');
      }
      throw error;
    }

    await this.queueAppointmentConfirmationEmail(appointment);

    const notificationUserId = patient?.userId ?? input.createdBy;
    if (notificationUserId) {
      const dateStr = scheduledAt.toLocaleDateString('vi-VN');
      const timeStr = scheduledAt.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      await this.notificationService.createNotification({
        userId: notificationUserId,
        type: 'APPOINTMENT_CONFIRMED',
        title: 'Lịch hẹn đã được xác nhận',
        content: `Cuộc hẹn ${treatmentMethod.name} vào ngày ${dateStr} lúc ${timeStr} đã được hệ thống tiếp nhận thành công.`,
        appointmentId: appointment.id,
      });
    }

    return {
      ...this.withDerivedService(appointment),
      bookingPolicy: {
        ...bookingPolicy,
        requiresDeposit: false,
        depositAmount: 0,
        depositInvoiceId: null,
      },
    };
  }

  private async queueAppointmentConfirmationEmail(
    appointment: {
      scheduledAt: Date;
      patient?: { user?: { fullName: string; email: string | null } | null } | null;
      doctor: { user: { fullName: string } };
      treatmentMethod?: { name: string } | null;
    },
  ) {
    const patientUser = appointment.patient?.user;
    if (!patientUser?.email) return;

    try {
      await this.mailQueue.add('send-appointment-confirmation', {
        name: patientUser.fullName,
        email: patientUser.email,
        locale: 'vi',
        serviceName: appointment.treatmentMethod?.name ?? 'Dich vu nha khoa',
        doctorName: appointment.doctor.user.fullName,
        scheduledAt: appointment.scheduledAt.toISOString(),
        paymentLabel: 'Thanh toan tai quay',
        depositAmount: 0,
      });
    } catch (error) {
      this.logger.warn(
        `Could not queue appointment confirmation email: ${error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private buildAppointmentOwnerWhere(
    patientId: string | null,
    createdBy: string,
  ) {
    return patientId ? { patientId } : { createdBy };
  }

  private async ensurePatientHasNoOverlappingAppointment(
    patientId: string | null,
    createdBy: string,
    scheduledAt: Date,
    endAt: Date,
    excludeAppointmentId?: string,
    db: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    if (!patientId) return;

    const overlap = await db.appointment.findFirst({
      where: {
        patientId,
        ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
        status: { in: activeAppointmentStatuses },
        scheduledAt: { lt: endAt },
        endAt: { gt: scheduledAt },
      },
      select: { id: true },
    });

    if (overlap) {
      throw new ConflictException('appointment.patient_time_conflict');
    }
  }

  private async ensureNoConflict(
    doctorId: string,
    scheduledAt: Date,
    endAt: Date,
    excludeAppointmentId?: string,
    db: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    const conflict = await db.appointment.findFirst({
      where: {
        doctorId,
        ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
        status: { in: activeAppointmentStatuses },
        scheduledAt: { lt: endAt },
        endAt: { gt: scheduledAt },
      },
    });

    if (conflict) {
      throw new ConflictException('appointment.doctor_time_conflict');
    }

    const startOfDay = new Date(scheduledAt);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(scheduledAt);
    endOfDay.setHours(23, 59, 59, 999);

    const existingConsultations = await db.videoConsultation.findMany({
      where: {
        doctorId,
        scheduledAt: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ['CANCELLED'] },
      },
      select: { scheduledAt: true, durationMinutes: true },
    });

    const vcConflict = existingConsultations.some((vc) => {
      const vcStart = vc.scheduledAt.getTime();
      const vcEnd = vcStart + vc.durationMinutes * 60 * 1000;
      return vcStart < endAt.getTime() && vcEnd > scheduledAt.getTime();
    });

    if (vcConflict) {
      throw new ConflictException('appointment.doctor_time_conflict_video');
    }
  }

  private async ensurePatientHasNoIncompleteTreatmentMethodAppointment(
    patientId: string | null,
    createdBy: string,
    treatmentMethodId: string,
    db: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    const existing = await db.appointment.findFirst({
      where: {
        ...this.buildAppointmentOwnerWhere(patientId, createdBy),
        treatmentMethodId,
        status: { in: incompleteAppointmentStatuses },
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('appointment.service_incomplete');
    }
  }

  private async ensurePendingAppointmentLimit(
    patientId: string | null,
    createdBy: string,
    db: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    const pendingCount = await db.appointment.count({
      where: {
        ...this.buildAppointmentOwnerWhere(patientId, createdBy),
        status: AppointmentStatus.PENDING,
        endAt: { gt: new Date() },
      },
    });

    if (pendingCount >= 3) {
      throw new ConflictException('appointment.pending_limit_reached');
    }
  }

  private async ensureSevenDayAppointmentLimit(
    patientId: string | null,
    createdBy: string,
    scheduledAt: Date,
    db: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    const windowStart = new Date(scheduledAt);
    windowStart.setHours(0, 0, 0, 0);

    const windowEnd = new Date(windowStart);
    windowEnd.setDate(windowEnd.getDate() + 7);

    const appointmentCount = await db.appointment.count({
      where: {
        ...this.buildAppointmentOwnerWhere(patientId, createdBy),
        status: { in: activeAppointmentStatuses },
        scheduledAt: {
          gte: windowStart,
          lt: windowEnd,
        },
      },
    });

    if (appointmentCount >= 5) {
      throw new ConflictException('appointment.seven_day_limit_reached');
    }
  }

  private async getPatientBookingPolicy(
    patientId: string | null,
    createdBy: string,
  ): Promise<PatientBookingPolicy> {
    const noShowCount = await this.countPatientNoShows(patientId, createdBy);

    return {
      noShowCount,
      requiresDeposit: false,
      onlineBookingBlocked: noShowCount >= noShowOnlineBookingBlockedThreshold,
    };
  }

  private async countPatientNoShows(
    patientId: string | null,
    createdBy: string,
  ) {
    return this.prisma.appointment.count({
      where: {
        ...this.buildAppointmentOwnerWhere(patientId, createdBy),
        status: AppointmentStatus.NO_SHOW,
      },
    });
  }

  private ensureOnlineBookingAllowed(bookingPolicy: PatientBookingPolicy) {
    if (bookingPolicy.onlineBookingBlocked) {
      throw new ConflictException('appointment.online_booking_blocked');
    }
  }

  private async resolveAppointmentPromotion(input: {
    code: string;
    serviceBasePrice: number;
    treatmentMethodId: string;
  }) {
    const now = new Date();
    const promo = await this.prisma.promotion.findFirst({
      where: {
        code: { equals: input.code, mode: 'insensitive' },
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
        OR: [
          { applicableTreatmentMethodId: null },
          { applicableTreatmentMethodId: input.treatmentMethodId },
        ],
      },
    });

    if (!promo) {
      throw new BadRequestException('promotion.not_found');
    }
    if (Number(promo.minOrderAmount) > input.serviceBasePrice) {
      throw new BadRequestException('promotion.min_order_not_met');
    }
    if (promo.maxUses != null && promo.usedCount >= promo.maxUses) {
      throw new BadRequestException('promotion.exhausted');
    }

    const value = Number(promo.discountValue);
    const discountAmount =
      promo.discountType === DiscountType.PERCENTAGE
        ? Number(((input.serviceBasePrice * value) / 100).toFixed(2))
        : Math.min(value, input.serviceBasePrice);

    return {
      promotionId: promo.id,
      discountAmount,
    };
  }

  private ensurePatientCancellationAllowed(appointment: {
    status: AppointmentStatus;
    scheduledAt: Date;
  }) {
    if (!patientCancelableStatuses.includes(appointment.status)) {
      throw new ConflictException('appointment.cancel_not_allowed');
    }

    if (
      !this.hasRequiredNoticeBeforeAppointment(
        appointment.scheduledAt,
        patientCancelNoticeHours,
      )
    ) {
      throw new ConflictException('appointment.cancel_deadline_passed');
    }
  }

  private ensurePatientRescheduleAllowed(appointment: {
    status: AppointmentStatus;
    scheduledAt: Date;
  }) {
    if (!patientReschedulableStatuses.includes(appointment.status)) {
      throw new ConflictException('appointment.reschedule_not_allowed');
    }

    if (
      !this.hasRequiredNoticeBeforeAppointment(
        appointment.scheduledAt,
        patientRescheduleNoticeHours,
      )
    ) {
      throw new ConflictException('appointment.reschedule_deadline_passed');
    }
  }

  private hasRequiredNoticeBeforeAppointment(
    scheduledAt: Date,
    minimumNoticeHours: number,
  ) {
    return (
      scheduledAt.getTime() - new Date().getTime() >=
      minimumNoticeHours * 60 * 60 * 1000
    );
  }

  private async ensureDoctorAvailable(
    doctorId: string,
    scheduledAt: Date,
    endAt: Date,
  ) {
    const available = await this.isDoctorWorking(doctorId, scheduledAt, endAt);
    if (!available) {
      throw new BadRequestException('doctor.not_available_at_selected_time');
    }
  }

  private async ensureDoctorAvailableForExistingAppointment(
    doctorId: string,
    appointmentId: string,
    scheduledAt: Date,
    endAt: Date,
  ) {
    const available = await this.isDoctorWorking(doctorId, scheduledAt, endAt);
    if (!available) {
      throw new BadRequestException('doctor.not_available_at_selected_time');
    }

    await this.ensureNoConflict(doctorId, scheduledAt, endAt, appointmentId);
  }

  private async ensureDoctorCanProvideTreatmentMethod(
    doctorId: string,
    treatmentMethod: {
      service: { specializationId: string | null };
    },
  ) {
    const specializationId = treatmentMethod.service.specializationId;
    if (!specializationId) return;

    const supportedSpecialization =
      await this.prisma.doctorSpecialization.findUnique({
        where: {
          doctorId_specializationId: {
            doctorId,
            specializationId,
          },
        },
        select: { doctorId: true },
      });

    if (!supportedSpecialization) {
      throw new BadRequestException('doctor.service_not_supported');
    }
  }

  private async ensureClinicOpen(scheduledAt: Date, endAt: Date) {
    const clinicScheduleConfig =
      await this.clinicConfigService.getClinicScheduleConfig();
    const businessHour = this.getBusinessHourForDate(
      scheduledAt,
      clinicScheduleConfig.businessHours,
      clinicScheduleConfig.specialDates,
    );
    if (!businessHour?.isOpen) {
      throw new BadRequestException('clinic.closed_at_selected_time');
    }

    const startMinutes = this.dateToMinutes(scheduledAt);
    const endMinutes = this.dateToMinutes(endAt);
    if (
      startMinutes < this.timeToMinutes(businessHour.start) ||
      endMinutes > this.timeToMinutes(businessHour.end)
    ) {
      throw new BadRequestException('clinic.closed_at_selected_time');
    }
  }

  private async getBookingWindowData(doctorIds: string[]) {
    const nowVn = this.getVnDate(new Date());
    const todayVnStr = [
      nowVn.getUTCFullYear(),
      String(nowVn.getUTCMonth() + 1).padStart(2, '0'),
      String(nowVn.getUTCDate()).padStart(2, '0'),
    ].join('-');
    const start = this.parseDateId(todayVnStr);
    const end = new Date(start.getTime() + 16 * 24 * 60 * 60 * 1000 - 1);

    const [availabilityRecords, activeAppointments, activeVideoConsultations] = await Promise.all([
      this.prisma.doctorAvailability.findMany({
        where: {
          doctorId: { in: doctorIds },
          isActive: true,
          OR: [
            { recordType: 'WEEKLY' },
            {
              recordType: { in: ['DATE_OVERRIDE', 'TIME_OFF'] },
              specificDate: { gte: start, lte: end },
            },
          ],
        },
        select: {
          doctorId: true,
          recordType: true,
          dayOfWeek: true,
          specificDate: true,
          startTime: true,
          endTime: true,
        },
      }),
      this.prisma.appointment.findMany({
        where: {
          doctorId: { in: doctorIds },
          status: { in: activeAppointmentStatuses },
          scheduledAt: { lt: end },
          endAt: { gt: start },
        },
        select: {
          doctorId: true,
          scheduledAt: true,
          endAt: true,
        },
      }),
      this.prisma.videoConsultation.findMany({
        where: {
          doctorId: { in: doctorIds },
          status: { notIn: ['CANCELLED'] },
          scheduledAt: { lte: end, gte: start },
        },
        select: {
          doctorId: true,
          scheduledAt: true,
          durationMinutes: true,
        },
      }),
    ]);

    const activeVcSlots = activeVideoConsultations.map((vc) => ({
      doctorId: vc.doctorId,
      scheduledAt: vc.scheduledAt,
      endAt: new Date(vc.scheduledAt.getTime() + vc.durationMinutes * 60 * 1000),
    }));

    const recordsByDoctor = new Map<string, Array<{ recordType: string; dayOfWeek: number | null; specificDateStr: string | null; startMin: number; endMin: number }>>();
    for (const rec of availabilityRecords) {
      const prepared = {
        recordType: rec.recordType,
        dayOfWeek: rec.dayOfWeek,
        specificDateStr: rec.specificDate ? this.formatDateId(new Date(rec.specificDate)) : null,
        startMin: this.timeToMinutes(rec.startTime),
        endMin: this.timeToMinutes(rec.endTime),
      };
      let list = recordsByDoctor.get(rec.doctorId);
      if (!list) {
        list = [];
        recordsByDoctor.set(rec.doctorId, list);
      }
      list.push(prepared);
    }

    const appointmentsByDoctor = new Map<string, AppointmentSlotSnapshot[]>();
    for (const app of [...activeAppointments, ...activeVcSlots]) {
      let list = appointmentsByDoctor.get(app.doctorId);
      if (!list) {
        list = [];
        appointmentsByDoctor.set(app.doctorId, list);
      }
      list.push(app);
    }

    return {
      recordsByDoctor,
      appointmentsByDoctor,
      availabilityRecords: availabilityRecords as AvailabilityRecordSnapshot[],
      activeAppointments: [...activeAppointments, ...activeVcSlots] as AppointmentSlotSnapshot[],
    };
  }

  private isDoctorBookableFromSnapshot(
    doctorId: string,
    startAt: Date,
    endAt: Date,
    recordsByDoctor: Map<string, any[]>,
    appointmentsByDoctor: Map<string, AppointmentSlotSnapshot[]>,
    dateStr: string,
    businessHourStart?: string,
    businessHourEnd?: string,
  ) {
    const docRecords = recordsByDoctor.get(doctorId) || [];
    const docApps = appointmentsByDoctor.get(doctorId) || [];
    const startMinutes = this.dateToMinutes(startAt);
    const endMinutes = this.dateToMinutes(endAt);

    const hasTimeOff = docRecords.some(
      (r) =>
        r.recordType === 'TIME_OFF' &&
        r.specificDateStr === dateStr &&
        this.timeRangesOverlap(startMinutes, endMinutes, r.startMin, r.endMin),
    );
    if (hasTimeOff) return false;

    const dayOfWeek = this.dateGetDayOfWeek(startAt);
    const dateOverrides = docRecords.filter(
      (r) => r.recordType === 'DATE_OVERRIDE' && r.specificDateStr === dateStr,
    );
    let isWorking = false;

    if (dateOverrides.length > 0) {
      isWorking = dateOverrides.some(
        (r) => startMinutes >= r.startMin && endMinutes <= r.endMin,
      );
    } else {
      const weekly = docRecords.filter(
        (r) =>
          r.recordType === 'WEEKLY' &&
          (r.dayOfWeek === dayOfWeek || (dayOfWeek === 0 && r.dayOfWeek === 7)),
      );
      if (weekly.length > 0) {
        isWorking = weekly.some(
          (r) => startMinutes >= r.startMin && endMinutes <= r.endMin,
        );
      } else if (businessHourStart && businessHourEnd) {
        isWorking =
          startMinutes >= this.timeToMinutes(businessHourStart) &&
          endMinutes <= this.timeToMinutes(businessHourEnd);
      } else {
        isWorking = true;
      }
    }

    if (!isWorking) return false;

    const conflict = docApps.some(
      (appointment) =>
        appointment.scheduledAt < endAt && appointment.endAt > startAt,
    );

    return !conflict;
  }

  private isDoctorWorkingFromSnapshot(
    doctorId: string,
    startAt: Date,
    endAt: Date,
    availabilityRecords: AvailabilityRecordSnapshot[],
    businessHourStart?: string,
    businessHourEnd?: string,
  ) {
    const records = this.getAvailabilityRecordsFromSnapshot(
      doctorId,
      startAt,
      availabilityRecords,
    );
    const startMinutes = this.dateToMinutes(startAt);
    const endMinutes = this.dateToMinutes(endAt);

    const hasTimeOff = records.some(
      (record) =>
        record.recordType === 'TIME_OFF' &&
        this.timeRangesOverlap(
          startMinutes,
          endMinutes,
          this.timeToMinutes(record.startTime),
          this.timeToMinutes(record.endTime),
        ),
    );
    if (hasTimeOff) return false;

    const dateOverrides = records.filter(
      (record) => record.recordType === 'DATE_OVERRIDE',
    );
    const weeklyRecords = records.filter(
      (record) => record.recordType === 'WEEKLY',
    );

    if (dateOverrides.length) {
      return dateOverrides.some(
        (record) =>
          startMinutes >= this.timeToMinutes(record.startTime) &&
          endMinutes <= this.timeToMinutes(record.endTime),
      );
    }

    if (weeklyRecords.length) {
      return weeklyRecords.some(
        (record) =>
          startMinutes >= this.timeToMinutes(record.startTime) &&
          endMinutes <= this.timeToMinutes(record.endTime),
      );
    }

    if (businessHourStart && businessHourEnd) {
      return (
        startMinutes >= this.timeToMinutes(businessHourStart) &&
        endMinutes <= this.timeToMinutes(businessHourEnd)
      );
    }

    return true;
  }

  private getAvailabilityRecordsFromSnapshot(
    doctorId: string,
    date: Date,
    availabilityRecords: AvailabilityRecordSnapshot[],
  ) {
    return availabilityRecords.filter((record) => {
      if (record.doctorId !== doctorId) return false;
      if (record.recordType === 'WEEKLY') {
        return this.isSameDayOfWeek(
          record.dayOfWeek,
          this.dateGetDayOfWeek(date),
        );
      }
      return (
        Boolean(record.specificDate) &&
        this.formatDateId(record.specificDate as Date) ===
        this.formatDateId(date)
      );
    });
  }

  private async isDoctorWorking(doctorId: string, startAt: Date, endAt: Date) {
    const records = await this.getAvailabilityRecords(doctorId, startAt);
    const startMinutes = this.dateToMinutes(startAt);
    const endMinutes = this.dateToMinutes(endAt);

    const hasTimeOff = records.some(
      (record) =>
        record.recordType === 'TIME_OFF' &&
        this.timeRangesOverlap(
          startMinutes,
          endMinutes,
          this.timeToMinutes(record.startTime),
          this.timeToMinutes(record.endTime),
        ),
    );
    if (hasTimeOff) return false;

    const dateOverrides = records.filter(
      (record) => record.recordType === 'DATE_OVERRIDE',
    );
    const workingRecords = dateOverrides.length
      ? dateOverrides
      : records.filter((record) => record.recordType === 'WEEKLY');

    if (!workingRecords.length) {
      const clinicScheduleConfig =
        await this.clinicConfigService.getClinicScheduleConfig();
      const businessHour = this.getBusinessHourForDate(
        startAt,
        clinicScheduleConfig.businessHours,
        clinicScheduleConfig.specialDates,
      );

      if (businessHour && businessHour.isOpen) {
        return (
          startMinutes >= this.timeToMinutes(businessHour.start) &&
          endMinutes <= this.timeToMinutes(businessHour.end)
        );
      }

      return true;
    }

    return workingRecords.some(
      (record) =>
        startMinutes >= this.timeToMinutes(record.startTime) &&
        endMinutes <= this.timeToMinutes(record.endTime),
    );
  }

  private async getAvailabilityRecords(doctorId: string, date: Date) {
    const dayStart = this.parseDateId(this.formatDateId(date));
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
    const dayOfWeek = this.dateGetDayOfWeek(date);
    const weeklyDayOfWeek = dayOfWeek === 0 ? [0, 7] : [dayOfWeek];

    return this.prisma.doctorAvailability.findMany({
      where: {
        doctorId,
        isActive: true,
        OR: [
          { recordType: 'WEEKLY', dayOfWeek: { in: weeklyDayOfWeek } },
          {
            recordType: { in: ['DATE_OVERRIDE', 'TIME_OFF'] },
            specificDate: { gte: dayStart, lte: dayEnd },
          },
        ],
      },
    });
  }

  private async buildBookingDates(
    doctorIds: string[],
    businessHours: BusinessHourDto[],
    serviceDurationMinutes: number,
    specialDates: ClinicSpecialDateDto[],
    slotIntervalMinutes: number,
    recordsByDoctor: Map<string, any[]>,
    appointmentsByDoctor: Map<string, AppointmentSlotSnapshot[]>,
  ) {
    const dates: Array<{
      id: string;
      weekday: string;
      day: string;
      month: string;
      isOpen: boolean;
    }> = [];
    const now = new Date();
    const step = Math.max(1, slotIntervalMinutes || 30);

    const nowVn = this.getVnDate(now);
    const todayVnStr = [
      nowVn.getUTCFullYear(),
      String(nowVn.getUTCMonth() + 1).padStart(2, '0'),
      String(nowVn.getUTCDate()).padStart(2, '0'),
    ].join('-');
    const baseToday = this.parseDateId(todayVnStr);

    for (let index = 0; index < 15; index += 1) {
      const date = new Date(baseToday.getTime() + index * 24 * 60 * 60 * 1000);
      const dateStr = this.formatDateId(date);

      const businessHour = this.getBusinessHourForDate(
        date,
        businessHours,
        specialDates,
      );

      const isOpen =
        Boolean(businessHour?.isOpen) &&
        this.hasAnyBookableSlotSync({
          date,
          dateStr,
          doctorIds,
          businessHour: businessHour!,
          serviceDurationMinutes,
          slotStep: step,
          recordsByDoctor,
          appointmentsByDoctor,
          now,
        });

      const vnDate = this.getVnDate(date);
      dates.push({
        id: dateStr,
        weekday: new Intl.DateTimeFormat('vi-VN', {
          timeZone: 'Asia/Ho_Chi_Minh',
          weekday: 'short',
        }).format(date),
        day: String(vnDate.getUTCDate()).padStart(2, '0'),
        month: `Thg ${vnDate.getUTCMonth() + 1}`,
        isOpen,
      });
    }

    return dates;
  }

  private async buildTimeSlots({
    dateId,
    serviceDurationMinutes,
    doctors,
    businessHours,
    specialDates,
    slotIntervalMinutes,
    recordsByDoctor,
    appointmentsByDoctor,
  }: {
    dateId: string;
    serviceDurationMinutes: number;
    doctors: Array<{ id: string }>;
    businessHours: BusinessHourDto[];
    specialDates: ClinicSpecialDateDto[];
    slotIntervalMinutes: number;
    recordsByDoctor: Map<string, any[]>;
    appointmentsByDoctor: Map<string, AppointmentSlotSnapshot[]>;
  }) {
    const date = this.parseDateId(dateId);
    const dateStr = this.formatDateId(date);
    const businessHour = this.getBusinessHourForDate(
      date,
      businessHours,
      specialDates,
    );
    if (!businessHour?.isOpen) return [];

    const openMinutes = this.timeToMinutes(businessHour.start);
    const closeMinutes = this.timeToMinutes(businessHour.end);
    const latestStart = closeMinutes - serviceDurationMinutes;
    const slots: string[] = [];
    const step = Math.max(1, slotIntervalMinutes || 30);
    const now = new Date();

    for (
      let minutes = openMinutes;
      minutes <= latestStart;
      minutes += step
    ) {
      const startAt = this.dateWithMinutes(date, minutes);
      if (startAt <= now) continue;

      const endAt = new Date(
        startAt.getTime() + serviceDurationMinutes * 60 * 1000,
      );
      const hasDoctor = doctors
        .map((doctor) =>
          this.isDoctorBookableFromSnapshot(
            doctor.id,
            startAt,
            endAt,
            recordsByDoctor,
            appointmentsByDoctor,
            dateStr,
            businessHour.start,
            businessHour.end,
          ),
        )
        .some(Boolean);

      if (hasDoctor) slots.push(this.minutesToTime(minutes));
    }

    return slots;
  }

  private hasAnyBookableSlotSync({
    date,
    dateStr,
    doctorIds,
    businessHour,
    serviceDurationMinutes,
    slotStep,
    recordsByDoctor,
    appointmentsByDoctor,
    now,
  }: {
    date: Date;
    dateStr: string;
    doctorIds: string[];
    businessHour: BusinessHourDto;
    serviceDurationMinutes: number;
    slotStep: number;
    recordsByDoctor: Map<string, any[]>;
    appointmentsByDoctor: Map<string, AppointmentSlotSnapshot[]>;
    now: Date;
  }) {
    const openMinutes = this.timeToMinutes(businessHour.start);
    const closeMinutes = this.timeToMinutes(businessHour.end);
    const latestStart = closeMinutes - serviceDurationMinutes;

    for (
      let minutes = openMinutes;
      minutes <= latestStart;
      minutes += slotStep
    ) {
      const startAt = this.dateWithMinutes(date, minutes);
      if (startAt <= now) continue;

      const endAt = new Date(
        startAt.getTime() + serviceDurationMinutes * 60 * 1000,
      );
      const hasDoctor = doctorIds
        .map((doctorId) =>
          this.isDoctorBookableFromSnapshot(
            doctorId,
            startAt,
            endAt,
            recordsByDoctor,
            appointmentsByDoctor,
            dateStr,
            businessHour.start,
            businessHour.end,
          ),
        )
        .some(Boolean);

      if (hasDoctor) return true;
    }

    return false;
  }

  private static readonly VN_TIMEZONE_OFFSET_MS = 7 * 60 * 60 * 1000;

  private getVnDate(date: Date) {
    return new Date(date.getTime() + AppointmentService.VN_TIMEZONE_OFFSET_MS);
  }

  private dateGetDayOfWeek(date: Date) {
    const vn = this.getVnDate(date);
    return vn.getUTCDay();
  }

  private getBusinessHourForDate(
    date: Date,
    businessHours: BusinessHourDto[],
    specialDates: ClinicSpecialDateDto[] = [],
  ) {
    const specialDate = specialDates.find(
      (item) => item.date === this.formatDateId(date),
    );
    const dayOfWeek = this.dateGetDayOfWeek(date);

    if (specialDate) {
      if (specialDate.isClosed) {
        return {
          id: dayOfWeek,
          label: specialDate.label,
          isOpen: false,
          start: '00:00',
          end: '00:00',
        } satisfies BusinessHourDto;
      }

      return {
        id: dayOfWeek,
        label: specialDate.label,
        isOpen: true,
        start: specialDate.start ?? '08:00',
        end: specialDate.end ?? '17:00',
      } satisfies BusinessHourDto;
    }

    return businessHours.find((hour) => hour.id === dayOfWeek);
  }

  private isSameDayOfWeek(
    storedDayOfWeek: number | null,
    targetDayOfWeek: number,
  ) {
    return (
      storedDayOfWeek === targetDayOfWeek ||
      (targetDayOfWeek === 0 && storedDayOfWeek === 7)
    );
  }

  private parseDateId(dateId: string) {
    const value = new Date(`${dateId}T00:00:00+07:00`);
    if (Number.isNaN(value.getTime())) {
      throw new BadRequestException('appointment.invalid_date');
    }
    return value;
  }

  private minutesToTime(minutes: number) {
    return [
      String(Math.floor(minutes / 60)).padStart(2, '0'),
      String(minutes % 60).padStart(2, '0'),
    ].join(':');
  }

  private buildDateTime(date: string, time: string) {
    const value = new Date(`${date}T${time}:00+07:00`);
    if (Number.isNaN(value.getTime())) {
      throw new BadRequestException('appointment.invalid_time');
    }
    return value;
  }

  private dateWithMinutes(date: Date, minutes: number) {
    return new Date(date.getTime() + minutes * 60 * 1000);
  }

  private formatDateId(date: Date) {
    const vn = this.getVnDate(date);
    return [
      vn.getUTCFullYear(),
      String(vn.getUTCMonth() + 1).padStart(2, '0'),
      String(vn.getUTCDate()).padStart(2, '0'),
    ].join('-');
  }

  private timeToMinutes(time: string) {
    const [hour, minute] = time.split(':').map(Number);
    return hour * 60 + minute;
  }

  private dateToMinutes(date: Date) {
    const vn = this.getVnDate(date);
    return vn.getUTCHours() * 60 + vn.getUTCMinutes();
  }

  private timeRangesOverlap(
    startA: number,
    endA: number,
    startB: number,
    endB: number,
  ) {
    return startA < endB && endA > startB;
  }

  private async generateAppointmentCode() {
    const today = new Date();
    const yyyyMMdd = today.toISOString().slice(0, 10).replaceAll('-', '');

    const count = await this.prisma.appointment.count({
      where: {
        appointmentCode: {
          startsWith: `APT-${yyyyMMdd}`,
        },
      },
    });

    return `APT-${yyyyMMdd}-${String(count + 1).padStart(4, '0')}`;
  }

  private async generateInvoiceCode() {
    const today = new Date();
    const yyyyMMdd = today.toISOString().slice(0, 10).replaceAll('-', '');

    const count = await this.prisma.invoice.count({
      where: {
        invoiceCode: {
          startsWith: `INV-${yyyyMMdd}`,
        },
      },
    });

    return `INV-${yyyyMMdd}-${String(count + 1).padStart(4, '0')}`;
  }
}
