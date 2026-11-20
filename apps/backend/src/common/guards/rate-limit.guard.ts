import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { RedisService } from '../../modules/redis/redis.service';
import {
  RATE_LIMIT_KEY,
  type RateLimitOptions,
} from '../decorators/rate-limit.decorator';

/**
 * Guard toàn cục: chỉ có tác dụng với route gắn @RateLimit(...).
 * Lỗi Redis thì cho request đi qua (fail-open) để không làm sập đăng nhập.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly redis: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return true;
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!options) return true;

    const request = context.switchToHttp().getRequest<Request>();
    // req.ip đã tính tới X-Forwarded-For nhờ cấu hình 'trust proxy' trong main.ts
    const ip = request.ip || request.socket?.remoteAddress || 'unknown';
    const route = `${context.getClass().name}.${context.getHandler().name}`;
    const key = `ratelimit:${route}:${ip}`;

    let count: number;
    try {
      count = await this.redis.incr(key);
      if (count === 1) {
        await this.redis.expire(key, options.windowSeconds);
      }
    } catch (err) {
      this.logger.warn(
        `Rate limit check skipped for ${route}: ${err instanceof Error ? err.message : String(err)}`,
      );
      return true;
    }

    if (count > options.limit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'common.too_many_requests',
          retryAfterSeconds: options.windowSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}
