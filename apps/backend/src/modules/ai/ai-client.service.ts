import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiClientService {
  constructor(private readonly config: ConfigService) {}

  private baseUrl() {
    return (
      this.config.get<string>('AI_SERVICE_URL')?.replace(/\/$/, '') ||
      'http://127.0.0.1:8001'
    );
  }

  private apiKey() {
    const configured = this.config.get<string>('AI_SERVICE_API_KEY');
    if (
      this.config.get<string>('NODE_ENV') === 'production' &&
      (!configured || configured === 'dev-local-key')
    ) {
      throw new ServiceUnavailableException(
        'AI_SERVICE_API_KEY phải được cấu hình riêng trong production.',
      );
    }
    return configured || 'dev-local-key';
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const url = `${this.baseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const key = this.apiKey();
    headers['x-api-key'] = key;

    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60_000),
      });
    } catch {
      throw new ServiceUnavailableException(
        'Không kết nối được AI service. Kiểm tra apps/ai-service đang chạy (cổng 8001).',
      );
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new BadGatewayException(
        text || `AI service lỗi HTTP ${res.status}`,
      );
    }

    return (await res.json()) as T;
  }
}
