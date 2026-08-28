import { AiService } from './ai.service';

describe('AiService.analyzeXray', () => {
  it('resolves the trusted image URL from the medical record and writes an audit', async () => {
    const auditCreate = jest.fn().mockResolvedValue({});
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
    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          imageId: '11111111-1111-4111-8111-111111111111',
          modelVersion: 'pano-v3',
          status: 'HEALTHY',
        }),
      }),
    );
    expect(response).toEqual(
      expect.objectContaining({ modelVersion: 'pano-v3', status: 'HEALTHY' }),
    );
  });
});
