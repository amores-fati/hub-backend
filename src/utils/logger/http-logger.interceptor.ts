import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { AmoresFatiLogger } from './amores-fati.logger';

@Injectable()
export class HttpLoggerInterceptor implements NestInterceptor {
  constructor(private readonly logger: AmoresFatiLogger) {
    this.logger.setContext('HTTP');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const start = Date.now();
    const { method, originalUrl, ip } = req;
    const userAgent = req.headers['user-agent'];

    this.logger.info(`INCOMING ${method} ${originalUrl}`, { ip, userAgent });

    return next.handle().pipe(
      tap({
        next: () =>
          this.logResponse(method, originalUrl, res.statusCode, start),
        error: (err: unknown) => {
          const status =
            err instanceof Error &&
            'status' in err &&
            typeof err.status === 'number'
              ? err.status
              : 500;
          this.logResponse(method, originalUrl, status, start, err);
        },
      }),
    );
  }

  private logResponse(
    method: string,
    url: string,
    status: number,
    start: number,
    error?: unknown,
  ): void {
    const ms = Date.now() - start;
    const line = `OUTGOING ${method} ${url} ${status} ${ms}ms`;

    if (status >= 500) {
      this.logger.critical(line, error ? { error } : {});
    } else if (status >= 400) {
      this.logger.warn(line, error ? { error } : {});
    } else {
      this.logger.info(line);
    }
  }
}
