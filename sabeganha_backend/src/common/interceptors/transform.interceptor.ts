import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

export interface Response<T> {
  status: string;
  data: T;
  meta: {
    timestamp: string;
    correlationId: string;
  };
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const correlationId = uuidv4();
    return next.handle().pipe(
      map((data) => ({
        status: 'success',
        data,
        meta: {
          timestamp: new Date().toISOString(),
          correlationId,
        },
      })),
    );
  }
}

