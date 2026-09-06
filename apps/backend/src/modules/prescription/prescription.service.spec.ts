import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrescriptionService } from './prescription.service';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

describe('PrescriptionService - sendPrescriptionToPatient', () => {
  let service: PrescriptionService;
  let prismaMock: any;
  let mailQueueMock: any;

  const doctorUser: AuthenticatedUser = {
    userId: 'user-doc-1',
    email: 'doctor@nhakhoa.com',
    roles: ['DOCTOR'],
    permissions: [],
  };

  beforeEach(() => {
    prismaMock = {
      prescription: {
        findUnique: jest.fn(),
      },
      doctor: {
        findUnique: jest.fn().mockResolvedValue({ id: 'doc-1' }),
      },
      notification: {
        create: jest.fn().mockResolvedValue({}),
      },
    };

    mailQueueMock = {
      add: jest.fn().mockResolvedValue({}),
    };

    service = new PrescriptionService(prismaMock, mailQueueMock);
  });

  it('throws NotFoundException when prescription does not exist', async () => {
    prismaMock.prescription.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.sendPrescriptionToPatient('non-existent', doctorUser),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when patient has no email or clinic local email', async () => {
    prismaMock.prescription.findUnique.mockResolvedValueOnce({
      id: 'rx-1',
      doctorId: 'doc-1',
      patient: {
        email: 'patient@clinic.local',
        user: { email: 'patient@clinic.local' },
      },
      doctor: { user: { fullName: 'Trần Văn A' } },
      items: [],
    });

    await expect(
      service.sendPrescriptionToPatient('rx-1', doctorUser),
    ).rejects.toThrow(BadRequestException);
  });

  it('enqueues mail with properly prefixed doctor name and prescription details', async () => {
    prismaMock.prescription.findUnique.mockResolvedValueOnce({
      id: 'rx-1',
      doctorId: 'doc-1',
      patient: {
        fullName: 'Nguyễn Văn Bệnh Nhân',
        patientCode: 'BN-100',
        email: 'benhnhan@gmail.com',
        user: { email: 'benhnhan@gmail.com', fullName: 'Nguyễn Văn Bệnh Nhân' },
      },
      doctor: { user: { fullName: 'Phạm Minh Tuấn' } },
      medicalRecord: { diagnosis: 'Viêm tủy răng' },
      notes: 'Uống thuốc sau ăn no',
      items: [
        {
          medicineName: 'Amoxicillin 500mg',
          dosage: '1 viên',
          frequency: '2 lần/ngày',
          duration: '5 ngày',
          instruction: 'Sau bữa ăn sáng và tối',
        },
      ],
    });

    const result = await service.sendPrescriptionToPatient('rx-1', doctorUser);
    expect(result).toEqual({
      success: true,
      message: 'Đã gửi toa thuốc điện tử thành công đến benhnhan@gmail.com',
    });
    expect(mailQueueMock.add).toHaveBeenCalledWith(
      'send-prescription',
      expect.objectContaining({
        name: 'Nguyễn Văn Bệnh Nhân',
        email: 'benhnhan@gmail.com',
        patientCode: 'BN-100',
        doctorName: 'BS. Phạm Minh Tuấn',
        diagnosis: 'Viêm tủy răng',
        notes: 'Uống thuốc sau ăn no',
        items: [
          {
            medicineName: 'Amoxicillin 500mg',
            dosage: '1 viên',
            frequency: '2 lần/ngày',
            duration: '5 ngày',
            instruction: 'Sau bữa ăn sáng và tối',
          },
        ],
      }),
    );
  });

  it('falls back to generic doctor title when doctor full name is missing', async () => {
    prismaMock.prescription.findUnique.mockResolvedValueOnce({
      id: 'rx-2',
      doctorId: 'doc-1',
      patient: {
        fullName: 'Lê Thị C',
        patientCode: 'BN-101',
        email: 'lethic@gmail.com',
        user: { email: 'lethic@gmail.com' },
      },
      doctor: null,
      medicalRecord: null,
      notes: null,
      items: [],
    });

    const result = await service.sendPrescriptionToPatient('rx-2', doctorUser);
    expect(result).toEqual({
      success: true,
      message: 'Đã gửi toa thuốc điện tử thành công đến lethic@gmail.com',
    });
    expect(mailQueueMock.add).toHaveBeenCalledWith(
      'send-prescription',
      expect.objectContaining({
        doctorName: 'Bác sĩ điều trị',
      }),
    );
  });
});
