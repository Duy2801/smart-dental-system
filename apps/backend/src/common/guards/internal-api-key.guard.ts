import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import type { Request } from 'express';

/** Chỉ cho phép service nội bộ (AI service) gọi, xác thực bằng header x-api-key. */
@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers['x-api-key'];
    const provided = (Array.isArray(header) ? header[0] : header) ?? '';
    const expected =
      this.config.get<string>('AI_SERVICE_API_KEY') || 'dev-local-key';

    const bufProvided = Buffer.from(String(provided));
    const bufExpected = Buffer.from(expected);
    if (
      bufProvided.length !== bufExpected.length ||
      !timingSafeEqual(bufProvided, bufExpected)
    ) {
      throw new UnauthorizedException('internal.unauthorized');
    }
    return true;
  }
}
