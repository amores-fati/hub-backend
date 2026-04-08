import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const body = exception.getResponse() as Record<string, unknown>;

    // Se já tem errorKind (lançado manualmente no controller), passa direto
    if (body.errorKind) {
      return response.status(status).json(body);
    }

    // Erros de validação (400) do ValidationPipe
    if (status === (HttpStatus.BAD_REQUEST as number)) {
      return response.status(status).json({
        ...body,
        errorKind: 'VALIDATION_ERROR',
      });
    }

    response.status(status).json(body);
  }
}
