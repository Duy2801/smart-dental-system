import { InjectQueue } from '@nestjs/bull';
import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import type { Queue } from 'bull';
import { randomBytes } from 'crypto';
import {
  AppointmentPaymentOption,
  AppointmentPaymentStatus,
  AppointmentStatus,
  BookingSource,
  DepositCalculationMode,
  InvoiceStatus,
  InvoiceType,
} from 'prisma/generated/enums';
import { PrismaService } from '../prisma/prisma.service';
import { ClinicConfigService } from '../clinic-config/clinic-config.service';
import type {
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
const noShowDepositThreshold = 2;
const noShowOnlineBookingBlockedThreshold = 3;

const appointmentInclude = {
  patient: { include: { user: true } },
  doctor: { include: { user: true } },
  service: true,
};

type BookingOptionQuery = {
  serviceId?: string;
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

type DepositPolicy = {
  enabled: boolean;
  calculationMode: DepositCalculationMode;
  value: number;
};

@Injectable()
export class AppointmentService {
  private readonly logger = new Logger(AppointmentService.name);

  constructor(
    private prisma: PrismaService,
    private clinicConfigService: ClinicConfigService,
    @InjectQueue('mail-queue') private readonly mailQueue: Queue,
  ) { }

  async createAppointmentForReceptionist(
    staffUserId: string,
    dto: CreateStaffAppointmentDto,
  ) {
    const appointment = await this.createAppointment({
      patientId: dto.patientId,
      doctorId: dto.doctorId,
      serviceId: dto.serviceId,
      scheduledAt: dto.scheduledAt,
      notes: dto.notes,
      paymentOption:
        dto.paymentOption ?? AppointmentPaymentOption.PAY_AT_COUNTER,
      bookingSource: BookingSource.RECEPTIONIST,
      createdBy: staffUserId,
      skipOnlineBookingBlock: true,
      allowPastSchedule: true,
    });

    if (dto.walkIn) {
      return this.prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          status: AppointmentStatus.CHECKED_IN,
          checkedInAt: new Date(),
        },
        include: appointmentInclude,
      });
    }

    return this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: AppointmentStatus.CONFIRMED,
        scheduleConfirmedAt: new Date(),
      },
      include: appointmentInclude,
    });
  }

  async createAppointmentForPatient(userId: string, dto: CreateAppointmentDto) {
    const patient = await this.findOrCreatePatientProfile(userId);

    return this.createAppointment({
      patientId: patient.id,
      doctorId: dto.doctorId,
      serviceId: dto.serviceId,
      scheduledAt: dto.scheduledAt,
      notes: dto.notes,
      paymentOption: dto.paymentOption,
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
        service: true,
      },
    });

    if (!appointment) {
      throw new BadRequestException('appointment.not_found');
    }

    this.ensurePatientRescheduleAllowed(appointment);
    this.ensureOnlineBookingAllowed(await this.getPatientBookingPolicy(
      appointment.patientId,
      appointment.createdBy,
    ));

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
        appointment.service.durationMinutes * 60 * 1000,
    );

    if (!this.hasRequiredNoticeBeforeAppointment(scheduledAt, patientRescheduleNoticeHours)) {
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

    return this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        scheduledAt,
        endAt,
        rescheduleHistory: [...rescheduleHistory, previousSchedule],
      },
      include: appointmentInclude,
    });
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

    this.ensurePatientCancellationAllowed(appointment);

    return this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: 'Cancelled by patient',
      },
      include: appointmentInclude,
    });
  }

  async findByDoctorAndWeek(doctorId: string, from: string, to: string) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    return this.prisma.appointment.findMany({
      where: {
        doctorId,
        scheduledAt: { gte: fromDate, lte: toDate },
      },
      include: appointmentInclude,
      orderBy: { scheduledAt: 'asc' },
    });
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
        const [y, m, d] = raw.split('-').map(Number);
        return endOfDay
          ? new Date(y, m - 1, d, 23, 59, 59, 999)
          : new Date(y, m - 1, d, 0, 0, 0, 0);
      }
      const value = new Date(raw);
      if (endOfDay) value.setHours(23, 59, 59, 999);
      return value;
    };

    const fromDate = parseBound(fromRaw, false);
    const toDate = parseBound(toRaw, true);
    const search = params.search?.trim();

    return this.prisma.appointment.findMany({
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
                    user: {
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
            }
          : {}),
      },
      include: appointmentInclude,
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async findOne(appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: appointmentInclude,
    });
    if (!appointment) {
      throw new BadRequestException('appointment.not_found');
    }
    return appointment;
  }

  async confirmAppointment(appointmentId: string) {
    return this.transitionAppointment(
      appointmentId,
      [AppointmentStatus.PENDING],
      {
        status: AppointmentStatus.CONFIRMED,
        scheduleConfirmedAt: new Date(),
      },
      'appointment.must_be_pending_to_confirm',
    );
  }

  async checkInAppointment(appointmentId: string, notes?: string) {
    return this.transitionAppointment(
      appointmentId,
      [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
      {
        status: AppointmentStatus.CHECKED_IN,
        checkedInAt: new Date(),
        ...(notes?.trim()
          ? { notes: notes.trim() }
          : {}),
      },
      'appointment.must_be_confirmed_to_check_in',
    );
  }

  async markNoShow(appointmentId: string) {
    return this.transitionAppointment(
      appointmentId,
      [
        AppointmentStatus.PENDING,
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.CHECKED_IN,
      ],
      { status: AppointmentStatus.NO_SHOW },
      'appointment.cannot_mark_no_show',
    );
  }

  async cancelByStaff(appointmentId: string) {
    return this.transitionAppointment(
      appointmentId,
      [
        AppointmentStatus.PENDING,
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.CHECKED_IN,
      ],
      {
        status: AppointmentStatus.CANCELLED,
        cancelledAt: new Date(),
      },
      'appointment.cannot_cancel',
    );
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
    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data,
      include: appointmentInclude,
    });
  }

  async startAppointment(appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new BadRequestException('appointment.not_found');
    }

    if (appointment.status !== AppointmentStatus.CHECKED_IN) {
      throw new BadRequestException(
        'appointment.must_be_checked_in_to_start',
      );
    }

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: AppointmentStatus.IN_PROGRESS },
      include: appointmentInclude,
    });
  }

  async completeAppointment(appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new BadRequestException('appointment.not_found');
    }

    if (appointment.status !== AppointmentStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'appointment.must_be_in_progress_to_complete',
      );
    }

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.COMPLETED,
        completedAt: new Date(),
      },
      include: appointmentInclude,
    });
  }

  async getBookingOptions(query: BookingOptionQuery) {
    const [services, doctors, clinicConfig] = await Promise.all([
      this.prisma.service.findMany({
        where: { isActive: true },
        orderBy: [
          { isFeatured: 'desc' },
          { displayOrder: 'asc' },
          { name: 'asc' },
        ],
      }),
      this.prisma.doctor.findMany({
        where: {
          isActive: true,
          user: { status: 'ACTIVE' },
          ...(query.doctorId ? { id: query.doctorId } : {}),
        },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.clinicConfigService.getClinicScheduleConfig(),
    ]);

    const selectedService =
      services.find((service) => service.id === query.serviceId) ?? services[0];
    const bookingWindow = await this.getBookingWindowData(
      doctors.map((doctor) => doctor.id),
    );
    const dates = await this.buildBookingDates(
      doctors.map((doctor) => doctor.id),
      clinicConfig.businessHours,
      selectedService?.durationMinutes ?? 30,
      clinicConfig.specialDates,
      clinicConfig.slotIntervalMinutes,
      bookingWindow.availabilityRecords,
      bookingWindow.activeAppointments,
    );
    const selectedDateId =
      query.date ?? dates.find((date) => date.isOpen)?.id ?? null;
    const timeSlots =
      selectedDateId && selectedService
        ? await this.buildTimeSlots({
          dateId: selectedDateId,
          serviceDurationMinutes: selectedService.durationMinutes,
          doctors,
          businessHours: clinicConfig.businessHours,
          specialDates: clinicConfig.specialDates,
          slotIntervalMinutes: clinicConfig.slotIntervalMinutes,
          availabilityRecords: bookingWindow.availabilityRecords,
          activeAppointments: bookingWindow.activeAppointments,
        })
        : [];
    const startAt =
      query.date && query.time
        ? this.buildDateTime(query.date, query.time)
        : null;
    const endAt =
      startAt && selectedService
        ? new Date(
          startAt.getTime() + selectedService.durationMinutes * 60 * 1000,
        )
        : null;

    const availableDoctors =
      startAt && endAt
        ? (
          await Promise.all(
            doctors.map(async (doctor) => ({
              doctor,
              available: this.isDoctorBookableFromSnapshot(
                doctor.id,
                startAt,
                endAt,
                bookingWindow.availabilityRecords,
                bookingWindow.activeAppointments,
              ),
            })),
          )
        )
          .filter((item) => item.available)
          .map((item) => item.doctor)
        : doctors;

    return {
      services,
      dates,
      timeSlots,
      doctors: availableDoctors,
      slotIntervalMinutes: clinicConfig.slotIntervalMinutes,
    };
  }

  private isDoctorBookableFromSnapshot(
    doctorId: string,
    startAt: Date,
    endAt: Date,
    availabilityRecords: AvailabilityRecordSnapshot[],
    activeAppointments: AppointmentSlotSnapshot[],
  ) {
    const working = this.isDoctorWorkingFromSnapshot(
      doctorId,
      startAt,
      endAt,
      availabilityRecords,
    );
    const conflict = activeAppointments.some(
      (appointment) =>
        appointment.doctorId === doctorId &&
        appointment.scheduledAt < endAt &&
        appointment.endAt > startAt,
    );

    return working && !conflict;
  }

  async findUpcomingForPatient(userId: string) {
    const ownerWhere = await this.buildPatientAppointmentOwnerWhere(userId);

    return this.prisma.appointment.findMany({
      where: {
        ...ownerWhere,
        scheduledAt: { gte: new Date() },
        status: { in: activeAppointmentStatuses },
      },
      include: appointmentInclude,
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async findHistoryForPatient(userId: string) {
    const ownerWhere = await this.buildPatientAppointmentOwnerWhere(userId);

    return this.prisma.appointment.findMany({
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
  }

  private async buildPatientAppointmentOwnerWhere(userId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    });

    return patient
      ? { OR: [{ createdBy: userId }, { patientId: patient.id }] }
      : { createdBy: userId };
  }

  private async findOrCreatePatientProfile(userId: string) {
    const existing = await this.prisma.patient.findUnique({
      where: { userId },
      select: { id: true, patientCode: true },
    });
    if (existing) return existing;

    return this.prisma.patient.create({
      data: {
        userId,
        patientCode: await this.generatePatientCode(),
      },
      select: { id: true, patientCode: true },
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
    serviceId: string;
    scheduledAt: string;
    notes?: string;
    paymentOption?: AppointmentPaymentOption;
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

    const [patient, doctor, service] = await Promise.all([
      input.patientId
        ? this.prisma.patient.findUnique({ where: { id: input.patientId } })
        : Promise.resolve(null),
      this.prisma.doctor.findUnique({ where: { id: input.doctorId } }),
      this.prisma.service.findUnique({ where: { id: input.serviceId } }),
    ]);

    if (input.patientId && !patient) {
      throw new BadRequestException('patient.not_found');
    }
    if (!doctor || !doctor.isActive) {
      throw new BadRequestException('doctor.unavailable');
    }
    if (!service || !service.isActive) {
      throw new BadRequestException('service.unavailable');
    }

    const bookingPolicy = await this.getPatientBookingPolicy(
      input.patientId,
      input.createdBy,
    );
    if (!input.skipOnlineBookingBlock) {
      this.ensureOnlineBookingAllowed(bookingPolicy);
    }
    const clinicConfig = await this.clinicConfigService.getClinicConfig();
    const depositPolicy = this.resolveDepositPolicy(service, clinicConfig);
    const depositAmount = depositPolicy.enabled
      ? this.calculateDepositAmount(Number(service.basePrice), depositPolicy)
      : 0;

    const endAt = new Date(
      scheduledAt.getTime() + service.durationMinutes * 60 * 1000,
    );

    await this.ensureClinicOpen(scheduledAt, endAt);
    await this.ensureDoctorAvailable(input.doctorId, scheduledAt, endAt);
    await this.ensurePatientHasNoOverlappingAppointment(
      input.patientId,
      input.createdBy,
      scheduledAt,
      endAt,
    );
    await this.ensureNoConflict(input.doctorId, scheduledAt, endAt);
    await this.ensurePatientHasNoIncompleteServiceAppointment(
      input.patientId,
      input.createdBy,
      input.serviceId,
    );
    await this.ensurePendingAppointmentLimit(input.patientId, input.createdBy);
    await this.ensureSevenDayAppointmentLimit(
      input.patientId,
      input.createdBy,
      scheduledAt,
    );

    const paymentStatus =
      input.paymentOption === AppointmentPaymentOption.DEPOSIT_30_PERCENT &&
      depositPolicy.enabled
        ? AppointmentPaymentStatus.PENDING_DEPOSIT
        : input.paymentOption === AppointmentPaymentOption.PAY_AT_COUNTER
          ? AppointmentPaymentStatus.PAY_AT_COUNTER_SELECTED
          : AppointmentPaymentStatus.NOT_SELECTED;

    if (
      input.paymentOption === AppointmentPaymentOption.DEPOSIT_30_PERCENT &&
      !depositPolicy.enabled
    ) {
      throw new BadRequestException('appointment.deposit_not_available');
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        appointmentCode: await this.generateAppointmentCode(),
        patientId: input.patientId,
        doctorId: input.doctorId,
        serviceId: input.serviceId,
        scheduledAt,
        endAt,
        status: AppointmentStatus.PENDING,
        bookingSource: input.bookingSource,
        paymentOption: input.paymentOption,
        paymentStatus,
        depositPercent:
          depositPolicy.calculationMode === DepositCalculationMode.PERCENT
            ? depositPolicy.value
            : 0,
        depositAmount:
          input.paymentOption === AppointmentPaymentOption.DEPOSIT_30_PERCENT &&
          depositPolicy.enabled
            ? depositAmount
            : null,
        scheduleConfirmedAt:
          input.paymentOption === AppointmentPaymentOption.PAY_AT_COUNTER
            ? new Date()
            : null,
        notes: input.notes,
        createdBy: input.createdBy,
      },
      include: appointmentInclude,
    });

    const depositInvoice =
      input.paymentOption === AppointmentPaymentOption.DEPOSIT_30_PERCENT &&
      depositPolicy.enabled &&
      input.patientId
        ? await this.createDepositInvoiceForAppointment({
            appointmentId: appointment.id,
            patientId: input.patientId,
            serviceId: service.id,
            serviceName: service.name,
            serviceBasePrice: Number(service.basePrice),
            depositPolicy,
            depositAmount,
            createdBy: input.createdBy,
          })
        : null;

    await this.queueAppointmentConfirmationEmail({
      appointment,
      depositAmount: depositInvoice ? depositAmount : 0,
    });

    return {
      ...appointment,
      bookingPolicy: {
        ...bookingPolicy,
        depositAmount: depositInvoice ? depositAmount : 0,
        depositInvoiceId: depositInvoice?.id ?? null,
      },
    };
  }

  private async queueAppointmentConfirmationEmail(input: {
    appointment: Awaited<ReturnType<typeof this.prisma.appointment.create>>;
    depositAmount: number;
  }) {
    const { appointment, depositAmount } = input;
    const patientUser = appointment.patient?.user;
    if (!patientUser?.email) return;

    const paymentLabel =
      appointment.paymentOption === AppointmentPaymentOption.DEPOSIT_30_PERCENT
        ? 'Coc truoc'
        : appointment.paymentOption === AppointmentPaymentOption.PAY_AT_COUNTER
          ? 'Thanh toan tai quay'
          : 'Chua chon';

    try {
      await this.mailQueue.add('send-appointment-confirmation', {
        name: patientUser.fullName,
        email: patientUser.email,
        locale: 'vi',
        serviceName: appointment.service.name,
        doctorName: appointment.doctor.user.fullName,
        scheduledAt: appointment.scheduledAt.toISOString(),
        paymentLabel,
        depositAmount,
      });
    } catch (error) {
      this.logger.warn(
        `Could not queue appointment confirmation email: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private buildAppointmentOwnerWhere(
    patientId: string | null,
    createdBy: string,
  ) {
    return patientId
      ? { OR: [{ patientId }, { createdBy }] }
      : { createdBy };
  }

  private async ensurePatientHasNoOverlappingAppointment(
    patientId: string | null,
    createdBy: string,
    scheduledAt: Date,
    endAt: Date,
    excludeAppointmentId?: string,
  ) {
    const overlap = await this.prisma.appointment.findFirst({
      where: {
        ...this.buildAppointmentOwnerWhere(patientId, createdBy),
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
  ) {
    const conflict = await this.prisma.appointment.findFirst({
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
  }

  private async ensurePatientHasNoIncompleteServiceAppointment(
    patientId: string | null,
    createdBy: string,
    serviceId: string,
  ) {
    const existing = await this.prisma.appointment.findFirst({
      where: {
        ...this.buildAppointmentOwnerWhere(patientId, createdBy),
        serviceId,
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
  ) {
    const pendingCount = await this.prisma.appointment.count({
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
  ) {
    const windowStart = new Date(scheduledAt);
    windowStart.setHours(0, 0, 0, 0);

    const windowEnd = new Date(windowStart);
    windowEnd.setDate(windowEnd.getDate() + 7);

    const appointmentCount = await this.prisma.appointment.count({
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
      requiresDeposit: noShowCount >= noShowDepositThreshold,
      onlineBookingBlocked:
        noShowCount >= noShowOnlineBookingBlockedThreshold,
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

  private async createDepositInvoiceForAppointment(input: {
    appointmentId: string;
    patientId: string;
    serviceId: string;
    serviceName: string;
    serviceBasePrice: number;
    depositPolicy: DepositPolicy;
    depositAmount: number;
    createdBy: string;
  }) {
    const remainingAmount = Number(
      (input.serviceBasePrice - input.depositAmount).toFixed(2),
    );

    return this.prisma.invoice.create({
      data: {
        invoiceCode: await this.generateInvoiceCode(),
        patientId: input.patientId,
        appointmentId: input.appointmentId,
        invoiceType: InvoiceType.DEPOSIT,
        items: [
          {
            service_id: input.serviceId,
            description:
              input.depositPolicy.calculationMode === DepositCalculationMode.PERCENT
                ? `Coc ${input.depositPolicy.value}% cho ${input.serviceName}`
                : `Coc ${input.depositAmount} cho ${input.serviceName}`,
            qty: 1,
            unit_price: input.depositAmount,
            amount: input.depositAmount,
            type: 'DEPOSIT',
          },
          {
            service_id: input.serviceId,
            description:
              input.depositPolicy.calculationMode === DepositCalculationMode.PERCENT
                ? `Con lai ${100 - input.depositPolicy.value}% cho ${input.serviceName}`
                : `Con lai ${Number((input.serviceBasePrice - input.depositAmount).toFixed(2))} cho ${input.serviceName}`,
            qty: 1,
            unit_price: remainingAmount,
            amount: remainingAmount,
            type: 'BALANCE',
          },
        ],
        subtotal: input.depositAmount,
        finalAmount: input.depositAmount,
        status: InvoiceStatus.ISSUED,
        issuedAt: new Date(),
        createdBy: input.createdBy,
      },
      select: { id: true },
    });
  }

  private resolveDepositPolicy(
    service: {
      depositOverrideEnabled: boolean;
      depositRequired: boolean;
      depositCalculationMode: DepositCalculationMode | null;
      depositValue: unknown;
      basePrice: unknown;
    },
    clinicConfig: {
      bookingDepositEnabled: boolean;
      bookingDepositCalculationMode: DepositCalculationMode;
      bookingDepositValue: number;
    },
  ): DepositPolicy {
    const mode =
      service.depositOverrideEnabled && service.depositCalculationMode
        ? service.depositCalculationMode
        : clinicConfig.bookingDepositCalculationMode;

    const valueFromService =
      typeof service.depositValue === 'number'
        ? service.depositValue
        : Number(service.depositValue);

    const value =
      service.depositOverrideEnabled && Number.isFinite(valueFromService)
        ? valueFromService
        : clinicConfig.bookingDepositValue;

    const enabled =
      service.depositOverrideEnabled
        ? service.depositRequired
        : clinicConfig.bookingDepositEnabled;

    return {
      enabled,
      calculationMode: mode,
      value,
    };
  }

  private calculateDepositAmount(basePrice: number, policy: DepositPolicy) {
    if (policy.calculationMode === DepositCalculationMode.FIXED) {
      if (policy.value > basePrice) {
        throw new BadRequestException('appointment.deposit_exceeds_service_price');
      }
      return Number(policy.value.toFixed(2));
    }

    if (policy.value < 0 || policy.value > 100) {
      throw new BadRequestException('appointment.deposit_percentage_invalid');
    }
    return Number((basePrice * (policy.value / 100)).toFixed(2));
  }

  private ensurePatientCancellationAllowed(appointment: {
    status: AppointmentStatus;
    scheduledAt: Date;
  }) {
    if (!patientCancelableStatuses.includes(appointment.status)) {
      throw new ConflictException('appointment.cancel_not_allowed');
    }

    if (!this.hasRequiredNoticeBeforeAppointment(appointment.scheduledAt, patientCancelNoticeHours)) {
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
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 15);
    end.setHours(23, 59, 59, 999);

    const [availabilityRecords, activeAppointments] = await Promise.all([
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
    ]);

    return {
      availabilityRecords:
        availabilityRecords as AvailabilityRecordSnapshot[],
      activeAppointments: activeAppointments as AppointmentSlotSnapshot[],
    };
  }


  private isDoctorWorkingFromSnapshot(
    doctorId: string,
    startAt: Date,
    endAt: Date,
    availabilityRecords: AvailabilityRecordSnapshot[],
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
    const workingRecords = dateOverrides.length
      ? dateOverrides
      : records.filter((record) => record.recordType === 'WEEKLY');

    return workingRecords.some(
      (record) =>
        startMinutes >= this.timeToMinutes(record.startTime) &&
        endMinutes <= this.timeToMinutes(record.endTime),
    );
  }

  private getAvailabilityRecordsFromSnapshot(
    doctorId: string,
    date: Date,
    availabilityRecords: AvailabilityRecordSnapshot[],
  ) {
    return availabilityRecords.filter((record) => {
      if (record.doctorId !== doctorId) return false;
      if (record.recordType === 'WEEKLY') {
        return this.isSameDayOfWeek(record.dayOfWeek, date.getDay());
      }
      return (
        Boolean(record.specificDate) &&
        this.formatDateId(record.specificDate as Date) === this.formatDateId(date)
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

    return workingRecords.some(
      (record) =>
        startMinutes >= this.timeToMinutes(record.startTime) &&
        endMinutes <= this.timeToMinutes(record.endTime),
    );
  }
  private async getAvailabilityRecords(doctorId: string, date: Date) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    const weeklyDayOfWeek =
      date.getDay() === 0 ? [0, 7] : [date.getDay()];

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
    availabilityRecords: AvailabilityRecordSnapshot[],
    activeAppointments: AppointmentSlotSnapshot[],
  ) {
    const dates: Array<{
      id: string;
      weekday: string;
      day: string;
      month: string;
      isOpen: boolean;
    }> = [];
    for (let index = 0; index < 15; index += 1) {
      const date = new Date();
      date.setDate(date.getDate() + index);
      date.setHours(0, 0, 0, 0);
      const businessHour = this.getBusinessHourForDate(
        date,
        businessHours,
        specialDates,
      );

      const isOpen =
        Boolean(businessHour?.isOpen) &&
        (await this.hasAnyBookableSlot({
          date,
          doctorIds,
          businessHour: businessHour!,
          serviceDurationMinutes,
          slotIntervalMinutes,
          availabilityRecords,
          activeAppointments,
        }));

      dates.push({
        id: this.formatDateId(date),
        weekday: new Intl.DateTimeFormat('vi-VN', { weekday: 'short' }).format(
          date,
        ),
        day: String(date.getDate()).padStart(2, '0'),
        month: `Thg ${date.getMonth() + 1}`,
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
    availabilityRecords,
    activeAppointments,
  }: {
    dateId: string;
    serviceDurationMinutes: number;
    doctors: Array<{ id: string }>;
    businessHours: BusinessHourDto[];
    specialDates: ClinicSpecialDateDto[];
    slotIntervalMinutes: number;
    availabilityRecords: AvailabilityRecordSnapshot[];
    activeAppointments: AppointmentSlotSnapshot[];
  }) {
    const date = this.parseDateId(dateId);
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

    for (
      let minutes = openMinutes;
      minutes <= latestStart;
      minutes += slotIntervalMinutes
    ) {
      const startAt = this.dateWithMinutes(date, minutes);
      if (startAt <= new Date()) continue;

      const endAt = new Date(
        startAt.getTime() + serviceDurationMinutes * 60 * 1000,
      );
      const hasDoctor = (
        doctors.map((doctor) =>
          this.isDoctorBookableFromSnapshot(
            doctor.id,
            startAt,
            endAt,
            availabilityRecords,
            activeAppointments,
          ),
        )
      ).some(Boolean);

      if (hasDoctor) slots.push(this.minutesToTime(minutes));
    }

    return slots;
  }

  private async hasAnyBookableSlot({
    date,
    doctorIds,
    businessHour,
    serviceDurationMinutes,
    slotIntervalMinutes,
    availabilityRecords,
    activeAppointments,
  }: {
    date: Date;
    doctorIds: string[];
    businessHour: BusinessHourDto;
    serviceDurationMinutes: number;
    slotIntervalMinutes: number;
    availabilityRecords: AvailabilityRecordSnapshot[];
    activeAppointments: AppointmentSlotSnapshot[];
  }) {
    const openMinutes = this.timeToMinutes(businessHour.start);
    const closeMinutes = this.timeToMinutes(businessHour.end);
    const latestStart = closeMinutes - serviceDurationMinutes;

    for (
      let minutes = openMinutes;
      minutes <= latestStart;
      minutes += slotIntervalMinutes
    ) {
      const startAt = this.dateWithMinutes(date, minutes);
      if (startAt <= new Date()) continue;

      const endAt = new Date(
        startAt.getTime() + serviceDurationMinutes * 60 * 1000,
      );
      const hasDoctor = (
        doctorIds.map((doctorId) =>
          this.isDoctorBookableFromSnapshot(
            doctorId,
            startAt,
            endAt,
            availabilityRecords,
            activeAppointments,
          ),
        )
      ).some(Boolean);

      if (hasDoctor) return true;
    }

    return false;
  }

  private getBusinessHourForDate(
    date: Date,
    businessHours: BusinessHourDto[],
    specialDates: ClinicSpecialDateDto[] = [],
  ) {
    const specialDate = specialDates.find(
      (item) => item.date === this.formatDateId(date),
    );

    if (specialDate) {
      if (specialDate.isClosed) {
        return {
          id: date.getDay(),
          label: specialDate.label,
          isOpen: false,
          start: '00:00',
          end: '00:00',
        } satisfies BusinessHourDto;
      }

      return {
        id: date.getDay(),
        label: specialDate.label,
        isOpen: true,
        start: specialDate.start ?? '08:00',
        end: specialDate.end ?? '17:00',
      } satisfies BusinessHourDto;
    }

    return businessHours.find((hour) => hour.id === date.getDay());
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
    const value = new Date(`${dateId}T00:00:00`);
    if (Number.isNaN(value.getTime())) {
      throw new BadRequestException('appointment.invalid_time');
    }
    return value;
  }

  private dateWithMinutes(date: Date, minutes: number) {
    const value = new Date(date);
    value.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    return value;
  }

  private minutesToTime(minutes: number) {
    return [
      String(Math.floor(minutes / 60)).padStart(2, '0'),
      String(minutes % 60).padStart(2, '0'),
    ].join(':');
  }

  private buildDateTime(date: string, time: string) {
    const value = new Date(`${date}T${time}:00`);
    if (Number.isNaN(value.getTime())) {
      throw new BadRequestException('appointment.invalid_time');
    }
    return value;
  }

  private formatDateId(date: Date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
  }

  private timeToMinutes(time: string) {
    const [hour, minute] = time.split(':').map(Number);
    return hour * 60 + minute;
  }

  private dateToMinutes(date: Date) {
    return date.getHours() * 60 + date.getMinutes();
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
