import { InjectQueue } from '@nestjs/bull';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Queue } from 'bull';
import { Prisma } from 'prisma/generated/client';
import {
  AppointmentPaymentStatus,
  DiscountType,
  InvoiceStatus,
  InvoiceType,
  PaymentMethod,
  PaymentStatus,
  VideoConsultationStatus,
} from 'prisma/generated/enums';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { EventsGateway } from '../socket/events.gateway';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { SepayWebhookDto } from './dto/sepay-webhook.dto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly notificationService: NotificationService,
    private readonly eventsGateway: EventsGateway,
    @InjectQueue('mail-queue') private readonly mailQueue: Queue,
  ) {}

  async ensureInvoiceAccess(user: AuthenticatedUser, invoiceId: string) {
    const isStaff =
      user.roles.includes('ADMIN') ||
      user.roles.includes('RECEPTIONIST');
    if (isStaff) return;

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        patient: true,
        appointment: true,
      },
    });
    if (!invoice) throw new NotFoundException('invoice.not_found');

    const patientUserId = invoice.patient?.userId;
    const appointmentCreatedBy = invoice.appointment?.createdBy;
    const isOwner =
      (patientUserId && patientUserId === user.userId) ||
      (appointmentCreatedBy && appointmentCreatedBy === user.userId);

    if (!isOwner) {
      throw new ForbiddenException('invoice.access_denied');
    }
  }

  async createPayment(
    userId: string,
    dto: CreatePaymentDto,
    db: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    const invoice = await db.invoice.findUnique({
      where: { id: dto.invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException('invoice.not_found');
    }

    if (
      invoice.status === InvoiceStatus.PAID ||
      invoice.status === InvoiceStatus.CANCELLED ||
      invoice.status === InvoiceStatus.REFUNDED
    ) {
      throw new BadRequestException('invoice.not_payable');
    }

    let discountAmount = Number(invoice.discountAmount);
    let promotionId = invoice.promotionId;
    let finalAmount = Number(invoice.finalAmount);

    if (dto.promotionCode?.trim()) {
      const promo = await this.applyPromotion(
        dto.promotionCode.trim(),
        Number(invoice.subtotal),
      );
      discountAmount = promo.discountAmount;
      promotionId = promo.promotionId;
      finalAmount = Math.max(
        0,
        Number((Number(invoice.subtotal) - discountAmount).toFixed(2)),
      );

      await db.invoice.update({
        where: { id: invoice.id },
        data: {
          discountAmount,
          finalAmount,
          promotionId,
        },
      });
    }

    const paidSoFar = await this.sumSuccessfulPayments(invoice.id, db);
    const remaining = Number((finalAmount - paidSoFar).toFixed(2));
    if (remaining <= 0) {
      throw new BadRequestException('invoice.already_paid');
    }

    const requested =
      dto.amount != null ? Number(dto.amount) : remaining;
    if (requested <= 0) {
      throw new BadRequestException('payment.invalid_amount');
    }
    const amount = Number(Math.min(requested, remaining).toFixed(2));

    if (dto.method === 'CASH') {
      return this.markPaid({
        invoiceId: invoice.id,
        amount,
        method: PaymentMethod.CASH,
        receivedBy: userId,
        transactionRef: `CASH-${Date.now()}`,
        invoiceType: invoice.invoiceType,
        appointmentId: invoice.appointmentId,
      });
    }

    // BANK_TRANSFER — tạo / tái sử dụng payment PENDING + QR VietQR (SePay)
    const existing = await db.payment.findFirst({
      where: {
        invoiceId: invoice.id,
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        status: PaymentStatus.PENDING,
      },
      orderBy: { createdAt: 'desc' },
    });

    const transferCode = this.buildTransferCode(invoice.invoiceCode);

    let payment = existing;
    if (existing) {
      if (
        !existing.transactionRef?.toUpperCase().includes('SEVQR') ||
        Number(existing.amount) !== amount
      ) {
        payment = await db.payment.update({
          where: { id: existing.id },
          data: {
            transactionRef: transferCode,
            amount,
            receivedBy: userId,
          },
        });
      }
    } else {
      payment = await db.payment.create({
        data: {
          invoiceId: invoice.id,
          amount,
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          transactionRef: transferCode,
          status: PaymentStatus.PENDING,
          receivedBy: userId,
        },
      });
    }

    if (!payment) {
      throw new BadRequestException('payment.create_failed');
    }

    const bank = this.getBankConfig();
    const content = payment.transactionRef ?? transferCode;
    const qrImageUrl = this.buildVietQrUrl({
      amount: Number(payment.amount),
      addInfo: content,
      accountNo: bank.accountNo,
      accountName: bank.accountName,
      bankBin: bank.bankBin,
      template: bank.template,
    });

    return {
      id: payment.id,
      invoiceId: invoice.id,
      invoiceCode: invoice.invoiceCode,
      amount: Number(payment.amount),
      remainingAfter: Number((remaining - Number(payment.amount)).toFixed(2)),
      invoiceRemaining: remaining,
      method: PaymentMethod.BANK_TRANSFER,
      status: payment.status,
      transferContent: content,
      bankAccountNo: bank.accountNo,
      bankAccountName: bank.accountName,
      bankBin: bank.bankBin,
      bankName: bank.bankName,
      qrImageUrl,
      provider: 'SEPAY',
    };
  }

  async getPayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        invoice: { select: { id: true, invoiceCode: true, status: true } },
      },
    });
    if (!payment) throw new NotFoundException('payment.not_found');

    return {
      id: payment.id,
      invoiceId: payment.invoiceId,
      invoiceCode: payment.invoice.invoiceCode,
      amount: Number(payment.amount),
      method: payment.paymentMethod,
      status: payment.status,
      transferContent: payment.transactionRef,
      paidAt: payment.paidAt,
    };
  }

  async getPaymentByInvoice(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        invoiceCode: true,
        status: true,
        finalAmount: true,
        appointmentId: true,
      },
    });
    if (!invoice) throw new NotFoundException('invoice.not_found');

    const latestPayment = await this.prisma.payment.findFirst({
      where: { invoiceId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      invoiceId: invoice.id,
      invoiceCode: invoice.invoiceCode,
      invoiceStatus: invoice.status,
      finalAmount: Number(invoice.finalAmount),
      appointmentId: invoice.appointmentId,
      paymentId: latestPayment?.id ?? null,
      status: latestPayment?.status ?? (invoice.status === InvoiceStatus.PAID ? PaymentStatus.SUCCESS : PaymentStatus.PENDING),
      paidAt: latestPayment?.paidAt ?? null,
    };
  }

  /** Lễ tân xác nhận tay khi đã thấy tiền vào (fallback nếu webhook chậm). */
  async confirmByStaff(userId: string, paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { invoice: true },
    });
    if (!payment) throw new NotFoundException('payment.not_found');
    if (payment.status === PaymentStatus.SUCCESS) {
      return this.getPayment(paymentId);
    }
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('payment.cannot_confirm');
    }

    await this.markPaid({
      invoiceId: payment.invoiceId,
      amount: Number(payment.amount),
      method: payment.paymentMethod,
      receivedBy: userId,
      transactionRef: payment.transactionRef ?? `MANUAL-${payment.id.slice(0, 8)}`,
      invoiceType: payment.invoice.invoiceType,
      appointmentId: payment.invoice.appointmentId,
      existingPaymentId: payment.id,
    });

    return this.getPayment(paymentId);
  }

  async handleSepayWebhook(dto: SepayWebhookDto) {
    if (dto.transferType && dto.transferType !== 'in') {
      return { success: true, ignored: true, reason: 'not_in' };
    }

    const amount = Number(dto.transferAmount ?? 0);
    const haystack = `${dto.content ?? ''} ${dto.code ?? ''}`.toUpperCase();
    const matchCode = haystack.match(/SEVQR[A-Z0-9]+/i)?.[0]?.toUpperCase();

    const pending = await this.prisma.payment.findMany({
      where: {
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        status: PaymentStatus.PENDING,
      },
      include: { invoice: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const matched = pending.find((p) => {
      const ref = (p.transactionRef ?? '').toUpperCase();
      if (!ref) return false;
      const amountOk = Math.abs(Number(p.amount) - amount) < 0.01;
      const codeOk = matchCode ? ref === matchCode : haystack.includes(ref);
      return codeOk && amountOk;
    });

    if (!matched) {
      return { success: true, matched: false };
    }

    const sepayRef =
      dto.referenceCode ||
      (dto.id != null ? `SEPAY-${dto.id}` : matched.transactionRef);

    // Dedup nếu đã có payment SUCCESS với cùng reference
    if (sepayRef) {
      const dup = await this.prisma.payment.findFirst({
        where: {
          transactionRef: sepayRef,
          status: PaymentStatus.SUCCESS,
        },
      });
      if (dup) {
        return { success: true, matched: true, duplicate: true };
      }
    }

    await this.markPaid({
      invoiceId: matched.invoiceId,
      amount: Number(matched.amount),
      method: PaymentMethod.BANK_TRANSFER,
      receivedBy: matched.receivedBy,
      transactionRef: matched.transactionRef ?? String(sepayRef),
      invoiceType: matched.invoice.invoiceType,
      appointmentId: matched.invoice.appointmentId,
      existingPaymentId: matched.id,
      externalRef: sepayRef ? String(sepayRef) : undefined,
    });

    return {
      success: true,
      matched: true,
      paymentId: matched.id,
      invoiceId: matched.invoiceId,
    };
  }


  private async markPaid(input: {
    invoiceId: string;
    amount: number;
    method: PaymentMethod;
    receivedBy: string;
    transactionRef: string;
    invoiceType: InvoiceType;
    appointmentId: string | null;
    existingPaymentId?: string;
    externalRef?: string;
  }) {
    const result = await this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: input.invoiceId },
      });
      if (!invoice) {
        throw new NotFoundException('invoice.not_found');
      }

      const prior = await tx.payment.aggregate({
        where: {
          invoiceId: input.invoiceId,
          status: PaymentStatus.SUCCESS,
          ...(input.existingPaymentId
            ? { id: { not: input.existingPaymentId } }
            : {}),
        },
        _sum: { amount: true },
      });
      const paidBefore = Number(prior._sum.amount ?? 0);
      const finalAmount = Number(invoice.finalAmount);
      const payAmount = Number(
        Math.min(input.amount, Math.max(0, finalAmount - paidBefore)).toFixed(
          2,
        ),
      );
      if (payAmount <= 0) {
        throw new BadRequestException('invoice.already_paid');
      }

      if (input.existingPaymentId) {
        await tx.payment.update({
          where: { id: input.existingPaymentId },
          data: {
            status: PaymentStatus.SUCCESS,
            paidAt: new Date(),
            receivedBy: input.receivedBy,
            amount: payAmount,
          },
        });
      } else {
        await tx.payment.create({
          data: {
            invoiceId: input.invoiceId,
            amount: payAmount,
            paymentMethod: input.method,
            transactionRef: input.transactionRef,
            status: PaymentStatus.SUCCESS,
            paidAt: new Date(),
            receivedBy: input.receivedBy,
          },
        });
      }

      const paidTotal = Number((paidBefore + payAmount).toFixed(2));
      const fullyPaid = paidTotal >= finalAmount - 0.01;
      const nextStatus = fullyPaid
        ? InvoiceStatus.PAID
        : InvoiceStatus.PARTIALLY_PAID;

      await tx.invoice.update({
        where: { id: input.invoiceId },
        data: {
          status: nextStatus,
          issuedAt: invoice.issuedAt ?? new Date(),
        },
      });

      if (input.appointmentId && fullyPaid) {
        const paymentStatus =
          input.invoiceType === InvoiceType.DEPOSIT
            ? AppointmentPaymentStatus.DEPOSIT_PAID
            : AppointmentPaymentStatus.COUNTER_PAID;

        await tx.appointment.update({
          where: { id: input.appointmentId },
          data: { paymentStatus },
        });
      }

      if (invoice.treatmentPlanStepId) {
        await tx.treatmentPlanStep.update({
          where: { id: invoice.treatmentPlanStepId },
          data: {
            paymentStatus: fullyPaid
              ? 'PAID'
              : 'PARTIALLY_PAID',
            ...(fullyPaid ? { paidAt: new Date() } : {}),
          },
        });
      }

      if (
        fullyPaid &&
        (invoice.invoiceCode.startsWith('INV-VC-') ||
          invoice.invoiceCode.startsWith('SEVQR'))
      ) {
        const items = Array.isArray(invoice.items)
          ? (invoice.items as Array<Record<string, any>>)
          : [];
        const targetVcId = items.find((it) => it?.videoConsultationId)
          ?.videoConsultationId;

        if (targetVcId) {
          await tx.videoConsultation.update({
            where: { id: targetVcId },
            data: {
              isPaid: true,
              status: VideoConsultationStatus.SCHEDULED,
            },
          });
        }
      }

      return {
        paymentId: input.existingPaymentId,
        payAmount,
        paidTotal,
        remaining: Number(Math.max(0, finalAmount - paidTotal).toFixed(2)),
        invoiceStatus: nextStatus,
      };
    });

    const paymentResponse = {
      id: result.paymentId,
      invoiceId: input.invoiceId,
      amount: result.payAmount,
      paidTotal: result.paidTotal,
      remaining: result.remaining,
      method: input.method,
      status: PaymentStatus.SUCCESS,
      invoiceStatus: result.invoiceStatus,
    };

    // Emit real-time WebSocket events to frontend
    try {
      this.eventsGateway.broadcast('payment_updated', paymentResponse);
      this.eventsGateway.broadcast('consultation_updated', { invoiceId: input.invoiceId });
      this.eventsGateway.broadcast('appointment_updated', { invoiceId: input.invoiceId });
    } catch {
      // Ignore socket emission errors
    }

    void this.dispatchPaymentSuccessNotification(
      input.invoiceId,
      result.payAmount,
      input.method,
      result.remaining,
    );

    return paymentResponse;
  }

  private async dispatchPaymentSuccessNotification(
    invoiceId: string,
    amountPaid: number,
    method: PaymentMethod,
    remainingAmount: number,
  ) {
    try {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          patient: { include: { user: true } },
          appointment: { include: { patient: { include: { user: true } } } },
        },
      });
      if (!invoice) return;

      const patient = invoice.patient || invoice.appointment?.patient;
      const email = patient?.email || patient?.user?.email;
      const name = patient?.fullName || patient?.user?.fullName || 'Quý khách';
      const targetUserId = patient?.userId;

      const rawItems = Array.isArray(invoice.items) ? invoice.items : [];
      const items = rawItems.map((it: any) => ({
        name: it.description || it.name || 'Dịch vụ nha khoa',
        qty: Number(it.qty || it.quantity || 1),
        price: Number(it.unitPrice || it.price || 0),
      }));

      if (email) {
        await this.mailQueue.add('send-payment-receipt', {
          email,
          name,
          invoiceCode: invoice.invoiceCode,
          amountPaid,
          totalAmount: Number(invoice.finalAmount),
          remainingAmount,
          paymentMethod: method,
          items,
          paidAt: new Date().toISOString(),
        });
      }

      if (targetUserId) {
        const formattedPaid = new Intl.NumberFormat('vi-VN').format(amountPaid);
        const methodLabel = method === 'BANK_TRANSFER' ? 'Chuyển khoản SePay' : 'Tiền mặt';
        await this.notificationService.createNotification({
          userId: targetUserId,
          type: 'PAYMENT_SUCCESS',
          title: 'Thanh toán thành công',
          content: `Hóa đơn #${invoice.invoiceCode} đã thanh toán thành công ${formattedPaid}đ (${methodLabel}).${remainingAmount > 0 ? ` Số dư nợ còn lại: ${new Intl.NumberFormat('vi-VN').format(remainingAmount)}đ.` : ' Đã hoàn tất 100%.'}`,
        });
      }
    } catch (err) {
      this.logger.warn(`Failed to dispatch payment success notification: ${err}`);
    }
  }

  async sendPaymentReminder(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        patient: { include: { user: true } },
        appointment: { include: { patient: { include: { user: true } } } },
      },
    });
    if (!invoice) {
      throw new NotFoundException('invoice.not_found');
    }

    const paidSoFar = await this.sumSuccessfulPayments(invoice.id);
    const remaining = Number((Number(invoice.finalAmount) - paidSoFar).toFixed(2));
    if (remaining <= 0) {
      throw new BadRequestException('Hóa đơn này đã được thanh toán đủ, không cần gửi nhắc.');
    }

    const patient = invoice.patient || invoice.appointment?.patient;
    const email = patient?.email || patient?.user?.email;
    const name = patient?.fullName || patient?.user?.fullName || 'Quý khách';
    const targetUserId = patient?.userId;

    const bank = this.getBankConfig();
    const transferCode = this.buildTransferCode(invoice.invoiceCode);
    const qrImageUrl = this.buildVietQrUrl({
      amount: remaining,
      addInfo: transferCode,
      accountNo: bank.accountNo,
      accountName: bank.accountName,
      bankBin: bank.bankBin,
      template: bank.template,
    });

    if (email) {
      await this.mailQueue.add('send-payment-reminder', {
        email,
        name,
        invoiceCode: invoice.invoiceCode,
        totalAmount: Number(invoice.finalAmount),
        paidAmount: paidSoFar,
        remainingAmount: remaining,
        qrImageUrl,
        transferContent: transferCode,
        bankAccountNo: bank.accountNo,
        bankAccountName: bank.accountName,
        bankName: bank.bankName,
      });
    }

    if (targetUserId) {
      const formattedRemaining = new Intl.NumberFormat('vi-VN').format(remaining);
      await this.notificationService.createNotification({
        userId: targetUserId,
        type: 'PAYMENT_REMINDER',
        title: 'Nhắc thanh toán hóa đơn',
        content: `Hóa đơn #${invoice.invoiceCode} còn số dư nợ ${formattedRemaining}đ. Quý khách có thể quét mã VietQR để thanh toán từ xa.`,
      });
    }

    return {
      success: true,
      message: `Đã gửi Gmail kèm mã VietQR & Thông báo nhắc thanh toán đến bệnh nhân ${name}`,
    };
  }

  private async sumSuccessfulPayments(
    invoiceId: string,
    db: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    const agg = await db.payment.aggregate({
      where: { invoiceId, status: PaymentStatus.SUCCESS },
      _sum: { amount: true },
    });
    return Number(agg._sum.amount ?? 0);
  }

  private async applyPromotion(code: string, subtotal: number) {
    const now = new Date();
    const promo = await this.prisma.promotion.findFirst({
      where: {
        code: { equals: code, mode: 'insensitive' },
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });
    if (!promo) {
      throw new BadRequestException('promotion.not_found');
    }
    if (Number(promo.minOrderAmount) > subtotal) {
      throw new BadRequestException('promotion.min_order_not_met');
    }
    if (promo.maxUses != null && promo.usedCount >= promo.maxUses) {
      throw new BadRequestException('promotion.exhausted');
    }

    const value = Number(promo.discountValue);
    const discountAmount =
      promo.discountType === DiscountType.PERCENTAGE
        ? Number(((subtotal * value) / 100).toFixed(2))
        : Math.min(value, subtotal);

    if (promo.maxUses != null) {
      const updated = await this.prisma.promotion.updateMany({
        where: {
          id: promo.id,
          usedCount: { lt: promo.maxUses },
        },
        data: { usedCount: { increment: 1 } },
      });
      if (updated.count === 0) {
        throw new BadRequestException('promotion.exhausted');
      }
    } else {
      await this.prisma.promotion.update({
        where: { id: promo.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    return { promotionId: promo.id, discountAmount };
  }

  private buildTransferCode(invoiceCode: string) {
    // SePay yêu cầu nội dung CK có SEVQR để nhận diện giao dịch
    const compact = invoiceCode.replace(/[^A-Za-z0-9]/g, '').slice(-10);
    return `SEVQR${compact}`.toUpperCase();
  }

  private getBankConfig() {
    return {
      bankBin: this.config.get<string>('SEPAY_BANK_BIN') || 'ICB',
      bankName: this.config.get<string>('SEPAY_BANK_NAME') || 'VietinBank',
      accountNo:
        this.config.get<string>('SEPAY_BANK_ACCOUNT_NO') || '109876820087',
      accountName:
        this.config.get<string>('SEPAY_ACCOUNT_NAME') || 'NGUYEN DUC HAU',
      template: this.config.get<string>('SEPAY_QR_TEMPLATE') || 'compact',
    };
  }

  private buildVietQrUrl(input: {
    bankBin: string;
    accountNo: string;
    accountName: string;
    amount: number;
    addInfo: string;
    template?: string;
  }) {
    const template = input.template || 'compact';
    const params = new URLSearchParams({
      amount: String(Math.round(input.amount)),
      addInfo: input.addInfo,
      accountName: input.accountName,
    });
    return `https://img.vietqr.io/image/${input.bankBin}-${input.accountNo}-${template}.png?${params.toString()}`;
  }
}
