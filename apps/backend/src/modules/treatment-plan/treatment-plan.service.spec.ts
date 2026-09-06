import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TreatmentPlanService } from './treatment-plan.service';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

describe('TreatmentPlanService', () => {
  let service: TreatmentPlanService;
  let prismaMock: any;
  let eventsGatewayMock: any;
  let mailQueueMock: any;

  const doctorUser: AuthenticatedUser = {
    userId: 'user-doc-1',
    email: 'doctor@nhakhoa.com',
    roles: ['DOCTOR'],
    permissions: [],
  };

  beforeEach(() => {
    prismaMock = {
      treatmentPlan: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      treatmentPlanStep: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
      doctor: {
        findUnique: jest.fn().mockResolvedValue({ id: 'doc-1' }),
      },
      patient: {
        findUnique: jest.fn().mockResolvedValue({ id: 'pat-1' }),
      },
      invoice: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'inv-1' }),
        count: jest.fn().mockResolvedValue(0),
      },
      notification: {
        create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
      },
      $transaction: jest.fn((cb) => cb(prismaMock)),
    };

    eventsGatewayMock = {
      emitToUser: jest.fn(),
    };

    mailQueueMock = {
      add: jest.fn().mockResolvedValue({}),
    };

    service = new TreatmentPlanService(
      prismaMock,
      eventsGatewayMock,
      mailQueueMock,
    );
  });

  describe('sendTreatmentPlanEmail', () => {
    it('throws NotFoundException when treatment plan does not exist', async () => {
      prismaMock.treatmentPlan.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.sendTreatmentPlanEmail('non-existent', doctorUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when patient email is missing or @clinic.local', async () => {
      prismaMock.treatmentPlan.findUnique.mockResolvedValueOnce({
        id: 'tp-1',
        doctorId: 'doc-1',
        patient: {
          email: 'test@clinic.local',
          user: { email: 'test@clinic.local' },
        },
        doctor: { user: { fullName: 'Nguyễn Văn B' } },
        steps: [],
      });

      await expect(
        service.sendTreatmentPlanEmail('tp-1', doctorUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('enqueues mail with properly prefixed doctor name and calculated costs', async () => {
      prismaMock.treatmentPlan.findUnique.mockResolvedValueOnce({
        id: 'tp-1',
        doctorId: 'doc-1',
        title: 'Cấy ghép Implant răng 46',
        description: 'Phác đồ phục hình răng hàm',
        status: 'IN_PROGRESS',
        startDate: new Date('2026-09-01'),
        expectedEndDate: new Date('2026-12-01'),
        patient: {
          fullName: 'Trần Thị Khách',
          patientCode: 'BN-202',
          email: 'tranthikhach@gmail.com',
          user: { id: 'usr-pat-1', email: 'tranthikhach@gmail.com', fullName: 'Trần Thị Khách' },
        },
        doctor: { user: { fullName: 'Trần Hữu Nam' } },
        steps: [
          {
            stepOrder: 1,
            title: 'Khám và chụp phim CT Cone Beam',
            estimatedCost: 500000,
            status: 'COMPLETED',
          },
          {
            stepOrder: 2,
            title: 'Cấy trụ Implant Straumann',
            estimatedCost: 15000000,
            status: 'IN_PROGRESS',
          },
        ],
      });

      const result = await service.sendTreatmentPlanEmail('tp-1', doctorUser);
      expect(result.success).toBe(true);
      expect(mailQueueMock.add).toHaveBeenCalledWith(
        'send-treatment-plan',
        expect.objectContaining({
          name: 'Trần Thị Khách',
          email: 'tranthikhach@gmail.com',
          doctorName: 'BS. Trần Hữu Nam',
          totalEstimatedCost: 15500000,
          steps: expect.arrayContaining([
            expect.objectContaining({
              stepOrder: 1,
              title: 'Khám và chụp phim CT Cone Beam',
              estimatedCost: 500000,
            }),
            expect.objectContaining({
              stepOrder: 2,
              title: 'Cấy trụ Implant Straumann',
              estimatedCost: 15000000,
            }),
          ]),
        }),
      );
      expect(eventsGatewayMock.emitToUser).toHaveBeenCalledWith(
        'usr-pat-1',
        'notification',
        expect.anything(),
      );
    });
  });

  describe('updateStep & auto sync status', () => {
    it('automatically updates treatment plan status to COMPLETED when all steps are completed', async () => {
      prismaMock.treatmentPlan.findUnique.mockResolvedValueOnce({
        id: 'tp-1',
        doctorId: 'doc-1',
        status: 'IN_PROGRESS',
      });

      prismaMock.treatmentPlanStep.findFirst.mockResolvedValueOnce({
        id: 'step-2',
        treatmentPlanId: 'tp-1',
        status: 'IN_PROGRESS',
        stepOrder: 2,
      });

      prismaMock.treatmentPlanStep.update.mockResolvedValueOnce({
        id: 'step-2',
        stepOrder: 2,
        title: 'Bước 2',
        treatmentPlanId: 'tp-1',
        status: 'COMPLETED',
        estimatedCost: 2000000,
        paymentAmount: null,
        paymentStatus: 'UNBILLED',
        doctor: { userId: 'user-doc-1' },
        treatmentPlan: { patientId: 'pat-1' },
      });

      prismaMock.treatmentPlanStep.findMany.mockResolvedValueOnce([
        { status: 'COMPLETED' },
        { status: 'COMPLETED' },
      ]);

      prismaMock.treatmentPlanStep.findUnique.mockResolvedValueOnce({
        id: 'step-2',
        status: 'COMPLETED',
      });

      await service.updateStep(
        'tp-1',
        'step-2',
        { status: 'COMPLETED' as any },
        doctorUser,
      );

      expect(prismaMock.treatmentPlan.update).toHaveBeenCalledWith({
        where: { id: 'tp-1' },
        data: { status: 'COMPLETED' },
      });
    });

    it('automatically updates treatment plan status to IN_PROGRESS when a step is activated', async () => {
      prismaMock.treatmentPlan.findUnique.mockResolvedValueOnce({
        id: 'tp-2',
        doctorId: 'doc-1',
        status: 'PLANNED',
      });

      prismaMock.treatmentPlanStep.findFirst.mockResolvedValueOnce({
        id: 'step-1',
        treatmentPlanId: 'tp-2',
        status: 'PLANNED',
        stepOrder: 1,
      });

      prismaMock.treatmentPlanStep.update.mockResolvedValueOnce({
        id: 'step-1',
        stepOrder: 1,
        title: 'Bước 1',
        treatmentPlanId: 'tp-2',
        status: 'IN_PROGRESS',
        estimatedCost: 1000000,
        paymentAmount: null,
        paymentStatus: 'UNBILLED',
        doctor: { userId: 'user-doc-1' },
        treatmentPlan: { patientId: 'pat-1' },
      });

      prismaMock.treatmentPlanStep.findMany.mockResolvedValueOnce([
        { status: 'IN_PROGRESS' },
        { status: 'PLANNED' },
      ]);

      prismaMock.treatmentPlanStep.findUnique.mockResolvedValueOnce({
        id: 'step-1',
        status: 'IN_PROGRESS',
      });

      await service.updateStep(
        'tp-2',
        'step-1',
        { status: 'IN_PROGRESS' as any },
        doctorUser,
      );

      expect(prismaMock.treatmentPlan.update).toHaveBeenCalledWith({
        where: { id: 'tp-2' },
        data: { status: 'IN_PROGRESS' },
      });
    });
  });

  describe('create', () => {
    it('throws BadRequestException if startDate is after expectedEndDate', async () => {
      await expect(
        service.create(
          'doc-1',
          {
            patientId: 'pat-1',
            title: 'Kế hoạch sai ngày',
            startDate: '2026-10-01',
            expectedEndDate: '2026-09-01',
            steps: [{ title: 'Bước 1' }],
          },
          doctorUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

