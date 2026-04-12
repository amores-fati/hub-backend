// Substitui o antigo: src/adapters/in/controllers/user.controller.ts
// src/adapters/in/controllers/admin.controller.ts
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  ConflictException,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminService } from '../../../core/services/admin.service';
import { CreateAdminDto } from '../dtos/admin/create-admin.dto';
import { DomainException } from '../../../core/exceptions/domain.exception';
import { RequireAuth } from '../../../utils/decorators/api-auth.decorator';

@ApiTags('Admins')
@RequireAuth()
@Controller('admins')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequireAuth() 
  @ApiOperation({
    summary: 'Registra um novo Administrador do sistema',
    description: 'Cria uma conta de acesso com privilégios administrativos.',
  })
  @ApiBody({ type: CreateAdminDto })
  @ApiCreatedResponse({
    description: 'Administrador criado com sucesso.',
  })
  @ApiBadRequestResponse({ description: 'Erro de validação nos dados.' })
  @ApiConflictResponse({ description: 'O e-mail fornecido já está em uso.' })
  async create(@Body() createAdminDto: CreateAdminDto) {
    try {
      const admin = await this.adminService.createAdmin(createAdminDto);
      return {
        id: admin.id,
        email: admin.email,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'UserAlreadyExistsException') {
        throw new ConflictException(error.message);
      }
      if (error instanceof DomainException) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}