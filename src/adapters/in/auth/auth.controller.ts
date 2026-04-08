import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  HttpException,
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
import { LoginDto } from './login.dto';
import { InvalidCredentialsException } from '../../../core/exceptions/invalid-credentials.exception';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autentica um usuário e retorna um JWT' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        role: 'student',
      },
    },
  })
  @ApiBadRequestResponse({
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
    schema: {
      example: {
        statusCode: 401,
        message: 'Credenciais inválidas',
        errorKind: 'INVALID_CREDENTIALS',
      },
    },
  })
  async login(@Body() dto: LoginDto) {
    try {
      return await this.authService.login(dto.email, dto.password);
    } catch (error) {
      if (error instanceof InvalidCredentialsException) {
        throw new HttpException(
          {
            statusCode: 401,
            message: 'Credenciais inválidas',
            errorKind: 'INVALID_CREDENTIALS',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }
      throw new HttpException(
        {
          statusCode: 500,
          message: 'Erro interno do servidor',
          errorKind: 'INTERNAL_ERROR',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
