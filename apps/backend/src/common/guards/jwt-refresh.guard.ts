import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

type RefreshPayload = {
  sub: string;
  email: string;
  tokenType: 'refresh';
};

type RefreshRequest = Request & {
  user?: RefreshPayload;
  refreshToken?: string;
};

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private isRefreshPayload(payload: unknown): payload is RefreshPayload {
    if (!payload || typeof payload !== 'object') return false;
    const candidate = payload as Record<string, unknown>;
    return (
      typeof candidate.sub === 'string' &&
      typeof candidate.email === 'string' &&
      candidate.tokenType === 'refresh'
    );
  }

  private getRefreshToken(request: Request): string | undefined {
    // Try httpOnly cookie first
    const cookies = (request as { cookies?: unknown }).cookies;
    if (cookies && typeof cookies === 'object') {
      const token = (cookies as Record<string, unknown>).refreshToken;
      if (typeof token === 'string') return token;
    }

    // Fall back to Authorization: Bearer <token> header (used by frontend)
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    return undefined;
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<RefreshRequest>();
    const token = this.getRefreshToken(request);
    if (!token) throw new UnauthorizedException('auth.refresh_required');

    try {
      const payload = this.jwt.verify(token, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      }) as unknown;
      if (!this.isRefreshPayload(payload)) throw new Error('Wrong token type');
      request.user = payload;
      request.refreshToken = token;
      return true;
    } catch {
      throw new UnauthorizedException('auth.refresh_expired');
    }
  }
}
