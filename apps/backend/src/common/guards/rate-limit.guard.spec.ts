import { HttpException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitGuard } from './rate-limit.guard';

class TestController {
  login() {}
}

const makeContext = (ip: string) =>
  ({
    getType: () => 'http',
    getClass: () => TestController,
    getHandler: () => TestController.prototype.login,
    switchToHttp: () => ({ getRequest: () => ({ ip }) }),
  }) as never;

const makeRedis = () => {
  const counts = new Map<string, number>();
  return {
    incr: jest.fn(async (key: string) => {
      const next = (counts.get(key) ?? 0) + 1;
      counts.set(key, next);
      return next;
    }),
    expire: jest.fn().mockResolvedValue(undefined),
  };
};

describe('RateLimitGuard', () => {
  it('lets routes without @RateLimit through', async () => {
    const reflector = {
      getAllAndOverride: () => undefined,
    } as unknown as Reflector;
    const guard = new RateLimitGuard(reflector, makeRedis() as never);
    await expect(guard.canActivate(makeContext('1.1.1.1'))).resolves.toBe(true);
  });

  it('blocks an IP after the limit and keeps other IPs independent', async () => {
    const reflector = {
      getAllAndOverride: () => ({ limit: 2, windowSeconds: 60 }),
    } as unknown as Reflector;
    const redis = makeRedis();
    const guard = new RateLimitGuard(reflector, redis as never);

    await expect(guard.canActivate(makeContext('1.1.1.1'))).resolves.toBe(true);
    await expect(guard.canActivate(makeContext('1.1.1.1'))).resolves.toBe(true);
    await expect(
      guard.canActivate(makeContext('1.1.1.1')),
    ).rejects.toBeInstanceOf(HttpException);
    await expect(guard.canActivate(makeContext('2.2.2.2'))).resolves.toBe(true);
    // Đặt hạn cho key ngay lần đếm đầu tiên của mỗi IP
    expect(redis.expire).toHaveBeenCalledTimes(2);
  });

  it('fails open when Redis is unavailable', async () => {
    const reflector = {
      getAllAndOverride: () => ({ limit: 1, windowSeconds: 60 }),
    } as unknown as Reflector;
    const redis = {
      incr: jest.fn().mockRejectedValue(new Error('down')),
      expire: jest.fn(),
    };
    const guard = new RateLimitGuard(reflector, redis as never);
    await expect(guard.canActivate(makeContext('1.1.1.1'))).resolves.toBe(true);
  });
});
