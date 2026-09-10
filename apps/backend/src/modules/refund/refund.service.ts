import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { randomUUID } from 'crypto';
import { Prisma } from '../../../prisma/generated/client';
import {
  AppointmentPaymentStatus,
  InvoiceStatus,
  InvoiceType,
  PaymentMethod,
  PaymentStatus,
  RefundStatus,
} from '../../../prisma/generated/enums';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRefundRequestDto } from './dto/create-refund-request.dto';
import { ProcessRefundDto } from './dto/process-refund.dto';

@Injectable()
export class RefundService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('mail-queue')
    private readonly mailQueue: Queue,
  ) {}

  /** Bệnh nhân gửi yêu cầu hoàn tiền */
  async createRefundRequest(
    user: AuthenticatedUser,
    dto: CreateRefundRequestDto,
  ) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId: user.userId },
    });
    if (!patient) {
      throw new NotFoundException('Không tìm thấy thông tin bệnh nhân');
    }

    let requestedAmount = 0;
    let refundPercent = 100;
    let invoiceId: string | null = null;

    if (dto.videoConsultationId) {
      const consultation = await this.prisma.videoConsultation.findUnique({
        where: { id: dto.videoConsultationId },
      });
      if (!consultation || consultation.patientId !== patient.id) {
        throw new NotFoundException('Không tìm thấy lịch tư vấn này');
      }

      if (!consultation.isPaid) {
        throw new BadRequestException('Lịch tư vấn này chưa được thanh toán, không thể hoàn tiền');
      }

      // Kiểm tra xem đã có yêu cầu hoàn tiền PENDING/COMPLETED chưa
      const existingRequest = await this.prisma.refundRequest.findFirst({
        where: {
          videoConsultationId: dto.videoConsultationId,
          status: { in: [RefundStatus.PENDING, RefundStatus.PROCESSING, RefundStatus.COMPLETED] },
        },
      });
      if (existingRequest) {
        throw new BadRequestException('Lịch tư vấn này đã có yêu cầu hoàn tiền đang được xử lý hoặc đã hoàn thành');
      }

      // Tính chính sách hoàn tiền
      const hoursUntil = (consultation.scheduledAt.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntil > 24) {
        refundPercent = 100;
      } else if (hoursUntil >= 4) {
        refundPercent = 50;
      } else {
        refundPercent = 0;
      }

      const feeNum = Number(consultation.fee);
      requestedAmount = Math.round((feeNum * refundPercent) / 100);

      // Lấy invoiceId liên quan nếu có
      const invoices = await this.prisma.invoice.findMany({
        where: {
          patientId: patient.id,
          status: { in: [InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID] },
        },
        orderBy: { issuedAt: 'desc' },
      });
      const invoice = invoices.find((candidate) =>
        Array.isArray(candidate.items) && candidate.items.some((item) =>
          typeof item === 'object' && item !== null &&
          'videoConsultationId' in item && item.videoConsultationId === dto.videoConsultationId,
        ),
      );
      if (!invoice) throw new BadRequestException('refund.invoice_not_found');
      invoiceId = invoice.id;
    } else if (dto.appointmentId) {
      const app = await this.prisma.appointment.findUnique({
        where: { id: dto.appointmentId },
      });
      if (!app || app.patientId !== patient.id) {
        throw new NotFoundException('Không tìm thấy lịch khám này');
      }

      if (app.paymentStatus !== AppointmentPaymentStatus.DEPOSIT_PAID) {
        throw new BadRequestException('refund.deposit_not_paid');
      }

      const existingRequest = await this.prisma.refundRequest.findFirst({
        where: {
          appointmentId: dto.appointmentId,
          status: { in: [RefundStatus.PENDING, RefundStatus.PROCESSING, RefundStatus.COMPLETED] },
        },
      });
      if (existingRequest) {
        throw new ConflictException('refund.request_already_exists');
      }

      const invoice = await this.prisma.invoice.findFirst({
        where: {
          appointmentId: dto.appointmentId,
          invoiceType: InvoiceType.DEPOSIT,
          status: { in: [InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID] },
        },
        orderBy: { issuedAt: 'desc' },
      });
      if (!invoice) throw new BadRequestException('refund.invoice_not_found');
      invoiceId = invoice.id;

      const depositNum = Number(app.depositAmount || 0);
      requestedAmount = depositNum;
      refundPercent = 100;
    } else {
      throw new BadRequestException('Phải chỉ định videoConsultationId hoặc appointmentId');
    }

    if (requestedAmount <= 0) {
      throw new BadRequestException('Đơn tư vấn này không đủ điều kiện hoàn tiền (hủy dưới 4h hoặc tiền = 0)');
    }

    const refundCode = `REF-${randomUUID().slice(0, 8).toUpperCase()}`;

    let refundRequest;
    try {
      refundRequest = await this.prisma.$transaction(async (tx) => {
        const created = await tx.refundRequest.create({
          data: {
            refundCode,
            patientId: patient.id,
            videoConsultationId: dto.videoConsultationId ?? null,
            appointmentId: dto.appointmentId ?? null,
            invoiceId,
            bankName: dto.bankName.trim(),
            accountNumber: dto.accountNumber.trim(),
            accountHolder: dto.accountHolder.trim().toUpperCase(),
            qrCodeUrl: dto.qrCodeUrl?.trim() || null,
            requestedAmount,
            refundPercent,
            reason: dto.reason?.trim() || null,
            status: RefundStatus.PENDING,
          },
          include: {
            patient: { select: { user: { select: { fullName: true, phone: true } } } },
          },
        });
        if (dto.videoConsultationId) {
          await tx.videoConsultation.update({
            where: { id: dto.videoConsultationId },
            data: { status: 'CANCELLED', meetingUrl: null },
          });
        }
        return created;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('refund.request_already_exists');
      }
      throw error;
    }

    // Notification delivery is best-effort and must not roll back committed domain state.
    try {
      await this.prisma.notification.create({
        data: {
          userId: user.userId,
          type: 'SYSTEM',
          title: 'Yêu cầu hoàn tiền đã gửi thành công',
          content: `Yêu cầu hoàn tiền mã ${refundCode} (${requestedAmount.toLocaleString('vi-VN')} VNĐ) đã gửi tới bộ phận Lễ tân. Chúng tôi sẽ chuyển khoản cho bạn trong thời gian sớm nhất.`,
          channel: 'IN_APP',
          status: 'SENT',
          sentAt: new Date(),
        },
      });
    } catch {
      // non-blocking
    }

    return refundRequest;
  }

  /** Lấy danh sách yêu cầu hoàn tiền cho Lễ tân / Admin */
  async findAll(status?: RefundStatus) {
    const whereCondition = status ? { status } : {};

    return this.prisma.refundRequest.findMany({
      where: whereCondition,
      include: {
        patient: {
          select: {
            id: true,
            patientCode: true,
            user: { select: { fullName: true, phone: true, email: true } },
          },
        },
        videoConsultation: {
          include: {
            doctor: { select: { user: { select: { fullName: true } } } },
          },
        },
        appointment: {
          include: {
            doctor: { select: { user: { select: { fullName: true } } } },
            service: { select: { name: true } },
          },
        },
        processor: {
          select: { id: true, fullName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Bệnh nhân xem danh sách yêu cầu hoàn tiền của mình */
  async findMyRefunds(user: AuthenticatedUser) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId: user.userId },
      select: { id: true },
    });
    if (!patient) return [];

    return this.prisma.refundRequest.findMany({
      where: { patientId: patient.id },
      include: {
        videoConsultation: {
          select: {
            scheduledAt: true,
            fee: true,
            doctor: { select: { user: { select: { fullName: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Lễ tân / Admin duyệt hoặc từ chối hoàn tiền */
  async processRefund(id: string, adminUser: AuthenticatedUser, dto: ProcessRefundDto) {
    const refundRequest = await this.prisma.refundRequest.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: { select: { fullName: true, email: true, phone: true } },
          },
        },
        videoConsultation: true,
        appointment: {
          include: {
            service: { select: { name: true } },
          },
        },
      },
    });

    if (!refundRequest) {
      throw new NotFoundException('Không tìm thấy yêu cầu hoàn tiền');
    }

    if (
      refundRequest.status !== RefundStatus.PENDING &&
      refundRequest.status !== RefundStatus.PROCESSING
    ) {
      throw new ConflictException('refund.already_processed');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.refundRequest.updateMany({
        where: { id, status: { in: [RefundStatus.PENDING, RefundStatus.PROCESSING] } },
        data: {
          status: dto.status,
          rejectReason: dto.status === RefundStatus.REJECTED ? dto.rejectReason?.trim() : null,
          proofImageUrl: dto.proofImageUrl?.trim() || null,
          processedBy: adminUser.userId,
          processedAt: new Date(),
        },
      });
      if (claimed.count !== 1) throw new ConflictException('refund.already_processed');

      if (dto.status === RefundStatus.COMPLETED) {
        if (!refundRequest.invoiceId) throw new BadRequestException('refund.invoice_not_found');
        const invoice = await tx.invoice.findUniqueOrThrow({
          where: { id: refundRequest.invoiceId },
          select: { finalAmount: true },
        });
        await tx.payment.create({
          data: {
            invoiceId: refundRequest.invoiceId,
            amount: refundRequest.requestedAmount,
            paymentMethod: PaymentMethod.BANK_TRANSFER,
            transactionRef: `REFUND-${refundRequest.refundCode}`,
            status: PaymentStatus.REFUNDED,
            paidAt: new Date(),
            receivedBy: adminUser.userId,
          },
        });
        if (Number(refundRequest.requestedAmount) >= Number(invoice.finalAmount)) {
          await tx.invoice.update({
            where: { id: refundRequest.invoiceId },
            data: { status: InvoiceStatus.REFUNDED },
          });
        }
      }

      return tx.refundRequest.findUniqueOrThrow({ where: { id } });
    });

    const patientEmail = refundRequest.patient?.user?.email;
    const patientName = refundRequest.patient?.user?.fullName || 'Quý khách';
    const amountNum = Number(refundRequest.requestedAmount);
    const serviceName = refundRequest.videoConsultation
      ? 'Tư vấn trực tuyến (Video Call)'
      : refundRequest.appointment?.service?.name || 'Khám & Điều trị nha khoa';

    // 1. Gửi Gmail thông báo chính thức đến bệnh nhân
    if (patientEmail) {
      try {
        if (dto.status === RefundStatus.COMPLETED) {
          await this.mailQueue.add('send-request-refund-approved', {
            name: patientName,
            email: patientEmail,
            requestCode: refundRequest.refundCode,
            serviceName,
            refundAmount: amountNum,
            refundPercent: refundRequest.refundPercent,
            note: `Đã hoàn tiền thành công vào tài khoản ${refundRequest.bankName} - STK ${refundRequest.accountNumber} (Chủ TK: ${refundRequest.accountHolder}).`,
          });
        } else if (dto.status === RefundStatus.REJECTED) {
          await this.mailQueue.add('send-request-rejected', {
            name: patientName,
            email: patientEmail,
            requestCode: refundRequest.refundCode,
            requestTypeLabel: 'Hoàn phí dịch vụ',
            reason: dto.rejectReason || 'Không đáp ứng điều kiện hoàn tiền theo quy định.',
          });
        }
      } catch (err) {
        // non-blocking
      }
    }

    // 2. Gửi thông báo In-App thời gian thực
    if (refundRequest.patient?.userId) {
      const amountStr = amountNum.toLocaleString('vi-VN');
      const isCompleted = dto.status === RefundStatus.COMPLETED;

      const title = isCompleted
        ? '✅ Hoàn tiền thành công!'
        : '❌ Yêu cầu hoàn tiền bị từ chối';

      const content = isCompleted
        ? `Lễ tân đã hoàn số tiền ${amountStr} VNĐ cho mã yêu cầu ${refundRequest.refundCode} vào tài khoản ${refundRequest.bankName} - ${refundRequest.accountNumber}. Vui lòng kiểm tra tài khoản.`
        : `Yêu cầu hoàn tiền ${refundRequest.refundCode} bị từ chối. Lý do: ${dto.rejectReason || 'Không đáp ứng điều kiện'}.`;

      try {
        await this.prisma.notification.create({
          data: {
            userId: refundRequest.patient.userId,
            type: 'SYSTEM',
            title,
            content,
            channel: 'IN_APP',
            status: 'SENT',
            sentAt: new Date(),
          },
        });
      } catch {
        // A notification failure must not turn a committed refund into a retryable request.
      }
    }

    return updated;
  }
}
