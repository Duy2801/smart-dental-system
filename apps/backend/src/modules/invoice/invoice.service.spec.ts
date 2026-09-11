import { InvoiceService } from './invoice.service';

describe('InvoiceService.findAll', () => {
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
