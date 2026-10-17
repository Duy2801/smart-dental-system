import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoginCaptchaService } from './login-captcha.service';

describe('LoginCaptchaService', () => {
  const originalFetch = global.fetch;
  const values: Record<string, string | undefined> = {};
  const config = {
    get: jest.fn((name: string) => values[name]),
  } as unknown as ConfigService;
  const captcha = new LoginCaptchaService(config);

  beforeEach(() => {
    values.WAU_SECRET_KEY = 'private-test-key';
    values.WAU_CAPTCHA_ALLOWED_HOSTNAMES = 'patient.example.com,admin.example.com';
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('allows local login when no secret key is configured', async () => {
    delete values.WAU_SECRET_KEY;
    await expect(captcha.verify()).resolves.toBeUndefined();
  });

  it('rejects a missing token before checking credentials', async () => {
    await expect(captcha.verify()).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepts only a human token solved on an allowed hostname', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        hostname: 'patient.example.com',
        behavior: { verdict: 'human' },
      }),
    });
    await expect(captcha.verify('token')).resolves.toBeUndefined();
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.waucaptcha.com/siteverify',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ token: 'token' }),
        headers: expect.objectContaining({ Authorization: 'Bearer private-test-key' }),
      }),
    );
  });

  it.each([
    { success: false, hostname: 'patient.example.com', behavior: { verdict: 'human' } },
    { success: true, hostname: 'other.example.com', behavior: { verdict: 'human' } },
    { success: true, hostname: 'patient.example.com', behavior: { verdict: 'suspicious' } },
  ])('rejects invalid verification results', async (result) => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => result });
    await expect(captcha.verify('token')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepts an auto_check pass earned by a cleared browser', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        hostname: 'patient.example.com',
        challenge_type: 'auto_check',
        behavior: { verdict: 'human', reasons: ['cleared'] },
      }),
    });
    await expect(captcha.verify('token')).resolves.toBeUndefined();
  });

  it('asks for a puzzle when auto_check passed on a first visit only', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        hostname: 'patient.example.com',
        challenge_type: 'auto_check',
        behavior: { verdict: 'human', reasons: ['first_visit'] },
      }),
    });
    await expect(captcha.verify('token')).rejects.toThrow('auth.captcha_puzzle_required');
  });

  it('fails closed when the verification service cannot be reached', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network error'));
    await expect(captcha.verify('token')).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
