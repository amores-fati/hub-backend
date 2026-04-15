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

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
      const command: LoginCommand = {
        email: loginDto.email,
        password: loginDto.password,
      };
      return await this.authService.login(command);
    } catch (error) {
      if (error instanceof InvalidCredentialsException) {
        throw new UnauthorizedException(error.message);
      }
      if (error instanceof DomainException) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
