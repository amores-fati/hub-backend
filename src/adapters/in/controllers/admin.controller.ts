// src/adapters/in/controllers/admin.controller.ts
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { DomainException } from '../../../core/exceptions/domain.exception';
import { AdminService } from '../../../core/services/admin.service';
import { RequireAuth } from '../../../utils/decorators/api-auth.decorator';
import { AmoresFatiLogger } from '../../../utils/logger';
import { CreateAdminDto } from '../dtos/admin/create-admin.dto';
import { StudentService } from '../../../core/services/student.service';
import { DeleteStudentsDto } from '../dtos/student/delete-student.dto';
import { StudentResumeResponseDto } from '../dtos/admin/student-resume-response.dto';

@ApiTags('Admins')
@RequireAuth()
@Controller('admins')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly logger: AmoresFatiLogger,
    private readonly studentService: StudentService,
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
  @ApiCreatedResponse({ description: 'Administrador criado com sucesso.' })
  @ApiBadRequestResponse({ description: 'Erro de validação nos dados.' })
  @ApiConflictResponse({ description: 'O e-mail fornecido já está em uso.' })
  async create(@Body() createAdminDto: CreateAdminDto) {
    try {
      this.logger.info('Creating admin', { email: createAdminDto.email });
      const admin = await this.adminService.createAdmin(createAdminDto);
      this.logger.info('Admin created', { id: admin.id, email: admin.email });
      return { id: admin.id, email: admin.email };
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

  @Delete('students')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deleta (soft delete) uma lista de alunos' })
  @ApiOkResponse({ description: 'IDs que não foram encontrados.' })
  async removeStudents(@Body() dto: DeleteStudentsDto) {
    this.logger.info('Deleting students', { ids: dto.ids });
    return this.studentService.deleteStudents(dto.ids);
  }

  @Get('students/:id/resume')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retorna o currículo de um aluno em modo leitura' })
  @ApiOkResponse({ type: StudentResumeResponseDto })
  @ApiNotFoundResponse({
    description: 'Aluno não encontrado ou sem currículo cadastrado.',
  })
  async getStudentResume(
    @Param('id') id: string,
  ): Promise<StudentResumeResponseDto> {
    return this.adminService.getStudentResume(id);
  }
}