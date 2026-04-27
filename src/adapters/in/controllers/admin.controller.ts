// Substitui o antigo: src/adapters/in/controllers/user.controller.ts
// src/adapters/in/controllers/admin.controller.ts
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { DomainException } from '../../../core/exceptions/domain.exception';
import { AdminService } from '../../../core/services/admin.service';
import { RequireAuth } from '../../../utils/decorators/api-auth.decorator';
import { AmoresFatiLogger } from '../../../utils/logger';
import { CreateAdminDto } from '../dtos/admin/create-admin.dto';

@ApiTags('Admins')
@RequireAuth()
@Controller('admins')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly logger: AmoresFatiLogger,
  ) {
    this.logger.setContext(AdminController.name);
  }

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
      this.logger.info('Creating admin', { email: createAdminDto.email });
      const admin = await this.adminService.createAdmin(createAdminDto);
      this.logger.info('Admin created', { id: admin.id, email: admin.email });
      return {
        id: admin.id,
        email: admin.email,
      };
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === 'UserAlreadyExistsException'
      ) {
        this.logger.warn('Admin creation conflict: email already in use', {
          email: createAdminDto.email,
        });
        throw new ConflictException(error.message);
      }
      if (error instanceof DomainException) {
        this.logger.error('Admin creation domain error');
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
