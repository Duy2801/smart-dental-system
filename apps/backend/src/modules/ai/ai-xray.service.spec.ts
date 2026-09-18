import { AiService } from './ai.service';

describe('AiService.analyzeXray', () => {
  it('resolves the trusted image URL from the medical record and writes an audit', async () => {
    let capturedAuditInput: unknown;
    const auditCreate = jest.fn((input: unknown) => {
      capturedAuditInput = input;
      return Promise.resolve({});
    });
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([
        {
          id: '22222222-2222-4222-8222-222222222222',
          patient_id: '33333333-3333-4333-8333-333333333333',
          doctor_id: '44444444-4444-4444-8444-444444444444',
          image: {
            id: '11111111-1111-4111-8111-111111111111',
            url: 'https://res.cloudinary.com/clinic/trusted-xray.jpg',
            type: 'xray',
            modality: 'PANORAMIC',
          },
        },
      ]),
      doctor: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: '44444444-4444-4444-8444-444444444444' }),
      },
      aiXrayAnalysisAudit: { create: auditCreate },
    };
    const aiClient = {
      post: jest.fn().mockResolvedValue({
        is_radiograph: true,
        status: 'HEALTHY',
        error_status: null,
        model_version: 'pano-v3',
        findings: [],
        total_findings: 0,
        summary: 'No finding above threshold',
        disclaimer: 'Doctor review required',
      }),
    };
    const limiter = { consume: jest.fn() };
    const service = new AiService(
      prisma as never,
      aiClient as never,
      limiter as never,
      {} as never,
    );

    const response = await service.analyzeXray(
      {
        userId: '55555555-5555-4555-8555-555555555555',
        email: 'doctor@example.com',
        roles: ['DOCTOR'],
        permissions: [],
      },
      { imageId: '11111111-1111-4111-8111-111111111111' },
    );

    expect(aiClient.post).toHaveBeenCalledWith(
      '/api/v1/doctor/analyze-xray',
      expect.objectContaining({
        image_url: 'https://res.cloudinary.com/clinic/trusted-xray.jpg',
        patient_id: '33333333-3333-4333-8333-333333333333',
      }),
    );
    expect(auditCreate).toHaveBeenCalledTimes(1);
    const auditInput = capturedAuditInput as {
      data: {
        imageId: string;
        modelVersion: string;
        status: string;
        imageSnapshot: { url: string; modality: string };
        resultSnapshot: { status: string; findings: unknown[] };
      };
    };
    expect(auditInput.data.imageId).toBe(
      '11111111-1111-4111-8111-111111111111',
    );
    expect(auditInput.data.modelVersion).toBe('pano-v3');
    expect(auditInput.data.status).toBe('HEALTHY');
    expect(auditInput.data.imageSnapshot).toMatchObject({
      url: 'https://res.cloudinary.com/clinic/trusted-xray.jpg',
      modality: 'PANORAMIC',
    });
    expect(auditInput.data.resultSnapshot).toMatchObject({
      status: 'HEALTHY',
      findings: [],
    });
    expect(response).toEqual(
      expect.objectContaining({ modelVersion: 'pano-v3', status: 'HEALTHY' }),
    );
  });

  it('persists the exact findings after the doctor finishes reviewing them', async () => {
    const findingId = '77777777-7777-4777-8777-777777777777';
    const auditFindUnique = jest.fn().mockResolvedValue({
      id: '66666666-6666-4666-8666-666666666666',
      userId: '55555555-5555-4555-8555-555555555555',
      status: 'PATHOLOGY_DETECTED',
      resultSnapshot: { findings: [{ findingId }] },
    });
    let capturedReviewInput: unknown;
    const auditUpdate = jest.fn((input: unknown) => {
      capturedReviewInput = input;
      return Promise.resolve({ count: 1 });
    });
    const prisma = {
      aiXrayAnalysisAudit: {
        findUnique: auditFindUnique,
        updateMany: auditUpdate,
      },
    };
    const service = new AiService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
    );
    const findings = [
      {
        findingId,
        fdiToothNumber: 46,
        findingType: 'Caries',
        confidence: 0.91,
        boundingBox: { x: 40, y: 30, width: 12, height: 24 },
        severity: 'UNASSESSED' as const,
        doctorStatus: 'ACCEPTED' as const,
        doctorNote: 'Đã đối chiếu lâm sàng',
      },
    ];

    const response = await service.reviewXrayAnalysis(
      {
        userId: '55555555-5555-4555-8555-555555555555',
        email: 'doctor@example.com',
        roles: ['DOCTOR'],
        permissions: [],
      },
      '66666666-6666-4666-8666-666666666666',
      { findings },
    );

    expect(auditUpdate).toHaveBeenCalledTimes(1);
    const reviewInput = capturedReviewInput as {
      where: { id: string; reviewedAt: null };
      data: {
        reviewedBy: string;
        reviewedFindings: typeof findings;
        reviewedAt: Date;
      };
    };
    expect(reviewInput.where).toEqual({
      id: '66666666-6666-4666-8666-666666666666',
      reviewedAt: null,
    });
    expect(reviewInput.data.reviewedBy).toBe(
      '55555555-5555-4555-8555-555555555555',
    );
    expect(reviewInput.data.reviewedFindings).toEqual(findings);
    expect(reviewInput.data.reviewedAt).toBeInstanceOf(Date);
    expect(typeof response.reviewedAt).toBe('string');
  });

  it('rejects a review that omits an original AI finding', async () => {
    const prisma = {
      aiXrayAnalysisAudit: {
        findUnique: jest.fn().mockResolvedValue({
          id: '66666666-6666-4666-8666-666666666666',
          userId: '55555555-5555-4555-8555-555555555555',
          status: 'PATHOLOGY_DETECTED',
          reviewedAt: null,
          resultSnapshot: {
            findings: [
              { findingId: '77777777-7777-4777-8777-777777777777' },
              { findingId: '88888888-8888-4888-8888-888888888888' },
            ],
          },
        }),
        updateMany: jest.fn(),
      },
    };
    const service = new AiService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.reviewXrayAnalysis(
        {
          userId: '55555555-5555-4555-8555-555555555555',
          email: 'doctor@example.com',
          roles: ['DOCTOR'],
          permissions: [],
        },
        '66666666-6666-4666-8666-666666666666',
        {
          findings: [
            {
              findingId: '77777777-7777-4777-8777-777777777777',
              fdiToothNumber: 46,
              findingType: 'Caries',
              confidence: 0.91,
              boundingBox: { x: 40, y: 30, width: 12, height: 24 },
              severity: 'UNASSESSED',
              source: 'AI',
              doctorStatus: 'ACCEPTED',
            },
          ],
        },
      ),
    ).rejects.toThrow('Phải rà soát đầy đủ từng phát hiện AI đúng một lần');
    expect(prisma.aiXrayAnalysisAudit.updateMany).not.toHaveBeenCalled();
  });

  it('does not allow an administrator without the doctor role to approve', async () => {
    const prisma = {
      aiXrayAnalysisAudit: { findUnique: jest.fn(), updateMany: jest.fn() },
    };
    const service = new AiService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.reviewXrayAnalysis(
        {
          userId: '55555555-5555-4555-8555-555555555555',
          email: 'admin@example.com',
          roles: ['ADMIN'],
          permissions: [],
        },
        '66666666-6666-4666-8666-666666666666',
        { findings: [] },
      ),
    ).rejects.toThrow('Chỉ bác sĩ được xác nhận kết quả X-quang');
    expect(prisma.aiXrayAnalysisAudit.findUnique).not.toHaveBeenCalled();
  });

  it('rejects an X-ray that is not explicitly classified as panoramic', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([
        {
          id: '22222222-2222-4222-8222-222222222222',
          patient_id: '33333333-3333-4333-8333-333333333333',
          doctor_id: '44444444-4444-4444-8444-444444444444',
          image: {
            id: '11111111-1111-4111-8111-111111111111',
            url: 'https://res.cloudinary.com/clinic/periapical.jpg',
            type: 'xray',
            modality: 'PERIAPICAL',
          },
        },
      ]),
    };
    const aiClient = { post: jest.fn() };
    const service = new AiService(
      prisma as never,
      aiClient as never,
      { consume: jest.fn() } as never,
      {} as never,
    );

    await expect(
      service.analyzeXray(
        {
          userId: '55555555-5555-4555-8555-555555555555',
          email: 'doctor@example.com',
          roles: ['DOCTOR'],
          permissions: [],
        },
        { imageId: '11111111-1111-4111-8111-111111111111' },
      ),
    ).rejects.toThrow('AI hiện chỉ hỗ trợ phim X-quang Panorama');
    expect(aiClient.post).not.toHaveBeenCalled();
  });
});
