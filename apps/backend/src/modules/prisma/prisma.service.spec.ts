import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';

describe('PrismaService startup', () => {
  it('constructs the service', () => {
    const service = new PrismaService({
      getOrThrow: () => 'postgresql://user:pass@127.0.0.1:5432/test',
    } as unknown as ConfigService);
    expect(service).toBeDefined();
  });

  it('retries the first database query when the network is briefly unavailable', async () => {
    jest.useFakeTimers();
    const service = new PrismaService({
      getOrThrow: () => 'postgresql://user:pass@127.0.0.1:5432/test',
    } as unknown as ConfigService);
    const connect = jest.spyOn(service, '$connect').mockResolvedValue();
    const query = jest
      .spyOn(service, '$queryRaw')
      .mockRejectedValueOnce(new Error('temporary network failure'))
      .mockResolvedValueOnce([{ ready: 1 }] as never);

    try {
      const startup = service.onModuleInit();
      await jest.advanceTimersByTimeAsync(1_000);
      await expect(startup).resolves.toBeUndefined();
      expect(connect).toHaveBeenCalledTimes(2);
      expect(query).toHaveBeenCalledTimes(2);
    } finally {
      jest.useRealTimers();
    }
  });
});
