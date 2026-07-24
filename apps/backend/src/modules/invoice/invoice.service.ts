import { Injectable } from '@nestjs/common';
import { InvoiceStatus, InvoiceType } from '../../../prisma/generated/enums';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceQueryDto } from './dto/invoice-query.dto';

@Injectable()
export class InvoiceService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: InvoiceQueryDto) {
    const search = query.search?.trim();
    const status = query.status ?? 'ALL';

    const statusWhere =
      status === 'ALL'
        ? {}
        : status === 'PAID'
          ? { status: InvoiceStatus.PAID }
          : status === 'CANCELLED'
            ? { status: InvoiceStatus.CANCELLED }
            : {
                status: {
                  in: [
                    InvoiceStatus.DRAFT,
                    InvoiceStatus.ISSUED,
                    InvoiceStatus.PARTIALLY_PAID,
                  ],
                },
              };

    const invoices = await this.prisma.invoice.findMany({
      where: {
        ...statusWhere,
        ...(search
          ? {
              OR: [
                { invoiceCode: { contains: search, mode: 'insensitive' } },
                {
                  patient: {
                    user: {
                      fullName: { contains: search, mode: 'insensitive' },
                    },
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        patient: { include: { user: true } },
        appointment: {
          include: {
            doctor: { include: { user: true } },
            service: true,
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ issuedAt: 'desc' }, { invoiceCode: 'desc' }],
    });

    return invoices.map((invoice) => {
      const payment = invoice.payments[0];
      const doctorName =
        invoice.appointment?.doctor?.user?.fullName ?? null;

      return {
        id: invoice.id,
        invoice_code: invoice.invoiceCode,
        invoice_type: invoice.invoiceType,
        patient_name: invoice.patient.user.fullName,
        doctor_name: doctorName,
        issued_at: (invoice.issuedAt ?? new Date()).toISOString(),
        subtotal: Number(invoice.subtotal),
        discount_amount: Number(invoice.discountAmount),
        final_amount: Number(invoice.finalAmount),
        status: this.mapInvoiceStatus(invoice.status),
        payment_method: payment?.paymentMethod,
        payment_option:
          invoice.invoiceType === InvoiceType.DEPOSIT
            ? 'DEPOSIT_30_PERCENT'
            : 'PAY_AT_COUNTER',
        items: this.normalizeItems(invoice.items),
      };
    });
  }

  private mapInvoiceStatus(status: InvoiceStatus) {
    if (status === InvoiceStatus.PAID) {
      return 'PAID';
    }

    if (status === InvoiceStatus.CANCELLED || status === InvoiceStatus.REFUNDED) {
      return 'CANCELLED';
    }

    return 'UNPAID';
  }

  private normalizeItems(items: unknown) {
    if (!Array.isArray(items)) {
      return [];
    }

    return items.map((item) => {
      const data = item as Record<string, unknown>;
      const qty = Number(data.qty ?? data.quantity ?? 1);
      const unitPrice = Number(data.unit_price ?? data.unitPrice ?? 0);

      return {
        service_id: String(data.service_id ?? data.serviceId ?? ''),
        description: String(data.description ?? data.name ?? 'Dich vu'),
        qty,
        unit_price: unitPrice,
        amount: Number(data.amount ?? qty * unitPrice),
      };
    });
  }
}
