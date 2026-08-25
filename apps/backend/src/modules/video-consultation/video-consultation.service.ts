import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { randomInt, randomUUID } from 'crypto';
import {
  InvoiceStatus,
  InvoiceType,
  PaymentMethod,
  VideoConsultationStatus,
} from '../../../prisma/generated/enums';
import type { AuthenticatedUser } from 'src/common/interfaces/authenticated-user.interface';
import { ClinicConfigService } from '../clinic-config/clinic-config.service';
import { PaymentService } from '../payment/payment.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../socket/events.gateway';
import { CreateVideoConsultationDto } from './dto/create-video-consultation.dto';

const consultInclude = {
  patient: {
    select: {
      id: true,
      patientCode: true,
      fullName: true,
      phone: true,
      medicalHistory: true,
      user: { select: { id: true, fullName: true, phone: true } },
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
    patientCode: string;
    fullName?: string | null;
    phone?: string | null;
    medicalHistory?: string | null;
    user: { id: string; fullName: string; phone: string | null } | null;
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

@Injectable()
export class VideoConsultationService {
  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentService,
    private clinicConfigService: ClinicConfigService,
    private eventsGateway: EventsGateway,
    @InjectQueue('mail-queue')
    private readonly mailQueue: Queue,
  ) {}

  /** Lấy danh sách các gói tư vấn (ConsultationPackage) từ DB */
  async getConsultationPackages() {
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
  }

  /** Tính toán slot rảnh tư vấn tuân thủ 100% lịch hoạt động setting của phòng khám */
  async getAvailableSlots(
    doctorId: string,
    dateStr: string,
    durationMinutes: number,
  ): Promise<string[]> {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Ngày không hợp lệ (YYYY-MM-DD)');
    }

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

    // A. Kiểm tra ngày đặc biệt/ngày lễ đóng cửa
    const formattedDateStr = dateStr.slice(0, 10);
    const specialDate = clinicConfig.specialDates.find(
      (s) => s.date === formattedDateStr,
    );
    if (specialDate && specialDate.isClosed) {
      return []; // Ngày phòng khám đóng cửa -> Không có slot
    }

    // B. Kiểm tra ngày trong tuần (Chủ nhật = 0, Thứ hai = 1,...)
    const dayOfWeek = date.getDay();
    const daySetting = businessHours.find((bh) => bh.id === dayOfWeek);
    if (!daySetting || !daySetting.isOpen) {
      return []; // Ngày phòng khám không mở cửa (ví dụ Chủ Nhật) -> Trả về rỗng []
    }

    let clinicStart = daySetting.start; // ví dụ "08:00"
    let clinicEnd = daySetting.end;     // ví dụ "17:00"

    if (specialDate && !specialDate.isClosed && specialDate.start && specialDate.end) {
      clinicStart = specialDate.start;
      clinicEnd = specialDate.end;
    }

    // 2. Lấy lịch làm việc của Bác sĩ trong khung giờ phòng khám
    const availability = await this.prisma.doctorAvailability.findMany({
      where: {
        doctorId,
        isActive: true,
        OR: [
          { recordType: 'WEEKLY', dayOfWeek },
          { recordType: 'DATE_OVERRIDE', specificDate: date },
        ],
      },
    });

    const activeWorkingHours = availability.length
      ? availability.map((a) => ({
          ...a,
          // Đảm bảo khung giờ làm của Bác sĩ nằm trong khung giờ phòng khám
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
        recordType: 'TIME_OFF',
        specificDate: date,
      },
    });

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        scheduledAt: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
      select: { scheduledAt: true, endAt: true },
    });

    const existingConsultations = await this.prisma.videoConsultation.findMany({
      where: {
        doctorId,
        scheduledAt: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ['CANCELLED'] },
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
      const [sH, sM] = to.startTime.split(':').map(Number);
      const [eH, eM] = to.endTime.split(':').map(Number);
      const startMs = new Date(date).setHours(sH, sM, 0, 0);
      const endMs = new Date(date).setHours(eH, eM, 0, 0);
      busyRanges.push({ startMs, endMs });
    }

    const availableSlots: string[] = [];
    const stepMinutes = 15;

    for (const avail of activeWorkingHours) {
      const [startH, startM] = avail.startTime.split(':').map(Number);
      const [endH, endM] = avail.endTime.split(':').map(Number);

      let current = new Date(date);
      current.setHours(startH, startM, 0, 0);

      const availEnd = new Date(date);
      availEnd.setHours(endH, endM, 0, 0);

      while (current.getTime() + durationMinutes * 60 * 1000 <= availEnd.getTime()) {
        const slotStartMs = current.getTime();
        const slotEndMs = slotStartMs + durationMinutes * 60 * 1000;

        if (slotStartMs > Date.now()) {
          const isConflict = busyRanges.some(
            (b) => slotStartMs < b.endMs && slotEndMs > b.startMs,
          );

          if (!isConflict) {
            const hh = String(current.getHours()).padStart(2, '0');
            const mm = String(current.getMinutes()).padStart(2, '0');
            availableSlots.push(`${hh}:${mm}`);
          }
        }

        current = new Date(current.getTime() + stepMinutes * 60 * 1000);
      }
    }

    return Array.from(new Set(availableSlots)).sort();
  }

  /** Đặt lịch tư vấn trực tuyến cho bệnh nhân & tạo thông báo + nhắc lịch 10 phút trước */
  async createBooking(user: AuthenticatedUser, dto: CreateVideoConsultationDto) {
    let patient = await this.prisma.patient.findUnique({
      where: { userId: user.userId },
      include: { user: { select: { fullName: true } } },
    });

    if (!patient) {
      const userRecord = await this.prisma.user.findUnique({
        where: { id: user.userId },
      });
      if (!userRecord) {
        throw new NotFoundException('Không tìm thấy tài khoản người dùng');
      }

      patient = await this.prisma.patient.create({
        data: {
          userId: user.userId,
          patientCode: `BN-${Date.now().toString().slice(-6)}`,
        },
        include: { user: { select: { fullName: true } } },
      });
    }

    const doctor = await this.prisma.doctor.findUnique({
      where: { id: dto.doctorId },
      include: { user: { select: { fullName: true } } },
    });
    if (!doctor || !doctor.isActive) {
      throw new NotFoundException('Không tìm thấy bác sĩ tư vấn');
    }

    const scheduledAt = new Date(dto.scheduledAt);
    if (isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('Thời gian hẹn không hợp lệ');
    }
    if (scheduledAt.getTime() < Date.now()) {
      throw new BadRequestException('Thời gian tư vấn phải ở tương lai');
    }

    const scheduledEndMs = scheduledAt.getTime() + dto.durationMinutes * 60 * 1000;

    const overlappingAppointment = await this.prisma.appointment.findFirst({
      where: {
        doctorId: dto.doctorId,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        AND: [
          { scheduledAt: { lt: new Date(scheduledEndMs) } },
          { endAt: { gt: scheduledAt } },
        ],
      },
    });

    if (overlappingAppointment) {
      throw new BadRequestException('Bác sĩ đã có lịch khám tại phòng khám vào khung giờ này');
    }

    const startOfDay = new Date(scheduledAt);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(scheduledAt);
    endOfDay.setHours(23, 59, 59, 999);

    const existingConsultations = await this.prisma.videoConsultation.findMany({
      where: {
        doctorId: dto.doctorId,
        scheduledAt: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ['CANCELLED'] },
      },
      select: { scheduledAt: true, durationMinutes: true },
    });

    const isConsultationConflict = existingConsultations.some((vc) => {
      const vcStart = vc.scheduledAt.getTime();
      const vcEnd = vcStart + vc.durationMinutes * 60 * 1000;
      return vcStart < scheduledEndMs && vcEnd > scheduledAt.getTime();
    });

    if (isConsultationConflict) {
      throw new BadRequestException('Bác sĩ đã có lịch tư vấn trực tuyến vào khung giờ này');
    }

    const fee = await this.calculateConsultationFee(dto.durationMinutes);

    const consultation = await this.prisma.videoConsultation.create({
      data: {
        patientId: patient.id,
        doctorId: dto.doctorId,
        scheduledAt,
        durationMinutes: dto.durationMinutes,
        fee,
        isPaid: false,
        status: VideoConsultationStatus.SCHEDULED,
        notes: dto.notes ? dto.notes.trim() : null,
      },
      include: consultInclude,
    });

    const invoiceCode = `INV-VC-${Date.now().toString().slice(-6)}`;
    const invoice = await this.prisma.invoice.create({
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
          },
        ],
      },
    });

    const paymentDetails = await this.paymentService.createPayment(user.userId, {
      invoiceId: invoice.id,
      amount: fee,
      method: PaymentMethod.BANK_TRANSFER,
    });

    // 📩 Bắn thông báo tạo lịch hẹn ngay lập tức
    await this.prisma.notification.create({
      data: {
        userId: user.userId,
        type: 'SYSTEM',
        title: 'Đặt lịch tư vấn trực tuyến thành công',
        content: `Đơn tư vấn với Bác sĩ ${doctor.user.fullName} vào ${scheduledAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ngày ${scheduledAt.toLocaleDateString('vi-VN')} đã tạo. Vui lòng hoàn tất thanh toán 100%.`,
        channel: 'IN_APP',
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    // ⏰ Lên lịch thông báo nhắc trước 10 phút (Notification Reminder)
    const reminderTime = new Date(scheduledAt.getTime() - 10 * 60 * 1000);
    if (reminderTime.getTime() > Date.now()) {
      await this.prisma.notification.create({
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
        await this.prisma.notification.create({
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
  }

  /** Bệnh nhân hủy lịch tư vấn & Xử lý chính sách hoàn tiền */
  async cancelBookingByPatient(user: AuthenticatedUser, id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId: user.userId },
    });
    if (!patient) {
      throw new NotFoundException('Không tìm thấy thông tin bệnh nhân');
    }

    const consultation = await this.prisma.videoConsultation.findUnique({
      where: { id },
    });
    if (!consultation || consultation.patientId !== patient.id) {
      throw new NotFoundException('Không tìm thấy lịch tư vấn này');
    }

    if (consultation.status === VideoConsultationStatus.CANCELLED) {
      throw new BadRequestException('Buổi tư vấn này đã bị hủy trước đó');
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

    const updated = await this.prisma.videoConsultation.update({
      where: { id },
      data: {
        status: VideoConsultationStatus.CANCELLED,
        meetingUrl: null,
      },
      include: consultInclude,
    });

    const feeNum = Number(consultation.fee);
    const refundAmount = Math.round((feeNum * refundPercent) / 100);

    // Gửi thông báo hủy đơn & hoàn tiền
    await this.prisma.notification.create({
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

    let invoice = await this.prisma.invoice.findFirst({
      where: {
        patientId: patient.id,
        invoiceType: InvoiceType.SERVICE,
        status: { in: [InvoiceStatus.DRAFT, InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID] },
        finalAmount: fee,
      },
      orderBy: { issuedAt: 'desc' },
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

    const chats = await this.prisma.chatbotConversation.findMany({
      where: { patientId: row.patientId },
      orderBy: { startedAt: 'desc' },
      take: 10,
    });

    return {
      ...this.toSummary(row, true),
      patientPhone: row.patient.phone ?? row.patient.user?.phone ?? null,
      medicalHistory: row.patient.medicalHistory,
      chatbotSessions: chats.map((c) => ({
        id: c.id,
        status: c.status,
        startedAt: c.startedAt,
        endedAt: c.endedAt,
        messages: this.normalizeMessages(c.messages),
      })),
    };
  }

  async start(id: string, user: AuthenticatedUser) {
    const row = await this.getAuthorizedRow(id, user, { doctorOnly: true });

    if (
      row.status !== VideoConsultationStatus.SCHEDULED &&
      row.status !== VideoConsultationStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        'Chỉ có thể bắt đầu buổi tư vấn đang chờ hoặc đang diễn ra',
      );
    }

    let meetingUrl = row.meetingUrl;
    if (row.status === VideoConsultationStatus.SCHEDULED || !meetingUrl) {
      const roomSlug = `SmartDental${randomUUID().replace(/-/g, '')}`;
      const pin = String(randomInt(100000, 1000000));
      meetingUrl = packMeeting(roomSlug, pin);
    }

    const updated = await this.prisma.videoConsultation.update({
      where: { id },
      data: {
        status: VideoConsultationStatus.IN_PROGRESS,
        meetingUrl,
      },
      include: consultInclude,
    });

    // Thông báo cuộc gọi đã bắt đầu — gửi đến bệnh nhân + bắn Real-time Socket
    const patientUserId = updated.patient.user?.id;
    if (patientUserId) {
      const notif = await this.prisma.notification.create({
        data: {
          userId: patientUserId,
          type: 'SYSTEM',
          title: '📞 Bác sĩ đã mở phòng tư vấn!',
          content:
            'Bác sĩ đã sẵn sàng. Vui lòng vào mục "Lịch tư vấn của tôi" và bấm "Tham Gia Tư Vấn" để bắt đầu.',
          channel: 'IN_APP',
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      try {
        this.eventsGateway.emitToUser(patientUserId, 'consultation_updated', {
          id: updated.id,
          status: updated.status,
        });
        this.eventsGateway.emitToUser(patientUserId, 'notification', notif);
      } catch (err) {
        console.error('Socket emit error:', err);
      }
    }

    return this.toSummary(updated, true);
  }

  async complete(id: string, user: AuthenticatedUser) {
    const row = await this.getAuthorizedRow(id, user, { doctorOnly: true });

    if (row.status !== VideoConsultationStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Chỉ có thể kết thúc buổi tư vấn đang diễn ra',
      );
    }

    const updated = await this.prisma.videoConsultation.update({
      where: { id },
      data: {
        status: VideoConsultationStatus.COMPLETED,
        meetingUrl: null,
      },
      include: consultInclude,
    });

    const patientUserId = updated.patient.user?.id;
    if (patientUserId) {
      try {
        this.eventsGateway.emitToUser(patientUserId, 'consultation_updated', {
          id: updated.id,
          status: updated.status,
        });
      } catch {}
    }

    return this.toSummary(updated, true);
  }

  async cancel(id: string, user: AuthenticatedUser) {
    const row = await this.getAuthorizedRow(id, user, { doctorOnly: true });

    if (
      row.status !== VideoConsultationStatus.SCHEDULED &&
      row.status !== VideoConsultationStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        'Chỉ có thể hủy buổi tư vấn đang chờ hoặc đang diễn ra',
      );
    }

    const updated = await this.prisma.videoConsultation.update({
      where: { id },
      data: {
        status: VideoConsultationStatus.CANCELLED,
        meetingUrl: null,
      },
      include: consultInclude,
    });

    const patientUserId = updated.patient.user?.id;
    if (patientUserId) {
      try {
        this.eventsGateway.emitToUser(patientUserId, 'consultation_updated', {
          id: updated.id,
          status: updated.status,
        });
      } catch {}
    }

    return this.toSummary(updated, true);
  }

  async updateNotes(id: string, user: AuthenticatedUser, notes: string | null) {
    const row = await this.getAuthorizedRow(id, user, { doctorOnly: true });

    if (row.status === VideoConsultationStatus.CANCELLED) {
      throw new BadRequestException('Không thể ghi chú buổi tư vấn đã hủy');
    }

    const normalized =
      notes === null || notes === undefined ? null : notes.trim() || null;

    const updated = await this.prisma.videoConsultation.update({
      where: { id },
      data: { notes: normalized },
      include: consultInclude,
    });
    return this.toSummary(updated, true);
  }

  private async resolveDoctorIdForList(
    user: AuthenticatedUser,
    doctorIdQuery?: string,
  ) {
    if (user.roles.includes('ADMIN') && doctorIdQuery) {
      return doctorIdQuery;
    }

    const doctor = await this.prisma.doctor.findUnique({
      where: { userId: user.userId },
      select: { id: true },
    });
    if (!doctor) {
      throw new ForbiddenException('Không tìm thấy hồ sơ bác sĩ');
    }

    if (
      doctorIdQuery &&
      doctorIdQuery !== doctor.id &&
      !user.roles.includes('ADMIN')
    ) {
      throw new ForbiddenException(
        'Không được xem lịch tư vấn của bác sĩ khác',
      );
    }

    return doctor.id;
  }

  private async getAuthorizedRow(
    id: string,
    user: AuthenticatedUser,
    opts?: { doctorOnly?: boolean },
  ): Promise<ConsultRow> {
    const row = await this.prisma.videoConsultation.findUnique({
      where: { id },
      include: consultInclude,
    });
    if (!row) {
      throw new NotFoundException('Không tìm thấy buổi tư vấn');
    }

    if (user.roles.includes('ADMIN')) {
      return row;
    }

    const doctor = await this.prisma.doctor.findUnique({
      where: { userId: user.userId },
      select: { id: true },
    });
    if (doctor && doctor.id === row.doctorId) {
      return row;
    }

    if (!opts?.doctorOnly) {
      const patient = await this.prisma.patient.findUnique({
        where: { userId: user.userId },
        select: { id: true },
      });
      if (patient && patient.id === row.patientId) {
        return row;
      }
    }

    throw new ForbiddenException('Bạn không có quyền truy cập buổi tư vấn này');
  }

  /** Bệnh nhân tham gia phòng tư vấn do Bác sĩ mở */
  async joinPatientRoom(user: AuthenticatedUser, id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId: user.userId },
      select: { id: true },
    });
    if (!patient) {
      throw new NotFoundException('Không tìm thấy bệnh nhân');
    }

    const consultation = await this.prisma.videoConsultation.findUnique({
      where: { id },
      include: consultInclude,
    });

    if (!consultation || consultation.patientId !== patient.id) {
      throw new NotFoundException('Không tìm thấy lịch tư vấn này');
    }

    if (!consultation.isPaid) {
      throw new BadRequestException('Buổi tư vấn chưa được thanh toán');
    }

    if (consultation.status === VideoConsultationStatus.CANCELLED) {
      throw new BadRequestException('Buổi tư vấn đã bị hủy');
    }

    if (consultation.status === VideoConsultationStatus.COMPLETED) {
      throw new BadRequestException('Buổi tư vấn đã hoàn thành');
    }

    if (!consultation.meetingUrl || consultation.status !== VideoConsultationStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Bác sĩ chưa mở phòng tư vấn. Vui lòng chờ Bác sĩ bấm bắt đầu cuộc gọi!',
      );
    }

    const secrets = unpackMeeting(consultation.meetingUrl);

    return {
      id: consultation.id,
      meetingUrl: secrets.meetingUrl,
      roomPin: secrets.roomPin,
      doctorName: consultation.doctor.user.fullName,
      scheduledAt: consultation.scheduledAt,
      durationMinutes: consultation.durationMinutes,
      status: consultation.status,
    };
  }

  private toSummary(row: ConsultRow, includeSecrets: boolean) {
    const active =
      row.status === VideoConsultationStatus.IN_PROGRESS ||
      (row.status === VideoConsultationStatus.SCHEDULED && Boolean(row.meetingUrl));
    const secrets =
      includeSecrets && (active || row.isPaid)
        ? unpackMeeting(row.meetingUrl)
        : { meetingUrl: null, roomPin: null };

    return {
      id: row.id,
      patientId: row.patientId,
      patientName: row.patient.fullName ?? row.patient.user?.fullName ?? 'Bệnh nhân',
      patientCode: row.patient.patientCode,
      patientPhone: row.patient.phone ?? row.patient.user?.phone ?? null,
      scheduledAt: row.scheduledAt,
      durationMinutes: row.durationMinutes,
      status: row.status,
      meetingUrl: secrets.meetingUrl,
      roomPin: secrets.roomPin,
      fee: Number(row.fee),
      isPaid: row.isPaid,
      notes: row.notes,
      createdAt: row.createdAt,
    };
  }

  private normalizeMessages(raw: unknown): {
    role: string;
    content: string;
  }[] {
    if (!Array.isArray(raw)) return [];
    return raw
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const msg = item as Record<string, unknown>;
        const role = typeof msg.role === 'string' ? msg.role : 'assistant';
        const content = typeof msg.content === 'string' ? msg.content : '';
        if (!content) return null;
        return { role, content };
      })
      .filter((m): m is { role: string; content: string } => m !== null);
  }

  /** Gửi Link phòng Video Call & Lời nhắc qua Gmail & Thông báo In-App cho bệnh nhân */
  async sendConsultationReminderToPatient(id: string, user: AuthenticatedUser) {
    const row = await this.getAuthorizedRow(id, user, { doctorOnly: true });

    const patient = await this.prisma.patient.findUnique({
      where: { id: row.patientId },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
      },
    });

    const doctor = await this.prisma.doctor.findUnique({
      where: { id: row.doctorId },
      include: {
        user: { select: { fullName: true } },
      },
    });

    const email = patient?.user?.email || patient?.email;
    const patientName = (patient as any)?.fullName || patient?.user?.fullName || 'Quý khách';
    const patientCode = patient?.patientCode || 'PAT-0000';
    const doctorName = doctor?.user?.fullName || 'BS. Nguyễn Đức Hậu';

    if (!email || email.endsWith('@clinic.local')) {
      throw new BadRequestException('Bệnh nhân chưa có địa chỉ email hợp lệ để nhận lời nhắc phòng tư vấn');
    }

    let meetingUrl = row.meetingUrl;
    let roomPin: string | null = null;
    if (!meetingUrl) {
      const roomSlug = `SmartDental${randomUUID().replace(/-/g, '')}`;
      const pin = String(randomInt(100000, 1000000));
      meetingUrl = packMeeting(roomSlug, pin);
      await this.prisma.videoConsultation.update({
        where: { id },
        data: { meetingUrl },
      });
      roomPin = pin;
    } else {
      const unpacked = unpackMeeting(meetingUrl);
      roomPin = unpacked.roomPin;
    }

    const { meetingUrl: baseMeetingUrl } = unpackMeeting(meetingUrl);
    const directUrl = baseMeetingUrl || `http://localhost:3000/dashboard/consultations`;

    const d = new Date(row.scheduledAt);
    const timeFormatted = new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    }).format(d);

    await this.mailQueue.add('send-consultation-reminder', {
      name: patientName,
      email,
      patientCode,
      doctorName,
      scheduledAt: row.scheduledAt.toISOString(),
      durationMinutes: row.durationMinutes,
      meetingUrl: directUrl,
      roomPin,
    });

    if (patient?.user?.id) {
      const notif = await this.prisma.notification.create({
        data: {
          userId: patient.user.id,
          type: 'SYSTEM',
          title: '📹 Lời nhắc vào phòng tư vấn Video Call',
          content: `${doctorName} nhắc bạn lịch hẹn tư vấn trực tuyến lúc ${timeFormatted}. Vui lòng chuẩn bị Camera/Micro để vào phòng đúng giờ.`,
          channel: 'IN_APP',
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      try {
        this.eventsGateway.emitToUser(patient.user.id, 'notification', notif);
      } catch (err) {
        console.error('Socket notification emit error:', err);
      }
    }

    return {
      success: true,
      message: `Đã gửi link phòng tư vấn & lời nhắc thành công đến ${email}`,
    };
  }
}
