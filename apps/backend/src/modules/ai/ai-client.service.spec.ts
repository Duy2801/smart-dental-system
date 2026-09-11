import { ConfigService } from '@nestjs/config';
import { AiClientService } from './ai-client.service';

describe('AiClientService', () => {
  afterEach(() => jest.restoreAllMocks());

  it('allows the AI service enough time to try a fallback provider', async () => {
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'AI_SERVICE_URL') return 'http://localhost:8001';
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
});
