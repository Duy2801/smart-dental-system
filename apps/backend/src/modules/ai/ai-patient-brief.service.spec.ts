import { AiService } from './ai.service';

const doctorUser = {
  userId: '55555555-5555-4555-8555-555555555555',
  email: 'doctor@example.com',
  roles: ['DOCTOR'],
  permissions: [],
};

function createSummaryHarness() {
  let latestBrief: Record<string, unknown> | null = null;
  const createBrief = jest.fn(({ data }: { data: Record<string, unknown> }) =>
    Promise.resolve(
      (latestBrief = {
        ...data,
        id: '66666666-6666-4666-8666-666666666666',
        feedback: null,
        feedbackNote: null,
        reviewedAt: null,
        reviewedBy: null,
        createdAt: new Date('2026-09-14T00:00:00.000Z'),
        creator: { fullName: 'Bác sĩ A' },
        reviewer: null,
      }),
    ),
  );
  const prisma = {
    doctor: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ id: '44444444-4444-4444-8444-444444444444' }),
    },
    videoConsultation: { findFirst: jest.fn().mockResolvedValue(null) },
    appointment: {
      findFirst: jest
        .fn()
        .mockImplementation(({ where }) =>
          Promise.resolve(where.doctorId ? { id: 'appointment-link' } : null),
        ),
    },
    treatmentPlan: {
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    },
    medicalRecord: {
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
    },
    patient: {
      findUnique: jest.fn().mockResolvedValue({
        id: '33333333-3333-4333-8333-333333333333',
        fullName: 'Bệnh nhân A',
        medicalHistory: 'Dị ứng penicillin và đang dùng thuốc chống đông.',
        user: null,
      }),
    },
    chatbotConversation: { findMany: jest.fn().mockResolvedValue([]) },
    prescription: { findMany: jest.fn().mockResolvedValue([]) },
    patientAiBrief: {
      create: createBrief,
      findFirst: jest.fn(() => Promise.resolve(latestBrief)),
    },
  };
  const aiClient = {
    post: jest.fn().mockResolvedValue({
      bullet_points: ['Đau răng hàm dưới.'],
      questions_to_ask: [],
      risk_flags: [],
      source_keys_by_bullet: {
        'Đau răng hàm dưới.': ['medical_history', 'chatbot', 'unknown'],
      },
      disclaimer: 'Bác sĩ cần kiểm tra.',
      provider: 'test',
      model: 'test',
    }),
  };
  const limiter = { consume: jest.fn() };
  return {
    prisma,
    aiClient,
    limiter,
    service: new AiService(
      prisma as never,
      aiClient as never,
      limiter as never,
      {} as never,
    ),
  };
}

describe('AiService patient brief safety', () => {
  it('filters cancelled prescriptions, adds mandatory risk flags, citations, and rate limiting', async () => {
    const { service, prisma, limiter } = createSummaryHarness();

    const result = await service.summarizePatient(doctorUser, {
      patientId: '33333333-3333-4333-8333-333333333333',
    });

    expect(prisma.prescription.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          patientId: '33333333-3333-4333-8333-333333333333',
          cancelledAt: null,
        },
      }),
    );
    expect(limiter.consume).toHaveBeenCalledWith(
      'patient-brief:55555555-5555-4555-8555-555555555555',
    );
    expect(result.riskFlags).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/dị ứng/i),
        expect.stringMatching(/chống đông/i),
      ]),
    );
    expect(result.bulletSources).toEqual({
      'Đau răng hàm dưới.': ['medical_history'],
    });
    expect(Object.values(result.riskSources).flat()).toEqual(
      expect.arrayContaining(['medical_history']),
    );
  });

  it('does not turn negated clinical statements into risk flags', async () => {
    const { service, prisma } = createSummaryHarness();
    prisma.patient.findUnique.mockResolvedValue({
      id: '33333333-3333-4333-8333-333333333333',
      fullName: 'Bệnh nhân A',
      medicalHistory:
        'Không ghi nhận dị ứng. Không ghi nhận dùng thuốc chống đông. Chưa ghi nhận mang thai.',
      user: null,
    });
    prisma.chatbotConversation.findMany.mockResolvedValue([
      {
        messages: [
          {
            role: 'patient',
            content: 'Không ghi nhận sưng má, không ghi nhận sốt.',
          },
        ],
      },
    ]);

    const result = await service.summarizePatient(doctorUser, {
      patientId: '33333333-3333-4333-8333-333333333333',
    });

    expect(result.riskFlags).toEqual([]);
    expect(result.riskSources).toEqual({});
  });

  it('keeps a positive risk mention when another mention is negated', async () => {
    const { service, prisma } = createSummaryHarness();
    prisma.patient.findUnique.mockResolvedValue({
      id: '33333333-3333-4333-8333-333333333333',
      fullName: 'Bệnh nhân A',
      medicalHistory:
        'Không dị ứng penicillin; dị ứng latex. Không dùng warfarin. Đang dùng apixaban.',
      user: null,
    });

    const result = await service.summarizePatient(doctorUser, {
      patientId: '33333333-3333-4333-8333-333333333333',
    });

    expect(result.riskFlags).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/dị ứng/i),
        expect.stringMatching(/chống đông/i),
      ]),
    );
  });

  it('keeps positive risks from a later chatbot message', async () => {
    const { service, prisma } = createSummaryHarness();
    prisma.patient.findUnique.mockResolvedValue({
      id: '33333333-3333-4333-8333-333333333333',
      fullName: 'Bệnh nhân A',
      medicalHistory: null,
      user: null,
    });
    prisma.chatbotConversation.findMany.mockResolvedValue([
      {
        messages: [
          { role: 'patient', content: 'Không dị ứng penicillin' },
          { role: 'patient', content: 'Dị ứng latex' },
        ],
      },
    ]);

    const result = await service.summarizePatient(doctorUser, {
      patientId: '33333333-3333-4333-8333-333333333333',
    });

    expect(result.riskFlags).toEqual(
      expect.arrayContaining([expect.stringMatching(/dị ứng/i)]),
    );
  });

  it('detects anticoagulants from active, non-cancelled prescriptions', async () => {
    const { service, prisma } = createSummaryHarness();
    prisma.patient.findUnique.mockResolvedValue({
      id: '33333333-3333-4333-8333-333333333333',
      fullName: 'Bệnh nhân A',
      medicalHistory: null,
      user: null,
    });
    prisma.prescription.findMany.mockResolvedValue([
      {
        items: [
          {
            medicineName: 'Apixaban',
            dosage: '5 mg',
            frequency: null,
            duration: null,
          },
        ],
      },
    ]);

    const result = await service.summarizePatient(doctorUser, {
      patientId: '33333333-3333-4333-8333-333333333333',
    });

    expect(result.riskFlags).toEqual(
      expect.arrayContaining([expect.stringMatching(/chống đông/i)]),
    );
    expect(Object.values(result.riskSources).flat()).toContain('prescriptions');
  });

  it('records who reviewed a brief', async () => {
    const update = jest.fn().mockImplementation(({ data }) =>
      Promise.resolve({
        id: '66666666-6666-4666-8666-666666666666',
        patientId: '33333333-3333-4333-8333-333333333333',
        patientName: 'Bệnh nhân A',
        bulletPoints: [],
        questionsToAsk: [],
        riskFlags: [],
        disclaimer: 'Bác sĩ cần kiểm tra.',
        sourceData: [],
        bulletSources: {},
        riskSources: {},
        provider: 'test',
        model: 'test',
        feedback: data.feedback,
        feedbackNote: null,
        reviewedAt: data.reviewedAt,
        reviewedBy: data.reviewedBy,
        createdAt: new Date('2026-09-14T00:00:00.000Z'),
        creator: { fullName: 'Bác sĩ A' },
        reviewer: { fullName: 'Bác sĩ duyệt' },
      }),
    );
    const prisma = {
      patientAiBrief: {
        findUnique: jest.fn().mockResolvedValue({
          patientId: '33333333-3333-4333-8333-333333333333',
          doctorId: '44444444-4444-4444-8444-444444444444',
        }),
        update,
      },
      doctor: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: '44444444-4444-4444-8444-444444444444' }),
      },
      videoConsultation: { findFirst: jest.fn().mockResolvedValue(null) },
      appointment: { findFirst: jest.fn().mockResolvedValue({ id: 'linked' }) },
    };
    const service = new AiService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
    );

    const result = await service.reviewPatientSummary(
      doctorUser,
      '66666666-6666-4666-8666-666666666666',
      { feedback: 'HELPFUL' as never },
    );

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ reviewedBy: doctorUser.userId }),
      }),
    );
    expect(result.reviewedByName).toBe('Bác sĩ duyệt');
  });

  it('prevents one doctor from reviewing another doctor brief', async () => {
    const update = jest.fn();
    const prisma = {
      patientAiBrief: {
        findUnique: jest.fn().mockResolvedValue({
          patientId: '33333333-3333-4333-8333-333333333333',
          doctorId: '77777777-7777-4777-8777-777777777777',
        }),
        update,
      },
      doctor: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: '44444444-4444-4444-8444-444444444444' }),
      },
    };
    const service = new AiService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.reviewPatientSummary(
        doctorUser,
        '66666666-6666-4666-8666-666666666666',
        { feedback: 'HELPFUL' as never },
      ),
    ).rejects.toThrow('Không có quyền');
    expect(update).not.toHaveBeenCalled();
  });

  it('marks a saved brief stale after its clinical context changes', async () => {
    const { service, prisma } = createSummaryHarness();
    const request = {
      patientId: '33333333-3333-4333-8333-333333333333',
    };
    await service.summarizePatient(doctorUser, request);
    prisma.patient.findUnique.mockResolvedValue({
      id: request.patientId,
      fullName: 'Bệnh nhân A',
      medicalHistory: 'Tiền sử vừa được cập nhật.',
      user: null,
    });

    const result = await service.getLatestPatientSummary(doctorUser, request);

    expect(result?.isStale).toBe(true);
  });

  it('uses the selected appointment service instead of another upcoming appointment', async () => {
    const appointmentId = '22222222-2222-4222-8222-222222222222';
    const prisma = {
      appointment: {
        findUnique: jest.fn().mockResolvedValue({
          id: appointmentId,
          patientId: '33333333-3333-4333-8333-333333333333',
          doctorId: '44444444-4444-4444-8444-444444444444',
          service: { name: 'Điều trị đúng lịch đang xem' },
          patient: {
            id: '33333333-3333-4333-8333-333333333333',
            fullName: 'Bệnh nhân A',
            medicalHistory: null,
            user: null,
          },
        }),
        findFirst: jest.fn().mockResolvedValue({
          scheduledAt: new Date('2026-09-15T02:00:00.000Z'),
          service: { name: 'Dịch vụ ở lịch khác' },
        }),
      },
      doctor: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: '44444444-4444-4444-8444-444444444444' }),
      },
      chatbotConversation: { findMany: jest.fn().mockResolvedValue([]) },
      medicalRecord: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      prescription: { findMany: jest.fn().mockResolvedValue([]) },
      treatmentPlan: { findMany: jest.fn().mockResolvedValue([]) },
      patientAiBrief: {
        create: jest.fn(({ data }) =>
          Promise.resolve({
            ...data,
            id: '66666666-6666-4666-8666-666666666666',
            feedback: null,
            feedbackNote: null,
            reviewedAt: null,
            reviewedBy: null,
            createdAt: new Date('2026-09-14T00:00:00.000Z'),
            creator: { fullName: 'Bác sĩ A' },
            reviewer: null,
          }),
        ),
      },
    };
    const aiClient = {
      post: jest.fn().mockResolvedValue({
        bullet_points: [],
        questions_to_ask: [],
        risk_flags: [],
        disclaimer: 'Bác sĩ cần kiểm tra.',
      }),
    };
    const service = new AiService(
      prisma as never,
      aiClient as never,
      { consume: jest.fn() } as never,
      {} as never,
    );

    await service.summarizePatient(doctorUser, { appointmentId });

    expect(aiClient.post).toHaveBeenCalledWith(
      '/api/v1/doctor/summarize-patient',
      expect.objectContaining({
        upcoming_service: 'Điều trị đúng lịch đang xem',
      }),
    );
    expect(prisma.patientAiBrief.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ appointmentId }),
      }),
    );
  });
});
