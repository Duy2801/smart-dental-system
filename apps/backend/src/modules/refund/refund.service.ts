import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RefundStatus } from '../../../prisma/generated/enums';
import { AuthenticatedUser } from 'src/common/interfaces/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRefundRequestDto } from './dto/create-refund-request.dto';
import { ProcessRefundDto } from './dto/process-refund.dto';

@Injectable()
export class RefundService {
  constructor(private prisma: PrismaService) {}

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
      const invoice = await this.prisma.invoice.findFirst({
        where: {
          patientId: patient.id,
          finalAmount: feeNum,
        },
        orderBy: { issuedAt: 'desc' },
      });
      if (invoice) {
        invoiceId = invoice.id;
      }
    } else if (dto.appointmentId) {
      const app = await this.prisma.appointment.findUnique({
        where: { id: dto.appointmentId },
      });
      if (!app || app.patientId !== patient.id) {
        throw new NotFoundException('Không tìm thấy lịch khám này');
      }

      const depositNum = Number(app.depositAmount || 0);
      requestedAmount = depositNum;
      refundPercent = 100;
    } else {
      throw new BadRequestException('Phải chỉ định videoConsultationId hoặc appointmentId');
    }

    if (requestedAmount <= 0) {
      throw new BadRequestException('Đơn tư vấn này không đủ điều kiện hoàn tiền (hủy dưới 4h hoặc tiền = 0)');
    }

    const refundCode = `REF-${Date.now().toString().slice(-6)}`;

    const refundRequest = await this.prisma.refundRequest.create({
      data: {
        refundCode,
        patientId: patient.id,
        videoConsultationId: dto.videoConsultationId ?? null,
        appointmentId: dto.appointmentId ?? null,
        invoiceId: invoiceId ?? null,
        bankName: dto.bankName.trim(),
        accountNumber: dto.accountNumber.trim(),
        accountHolder: dto.accountHolder.trim().toUpperCase(),
        qrCodeUrl: dto.qrCodeUrl ? dto.qrCodeUrl.trim() : null,
        requestedAmount,
        refundPercent,
        reason: dto.reason ? dto.reason.trim() : null,
        status: RefundStatus.PENDING,
      },
      include: {
        patient: { select: { user: { select: { fullName: true, phone: true } } } },
      },
    });

    // Cập nhật trạng thái buổi tư vấn thành CANCELLED nếu chưa hủy
    if (dto.videoConsultationId) {
      await this.prisma.videoConsultation.update({
        where: { id: dto.videoConsultationId },
        data: { status: 'CANCELLED', meetingUrl: null },
      });
    }

    // Gửi thông báo đến bệnh nhân
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
        patient: { select: { userId: true, user: { select: { fullName: true } } } },
      },
    });

    if (!refundRequest) {
      throw new NotFoundException('Không tìm thấy yêu cầu hoàn tiền');
    }

    if (refundRequest.status === RefundStatus.COMPLETED) {
      throw new BadRequestException('Yêu cầu hoàn tiền này đã được xử lý hoàn tất trước đó');
    }

    const updated = await this.prisma.refundRequest.update({
      where: { id },
      data: {
        status: dto.status,
        rejectReason: dto.status === RefundStatus.REJECTED ? dto.rejectReason : null,
        proofImageUrl: dto.proofImageUrl ? dto.proofImageUrl.trim() : null,
        processedBy: adminUser.userId,
        processedAt: new Date(),
      },
    });

    // Gửi thông báo đến Bệnh nhân khi Lễ tân chuyển tiền xong hoặc từ chối
    if (refundRequest.patient.userId) {
      const amountStr = Number(refundRequest.requestedAmount).toLocaleString('vi-VN');
      const isCompleted = dto.status === RefundStatus.COMPLETED;
      
      const title = isCompleted
        ? '✅ Hoàn tiền thành công!'
        : '❌ Yêu cầu hoàn tiền bị từ chối';
      
      const content = isCompleted
        ? `Lễ tân đã hoàn số tiền ${amountStr} VNĐ cho mã yêu cầu ${refundRequest.refundCode} vào tài khoản ${refundRequest.bankName} - ${refundRequest.accountNumber}. Vui lòng kiểm tra tài khoản.`
        : `Yêu cầu hoàn tiền ${refundRequest.refundCode} bị từ chối. Lý do: ${dto.rejectReason || 'Không đáp ứng điều kiện'}.`;

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
    }

    return updated;
  }
}
