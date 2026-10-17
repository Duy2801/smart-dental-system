import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type WauVerifyResult = {
  success?: boolean;
  hostname?: string;
  /** auto_check khi qua tự động, hoặc loại câu đố dự phòng nếu người dùng đã giải */
  challenge_type?: string;
  behavior?: { verdict?: string; reasons?: string[] };
};

@Injectable()
export class LoginCaptchaService {
  private readonly logger = new Logger(LoginCaptchaService.name);

  constructor(private readonly config: ConfigService) {}

  get enabled(): boolean {
    return Boolean(this.config.get<string>('WAU_SECRET_KEY')?.trim());
  }

  get publicConfig() {
    const frontendUrl = this.config.get<string>('FRONTEND_URL')?.replace(/\/$/, '');
    return {
      enabled: this.enabled,
      mobileUrl: this.enabled && frontendUrl
        ? `${frontendUrl}/captcha/mobile`
        : null,
    };
  }

  async verify(token?: string): Promise<void> {
    const secret = this.config.get<string>('WAU_SECRET_KEY')?.trim();
    if (!secret) return;

    if (!token?.trim()) {
      throw new BadRequestException('auth.captcha_required');
    }

    let result: WauVerifyResult;
    try {
      const response = await fetch('https://api.waucaptcha.com/siteverify', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
        signal: AbortSignal.timeout(7000),
      });
      if (!response.ok) {
        this.logger.warn(`WAU Captcha verification returned HTTP ${response.status}`);
        throw new ServiceUnavailableException('auth.captcha_unavailable');
      }
      result = (await response.json()) as WauVerifyResult;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      this.logger.warn('WAU Captcha verification request failed');
      throw new ServiceUnavailableException('auth.captcha_unavailable');
    }

    // Không ràng buộc hostname: token có thể được giải trên web deploy, localhost hoặc app mobile.
    // App mobile không có tín hiệu chuột/bàn phím nên chỉ chặn khi WAU kết luận rõ là bot.
    if (result.success !== true || result.behavior?.verdict === 'bot') {
      // Ghi lý do (không ghi token) để dễ chẩn đoán CAPTCHA trên web / mobile
      this.logger.warn(
        `WAU Captcha rejected: success=${String(result.success)} verdict=${result.behavior?.verdict ?? 'none'} ` +
          `hostname=${result.hostname || 'none'} reasons=${(result.behavior?.reasons ?? []).join(',') || 'none'}`,
      );
      throw new BadRequestException('auth.captcha_invalid');
    }

    // auto_check cho qua "first_visit" chỉ dựa trên tín hiệu trình duyệt, chưa từng giải câu đố.
    // WAU khuyến nghị từ chối trường hợp này cho đăng nhập và yêu cầu giải câu đố.
    if (
      result.challenge_type === 'auto_check' &&
      result.behavior?.reasons?.includes('first_visit')
    ) {
      throw new BadRequestException('auth.captcha_puzzle_required');
    }
  }
}
