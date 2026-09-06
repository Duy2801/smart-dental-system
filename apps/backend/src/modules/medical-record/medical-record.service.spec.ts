import { BadRequestException } from '@nestjs/common';
import { MedicalRecordService } from './medical-record.service';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

describe('MedicalRecordService - followUpDate validation', () => {
  let service: MedicalRecordService;
  let prismaMock: any;
  let txMock: any;
  let redisMock: any;
  let configMock: any;

  const adminUser: AuthenticatedUser = {
    userId: 'admin-1',
    email: 'admin@nhakhoa.com',
    roles: ['ADMIN'],
    permissions: [],
  };

  beforeEach(() => {
    txMock = {
      medicalRecord: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUnique: jest.fn(),
      },
      medicalRecordAudit: {
        create: jest.fn().mockResolvedValue({}),
      },
    };

    prismaMock = {
      medicalRecord: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(async (cb: (tx: any) => Promise<any>) => cb(txMock)),
      doctor: {
        findUnique: jest.fn(),
      },
    };
    redisMock = {
      del: jest.fn(),
    };
    configMock = {};

    service = new MedicalRecordService(prismaMock, configMock, redisMock);
  });

  it('rejects a new follow-up date in the past', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    prismaMock.medicalRecord.findUnique.mockResolvedValueOnce({
      id: 'rec-1',
      doctorId: 'doc-1',
      images: [],
      dentalChart: { teeth: [] },
      chiefComplaint: null,
      diagnosis: null,
      treatmentNotes: null,
      internalNotes: null,
      followUpDate: null,
      updatedAt: new Date(),
    });

    await expect(
      service.update(
        'rec-1',
        { followUpDate: yesterday.toISOString().slice(0, 10) },
        adminUser,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('allows an existing historical follow-up date to be preserved unchanged', async () => {
    const historicalDate = new Date('2025-01-01T00:00:00.000Z');

    prismaMock.medicalRecord.findUnique.mockResolvedValueOnce({
      id: 'rec-1',
      doctorId: 'doc-1',
      images: [],
      dentalChart: { teeth: [] },
      chiefComplaint: null,
      diagnosis: null,
      treatmentNotes: 'Old note',
      internalNotes: null,
      followUpDate: historicalDate,
      updatedAt: new Date(),
    });

    txMock.medicalRecord.findUnique.mockResolvedValueOnce({
      id: 'rec-1',
      patientId: 'pat-1',
      doctorId: 'doc-1',
      treatmentNotes: 'Updated note',
      internalNotes: null,
      followUpDate: historicalDate,
      images: [],
      dentalChart: { teeth: [] },
      prescriptionRecords: [],
      patient: { fullName: 'Nguyen Van A', patientCode: 'P01' },
      appointment: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.update(
      'rec-1',
      {
        treatmentNotes: 'Updated note',
        followUpDate: historicalDate.toISOString().slice(0, 10),
      },
      adminUser,
    );

    expect(result).toBeDefined();
    expect(txMock.medicalRecord.updateMany).toHaveBeenCalled();
  });

  it('supports filtering by appointmentId and returns appointmentId in summary', async () => {
    prismaMock.medicalRecord.findMany = jest.fn().mockResolvedValueOnce([
      {
        id: 'rec-1',
        patientId: 'pat-1',
        diagnosis: 'Sâu kẽ răng 46',
        chiefComplaint: 'Đau răng',
        followUpDate: null,
        images: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        patient: { fullName: 'Nguyen Van A', patientCode: 'P01' },
        appointment: { id: 'apt-1', scheduledAt: new Date(), service: { name: 'Trám răng' } },
        _count: { prescriptionRecords: 1 },
      },
    ]);

    const list = await service.findByDoctor('doc-1', 'pat-1', 'apt-1');
    expect(prismaMock.medicalRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          doctorId: 'doc-1',
          patientId: 'pat-1',
          appointmentId: 'apt-1',
        },
      }),
    );
    expect(list[0]).toMatchObject({
      id: 'rec-1',
      patientId: 'pat-1',
      appointmentId: 'apt-1',
      serviceName: 'Trám răng',
    });
  });

  it('returns doctorName and treatmentNotes in findByDoctor summary', async () => {
    prismaMock.medicalRecord.findMany = jest.fn().mockResolvedValueOnce([
      {
        id: 'rec-2',
        patientId: 'pat-1',
        doctorId: 'doc-2',
        doctor: { id: 'doc-2', user: { fullName: 'BS. Tran Thi B' } },
        diagnosis: 'Viêm tủy răng 36',
        chiefComplaint: 'Đau buốt răng',
        treatmentNotes: 'Mở tủy làm sạch buồng tủy',
        followUpDate: null,
        images: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        patient: { fullName: 'Nguyen Van A', patientCode: 'P01' },
        appointment: { id: 'apt-2', scheduledAt: new Date(), service: { name: 'Chữa tủy' } },
        _count: { prescriptionRecords: 2 },
      },
    ]);

    const list = await service.findByDoctor('doc-1', 'pat-1', undefined, adminUser, true);
    expect(prismaMock.medicalRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          patientId: 'pat-1',
        },
      }),
    );
    expect(list[0]).toMatchObject({
      id: 'rec-2',
      doctorId: 'doc-2',
      doctorName: 'BS. Tran Thi B',
      treatmentNotes: 'Mở tủy làm sạch buồng tủy',
      diagnosis: 'Viêm tủy răng 36',
      prescriptionCount: 2,
    });
  });
});

