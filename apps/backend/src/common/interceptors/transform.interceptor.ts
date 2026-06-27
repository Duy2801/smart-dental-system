import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  status: boolean;
  statusCode: number;
  data?: T;
  [key: string]: unknown;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<Response<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<{ statusCode: number }>();
    const statusCode = response.statusCode;

    const statusVal = statusCode >= 200 && statusCode < 300;

    return next.handle().pipe(
      map((data): Response<T> => {
        if (data === undefined || data === null) {
          return { status: statusVal, statusCode };
        }

        return {
          status: statusVal,
          statusCode,
          data,
        };
      }),
    );
  }
}
