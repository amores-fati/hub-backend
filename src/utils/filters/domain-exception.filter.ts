import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainException } from '../../core/exceptions/domain.exception';

/**
 * Filtro global que traduz exceções de domínio que escaparam do mapeamento
 * manual dos controllers em respostas HTTP corretas, evitando vazar 500.
 * Mapeia pelo sufixo do nome da exceção:
 *  *NotFoundException      -> 404
 *  *AlreadyExistsException -> 409
 *  *ForbiddenException     -> 403
 *  InvalidCredentials...   -> 401
 *  demais DomainException  -> 400
 */
@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = this.resolveStatus(exception);

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      error: HttpStatus[status],
    });
  }

  private resolveStatus(exception: DomainException): number {
    const name = exception.name ?? 'DomainException';

    if (name.endsWith('NotFoundException')) return HttpStatus.NOT_FOUND;
    if (name.endsWith('AlreadyExistsException')) return HttpStatus.CONFLICT;
    if (name.endsWith('ForbiddenException')) return HttpStatus.FORBIDDEN;
    if (name === 'InvalidCredentialsException') return HttpStatus.UNAUTHORIZED;

    return HttpStatus.BAD_REQUEST;
  }
}
