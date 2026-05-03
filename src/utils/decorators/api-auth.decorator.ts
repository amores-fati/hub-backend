import { applyDecorators, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from './roles.decorator';
import { UserRoleEnum } from '../../core/domain/enums/user-role.enum';

export function RequireAuth(...roles: UserRoleEnum[]) {
  const decorators = [
    UseGuards(JwtAuthGuard, RolesGuard),
    ApiBearerAuth('access-token'),
    ApiUnauthorizedResponse({
      description: 'Não autorizado. JWT ausente ou inválido.',
    }),
  ];

  if (roles.length > 0) {
    decorators.push(
      Roles(...roles),
      ApiForbiddenResponse({
        description: 'Acesso negado. O usuário não possui o cargo necessário.',
      }),
    );
  }

  return applyDecorators(...decorators);
}
