import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

interface MemoryStoreEntry {
  value: any;
  expiresAt?: number;
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;
  private readonly memoryStore = new Map<string, MemoryStoreEntry>();
  private readonly inFlightLoads = new Map<string, Promise<unknown>>();
  private cacheEpoch = 0;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const url = this.configService.get<string>('REDIS_URL');
    const options: RedisOptions = {
      username: this.configService.get<string>('REDIS_USERNAME') || undefined,
      password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
      tls:
        this.configService.get<string>('REDIS_TLS') === 'true' ? {} : undefined,
      connectTimeout: 10_000,
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 1000, 3000);
      },
    };

    try {
      this.client = url
        ? new Redis(url, options)
        : new Redis({
            ...options,
            host: this.configService.get<string>('REDIS_HOST', '127.0.0.1'),
            port: this.configService.get<number>('REDIS_PORT', 6379),
          });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Redis client connected');
      });

      this.client.on('error', (error) => {
        this.isConnected = false;
        this.logger.warn(
          `Redis connection warning: ${error.message}. Operating in resilient fallback mode.`,
        );
      });

      await this.client.ping();
      this.isConnected = true;
      this.logger.log('Redis ping successful');
    } catch (err: any) {
      this.isConnected = false;
      this.logger.warn(
        `Redis startup ping failed: ${err.message}. Features will use memory fallback.`,
      );
    }
  }

  async onModuleDestroy() {
    if (this.client && this.client.status !== 'end') {
      try {
        await this.client.quit();
      } catch {
        // Ignore quit errors during teardown
      }
    }
  }

  private cleanExpired(key: string, entry?: MemoryStoreEntry): boolean {
    if (!entry) return false;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.memoryStore.delete(key);
      return false;
    }
    return true;
  }

  /* ========================
      BASIC HELPERS
     ======================== */

  async get(key: string): Promise<string | null> {
    if (this.isConnected) {
      try {
        const result = await this.client.get(key);
        return result;
      } catch (err: any) {
        this.logger.warn(`Redis get failed for [${key}]: ${err.message}`);
      }
    }

    const entry = this.memoryStore.get(key);
    if (this.cleanExpired(key, entry)) {
      return typeof entry!.value === 'string'
        ? entry!.value
        : JSON.stringify(entry!.value);
    }
    return null;
  }

  async getDel(key: string): Promise<string | null> {
    const val = await this.get(key);
    await this.del(key);
    return val;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.memoryStore.set(key, { value, expiresAt });

    if (this.isConnected) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
      } catch (err: any) {
        this.logger.warn(
          `Redis set failed for [${key}]: ${err.message}. Stored in fallback memory.`,
        );
      }
    }
  }

  async del(key: string): Promise<void> {
    this.cacheEpoch += 1;
    this.memoryStore.delete(key);
    if (this.isConnected) {
      try {
        await this.client.del(key);
      } catch (err: any) {
        this.logger.warn(`Redis del failed for [${key}]: ${err.message}`);
      }
    }
  }

  async delMany(keys: string[]): Promise<void> {
    this.cacheEpoch += 1;
    for (const k of keys) {
      this.memoryStore.delete(k);
    }
    if (this.isConnected && keys.length) {
      try {
        await this.client.del(...keys);
      } catch (err: any) {
        this.logger.warn(`Redis delMany failed: ${err.message}`);
      }
    }
  }

  async delByPrefix(prefix: string): Promise<void> {
    this.cacheEpoch += 1;
    const memoryKeys = [...this.memoryStore.keys()].filter((key) =>
      key.startsWith(prefix),
    );
    memoryKeys.forEach((key) => this.memoryStore.delete(key));

    if (!this.isConnected) return;

    try {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.client.scan(
          cursor,
          'MATCH',
          `${prefix}*`,
          'COUNT',
          100,
        );
        cursor = nextCursor;
        if (keys.length) await this.client.del(...keys);
      } while (cursor !== '0');
    } catch (error: unknown) {
      this.logger.warn(
        `Redis prefix invalidation failed for [${prefix}]: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async rememberJson<T>(
    key: string,
    ttlSeconds: number,
    loader: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.get(key);
    if (cached !== null) {
      try {
        return JSON.parse(cached) as T;
      } catch {
        await this.del(key);
      }
    }

    const existingLoad = this.inFlightLoads.get(key) as Promise<T> | undefined;
    if (existingLoad) return existingLoad;

    const loadEpoch = this.cacheEpoch;
    const load = loader()
      .then(async (value) => {
        if (loadEpoch === this.cacheEpoch) {
          await this.set(key, JSON.stringify(value), ttlSeconds);
        }
        return value;
      })
      .finally(() => this.inFlightLoads.delete(key));

    this.inFlightLoads.set(key, load);
    return load;
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    const entry = this.memoryStore.get(key);
    if (entry) {
      entry.expiresAt = Date.now() + ttlSeconds * 1000;
    }
    if (this.isConnected) {
      try {
        await this.client.expire(key, ttlSeconds);
      } catch (err: any) {
        this.logger.warn(`Redis expire failed for [${key}]: ${err.message}`);
      }
    }
  }

  async incr(key: string): Promise<number> {
    if (this.isConnected) {
      try {
        return await this.client.incr(key);
      } catch (err: any) {
        this.logger.warn(`Redis incr failed for [${key}]: ${err.message}`);
      }
    }

    const entry = this.memoryStore.get(key);
    let nextVal = 1;
    if (this.cleanExpired(key, entry) && typeof entry!.value === 'number') {
      nextVal = entry!.value + 1;
    }
    this.memoryStore.set(key, { value: nextVal, expiresAt: entry?.expiresAt });
    return nextVal;
  }

  async sadd(key: string, member: string): Promise<void> {
    const entry = this.memoryStore.get(key);
    let setObj: Set<string>;
    if (this.cleanExpired(key, entry) && entry!.value instanceof Set) {
      setObj = entry!.value;
    } else {
      setObj = new Set<string>();
      this.memoryStore.set(key, { value: setObj, expiresAt: entry?.expiresAt });
    }
    setObj.add(member);

    if (this.isConnected) {
      try {
        await this.client.sadd(key, member);
      } catch (err: any) {
        this.logger.warn(`Redis sadd failed for [${key}]: ${err.message}`);
      }
    }
  }

  async srem(key: string, member: string): Promise<void> {
    const entry = this.memoryStore.get(key);
    if (this.cleanExpired(key, entry) && entry!.value instanceof Set) {
      entry!.value.delete(member);
    }

    if (this.isConnected) {
      try {
        await this.client.srem(key, member);
      } catch (err: any) {
        this.logger.warn(`Redis srem failed for [${key}]: ${err.message}`);
      }
    }
  }

  async smembers(key: string): Promise<string[]> {
    if (this.isConnected) {
      try {
        return await this.client.smembers(key);
      } catch (err: any) {
        this.logger.warn(`Redis smembers failed for [${key}]: ${err.message}`);
      }
    }

    const entry = this.memoryStore.get(key);
    if (this.cleanExpired(key, entry) && entry!.value instanceof Set) {
      return Array.from(entry!.value);
    }
    return [];
  }
}
