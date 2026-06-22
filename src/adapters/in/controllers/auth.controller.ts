// Relocated from: src/adapters/in/auth/auth.controller.ts
// src/adapters/in/controllers/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from '../../../core/services/auth.service';
import { LoginDto } from '../dtos/login/login.dto';
import {
  ChangePasswordCommand,
  ForgotPasswordCommand,
  LoginCommand,
  ResetPasswordCommand,
} from '../../../core/command/auth.command';
import { InvalidCredentialsException } from '../../../core/exceptions/invalid-credentials.exception';
import { DomainException } from '../../../core/exceptions/domain.exception';
import { AmoresFatiLogger } from '../../../utils/logger';
import { RequireAuth } from '../../../utils/decorators/api-auth.decorator';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../../utils/decorators/current-user.decorator';
import { ChangePasswordDto } from '../dtos/auth/change-password.dto';
import { ForgotPasswordDto } from '../dtos/auth/forgot-password.dto';
import { ResetPasswordDto } from '../dtos/auth/reset-password.dto';
import { InvalidPasswordResetTokenException } from '../../../core/exceptions/invalid-password-reset-token.exception';

@ApiTags('Auth')
@UseGuards(ThrottlerGuard)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: AmoresFatiLogger,
  ) {
    this.logger.setContext(AuthController.name);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Autentica um usuário e retorna um JWT',
    description:
      'Recebe credenciais de usuário, orquestra a validação e retorna um token de acesso.',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Login realizado com sucesso',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Erro de validação (ex: e-mail inválido)',
    schema: {
      example: {
        statusCode: 400,
        message: ['email deve ser um e-mail válido'],
        error: 'Bad Request',
        errorKind: 'VALIDATION_ERROR',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Credenciais de acesso incorretas ou inexistentes.',
    schema: {
      example: {
        statusCode: 401,
        message: 'Credenciais inválidas',
        error: 'Unauthorized',
      },
    },
  })
  async login(@Body() loginDto: LoginDto) {
    try {
      this.logger.info('Logging in user', { email: loginDto.email });
      const command: LoginCommand = {
        email: loginDto.email,
        password: loginDto.password,
      };
      const result = await this.authService.login(command);
      this.logger.info('User login succeeded', { email: loginDto.email });
      return result;
    } catch (error) {
      if (error instanceof InvalidCredentialsException) {
        this.logger.warn('Login failed: invalid credentials', {
          email: loginDto.email,
        });
        throw new UnauthorizedException(error.message);
      }
      if (error instanceof DomainException) {
        this.logger.error('Login domain error');
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Solicita recuperacao de senha',
    description:
      'Recebe um email e, se existir usuario cadastrado, envia um link temporario de redefinicao.',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiOkResponse({
    description: 'Solicitacao recebida',
    schema: {
      example: {
        message:
          'Se o e-mail estiver cadastrado, enviaremos as instrucoes para recuperacao de senha.',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Erro de validacao.',
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    this.logger.info('Password reset requested');

    const command: ForgotPasswordCommand = {
      email: forgotPasswordDto.email,
    };

    // Resposta constante: nunca revela se o e-mail existe nem vaza falha de
    // infra/mail. Erros internos são logados, mas a resposta é sempre 200.
    try {
      await this.authService.forgotPassword(command);
    } catch {
      this.logger.error(
        'forgotPassword: falha interna suprimida para manter resposta constante',
      );
    }

    return {
      message:
        'Se o e-mail estiver cadastrado, enviaremos as instrucoes para recuperacao de senha.',
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Redefine senha com token de recuperacao',
    description:
      'Recebe o token enviado por email e uma nova senha, valida o token e atualiza a senha.',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiOkResponse({
    description: 'Senha redefinida com sucesso',
    schema: {
      example: {
        message: 'Senha redefinida com sucesso.',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Token invalido/expirado ou erro de validacao.',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    try {
      const command: ResetPasswordCommand = {
        token: resetPasswordDto.token,
        newPassword: resetPasswordDto.newPassword,
      };

      await this.authService.resetPassword(command);

      return { message: 'Senha redefinida com sucesso.' };
    } catch (error) {
      if (error instanceof InvalidPasswordResetTokenException) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof DomainException) {
        this.logger.error('Password reset domain error');
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @RequireAuth()
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Altera a senha do usuario autenticado',
    description:
      'Recebe a senha atual e a nova senha, valida as credenciais atuais e atualiza a senha do usuario autenticado.',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiOkResponse({
    description: 'Senha alterada com sucesso',
    schema: {
      example: {
        message: 'Senha alterada com sucesso.',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Erro de validacao.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente/invalido ou senha atual incorreta.',
  })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    try {
      this.logger.info('Changing authenticated user password', {
        userId: user.id,
      });

      const command: ChangePasswordCommand = {
        userId: user.id,
        currentPassword: changePasswordDto.currentPassword,
        newPassword: changePasswordDto.newPassword,
      };

      await this.authService.changePassword(command);

      this.logger.info('Authenticated user password changed', {
        userId: user.id,
      });

      return { message: 'Senha alterada com sucesso.' };
    } catch (error) {
      if (error instanceof InvalidCredentialsException) {
        this.logger.warn('Password change failed: invalid credentials', {
          userId: user.id,
        });
        throw new UnauthorizedException(error.message);
      }
      if (error instanceof DomainException) {
        this.logger.error('Password change domain error');
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
