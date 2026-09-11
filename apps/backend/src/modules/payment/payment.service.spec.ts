import { BadRequestException } from '@nestjs/common';
import { InvoiceStatus } from '../../../prisma/generated/enums';
import { PaymentService } from './payment.service';

function serviceWith(prisma: Record<string, unknown>) {
  return new PaymentService(
    prisma as never,
    { get: jest.fn() } as never,
    {} as never,
    { broadcast: jest.fn() } as never,
    { add: jest.fn() } as never,
  );
}

const invoice = {
  id: 'invoice-1',
  invoiceCode: 'INV-20260909-0001',
  status: InvoiceStatus.ISSUED,
  subtotal: 1_000_000,
  discountAmount: 0,
  finalAmount: 1_000_000,
  promotionId: null,
  invoiceType: 'SERVICE',
  appointmentId: null,
};

describe('PaymentService.createPayment', () => {
  it('rejects payment for a draft invoice', async () => {
    const service = serviceWith({
      invoice: { findUnique: jest.fn().mockResolvedValue({ ...invoice, status: InvoiceStatus.DRAFT }) },
    });

    await expect(
      service.createPayment('staff-1', {
        invoiceId: invoice.id,
        method: 'CASH',
        amount: 100_000,
      }),
    ).rejects.toEqual(new BadRequestException('invoice.not_payable'));
  });

  it('lets staff issue a legacy draft invoice before creating its QR', async () => {
    const prisma = {
      invoice: {
        findUnique: jest.fn().mockResolvedValue({
          ...invoice,
          status: InvoiceStatus.DRAFT,
        }),
        update: jest.fn().mockResolvedValue({
          ...invoice,
          status: InvoiceStatus.ISSUED,
        }),
      },
      payment: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 0 } }),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 'payment-1',
          amount: invoice.finalAmount,
          status: 'PENDING',
          transactionRef: 'SEVQRINV0001',
        }),
      },
    };

    const result = await serviceWith(prisma).createPayment(
      'receptionist-1',
      {
        invoiceId: invoice.id,
        method: 'BANK_TRANSFER',
        amount: invoice.finalAmount,
      },
      undefined,
      true,
    );

    expect(prisma.invoice.update).toHaveBeenCalledWith({
      where: { id: invoice.id },
      data: { status: InvoiceStatus.ISSUED, issuedAt: expect.any(Date) },
    });
    expect('qrImageUrl' in result && result.qrImageUrl).toContain(
      'https://img.vietqr.io/image/',
    );
  });

  it('rejects an amount greater than the current balance instead of silently clipping it', async () => {
    const service = serviceWith({
      invoice: { findUnique: jest.fn().mockResolvedValue(invoice) },
      payment: { aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 0 } }) },
    });

    await expect(
      service.createPayment('staff-1', {
        invoiceId: invoice.id,
        method: 'CASH',
        amount: 1_000_001,
      }),
    ).rejects.toEqual(new BadRequestException('payment.amount_exceeds_remaining'));
  });

  it('does not consume a promotion while only preparing a bank transfer', async () => {
    const promotion = {
      id: 'promotion-1',
      minOrderAmount: 0,
      maxUses: 1,
      usedCount: 0,
      discountValue: 10,
      discountType: 'PERCENTAGE',
    };
    const promotionUpdate = jest.fn();
    const promotionUpdateMany = jest.fn();
    const prisma = {
      invoice: {
        findUnique: jest.fn().mockResolvedValue(invoice),
        update: jest.fn().mockResolvedValue({}),
      },
      payment: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 0 } }),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 'payment-1',
          amount: 900_000,
          status: 'PENDING',
          transactionRef: 'SEVQR0001',
        }),
      },
      promotion: {
        findFirst: jest.fn().mockResolvedValue(promotion),
        update: promotionUpdate,
        updateMany: promotionUpdateMany,
      },
    };
    const service = serviceWith(prisma);

    await service.createPayment('staff-1', {
      invoiceId: invoice.id,
      method: 'BANK_TRANSFER',
      amount: 900_000,
      promotionCode: 'SALE10',
    });

    expect(promotionUpdate).not.toHaveBeenCalled();
    expect(promotionUpdateMany).not.toHaveBeenCalled();
  });

  it('records received money even if promotion capacity was consumed after QR creation', async () => {
    const discountedInvoice = {
      ...invoice,
      finalAmount: 900_000,
      discountAmount: 100_000,
      promotionId: 'promotion-1',
    };
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([]),
      invoice: {
        findUnique: jest.fn().mockResolvedValue(discountedInvoice),
        update: jest.fn().mockResolvedValue({}),
      },
      payment: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 0 } }),
        create: jest.fn().mockResolvedValue({ id: 'cash-payment' }),
      },
      promotion: {
        findUnique: jest.fn().mockResolvedValue({ maxUses: 1 }),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    const prisma = {
      invoice: { findUnique: jest.fn().mockResolvedValue(discountedInvoice) },
      payment: { aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 0 } }) },
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
    };
    const service = serviceWith(prisma);

    await expect(
      service.createPayment('staff-1', {
        invoiceId: invoice.id,
        method: 'CASH',
        amount: 900_000,
      }),
    ).resolves.toMatchObject({ status: 'SUCCESS', amount: 900_000 });
  });
});
