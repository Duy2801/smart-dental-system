import { BadRequestException, ConflictException } from '@nestjs/common';
import {
  AppointmentPaymentStatus,
  RefundStatus,
} from '../../../prisma/generated/enums';
import { RefundService } from './refund.service';

const user = { userId: 'staff-1', email: 'staff@test.local', roles: ['RECEPTIONIST'] };

function makeService(prisma: Record<string, unknown>) {
  return new RefundService(prisma as never, { add: jest.fn() } as never);
}

describe('RefundService', () => {
  it('rejects refunding an appointment deposit that was not paid', async () => {
    const service = makeService({
      patient: { findUnique: jest.fn().mockResolvedValue({ id: 'patient-1' }) },
      appointment: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'appointment-1',
          patientId: 'patient-1',
          depositAmount: 300_000,
          paymentStatus: AppointmentPaymentStatus.PENDING_DEPOSIT,
        }),
      },
    });

    await expect(
      service.createRefundRequest(user as never, {
        appointmentId: 'appointment-1',
        bankName: 'VCB',
        accountNumber: '123',
        accountHolder: 'NGUYEN AN',
      }),
    ).rejects.toEqual(new BadRequestException('refund.deposit_not_paid'));
  });

  it('rejects a duplicate active appointment refund request', async () => {
    const service = makeService({
      patient: { findUnique: jest.fn().mockResolvedValue({ id: 'patient-1' }) },
      appointment: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'appointment-1',
          patientId: 'patient-1',
          depositAmount: 300_000,
          paymentStatus: AppointmentPaymentStatus.DEPOSIT_PAID,
        }),
      },
      refundRequest: { findFirst: jest.fn().mockResolvedValue({ id: 'existing' }) },
    });

    await expect(
      service.createRefundRequest(user as never, {
        appointmentId: 'appointment-1',
        bankName: 'VCB',
        accountNumber: '123',
        accountHolder: 'NGUYEN AN',
      }),
    ).rejects.toEqual(new ConflictException('refund.request_already_exists'));
  });

  it('does not process a rejected request again', async () => {
    const service = makeService({
      refundRequest: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'refund-1',
          status: RefundStatus.REJECTED,
          patient: null,
        }),
      },
    });

    await expect(
      service.processRefund('refund-1', user as never, {
        status: RefundStatus.COMPLETED,
      }),
    ).rejects.toEqual(new ConflictException('refund.already_processed'));
  });

  it('records a completed refund in the payment ledger atomically', async () => {
    const request = {
      id: 'refund-1',
      refundCode: 'REF-1',
      status: RefundStatus.PENDING,
      invoiceId: 'invoice-1',
      requestedAmount: 300_000,
      refundPercent: 100,
      patient: null,
      videoConsultation: null,
      appointment: null,
    };
    const tx = {
      refundRequest: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ ...request, status: RefundStatus.COMPLETED }),
      },
      invoice: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({ finalAmount: 300_000 }),
        update: jest.fn().mockResolvedValue({}),
      },
      payment: { create: jest.fn().mockResolvedValue({}) },
    };
    const service = makeService({
      refundRequest: { findUnique: jest.fn().mockResolvedValue(request) },
      $transaction: jest.fn((callback) => callback(tx)),
    });

    await service.processRefund('refund-1', user as never, {
      status: RefundStatus.COMPLETED,
    });

    expect(tx.payment.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        invoiceId: 'invoice-1',
        status: 'REFUNDED',
        transactionRef: 'REFUND-REF-1',
      }),
    }));
    expect(tx.invoice.update).toHaveBeenCalledWith({
      where: { id: 'invoice-1' },
      data: { status: 'REFUNDED' },
    });
  });
});
