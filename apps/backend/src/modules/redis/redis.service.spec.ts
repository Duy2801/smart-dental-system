import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

describe('RedisService cache-aside helpers', () => {
  let service: RedisService;

  beforeEach(() => {
    service = new RedisService({} as ConfigService);
  });

  it('loads once and returns the cached JSON value', async () => {
    const loader = jest.fn().mockResolvedValue({ id: 'service-1' });

    await expect(
      service.rememberJson('catalog:test:1', 60, loader),
    ).resolves.toEqual({ id: 'service-1' });
    await expect(
      service.rememberJson('catalog:test:1', 60, loader),
    ).resolves.toEqual({ id: 'service-1' });

    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('deduplicates concurrent cache misses', async () => {
    let resolveLoad!: (value: { id: string }) => void;
    const loader = jest.fn(
      () =>
        new Promise<{ id: string }>((resolve) => {
          resolveLoad = resolve;
        }),
    );

    const first = service.rememberJson('catalog:test:2', 60, loader);
    const second = service.rememberJson('catalog:test:2', 60, loader);
    await Promise.resolve();
    resolveLoad({ id: 'service-2' });

    await expect(Promise.all([first, second])).resolves.toEqual([
      { id: 'service-2' },
      { id: 'service-2' },
    ]);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('invalidates all memory fallback entries under a prefix', async () => {
    const firstLoader = jest.fn().mockResolvedValue({ version: 1 });
    const secondLoader = jest.fn().mockResolvedValue({ version: 2 });

    await service.rememberJson('catalog:test:list', 60, firstLoader);
    await service.delByPrefix('catalog:test:');
    await expect(
      service.rememberJson('catalog:test:list', 60, secondLoader),
    ).resolves.toEqual({ version: 2 });

    expect(firstLoader).toHaveBeenCalledTimes(1);
    expect(secondLoader).toHaveBeenCalledTimes(1);
  });
});
