import { ConfigService } from '@nestjs/config';
import { AiClientService } from './ai-client.service';

describe('AiClientService', () => {
  afterEach(() => jest.restoreAllMocks());

  it('allows the AI service enough time to try a fallback provider', async () => {
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'AI_SERVICE_URL') return 'http://localhost:8001';
        if (key === 'AI_SERVICE_API_KEY') return 'test-key';
        return undefined;
      }),
    } as unknown as ConfigService;
    const timeoutSpy = jest
      .spyOn(AbortSignal, 'timeout')
      .mockReturnValue(new AbortController().signal);
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await new AiClientService(config).post('/draft', {});

    expect(timeoutSpy).toHaveBeenCalledWith(90_000);
  });

  it('uses AI_SERVICE_TIMEOUT_MS when configured', async () => {
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'AI_SERVICE_URL') return 'http://localhost:8001';
        if (key === 'AI_SERVICE_API_KEY') return 'test-key';
        if (key === 'AI_SERVICE_TIMEOUT_MS') return '120000';
        return undefined;
      }),
    } as unknown as ConfigService;
    const timeoutSpy = jest
      .spyOn(AbortSignal, 'timeout')
      .mockReturnValue(new AbortController().signal);
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await new AiClientService(config).post('/draft', {});

    expect(timeoutSpy).toHaveBeenCalledWith(120_000);
  });

  it.each([
    '/api/v1/doctor/analyze-xray',
    'api/v1/doctor/analyze-xray',
    '/api/v1/vision/analyze-panoramic',
  ])('allows CPU inference to finish for %s', async (path) => {
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'AI_SERVICE_URL') return 'http://localhost:8001';
        if (key === 'AI_SERVICE_API_KEY') return 'test-key';
        if (key === 'AI_SERVICE_TIMEOUT_MS') return '90000';
        return undefined;
      }),
    } as unknown as ConfigService;
    const timeoutSpy = jest
      .spyOn(AbortSignal, 'timeout')
      .mockReturnValue(new AbortController().signal);
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ status: 'INVALID_IMAGE' })),
      );

    await new AiClientService(config).post(path, {});

    expect(timeoutSpy).toHaveBeenCalledWith(240_000);
  });

  it('supports an explicit X-ray timeout override', async () => {
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'AI_SERVICE_URL') return 'http://localhost:8001';
        if (key === 'AI_SERVICE_API_KEY') return 'test-key';
        if (key === 'AI_XRAY_TIMEOUT_MS') return '300000';
        return undefined;
      }),
    } as unknown as ConfigService;
    const timeoutSpy = jest
      .spyOn(AbortSignal, 'timeout')
      .mockReturnValue(new AbortController().signal);
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response('{}'));

    await new AiClientService(config).post('/api/v1/doctor/analyze-xray', {});

    expect(timeoutSpy).toHaveBeenCalledWith(300_000);
  });
});
