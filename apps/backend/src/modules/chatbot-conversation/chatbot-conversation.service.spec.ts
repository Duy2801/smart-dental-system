import {
  ForbiddenException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ChatbotConversationService } from './chatbot-conversation.service';

describe('patient chat security and sources', () => {
  const user = { userId: 'account-a' };
  const profiles = [
    { id: 'own-patient', fullName: 'Own name', phone: '123', isPrimary: true },
  ];
  let service: ChatbotConversationService;
  let prisma: any;
  let ai: any;
  let patients: any;
  beforeEach(() => {
    prisma = {
      patient: {
        findFirst: jest.fn().mockResolvedValue({ id: 'own-patient' }),
        findMany: jest.fn().mockResolvedValue([{ id: 'own-patient' }]),
      },
      patientAccount: {
        findMany: jest.fn().mockResolvedValue([{ patientId: 'own-patient' }]),
      },
      appointment: { findMany: jest.fn().mockResolvedValue([]) },
      service: { findMany: jest.fn().mockResolvedValue([]) },
      promotion: { findMany: jest.fn().mockResolvedValue([]) },
      doctor: { findMany: jest.fn().mockResolvedValue([]) },
      clinicConfig: { findMany: jest.fn().mockResolvedValue([]) },
      chatbotConversation: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest
          .fn()
          .mockImplementation(({ create }) => Promise.resolve(create)),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    ai = {
      post: jest
        .fn()
        .mockImplementation((_path, body) => Promise.resolve(body)),
    };
    patients = {
      getManagedPatientProfiles: jest.fn().mockResolvedValue(profiles),
    };
    service = new ChatbotConversationService(
      prisma,
      ai,
      { getBookingOptions: jest.fn().mockResolvedValue({}) } as never,
      patients,
    );
  });

  it.each(['handlePatientChat', 'handlePatientAgentChat'])(
    '%s rejects another account patient',
    async (method) => {
      await expect(
        service[method](user, { message: 'hello', patientId: 'foreign' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    },
  );
  it.each([
    { metadata: { bookingState: { patientId: 'foreign' } } },
    {
      history: [
        {
          role: 'assistant',
          content: 'prior',
          metadata: { patient_id: 'foreign' },
        },
      ],
    },
  ])(
    'rejects private patient selection nested in metadata/history',
    async (extra) => {
      await expect(
        service.handlePatientAgentChat(user, { message: 'hi', ...extra }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    },
  );
  it('public callers cannot select private patients', async () => {
    await expect(
      service.handlePatientChat(null, {
        message: 'hi',
        metadata: { patientId: 'own-patient' },
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('public callers cannot inject identity and patient contact information', async () => {
    const result = await service.handlePatientAgentChat(null, {
      message: 'hi',
      patientName: 'victim',
      patientPhone: '456',
      metadata: {
        created_by_user_id: 'victim',
        bookingState: { userId: 'victim' },
      },
    });
    expect(result).toMatchObject({
      created_by_user_id: null,
      patient_id: null,
      patient_name: null,
      patient_phone: null,
      metadata: { bookingState: {} },
    });
    expect(result.metadata).not.toHaveProperty('created_by_user_id');
  });
  it('selected patient identity is derived from managed profile', async () => {
    const result = await service.handlePatientAgentChat(user, {
      message: 'hi',
      patientId: 'own-patient',
      patientName: 'forged',
      patientPhone: 'forged',
    });
    expect(result).toMatchObject({
      created_by_user_id: 'account-a',
      patient_name: 'Own name',
      patient_phone: '123',
    });
  });
  it('an empty catalog remains empty', async () => {
    await expect(service.getInternalServices()).resolves.toEqual([]);
  });
  it('a catalog database failure is unavailable rather than an empty or fabricated catalog', async () => {
    prisma.service.findMany.mockRejectedValue(new Error('database secret'));
    await expect(service.getInternalServices()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
  it('a live zero service price stays zero', async () => {
    prisma.service.findMany.mockResolvedValue([
      {
        id: 'free',
        name: 'Free consultation',
        basePrice: 0,
        treatmentMethods: [],
      },
    ]);
    await expect(service.getInternalServices()).resolves.toMatchObject([
      { price: 0 },
    ]);
  });
  it('an unconfigured service price remains unavailable, not zero', async () => {
    prisma.service.findMany.mockResolvedValue([
      {
        id: 'missing',
        name: 'No configured price',
        basePrice: null,
        treatmentMethods: [],
      },
    ]);
    await expect(service.getInternalServices()).resolves.toMatchObject([
      { price: null },
    ]);
  });
  it('a doctor source failure remains unavailable', async () => {
    prisma.doctor.findMany.mockRejectedValue(new Error('offline'));
    await expect(service.getInternalDoctors()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
  it('clinic exposes only configured public allowlisted values', async () => {
    prisma.clinicConfig.findMany.mockResolvedValue([
      { configKey: 'clinic.name', configValue: 'Dental clinic' },
      {
        configKey: 'clinic.businessHours',
        configValue: '[{"id":1,"start":"08:00","end":"17:00","isOpen":true}]',
      },
      { configKey: 'vnpay.secret', configValue: 'secret' },
      { configKey: 'clinic.privateNote', configValue: 'private' },
    ]);
    await expect((service as any).getInternalClinic()).resolves.toEqual({
      name: 'Dental clinic',
      businessHours: [{ id: 1, start: '08:00', end: '17:00', isOpen: true }],
    });
  });
  it('history save derives account session and own patient', async () => {
    const messages = [{ id: '1', sender: 'user', text: 'hello' }];
    await expect(
      (service as any).putHistory(user, { messages }),
    ).resolves.toEqual({ messages });
    expect(prisma.chatbotConversation.upsert.mock.calls[0][0]).toMatchObject({
      where: { sessionId: 'patient-chat:account-a' },
      create: { patientId: 'own-patient', messages },
    });
  });
  it('history refuses mismatched stored patient ownership', async () => {
    prisma.chatbotConversation.findUnique.mockResolvedValue({
      patientId: 'foreign',
      messages: [{ id: 'x', sender: 'bot', text: 'private' }],
    });
    await expect((service as any).getHistory(user)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
  it('history rejects foreign patients hidden in suggestions', async () => {
    const messages = [
      {
        id: '1',
        sender: 'bot',
        text: 'select',
        suggestions: [
          {
            type: 'quick_reply',
            label: 'Select',
            value: 'Select',
            metadata: { patientId: 'foreign' },
          },
        ],
      },
    ];
    await expect(
      (service as any).putHistory(user, { messages }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('history clear targets only the signed in account and its own patient', async () => {
    await expect((service as any).deleteHistory(user)).resolves.toEqual({
      messages: [],
    });
    expect(prisma.chatbotConversation.deleteMany.mock.calls[0][0]).toEqual({
      where: { sessionId: 'patient-chat:account-a', patientId: 'own-patient' },
    });
  });
  it('clinic excludes hidden nested config fields', async () => {
    prisma.clinicConfig.findMany.mockResolvedValue([
      {
        configKey: 'clinic.lunchBreak',
        configValue:
          '{"isEnabled":true,"start":"12:00","end":"13:00","secret":"private"}',
      },
    ]);
    await expect(service.getInternalClinic()).resolves.toEqual({
      lunchBreak: { isEnabled: true, start: '12:00', end: '13:00' },
    });
  });
  it('a revoked patient grant is denied even if profile cache still contains it', async () => {
    patients.getManagedPatientProfiles.mockResolvedValue([
      ...profiles,
      { id: 'revoked', fullName: 'Private' },
    ]);
    await expect(
      service.handlePatientAgentChat(user, {
        message: 'book',
        patientId: 'revoked',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('appointment selection uses current managed grants and clinic-local today, without private contact', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-15T20:00:00.000Z'));
    try {
      await expect(
        service.getInternalAppointments(user.userId),
      ).resolves.toEqual([]);
      const query = prisma.appointment.findMany.mock.calls[0][0];
      expect(query.where).toEqual({
        patientId: { in: ['own-patient'] },
        scheduledAt: { gte: new Date('2026-09-15T17:00:00.000Z') },
        status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'] },
      });
      expect(query.include.patient.select).toEqual({
        id: true,
        fullName: true,
      });
    } finally {
      jest.useRealTimers();
    }
  });
  it('GET history with no own profile returns empty without creating a profile', async () => {
    prisma.patient.findFirst.mockResolvedValue(null);
    await expect(service.getHistory(user)).resolves.toEqual({ messages: [] });
    expect(patients.getManagedPatientProfiles).not.toHaveBeenCalled();
  });
  it.each(['handlePatientChat', 'handlePatientAgentChat'])(
    '%s does not leak AI failure details to logs or reply',
    async (method) => {
      const log = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => {});
      ai.post.mockRejectedValue(new Error('secret-api-token'));
      try {
        const result = await service[method](null, { message: 'hi' });
        expect(JSON.stringify(result)).not.toContain('secret-api-token');
        expect(JSON.stringify(log.mock.calls)).not.toContain(
          'secret-api-token',
        );
      } finally {
        log.mockRestore();
      }
    },
  );
});
