import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const url = this.configService.get<string>('REDIS_URL');
    const options: RedisOptions = {
      username: this.configService.get<string>('REDIS_USERNAME') || undefined,
      password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
      tls:
        this.configService.get<string>('REDIS_TLS') === 'true' ? {} : undefined,
      connectTimeout: 10_000,
      maxRetriesPerRequest: 2,
    };

    this.client = url
      ? new Redis(url, options)
      : new Redis({
          ...options,
          host: this.configService.get<string>('REDIS_HOST', '127.0.0.1'),
          port: this.configService.get<number>('REDIS_PORT', 6379),
        });

    this.client.on('error', (error) => {
      this.logger.error(`Redis connection error: ${error.message}`);
    });

    await this.client.ping();
    this.logger.log('Redis connected');
  }

  async onModuleDestroy() {
    if (this.client?.status !== 'end') {
      await this.client.quit();
    }
  }

  /* ========================
      BASIC HELPERS
     ======================== */

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async getDel(key: string): Promise<string | null> {
    return this.client.getdel(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async delMany(keys: string[]): Promise<void> {
    if (keys.length) await this.client.del(...keys);
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.client.expire(key, ttlSeconds);
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async sadd(key: string, member: string): Promise<void> {
    await this.client.sadd(key, member);
  }

  async srem(key: string, member: string): Promise<void> {
    await this.client.srem(key, member);
  }

  async smembers(key: string): Promise<string[]> {
    return this.client.smembers(key);
  }
}
