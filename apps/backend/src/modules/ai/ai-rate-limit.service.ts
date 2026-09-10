import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

type Counter = { count: number; resetsAt: number };

@Injectable()
export class AiRateLimitService {
  private readonly counters = new Map<string, Counter>();
  private readonly limit = 5;
  private readonly windowMs = 60_000;

  consume(key: string, now = Date.now()): void {
    if (this.counters.size > 1000) {
      for (const [storedKey, counter] of this.counters) {
        if (counter.resetsAt <= now) this.counters.delete(storedKey);
      }
    }
    const current = this.counters.get(key);
    if (!current || current.resetsAt <= now) {
      this.counters.set(key, { count: 1, resetsAt: now + this.windowMs });
      return;
    }

    if (current.count >= this.limit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          errorStatus: 'RATE_LIMITED',
          message: 'Đã vượt quá giới hạn 5 yêu cầu AI mỗi phút.',
          retryAfterSeconds: Math.ceil((current.resetsAt - now) / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    current.count += 1;
  }
}
