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
} from '@nestjs/common';
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
import { LoginCommand } from '../../../core/command/auth.command';
import { InvalidCredentialsException } from '../../../core/exceptions/invalid-credentials.exception';
import { DomainException } from '../../../core/exceptions/domain.exception';
import { AmoresFatiLogger } from '../../../utils/logger';

@ApiTags('Auth')
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
}
