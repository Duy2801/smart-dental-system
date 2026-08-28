import { HttpException } from '@nestjs/common';
import { AiRateLimitService } from './ai-rate-limit.service';

describe('AiRateLimitService', () => {
  it('limits each user to five analyses per minute', () => {
    const limiter = new AiRateLimitService();
    for (let index = 0; index < 5; index += 1) limiter.consume('doctor-1', 0);

    expect(() => limiter.consume('doctor-1', 0)).toThrow(HttpException);
    expect(() => limiter.consume('doctor-2', 0)).not.toThrow();
    expect(() => limiter.consume('doctor-1', 60_000)).not.toThrow();
  });
});
