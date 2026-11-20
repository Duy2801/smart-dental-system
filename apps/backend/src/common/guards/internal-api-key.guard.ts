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
      this.config.get<string>('AI_SERVICE_API_KEY')?.trim() ?? '';
    // Không có fallback: giá trị mặc định cũ ('dev-local-key') đã lộ công khai trong repo
    // và app mobile, nên chưa cấu hình key thì đóng hẳn các route nội bộ.
    if (!expected || expected === 'dev-local-key') {
      throw new UnauthorizedException('internal.api_key_not_configured');
    }

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
