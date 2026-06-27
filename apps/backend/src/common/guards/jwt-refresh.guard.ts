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
  cookies?: Record<string, string | undefined>;
  user?: RefreshPayload;
  refreshToken?: string;
};

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<RefreshRequest>();
    const token = request.cookies?.refreshToken;
    if (!token) throw new UnauthorizedException('auth.refresh_required');

    try {
      const payload = this.jwt.verify<RefreshPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });
      if (payload.tokenType !== 'refresh') throw new Error('Wrong token type');
      request.user = payload;
      request.refreshToken = token;
      return true;
    } catch {
      throw new UnauthorizedException('auth.refresh_expired');
    }
  }
}
