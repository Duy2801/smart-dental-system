import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';

@Injectable()
export class ChatbotServiceKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const configured = this.config.get<string>('AI_SERVICE_API_KEY');
    const expected =
      configured ||
      (this.config.get<string>('NODE_ENV') !== 'production'
        ? 'dev-local-key'
        : undefined);
    const provided = context.switchToHttp().getRequest().headers['x-api-key'];
    if (!expected || typeof provided !== 'string')
      throw new UnauthorizedException();
    const received = Buffer.from(provided);
    const key = Buffer.from(expected);
    if (received.length !== key.length || !timingSafeEqual(received, key))
      throw new UnauthorizedException();
    return true;
  }
}
