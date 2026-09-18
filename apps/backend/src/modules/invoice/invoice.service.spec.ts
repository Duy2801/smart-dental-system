import { InvoiceService } from './invoice.service';

describe('InvoiceService.findAll', () => {
  it('shows the doctor assigned to a treatment-plan step invoice', async () => {
    const prisma = {
      invoice: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'invoice-step-1',
            invoiceCode: 'INV-STEP-1',
            invoiceType: 'STEP_PAYMENT',
            patientId: 'patient-1',
            patient: { fullName: 'Bệnh nhân', user: null },
            appointment: null,
            treatmentPlanStep: {
              doctor: { user: { fullName: 'BS. Nguyễn Minh Anh' } },
            },
            treatmentPlan: {
              doctor: { user: { fullName: 'BS. Bác sĩ phụ trách' } },
            },
            payments: [],
            items: [{ description: 'Đợt 1', qty: 1, unit_price: 150000 }],
            subtotal: 150000,
            discountAmount: 0,
            finalAmount: 150000,
            status: 'ISSUED',
            issuedAt: new Date('2026-09-13T10:00:00Z'),
          },
        ]),
      },
      videoConsultation: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const result = await new InvoiceService(prisma as never).findAll({
      status: 'UNPAID',
    });

    expect(result[0].doctor_name).toBe('BS. Nguyễn Minh Anh');
  });

  it('shows the treating doctor for a video-consultation invoice', async () => {
    const prisma = {
      invoice: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'invoice-1',
            invoiceCode: 'INV-VC-1',
            invoiceType: 'SERVICE',
            patientId: 'patient-1',
            patient: { fullName: 'Bệnh nhân', user: null },
            appointment: null,
            payments: [],
            items: [{ videoConsultationId: 'consultation-1', title: 'Tư vấn' }],
            subtotal: 50000,
            discountAmount: 0,
            finalAmount: 50000,
            status: 'ISSUED',
            issuedAt: new Date('2026-09-11T10:00:00Z'),
          },
        ]),
      },
      videoConsultation: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'consultation-1',
            doctor: { user: { fullName: 'BS. Huỳnh Mai Chi' } },
          },
        ]),
      },
    };

    const result = await new InvoiceService(prisma as never).findAll({
      status: 'UNPAID',
    });

    expect(result[0].doctor_name).toBe('BS. Huỳnh Mai Chi');
  });
});
