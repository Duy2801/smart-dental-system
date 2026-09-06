import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { randomInt } from 'crypto';
import {
  InvoiceStatus,
  InvoiceType,
  PaymentMethod,
  VideoConsultationStatus,
} from '../../../prisma/generated/enums';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { ClinicConfigService } from '../clinic-config/clinic-config.service';
import { PaymentService } from '../payment/payment.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../socket/events.gateway';
import { RedisService } from '../redis/redis.service';
import { CreateVideoConsultationDto } from './dto/create-video-consultation.dto';

const consultInclude = {
  patient: {
    select: {
      id: true,
      patientCode: true,
      fullName: true,
      phone: true,
      medicalHistory: true,
      user: { select: { id: true, fullName: true, phone: true, email: true } },
    },
  },
  doctor: {
    select: {
      id: true,
      specialization: true,
      avatarUrl: true,
      user: { select: { fullName: true } },
    },
  },
} as const;

type ConsultRow = {
  id: string;
  patientId: string;
  doctorId: string;
  scheduledAt: Date;
  durationMinutes: number;
  status: VideoConsultationStatus;
  meetingUrl: string | null;
  fee: unknown;
  isPaid: boolean;
  notes: string | null;
  createdAt: Date;
  patient: {
    id?: string;
    patientCode: string;
    fullName?: string | null;
    phone?: string | null;
    medicalHistory?: string | null;
    user: { id: string; fullName: string; phone: string | null; email?: string | null } | null;
  };
  doctor: {
    id: string;
    specialization: string;
    avatarUrl: string | null;
    user: { fullName: string };
  };
};

function packMeeting(roomSlug: string, pin: string): string {
  return `https://meet.jit.si/${roomSlug}#sdsPin=${pin}`;
}

function unpackMeeting(raw: string | null): {
  meetingUrl: string | null;
  roomPin: string | null;
} {
  if (!raw) return { meetingUrl: null, roomPin: null };
  const [base, hash = ''] = raw.split('#');
  const pinMatch = /(?:^|&)sdsPin=(\d{6})(?:&|$)/.exec(hash);
  return {
    meetingUrl: base || null,
    roomPin: pinMatch?.[1] ?? null,
  };
}

function getIctDateDetails(input: Date | string): {
  formattedDateStr: string;
  dayOfWeek: number;
  weeklyDayOfWeek: number[];
  startOfDay: Date;
  endOfDay: Date;
} {
  let cleanStr = '';
  if (typeof input === 'string') {
    cleanStr = input.slice(0, 10);
  } else {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    cleanStr = formatter.format(input);
  }

  const [y, m, d] = cleanStr.split('-').map(Number);
  const noonUtc = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const dayOfWeek = noonUtc.getUTCDay();
  const weeklyDayOfWeek = dayOfWeek === 0 ? [0, 7] : [dayOfWeek];

  const startOfDay = new Date(`${cleanStr}T00:00:00.000+07:00`);
  const endOfDay = new Date(`${cleanStr}T23:59:59.999+07:00`);

  return {
    formattedDateStr: cleanStr,
    dayOfWeek,
    weeklyDayOfWeek,
    startOfDay,
    endOfDay,
  };
}

@Injectable()
export class VideoConsultationService implements OnModuleInit {
  private readonly logger = new Logger(VideoConsultationService.name);

  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentService,
    private clinicConfigService: ClinicConfigService,
    private eventsGateway: EventsGateway,
    private redis: RedisService,
    @InjectQueue('mail-queue')
    private readonly mailQueue: Queue,
  ) { }

  onModuleInit() {
    setInterval(() => {
      this.cleanupExpiredBookings().catch(() => { });
      this.processPendingNotifications().catch(() => { });
      this.checkDoctorMissedConsultations().catch(() => { });
    }, 30000);
  }

  /** Background Job 1: Dọn dẹp các đơn đặt tư vấn hết hạn 15 phút mà chưa thanh toán (EXPIRED) */
  private async cleanupExpiredBookings() {
    const now = new Date();
    const expiredConsultations = await this.prisma.videoConsultation.findMany({
      where: {
        status: VideoConsultationStatus.PENDING_PAYMENT,
        expiresAt: { lte: now },
      },
      select: { id: true },
    });

    if (expiredConsultations.length === 0) return;
    const expiredIds = expiredConsultations.map((c) => c.id);

    await this.prisma.videoConsultation.updateMany({
      where: { id: { in: expiredIds } },
      data: { status: VideoConsultationStatus.EXPIRED },
    });

    const invoices = await this.prisma.invoice.findMany({
      where: {
        status: { in: [InvoiceStatus.DRAFT, InvoiceStatus.ISSUED] },
      },
    });

    for (const inv of invoices) {
      const items = Array.isArray(inv.items)
        ? (inv.items as Array<Record<string, any>>)
        : [];
      if (items.some((it) => expiredIds.includes(it?.videoConsultationId))) {
        await this.prisma.invoice.update({
          where: { id: inv.id },
          data: { status: InvoiceStatus.CANCELLED },
        });
      }
    }
  }

  /** Background Job 2: Bắn các thông báo PENDING đến giờ hẹn (nhắc lịch 10p) */
  private async processPendingNotifications() {
    const now = new Date();
    const pending = await this.prisma.notification.findMany({
      where: {
        status: 'PENDING',
        scheduledAt: { lte: now },
      },
      take: 50,
    });

    for (const item of pending) {
      await this.prisma.notification.update({
        where: { id: item.id },
        data: { status: 'SENT', sentAt: now },
      });
      if (this.eventsGateway?.server) {
        this.eventsGateway.server.to(`user_${item.userId}`).emit('notification', item);
      }
    }
  }

  /** Background Job 3: Xử lý trường hợp Bác sĩ vắng mặt sau 10 phút (DOCTOR_MISSED) */
  private async checkDoctorMissedConsultations() {
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
    const missed = await this.prisma.videoConsultation.findMany({
      where: {
        status: VideoConsultationStatus.SCHEDULED,
        isPaid: true,
        scheduledAt: { lte: tenMinsAgo },
        meetingUrl: null,
      },
    });

    for (const vc of missed) {
      await this.prisma.videoConsultation.update({
        where: { id: vc.id },
        data: { status: VideoConsultationStatus.DOCTOR_MISSED },
      });

      const refundCode = `REF-MISSED-${Date.now().toString().slice(-6)}`;
      await this.prisma.refundRequest.create({
        data: {
          refundCode,
          patientId: vc.patientId,
          videoConsultationId: vc.id,
          bankName: 'Hệ thống tự động',
          accountNumber: 'Tự động hoàn tiền',
          accountHolder: 'Bệnh nhân',
          requestedAmount: vc.fee,
          refundPercent: 100,
          reason:
            'Bác sĩ không tham gia cuộc hẹn sau 10 phút. Hệ thống tự động kích hoạt hoàn tiền 100%.',
          status: 'PENDING',
        },
      });
    }
  }

  async invalidateConsultationSlots(doctorId?: string) {
    try {
      if (doctorId) {
        await this.redis.delByPrefix(`consultation:slots:${doctorId}:`);
      } else {
        await this.redis.delByPrefix('consultation:slots:');
      }
      await this.redis.delByPrefix('booking:window:');
    } catch (err: any) {
      // ignore
    }
  }

  /** Lấy danh sách các gói tư vấn (ConsultationPackage) từ DB */
  async getConsultationPackages() {
    return this.redis.rememberJson('consultation:packages', 1800, async () => {
      const packages = await this.prisma.consultationPackage.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      });

      return packages.map((pkg) => ({
        id: pkg.id,
        minutes: pkg.minutes,
        label: pkg.label,
        price: Number(pkg.price),
        formattedPrice: `${Number(pkg.price).toLocaleString('vi-VN')} đ`,
        description: pkg.description,
        tag: pkg.tag,
        displayOrder: pkg.displayOrder,
      }));
    });
  }

  /** Tính toán giá phí tư vấn dựa theo dữ liệu gói lưu trong DB */
  async calculateConsultationFee(durationMinutes: number): Promise<number> {
    const pkg = await this.prisma.consultationPackage.findUnique({
      where: { minutes: durationMinutes },
    });
    if (!pkg || !pkg.isActive) {
      throw new BadRequestException(
        `Gói tư vấn ${durationMinutes} phút không khả dụng trong hệ thống`,
      );
    }
    return Number(pkg.price);
  }

  /** Lấy danh sách bác sĩ tư vấn online cho bệnh nhân */
  async findDoctorsForConsultation() {
    return this.redis.rememberJson('consultation:doctors', 600, async () => {
      const doctors = await this.prisma.doctor.findMany({
        where: { isActive: true },
        select: {
          id: true,
          specialization: true,
          licenseNumber: true,
          avatarUrl: true,
          bio: true,
          yearsExperience: true,
          position: true,
          user: {
            select: {
              fullName: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return doctors.map((d) => ({
        id: d.id,
        fullName: d.user.fullName,
        specialization: d.specialization,
        licenseNumber: d.licenseNumber,
        avatarUrl: d.avatarUrl,
        bio: d.bio,
        yearsExperience: d.yearsExperience,
        position: d.position,
      }));
    });
  }

  /** Tính toán slot rảnh tư vấn tuân thủ 100% lịch hoạt động setting của phòng khám */
  async getAvailableSlots(
    doctorId: string,
    dateStr: string,
    durationMinutes: number,
  ): Promise<string[]> {
    const cacheKey = `consultation:slots:${doctorId}:${dateStr}:${durationMinutes}`;
    return this.redis.rememberJson(cacheKey, 60, async () => {
      const {
        formattedDateStr,
        dayOfWeek,
        weeklyDayOfWeek,
        startOfDay,
        endOfDay,
      } = getIctDateDetails(dateStr);

      const doctor = await this.prisma.doctor.findUnique({
        where: { id: doctorId },
        select: { id: true, isActive: true },
      });
      if (!doctor || !doctor.isActive) {
        throw new NotFoundException('Không tìm thấy bác sĩ');
      }

      // 1. Kiểm tra cấu hình giờ hoạt động phòng khám (ClinicConfig)
      const clinicConfig = await this.clinicConfigService.getClinicConfig();
      const businessHours = clinicConfig.businessHours;

      const specialDate = clinicConfig.specialDates.find(
        (s) => s.date === formattedDateStr,
      );
      if (specialDate && specialDate.isClosed) {
        return [];
      }

      const daySetting = businessHours.find((bh) => bh.id === dayOfWeek);

      if (!daySetting || !daySetting.isOpen) {
        return [];
      }

      let clinicStart = daySetting.start;
      let clinicEnd = daySetting.end;

      if (specialDate && !specialDate.isClosed && specialDate.start && specialDate.end) {
        clinicStart = specialDate.start;
        clinicEnd = specialDate.end;
      }

      // 2. Lấy lịch làm việc của Bác sĩ trong khung giờ phòng khám
      const availability = await this.prisma.doctorAvailability.findMany({
        where: {
          doctorId,
          isActive: true,
          approvalStatus: 'APPROVED',
          OR: [
            { recordType: 'WEEKLY', dayOfWeek: { in: weeklyDayOfWeek } },
            {
              recordType: 'DATE_OVERRIDE',
              specificDate: { gte: startOfDay, lte: endOfDay },
            },
          ],
        },
      });

      const activeWorkingHours = availability.length
        ? availability.map((a) => ({
          ...a,
          startTime: a.startTime < clinicStart ? clinicStart : a.startTime,
          endTime: a.endTime > clinicEnd ? clinicEnd : a.endTime,
        }))
        : [
          {
            id: 'default',
            doctorId,
            recordType: 'WEEKLY' as const,
            dayOfWeek,
            specificDate: null,
            startTime: clinicStart,
            endTime: clinicEnd,
            reason: null,
            isActive: true,
          },
        ];

      const timeOffs = await this.prisma.doctorAvailability.findMany({
        where: {
          doctorId,
          isActive: true,
          approvalStatus: 'APPROVED',
          recordType: 'TIME_OFF',
          specificDate: { gte: startOfDay, lte: endOfDay },
        },
      });

      const existingAppointments = await this.prisma.appointment.findMany({
        where: {
          doctorId,
          scheduledAt: { gte: startOfDay, lte: endOfDay },
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        },
        select: { scheduledAt: true, endAt: true },
      });

      const now = new Date();
      const existingConsultations = await this.prisma.videoConsultation.findMany({
        where: {
          doctorId,
          scheduledAt: { gte: startOfDay, lte: endOfDay },
          status: { notIn: ['CANCELLED', 'EXPIRED'] },
          NOT: {
            status: 'PENDING_PAYMENT',
            expiresAt: { lte: now },
          },
        },
        select: { scheduledAt: true, durationMinutes: true },
      });

      const busyRanges: { startMs: number; endMs: number }[] = [];

      for (const app of existingAppointments) {
        busyRanges.push({
          startMs: app.scheduledAt.getTime(),
          endMs: app.endAt.getTime(),
        });
      }

      for (const vc of existingConsultations) {
        const startMs = vc.scheduledAt.getTime();
        const endMs = startMs + vc.durationMinutes * 60 * 1000;
        busyRanges.push({ startMs, endMs });
      }

      for (const to of timeOffs) {
        const startMs = new Date(`${formattedDateStr}T${to.startTime}:00.000+07:00`).getTime();
        const endMs = new Date(`${formattedDateStr}T${to.endTime}:00.000+07:00`).getTime();
        busyRanges.push({ startMs, endMs });
      }

      const availableSlots: string[] = [];
      const stepMinutes = 15;

      for (const avail of activeWorkingHours) {
        let current = new Date(`${formattedDateStr}T${avail.startTime}:00.000+07:00`);
        const availEnd = new Date(`${formattedDateStr}T${avail.endTime}:00.000+07:00`);

        while (current.getTime() + durationMinutes * 60 * 1000 <= availEnd.getTime()) {
          const slotStartMs = current.getTime();
          const slotEndMs = slotStartMs + durationMinutes * 60 * 1000;

          if (slotStartMs > Date.now()) {
            const isConflict = busyRanges.some(
              (b) => slotStartMs < b.endMs && slotEndMs > b.startMs,
            );

            if (!isConflict) {
              const timeFormatter = new Intl.DateTimeFormat('en-GB', {
                timeZone: 'Asia/Ho_Chi_Minh',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              });
              availableSlots.push(timeFormatter.format(current));
            }
          }

          current = new Date(current.getTime() + stepMinutes * 60 * 1000);
        }
      }

      return Array.from(new Set(availableSlots)).sort();
    });
  }

  /** Đặt lịch tư vấn trực tuyến cho bệnh nhân với 15m slot locking */
  async createBooking(user: AuthenticatedUser, dto: CreateVideoConsultationDto) {
    const scheduledAt = new Date(dto.scheduledAt);
    if (isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('Thời gian hẹn không hợp lệ');
    }
    if (scheduledAt.getTime() < Date.now()) {
      throw new BadRequestException('Thời gian tư vấn phải ở tương lai');
    }

    const scheduledEndMs = scheduledAt.getTime() + dto.durationMinutes * 60 * 1000;
    const scheduledEnd = new Date(scheduledEndMs);

    // 1. Kiểm tra Giờ hoạt động phòng khám (Clinic Operating Hours) trước khi mở transaction
    const clinicConfig = await this.clinicConfigService.getClinicConfig();
    const { formattedDateStr, dayOfWeek } = getIctDateDetails(scheduledAt);

    const specialDate = clinicConfig.specialDates.find(
      (s) => s.date === formattedDateStr,
    );
    if (specialDate && specialDate.isClosed) {
      throw new BadRequestException('Phòng khám đóng cửa vào ngày này');
    }

    const daySetting = clinicConfig.businessHours.find((bh) => bh.id === dayOfWeek);
    if (!daySetting || !daySetting.isOpen) {
      throw new BadRequestException('Phòng khám không mở cửa vào ngày này');
    }

    let clinicStart = daySetting.start;
    let clinicEnd = daySetting.end;
    if (specialDate && !specialDate.isClosed && specialDate.start && specialDate.end) {
      clinicStart = specialDate.start;
      clinicEnd = specialDate.end;
    }

    const clinicStartMs = new Date(`${formattedDateStr}T${clinicStart}:00.000+07:00`).getTime();
    const clinicEndMs = new Date(`${formattedDateStr}T${clinicEnd}:00.000+07:00`).getTime();
    if (scheduledAt.getTime() < clinicStartMs || scheduledEndMs > clinicEndMs) {
      throw new BadRequestException('Thời gian tư vấn nằm ngoài giờ hoạt động của phòng khám');
    }

    const fee = await this.calculateConsultationFee(dto.durationMinutes);

    const result = await this.prisma.$transaction(
      async (tx) => {
        let patient = await tx.patient.findUnique({
          where: { userId: user.userId },
          include: { user: { select: { fullName: true } } },
        });

        if (!patient) {
          const userRecord = await tx.user.findUnique({
            where: { id: user.userId },
          });
          if (!userRecord) {
            throw new NotFoundException('Không tìm thấy tài khoản người dùng');
          }

          patient = await tx.patient.create({
            data: {
              userId: user.userId,
              patientCode: `BN-${Date.now().toString().slice(-6)}`,
            },
            include: { user: { select: { fullName: true } } },
          });
        }

        const doctor = await tx.doctor.findUnique({
          where: { id: dto.doctorId },
          include: { user: { select: { fullName: true } } },
        });
        if (!doctor || !doctor.isActive) {
          throw new NotFoundException('Không tìm thấy bác sĩ tư vấn');
        }

        // 2. Doctor Overlapping check
        const overlappingAppointment = await tx.appointment.findFirst({
          where: {
            doctorId: dto.doctorId,
            status: { notIn: ['CANCELLED', 'NO_SHOW'] },
            AND: [
              { scheduledAt: { lt: scheduledEnd } },
              { endAt: { gt: scheduledAt } },
            ],
          },
        });

        if (overlappingAppointment) {
          throw new BadRequestException('Bác sĩ đã có lịch khám tại phòng khám vào khung giờ này');
        }

        const now = new Date();
        const existingDoctorConsultations = await tx.videoConsultation.findMany({
          where: {
            doctorId: dto.doctorId,
            status: { notIn: ['CANCELLED', 'EXPIRED'] },
            NOT: {
              status: 'PENDING_PAYMENT',
              expiresAt: { lte: now },
            },
            AND: [
              { scheduledAt: { lt: scheduledEnd } },
            ],
          },
          select: { scheduledAt: true, durationMinutes: true },
        });

        const isDoctorConflict = existingDoctorConsultations.some((vc) => {
          const vcStart = vc.scheduledAt.getTime();
          const vcEnd = vcStart + vc.durationMinutes * 60 * 1000;
          return vcStart < scheduledEndMs && vcEnd > scheduledAt.getTime();
        });

        if (isDoctorConflict) {
          throw new BadRequestException('Bác sĩ đã có lịch tư vấn trực tuyến vào khung giờ này');
        }

        // 3. Patient Overlapping check
        const patientAppointmentConflict = await tx.appointment.findFirst({
          where: {
            patientId: patient.id,
            status: { notIn: ['CANCELLED', 'NO_SHOW'] },
            AND: [
              { scheduledAt: { lt: scheduledEnd } },
              { endAt: { gt: scheduledAt } },
            ],
          },
        });

        if (patientAppointmentConflict) {
          throw new BadRequestException('Bạn đã có lịch khám khác tại phòng khám vào khung giờ này');
        }

        const patientConsultationConflict = await tx.videoConsultation.findMany({
          where: {
            patientId: patient.id,
            status: { notIn: ['CANCELLED', 'EXPIRED'] },
            NOT: {
              status: 'PENDING_PAYMENT',
              expiresAt: { lte: now },
            },
            AND: [
              { scheduledAt: { lt: scheduledEnd } },
            ],
          },
          select: { scheduledAt: true, durationMinutes: true },
        });

        const isPatientConflict = patientConsultationConflict.some((vc) => {
          const vcStart = vc.scheduledAt.getTime();
          const vcEnd = vcStart + vc.durationMinutes * 60 * 1000;
          return vcStart < scheduledEndMs && vcEnd > scheduledAt.getTime();
        });

        if (isPatientConflict) {
          throw new BadRequestException('Bạn đã có cuộc hẹn tư vấn trực tuyến khác vào khung giờ này');
        }

        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Lock 15 phút

        const consultation = await tx.videoConsultation.create({
          data: {
            patientId: patient.id,
            doctorId: dto.doctorId,
            scheduledAt,
            durationMinutes: dto.durationMinutes,
            fee,
            isPaid: false,
            status: VideoConsultationStatus.PENDING_PAYMENT,
            expiresAt,
            notes: dto.notes ? dto.notes.trim() : null,
          },
          include: consultInclude,
        });

        const invoiceCode = `INV-VC-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const invoice = await tx.invoice.create({
          data: {
            invoiceCode,
            patientId: patient.id,
            invoiceType: InvoiceType.SERVICE,
            subtotal: fee,
            discountAmount: 0,
            finalAmount: fee,
            status: InvoiceStatus.DRAFT,
            createdBy: user.userId,
            items: [
              {
                title: `Tư vấn trực tuyến (${dto.durationMinutes} phút) - Bác sĩ ${doctor.user.fullName}`,
                price: fee,
                quantity: 1,
                videoConsultationId: consultation.id,
              },
            ],
          },
        });

        const paymentDetails = await this.paymentService.createPayment(
          user.userId,
          {
            invoiceId: invoice.id,
            amount: fee,
            method: PaymentMethod.BANK_TRANSFER,
          },
          tx,
        );

        await tx.notification.create({
          data: {
            userId: user.userId,
            type: 'SYSTEM',
            title: 'Đặt lịch tư vấn trực tuyến thành công',
            content: `Đơn tư vấn với Bác sĩ ${doctor.user.fullName} lúc ${scheduledAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ngày ${scheduledAt.toLocaleDateString('vi-VN')} đã khởi tạo. Vui lòng hoàn tất thanh toán 100% trong 15 phút để giữ vị trí slot.`,
            channel: 'IN_APP',
            status: 'SENT',
            sentAt: new Date(),
          },
        });

        const reminderTime = new Date(scheduledAt.getTime() - 10 * 60 * 1000);
        if (reminderTime.getTime() > Date.now()) {
          await tx.notification.create({
            data: {
              userId: user.userId,
              type: 'APPOINTMENT_REMINDER',
              title: '⏰ Lịch tư vấn trực tuyến sắp bắt đầu trong 10 phút',
              content: `Buổi tư vấn với Bác sĩ ${doctor.user.fullName} sẽ bắt đầu lúc ${scheduledAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}. Vui lòng chuẩn bị sẵn sàng thiết bị!`,
              channel: 'IN_APP',
              scheduledAt: reminderTime,
              status: 'PENDING',
            },
          });

          if (doctor.userId) {
            await tx.notification.create({
              data: {
                userId: doctor.userId,
                type: 'APPOINTMENT_REMINDER',
                title: '⏰ Lịch tư vấn bệnh nhân sắp bắt đầu trong 10 phút',
                content: `Bạn có buổi tư vấn trực tuyến với bệnh nhân ${patient.fullName ?? patient.user?.fullName ?? 'Bệnh nhân'} lúc ${scheduledAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}.`,
                channel: 'IN_APP',
                scheduledAt: reminderTime,
                status: 'PENDING',
              },
            });
          }
        }

        return {
          consultation: this.toSummary(consultation, false),
          invoice: {
            id: invoice.id,
            invoiceCode: invoice.invoiceCode,
            finalAmount: Number(invoice.finalAmount),
          },
          payment: paymentDetails,
        };
      },
      { maxWait: 15000, timeout: 30000 },
    );

    void this.invalidateConsultationSlots(dto.doctorId);
    return result;
  }

  /** Bệnh nhân hủy lịch tư vấn & Xử lý chính sách hoàn tiền */
  async cancelBookingByPatient(user: AuthenticatedUser, id: string) {
    const result = await this.prisma.$transaction(
      async (tx) => {
        const patient = await tx.patient.findUnique({
          where: { userId: user.userId },
        });
      if (!patient) {
        throw new NotFoundException('Không tìm thấy thông tin bệnh nhân');
      }

      const consultation = await tx.videoConsultation.findUnique({
        where: { id },
      });
      if (!consultation || consultation.patientId !== patient.id) {
        throw new NotFoundException('Không tìm thấy lịch tư vấn này');
      }

      if (
        consultation.status === VideoConsultationStatus.CANCELLED ||
        consultation.status === VideoConsultationStatus.EXPIRED
      ) {
        throw new BadRequestException('Buổi tư vấn này đã bị hủy hoặc hết hạn trước đó');
      }

      if (consultation.status === VideoConsultationStatus.COMPLETED) {
        throw new BadRequestException('Không thể hủy buổi tư vấn đã hoàn thành');
      }

      const hoursUntil =
        (consultation.scheduledAt.getTime() - Date.now()) / (1000 * 60 * 60);

      let refundPercent = 0;
      let refundNote = '';

      if (hoursUntil > 24) {
        refundPercent = 100;
        refundNote = 'Hủy trước >24h: Hoàn tiền 100% phí tư vấn.';
      } else if (hoursUntil >= 4) {
        refundPercent = 50;
        refundNote = 'Hủy trước 4h - 24h: Hoàn tiền 50% phí tư vấn.';
      } else {
        refundPercent = 0;
        refundNote = 'Hủy dưới 4h: Không áp dụng hoàn tiền theo quy định phòng khám.';
      }

      const updated = await tx.videoConsultation.update({
        where: { id },
        data: {
          status: VideoConsultationStatus.CANCELLED,
          meetingUrl: null,
        },
        include: consultInclude,
      });

      const feeNum = Number(consultation.fee);
      const refundAmount = Math.round((feeNum * refundPercent) / 100);

      const invoices = await tx.invoice.findMany({
        where: { patientId: patient.id },
      });
      const invoice = invoices.find((inv) => {
        const items = Array.isArray(inv.items)
          ? (inv.items as Array<Record<string, any>>)
          : [];
        return items.some((it) => it?.videoConsultationId === id);
      });

      if (consultation.isPaid && refundPercent > 0) {
        const refundCode = `REF-VC-${Date.now().toString().slice(-6)}`;
        await tx.refundRequest.create({
          data: {
            refundCode,
            patientId: patient.id,
            videoConsultationId: id,
            invoiceId: invoice?.id ?? null,
            bankName: 'Cần bệnh nhân cung cấp STK',
            accountNumber: 'Chờ cập nhật',
            accountHolder: patient.fullName ?? 'Bệnh nhân',
            requestedAmount: refundAmount,
            refundPercent,
            reason: refundNote,
            status: 'PENDING',
          },
        });

        if (invoice) {
          await tx.invoice.update({
            where: { id: invoice.id },
            data: {
              status:
                refundPercent === 100
                  ? InvoiceStatus.REFUNDED
                  : InvoiceStatus.PARTIALLY_PAID,
            },
          });
        }
      } else if (invoice && !consultation.isPaid) {
        await tx.invoice.update({
          where: { id: invoice.id },
          data: { status: InvoiceStatus.CANCELLED },
        });
      }

      await tx.notification.create({
        data: {
          userId: user.userId,
          type: 'SYSTEM',
          title: 'Hủy lịch tư vấn trực tuyến',
          content: `Đơn tư vấn ngày ${consultation.scheduledAt.toLocaleDateString('vi-VN')} đã bị hủy. ${refundNote} Số tiền hoàn lại dự kiến: ${refundAmount.toLocaleString('vi-VN')} VNĐ.`,
          channel: 'IN_APP',
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      return {
        consultation: this.toSummary(updated, false),
        refundInfo: {
          hoursUntilBooking: Math.round(hoursUntil * 10) / 10,
          refundPercent,
          refundAmount,
          note: refundNote,
        },
      };
    },
    { maxWait: 15000, timeout: 30000 },
  );

    void this.invalidateConsultationSlots(result.consultation.doctorId);
    return result;
  }

  /** Lấy thông tin thanh toán (VietQR) cho lịch tư vấn chưa thanh toán */
  async getConsultationPaymentInfo(user: AuthenticatedUser, id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId: user.userId },
      select: { id: true },
    });
    if (!patient) {
      throw new NotFoundException('Không tìm thấy bệnh nhân');
    }

    const consultation = await this.prisma.videoConsultation.findUnique({
      where: { id },
      include: {
        doctor: { select: { user: { select: { fullName: true } } } },
      },
    });

    if (!consultation || consultation.patientId !== patient.id) {
      throw new NotFoundException('Không tìm thấy lịch tư vấn này');
    }

    if (consultation.isPaid) {
      return { isPaid: true, status: consultation.status };
    }

    const fee = Number(consultation.fee);

    const invoices = await this.prisma.invoice.findMany({
      where: {
        patientId: patient.id,
        invoiceType: InvoiceType.SERVICE,
        status: { in: [InvoiceStatus.DRAFT, InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID] },
      },
      orderBy: { issuedAt: 'desc' },
    });

    let invoice = invoices.find((inv) => {
      const items = Array.isArray(inv.items)
        ? (inv.items as Array<Record<string, any>>)
        : [];
      return items.some((it) => it?.videoConsultationId === id);
    });

    if (!invoice) {
      const invoiceCode = `INV-VC-${Date.now().toString().slice(-6)}`;
      invoice = await this.prisma.invoice.create({
        data: {
          invoiceCode,
          patientId: patient.id,
          invoiceType: InvoiceType.SERVICE,
          subtotal: fee,
          discountAmount: 0,
          finalAmount: fee,
          status: InvoiceStatus.DRAFT,
          createdBy: user.userId,
          items: [
            {
              title: `Tư vấn trực tuyến (${consultation.durationMinutes} phút) - Bác sĩ ${consultation.doctor.user.fullName}`,
              price: fee,
              quantity: 1,
              videoConsultationId: consultation.id,
            },
          ],
        },
      });
    }

    const paymentDetails = await this.paymentService.createPayment(user.userId, {
      invoiceId: invoice.id,
      amount: fee,
      method: PaymentMethod.BANK_TRANSFER,
    });

    return {
      consultationId: consultation.id,
      isPaid: false,
      fee,
      invoice: {
        id: invoice.id,
        invoiceCode: invoice.invoiceCode,
        finalAmount: Number(invoice.finalAmount),
      },
      payment: paymentDetails,
    };
  }

  /** Bệnh nhân vào phòng họp tư vấn */
  async joinPatientRoom(user: AuthenticatedUser, id: string) {
    const row = await this.getAuthorizedRow(id, user);
    if (!row.meetingUrl) {
      throw new BadRequestException('Bác sĩ chưa khởi tạo hoặc tham gia phòng tư vấn');
    }
    const { meetingUrl, roomPin } = unpackMeeting(row.meetingUrl);
    return {
      id: row.id,
      meetingUrl,
      roomPin,
      doctorName: row.doctor.user.fullName,
      scheduledAt: row.scheduledAt.toISOString(),
      durationMinutes: row.durationMinutes,
      status: row.status,
    };
  }

  /** Lấy danh sách buổi tư vấn cá nhân của bệnh nhân */
  async findByPatient(user: AuthenticatedUser) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId: user.userId },
      select: { id: true },
    });
    if (!patient) return [];

    const rows = await this.prisma.videoConsultation.findMany({
      where: { patientId: patient.id },
      include: {
        patient: {
          select: {
            id: true,
            patientCode: true,
            user: { select: { fullName: true, phone: true } },
          },
        },
        doctor: {
          select: {
            id: true,
            specialization: true,
            avatarUrl: true,
            user: { select: { fullName: true } },
          },
        },
        refundRequests: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { scheduledAt: 'desc' },
    });

    return rows.map((row) => {
      const summary = this.toSummary(row as unknown as ConsultRow, true);
      const latestRefund = row.refundRequests?.[0];
      return {
        ...summary,
        doctorName: row.doctor.user.fullName,
        doctorSpecialization: row.doctor.specialization,
        doctorAvatarUrl: row.doctor.avatarUrl,
        refundRequest: latestRefund
          ? {
            id: latestRefund.id,
            refundCode: latestRefund.refundCode,
            bankName: latestRefund.bankName,
            accountNumber: latestRefund.accountNumber,
            accountHolder: latestRefund.accountHolder,
            qrCodeUrl: latestRefund.qrCodeUrl,
            requestedAmount: Number(latestRefund.requestedAmount),
            refundPercent: latestRefund.refundPercent,
            reason: latestRefund.reason,
            status: latestRefund.status,
            rejectReason: latestRefund.rejectReason,
            proofImageUrl: latestRefund.proofImageUrl,
            createdAt: latestRefund.createdAt.toISOString(),
          }
          : null,
      };
    });
  }

  async findByDoctor(user: AuthenticatedUser, doctorIdQuery?: string) {
    const doctorId = await this.resolveDoctorIdForList(user, doctorIdQuery);

    const rows = await this.prisma.videoConsultation.findMany({
      where: { doctorId },
      include: consultInclude,
      orderBy: { scheduledAt: 'desc' },
    });

    return rows.map((row) => this.toSummary(row, false));
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const row = await this.getAuthorizedRow(id, user);

    const summary = this.toSummary(row, true);
    const meetingUrl =
      row.status === VideoConsultationStatus.IN_PROGRESS ||
      row.status === VideoConsultationStatus.SCHEDULED
        ? summary.meetingUrl
        : null;
    const roomPin =
      row.status === VideoConsultationStatus.IN_PROGRESS ||
      row.status === VideoConsultationStatus.SCHEDULED
        ? (summary as any).roomPin ?? null
        : null;

    const chatbotConversations = await this.prisma.chatbotConversation.findMany({
      where: { patientId: row.patientId },
      orderBy: { startedAt: 'desc' },
      take: 10,
    });

    const chatbotSessions = chatbotConversations.map((c) => ({
      id: c.id,
      status: c.status,
      startedAt: c.startedAt.toISOString(),
      endedAt: c.endedAt ? c.endedAt.toISOString() : null,
      messages: Array.isArray(c.messages) ? c.messages : [],
    }));

    return {
      ...this.toSummary(row, true),
      ...summary,
      meetingUrl,
      roomPin,
      notes: row.notes,
      chatbotSessions,
    };
  }

  private async getAuthorizedRow(id: string, user: AuthenticatedUser) {
    const row = await this.prisma.videoConsultation.findUnique({
      where: { id },
      include: consultInclude,
    });
    if (!row) {
      throw new NotFoundException('Không tìm thấy lịch tư vấn');
    }

    if (user.roles?.includes('PATIENT')) {
      const patient = await this.prisma.patient.findUnique({
        where: { userId: user.userId },
        select: { id: true },
      });
      if (!patient || row.patientId !== patient.id) {
        throw new ForbiddenException('Bạn không có quyền xem lịch tư vấn này');
      }
    } else if (user.roles?.includes('DOCTOR')) {
      const doctor = await this.prisma.doctor.findUnique({
        where: { userId: user.userId },
        select: { id: true },
      });
      if (!doctor || row.doctorId !== doctor.id) {
        throw new ForbiddenException('Bạn không phải bác sĩ phụ trách buổi này');
      }
    }

    return row;
  }

  private async resolveDoctorIdForList(
    user: AuthenticatedUser,
    doctorIdQuery?: string,
  ): Promise<string> {
    if (user.roles?.includes('DOCTOR')) {
      const doctor = await this.prisma.doctor.findUnique({
        where: { userId: user.userId },
        select: { id: true },
      });
      if (!doctor) {
        throw new ForbiddenException('Tài khoản chưa được liên kết bác sĩ');
      }
      return doctor.id;
    }

    if (!doctorIdQuery) {
      throw new BadRequestException('Vui lòng truyền doctorId');
    }
    return doctorIdQuery;
  }

  private toSummary(row: ConsultRow, includeRoomPin: boolean) {
    const feeNum = Number(row.fee);
    const { meetingUrl, roomPin } = unpackMeeting(row.meetingUrl);
    const patientUser = row.patient.user;
    const patientName =
      row.patient.fullName ?? patientUser?.fullName ?? 'Bệnh nhân';
    const patientPhone = row.patient.phone ?? patientUser?.phone ?? null;

    return {
      id: row.id,
      patientId: row.patientId,
      patientCode: row.patient.patientCode,
      patientName,
      patientPhone,
      medicalHistory: row.patient.medicalHistory ?? null,
      doctorId: row.doctorId,
      doctorName: row.doctor.user.fullName,
      scheduledAt: row.scheduledAt.toISOString(),
      durationMinutes: row.durationMinutes,
      status: row.status,
      fee: feeNum,
      isPaid: row.isPaid,
      notes: row.notes,
      meetingUrl,
      ...(includeRoomPin ? { roomPin } : {}),
      createdAt: row.createdAt.toISOString(),
    };
  }

  async start(id: string, user: AuthenticatedUser) {
    return this.startConsultation(id, user);
  }

  async startConsultation(id: string, user: AuthenticatedUser) {
    const row = await this.getAuthorizedRow(id, user);

    if (row.status === VideoConsultationStatus.CANCELLED) {
      throw new BadRequestException('Buổi tư vấn đã bị hủy');
    }
    if (row.status === VideoConsultationStatus.COMPLETED) {
      throw new BadRequestException('Buổi tư vấn đã hoàn thành');
    }

    let roomSlug: string;
    let pin: string;
    let packed: string;

    if (row.meetingUrl) {
      const unpacked = unpackMeeting(row.meetingUrl);
      if (unpacked.meetingUrl && unpacked.roomPin) {
        roomSlug = unpacked.meetingUrl.replace('https://meet.jit.si/', '');
        pin = unpacked.roomPin;
        packed = row.meetingUrl;
      } else {
        roomSlug = `sds-consult-${id.slice(0, 8)}-${Date.now()
          .toString(36)
          .slice(-4)}`;
        pin = String(randomInt(100000, 999999));
        packed = packMeeting(roomSlug, pin);
      }
    } else {
      roomSlug = `sds-consult-${id.slice(0, 8)}-${Date.now()
        .toString(36)
        .slice(-4)}`;
      pin = String(randomInt(100000, 999999));
      packed = packMeeting(roomSlug, pin);
    }

    const updated = await this.prisma.videoConsultation.update({
      where: { id },
      data: {
        status: VideoConsultationStatus.IN_PROGRESS,
        meetingUrl: packed,
      },
      include: consultInclude,
    });

    return {
      ...this.toSummary(updated, true),
      roomSlug,
      roomPin: pin,
      meetingUrl: `https://meet.jit.si/${roomSlug}`,
    };
  }

  async complete(id: string, user: AuthenticatedUser) {
    return this.completeConsultation(id, user);
  }

  async completeConsultation(
    id: string,
    user: AuthenticatedUser,
    summaryNotes?: string,
  ) {
    const row = await this.getAuthorizedRow(id, user);

    if (row.status === VideoConsultationStatus.COMPLETED) {
      throw new BadRequestException('Buổi tư vấn đã hoàn thành trước đó');
    }

    const notes = summaryNotes?.trim()
      ? [row.notes, `[Ghi chú tổng kết]: ${summaryNotes.trim()}`]
        .filter(Boolean)
        .join('\n\n')
      : row.notes;

    const updated = await this.prisma.videoConsultation.update({
      where: { id },
      data: {
        status: VideoConsultationStatus.COMPLETED,
        notes,
      },
      include: consultInclude,
    });

    return this.toSummary(updated, false);
  }

  async cancel(id: string, user: AuthenticatedUser) {
    if (user.roles?.includes('PATIENT')) {
      return this.cancelBookingByPatient(user, id);
    }
    return this.cancelConsultationByDoctorOrAdmin(id, user);
  }

  async cancelConsultationByDoctorOrAdmin(id: string, user: AuthenticatedUser) {
    const row = await this.getAuthorizedRow(id, user);

    if (
      row.status === VideoConsultationStatus.CANCELLED ||
      row.status === VideoConsultationStatus.EXPIRED
    ) {
      throw new BadRequestException('Buổi tư vấn này đã bị hủy hoặc hết hạn trước đó');
    }

    if (row.status === VideoConsultationStatus.COMPLETED) {
      throw new BadRequestException('Không thể hủy buổi tư vấn đã hoàn thành');
    }

    const result = await this.prisma.$transaction(
      async (tx) => {
        const updated = await tx.videoConsultation.update({
          where: { id },
          data: {
            status: VideoConsultationStatus.CANCELLED,
            meetingUrl: null,
          },
          include: consultInclude,
        });

        const feeNum = Number(row.fee);
        const refundPercent = 100;
        const refundAmount = feeNum;
        const refundNote = 'Bác sĩ / Phòng khám hủy buổi tư vấn: Hoàn tiền 100% phí tư vấn.';

        const invoices = await tx.invoice.findMany({
          where: { patientId: row.patientId },
        });
        const invoice = invoices.find((inv) => {
          const items = Array.isArray(inv.items)
            ? (inv.items as Array<Record<string, any>>)
            : [];
          return items.some((it) => it?.videoConsultationId === id);
        });

        if (row.isPaid && feeNum > 0) {
          const refundCode = `REF-VC-${Date.now().toString().slice(-6)}`;
          await tx.refundRequest.create({
            data: {
              refundCode,
              patientId: row.patientId,
              videoConsultationId: id,
              invoiceId: invoice?.id ?? null,
              bankName: 'Cần bệnh nhân cung cấp STK',
              accountNumber: 'Chờ cập nhật',
              accountHolder: row.patient.fullName ?? 'Bệnh nhân',
              requestedAmount: refundAmount,
              refundPercent,
              reason: refundNote,
              status: 'PENDING',
            },
          });

          if (invoice) {
            await tx.invoice.update({
              where: { id: invoice.id },
              data: {
                status: InvoiceStatus.REFUNDED,
              },
            });
          }
        } else if (invoice && !row.isPaid) {
          await tx.invoice.update({
            where: { id: invoice.id },
            data: { status: InvoiceStatus.CANCELLED },
          });
        }

        const patientUserId = row.patient.user?.id;
        if (patientUserId) {
          await tx.notification.create({
            data: {
              userId: patientUserId,
              type: 'SYSTEM',
              title: 'Lịch tư vấn trực tuyến đã bị hủy',
              content: `Buổi tư vấn ngày ${new Date(row.scheduledAt).toLocaleDateString('vi-VN')} đã được hủy bởi bác sĩ / phòng khám. ${row.isPaid ? 'Khoản phí tư vấn sẽ được hoàn lại 100%.' : ''}`,
              channel: 'IN_APP',
              status: 'SENT',
              sentAt: new Date(),
            },
          });
        }

        return {
          consultation: this.toSummary(updated, false),
          refundInfo: {
            refundPercent,
            refundAmount,
            note: refundNote,
          },
        };
      },
      { maxWait: 15000, timeout: 30000 },
    );

    void this.invalidateConsultationSlots(row.doctorId);
    return result;
  }

  async updateNotes(id: string, user: AuthenticatedUser, notes: string | null) {
    const row = await this.getAuthorizedRow(id, user);
    const updated = await this.prisma.videoConsultation.update({
      where: { id: row.id },
      data: { notes },
      include: consultInclude,
    });
    return this.toSummary(updated, false);
  }

  async sendConsultationReminderToPatient(id: string, user: AuthenticatedUser) {
    const row = await this.getAuthorizedRow(id, user);

    if (
      row.status === VideoConsultationStatus.CANCELLED ||
      row.status === VideoConsultationStatus.EXPIRED ||
      row.status === VideoConsultationStatus.COMPLETED
    ) {
      throw new BadRequestException('Không thể gửi nhắc nhở cho buổi tư vấn đã kết thúc hoặc bị hủy');
    }

    let meetingUrl = row.meetingUrl;
    let pin: string | null = null;
    let urlOnly: string | null = null;

    if (!meetingUrl) {
      const roomSlug = `sds-consult-${id.slice(0, 8)}-${Date.now()
        .toString(36)
        .slice(-4)}`;
      pin = String(randomInt(100000, 999999));
      meetingUrl = packMeeting(roomSlug, pin);
      urlOnly = `https://meet.jit.si/${roomSlug}`;

      await this.prisma.videoConsultation.update({
        where: { id },
        data: { meetingUrl },
      });
    } else {
      const unpacked = unpackMeeting(meetingUrl);
      urlOnly = unpacked.meetingUrl;
      pin = unpacked.roomPin;
    }

    const patientUser = row.patient.user;
    if (patientUser?.id) {
      await this.prisma.notification.create({
        data: {
          userId: patientUser.id,
          type: 'APPOINTMENT_REMINDER',
          title: '⏰ Nhắc nhở từ phòng khám',
          content: `Bác sĩ ${row.doctor.user.fullName} đang nhắc bạn tham gia buổi tư vấn trực tuyến. Vui lòng truy cập phòng ngay!`,
          channel: 'IN_APP',
          status: 'SENT',
          sentAt: new Date(),
        },
      });
    }

    const patientEmail = (patientUser as any)?.email;
    if (patientEmail) {
      try {
        await this.mailQueue.add('send-consultation-reminder', {
          name: row.patient.fullName ?? row.patient.user?.fullName ?? 'Quý khách',
          email: patientEmail,
          patientCode: row.patient.patientCode,
          doctorName: row.doctor.user.fullName,
          scheduledAt: row.scheduledAt,
          durationMinutes: row.durationMinutes,
          meetingUrl: urlOnly ?? '',
          roomPin: pin,
        });
      } catch (err) {
        this.logger.error('Failed to queue consultation reminder mail', err);
      }
    }

    return {
      success: true,
      message: 'Đã gửi thông báo và email nhắc nhở tới bệnh nhân',
    };
  }
}
