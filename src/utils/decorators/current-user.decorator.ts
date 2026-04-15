import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRoleEnum } from '../../core/domain/enums/user-role.enum';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRoleEnum;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user: AuthenticatedUser }>();
    return request.user;
  },
);
