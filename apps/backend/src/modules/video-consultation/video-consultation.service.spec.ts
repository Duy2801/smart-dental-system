import { BadRequestException } from '@nestjs/common';
import { VideoConsultationService } from './video-consultation.service';
import { VideoConsultationStatus } from '../../../prisma/generated/enums';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

describe('VideoConsultationService', () => {
  let service: VideoConsultationService;
  let prismaMock: any;
  let paymentServiceMock: any;
  let clinicConfigServiceMock: any;
  let eventsGatewayMock: any;
  let redisMock: any;
  let mailQueueMock: any;

  const doctorUser: AuthenticatedUser = {
    userId: 'user-doc-1',
    email: 'doctor@nhakhoa.com',
    roles: ['DOCTOR'],
    permissions: [],
  };

  const sampleConsultation = {
    id: 'consult-1',
    patientId: 'patient-1',
    doctorId: 'doctor-1',
    scheduledAt: new Date(Date.now() + 60 * 60 * 1000),
    durationMinutes: 30,
    status: VideoConsultationStatus.SCHEDULED,
    meetingUrl: 'https://meet.jit.si/sds-room-1#sdsPin=123456',
    fee: 200000,
    isPaid: true,
    notes: 'Bệnh nhân cần tư vấn niềng răng',
    createdAt: new Date('2026-09-01T08:00:00Z'),
    patient: {
      id: 'patient-1',
      patientCode: 'PAT-0001',
      fullName: 'Nguyễn Văn A',
      phone: '0901234567',
      medicalHistory: 'Không dị ứng',
      user: {
        id: 'user-pat-1',
        fullName: 'Nguyễn Văn A',
        phone: '0901234567',
        email: 'patient@gmail.com',
      },
    },
    doctor: {
      id: 'doctor-1',
      specialization: 'Chỉnh nha',
      avatarUrl: null,
      user: { fullName: 'BS. Trần Văn B' },
    },
  };

  beforeEach(() => {
    prismaMock = {
      videoConsultation: {
        findUnique: jest.fn().mockResolvedValue(sampleConsultation),
        findMany: jest.fn().mockResolvedValue([sampleConsultation]),
        update: jest.fn().mockImplementation(({ data }) => ({
          ...sampleConsultation,
          ...data,
        })),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      doctor: {
        findUnique: jest.fn().mockResolvedValue({ id: 'doctor-1' }),
      },
      patient: {
        findUnique: jest.fn().mockResolvedValue({ id: 'patient-1' }),
      },
      invoice: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'inv-1',
            patientId: 'patient-1',
            items: [{ videoConsultationId: 'consult-1' }],
          },
        ]),
        update: jest.fn().mockResolvedValue({ id: 'inv-1' }),
      },
      refundRequest: {
        create: jest.fn().mockResolvedValue({ id: 'ref-1' }),
      },
      notification: {
        create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
      },
      chatbotConversation: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'chat-1',
            status: 'COMPLETED',
            startedAt: new Date('2026-09-05T09:00:00Z'),
            endedAt: new Date('2026-09-05T09:15:00Z'),
            messages: [
              { role: 'user', content: 'Tôi bị đau răng hàm dưới' },
              {
                role: 'assistant',
                content: 'Bạn nên đến khám trực tiếp hoặc đặt tư vấn video',
              },
            ],
          },
        ]),
      },
      $transaction: jest.fn((cb) => cb(prismaMock)),
    };

    paymentServiceMock = {};
    clinicConfigServiceMock = {};
    eventsGatewayMock = { emitToUser: jest.fn() };
    redisMock = {
      del: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      incr: jest.fn().mockResolvedValue(1),
      expire: jest.fn(),
    };
    mailQueueMock = { add: jest.fn().mockResolvedValue({}) };

    service = new VideoConsultationService(
      prismaMock,
      paymentServiceMock,
      clinicConfigServiceMock,
      eventsGatewayMock,
      redisMock,
      mailQueueMock,
    );
  });

  describe('cancel by DOCTOR', () => {
    it('should successfully cancel consultation and create 100% refund request if paid', async () => {
      const res = await service.cancel('consult-1', doctorUser);

      expect(res.consultation.status).toBe(VideoConsultationStatus.CANCELLED);
      expect(res.refundInfo.refundPercent).toBe(100);
      expect(prismaMock.refundRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            videoConsultationId: 'consult-1',
            refundPercent: 100,
            status: 'PENDING',
          }),
        }),
      );
      expect(prismaMock.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-pat-1',
          }),
        }),
      );
      expect(prismaMock.invoice.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if consultation is already cancelled', async () => {
      prismaMock.videoConsultation.findUnique.mockResolvedValueOnce({
        ...sampleConsultation,
        status: VideoConsultationStatus.CANCELLED,
      });

      await expect(service.cancel('consult-1', doctorUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('consultation state transitions', () => {
    it('rejects starting a consultation that is still pending payment', async () => {
      prismaMock.videoConsultation.findUnique.mockResolvedValueOnce({
        ...sampleConsultation,
        status: VideoConsultationStatus.PENDING_PAYMENT,
        isPaid: false,
      });

      await expect(service.start('consult-1', doctorUser)).rejects.toThrow(
        'Chỉ có thể bắt đầu lịch đã thanh toán',
      );
    });

    it('rejects completing a consultation that is not in progress', async () => {
      await expect(service.complete('consult-1', doctorUser)).rejects.toThrow(
        'Chỉ có thể hoàn thành buổi tư vấn đang diễn ra',
      );
    });

    it('starts a paid consultation inside the allowed window with an unguessable link', async () => {
      prismaMock.videoConsultation.findUnique.mockResolvedValueOnce({
        ...sampleConsultation,
        scheduledAt: new Date(Date.now() + 5 * 60 * 1000),
        meetingUrl: null,
      });

      const result = await service.start('consult-1', doctorUser);

      expect(result.status).toBe(VideoConsultationStatus.IN_PROGRESS);
      expect(result.meetingUrl).toMatch(
        /^https:\/\/meet\.jit\.si\/sds-consult-[0-9a-f-]{36}$/,
      );
      expect(result.roomPin).toBeNull();
    });

    it('does not let a patient join before the doctor starts', async () => {
      await expect(
        service.joinPatientRoom(
          { ...doctorUser, roles: ['PATIENT'] },
          'consult-1',
        ),
      ).rejects.toThrow('Phòng tư vấn chưa sẵn sàng');
    });
  });

  describe('notes concurrency', () => {
    it('rejects overwriting notes changed by another tab', async () => {
      prismaMock.videoConsultation.updateMany.mockResolvedValueOnce({
        count: 0,
      });

      await expect(
        service.updateNotes(
          'consult-1',
          doctorUser,
          'Ghi chú mới',
          sampleConsultation.notes,
        ),
      ).rejects.toThrow('Ghi chú đã được cập nhật ở nơi khác');
    });
  });

  describe('sendConsultationReminderToPatient', () => {
    it('should send in-app notification and enqueue email to patient', async () => {
      const res = await service.sendConsultationReminderToPatient(
        'consult-1',
        doctorUser,
      );

      expect(res.success).toBe(true);
      expect(prismaMock.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-pat-1',
            type: 'APPOINTMENT_REMINDER',
          }),
        }),
      );
      expect(mailQueueMock.add).toHaveBeenCalledWith(
        'send-consultation-reminder',
        expect.objectContaining({
          email: 'patient@gmail.com',
          doctorName: 'BS. Trần Văn B',
          roomPin: '123456',
        }),
      );
    });

    it('rate limits repeated reminders', async () => {
      redisMock.incr.mockResolvedValueOnce(2);

      await expect(
        service.sendConsultationReminderToPatient('consult-1', doctorUser),
      ).rejects.toThrow('Vừa gửi lời nhắc');
      expect(prismaMock.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return consultation with clean meetingUrl, roomPin, and mapped chatbotSessions', async () => {
      const res = await service.findOne('consult-1', doctorUser);

      expect(res.id).toBe('consult-1');
      expect(res.meetingUrl).toBe('https://meet.jit.si/sds-room-1');
      expect(res.roomPin).toBe('123456');
      expect(res.chatbotSessions).toHaveLength(1);
      expect(res.chatbotSessions[0].messages).toHaveLength(2);
    });
  });
});
