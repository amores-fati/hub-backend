import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  ConflictException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { UserService } from '../../../core/services/user.service';
import { CreateUserDto } from './create-user.dto';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registra um novo usuário',
    description:
      'Recebe os dados (DTO), valida a entrada e orquestra o caso de uso de criação de usuário na camada Core (Hexágono).',
  })
  @ApiBody({
    type: CreateUserDto,
    description: 'Payload contendo Nome e E-mail obrigatórios.',
  })
  @ApiCreatedResponse({
    description:
      'O usuário foi criado e persistido no banco de dados com sucesso.',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: '2023-10-01T12:00:00Z',
        updatedAt: '2023-10-01T12:00:00Z',
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      'Erro de validação (ex: e-mail inválido, campos vazios). Retorna detalhes pelo class-validator.',
  })
  @ApiConflictResponse({
    description:
      'Conflito de estado: O e-mail fornecido já está em uso por outro usuário cadastrado.',
  })
  async create(@Body() createUserDto: CreateUserDto) {
    try {
      const user = await this.userService.createUser(
        createUserDto.name,
        createUserDto.email,
      );
      return user;
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === 'UserAlreadyExistsException'
      ) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }
}
