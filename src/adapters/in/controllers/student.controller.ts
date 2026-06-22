import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
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

import {
  CreateStudentCommand,
  PatchStudentCommand,
  UpdateStudentCommand,
  UpdateStudentMeCommand,
} from '../../../core/command/student.command';
import { StudentService } from '../../../core/services/student.service';
import { RequireAuth } from '../../../utils/decorators/api-auth.decorator';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../../utils/decorators/current-user.decorator';
import { UserRoleEnum } from '../../../core/domain/enums/user-role.enum';
import { AmoresFatiLogger } from '../../../utils/logger';
import { CreateStudentDto } from '../dtos/student/create-student.dto';
import { DeleteStudentsDto } from '../dtos/student/delete-student.dto';
import { GetAdminStudentsDto } from '../dtos/student/get-admin-students.dto';
import { PaginatedStudentsResponseDto } from '../dtos/student/paginated-students-response.dto';
import { PatchStudentDto } from '../dtos/student/patch-student.dto';
import { UpdateStudentDto } from '../dtos/student/update-student.dto';
import { UpdateStudentMeDto } from '../dtos/student/update-student-me.dto';

import { Request } from 'express';

@ApiTags('Students')
@Controller('students')
export class StudentController {
  constructor(
    private readonly studentService: StudentService,
    private readonly logger: AmoresFatiLogger,
  ) {
    this.logger.setContext(StudentController.name);
  }

  private assertSelfOrAdmin(user: AuthenticatedUser, id: string): void {
    if (user.role !== UserRoleEnum.ADMIN && user.id !== id) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar este recurso.',
      );
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registra um novo aluno',
    description:
      'Recebe os dados do aluno e orquestra o caso de uso de registro.',
  })
  @ApiBody({ type: CreateStudentDto })
  @ApiCreatedResponse({ description: 'Aluno registrado com sucesso.' })
  @ApiBadRequestResponse({ description: 'Erro de validacao.' })
  @ApiConflictResponse({
    description: 'CPF ou e-mail ja cadastrado na plataforma.',
  })
  async register(@Body() createStudentDto: CreateStudentDto) {
    try {
      this.logger.info('Creating student', {
        cpf: createStudentDto.cpf,
        email: createStudentDto.email,
      });
      const command: CreateStudentCommand = { ...createStudentDto };
      const student = await this.studentService.createStudent(command);
      this.logger.info('Student created', {
        id: (student as { id?: string })?.id,
      });
      return student;
    } catch (error) {
      if (
        error instanceof Error &&
        (error.name === 'StudentAlreadyExistsException' ||
          error.name === 'UserAlreadyExistsException')
      ) {
        this.logger.warn('Student creation conflict: already registered', {
          cpf: createStudentDto.cpf,
          email: createStudentDto.email,
        });
        throw new ConflictException(error.message);
      }

      if (error instanceof Error && error.name === 'DomainException') {
        this.logger.error('Student creation domain error');
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  @RequireAuth(UserRoleEnum.ADMIN)
  @Get()
  @ApiOperation({ summary: 'Lista todos os alunos' })
  @ApiOkResponse({
    description: 'Retorna um array com todos os alunos cadastrados.',
  })
  async findAll() {
    this.logger.info('Listing students');
    const students = await this.studentService.findAllStudents();
    this.logger.info('Students listed', { count: students.length });
    return students;
  }

  @RequireAuth(UserRoleEnum.STUDENT)
  @Get('me')
  @ApiOperation({ summary: 'Retorna o perfil do aluno autenticado' })
  @ApiOkResponse({ description: 'Perfil retornado com sucesso.' })
  async getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    this.logger.info('Fetching own student profile', { userId: user.id });

    try {
      const student = await this.studentService.getStudentById(user.id);
      this.logger.info('Own student profile fetched', { userId: user.id });
      return student;
    } catch (error) {
      if (error instanceof Error && error.name === 'StudentNotFoundException') {
        this.logger.warn('Student profile not found', { userId: user.id });
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @RequireAuth(UserRoleEnum.STUDENT)
  @Put('me')
  @ApiOperation({ summary: 'Atualiza o perfil do aluno autenticado' })
  @ApiBody({ type: UpdateStudentMeDto })
  @ApiOkResponse({ description: 'Perfil atualizado com sucesso.' })
  @ApiBadRequestResponse({
    description: 'Dados inválidos.',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'phone deve conter apenas dígitos',
          'householdSize deve ser um número inteiro positivo',
        ],
        error: 'Bad Request',
        errorKind: 'VALIDATION_ERROR',
      },
    },
  })
  async updateMe(
    @Req() req: Request & { user: { id: string; role: UserRoleEnum } },
    @Body() updateStudentMeDto: UpdateStudentMeDto,
  ) {
    this.logger.info('Updating authenticated student profile', {
      userId: req.user.id,
    });

    const command: UpdateStudentMeCommand = { ...updateStudentMeDto };

    return this.studentService.updateAuthenticatedStudentProfile(
      req.user.id,
      command,
    );
  }

  @RequireAuth(UserRoleEnum.ADMIN)
  @Get('filter')
  @ApiOperation({ summary: 'Lista alunos com filtros e paginacao para admins' })
  @ApiOkResponse({
    description: 'Retorna alunos paginados, sem usuarios excluidos.',
    type: PaginatedStudentsResponseDto,
  })
  async findAllWithFilter(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filters: GetAdminStudentsDto,
  ) {
    this.logger.info('Listing students with admin filters', {
      page: filters.page,
      pageSize: filters.pageSize,
      adminId: user.id,
    });
    const students =
      await this.studentService.findAllStudentsWithFilter(filters);
    this.logger.info('Students listed with admin filters', {
      count: students.items.length,
      total: students.meta.total,
    });
    return students;
  }

  @RequireAuth(UserRoleEnum.ADMIN, UserRoleEnum.STUDENT)
  @Get(':id')
  @ApiOperation({ summary: 'Busca um aluno por ID' })
  @ApiOkResponse({ description: 'Aluno encontrado com sucesso.' })
  @ApiNotFoundResponse({ description: 'Aluno nao encontrado.' })
  async findById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    this.assertSelfOrAdmin(user, id);
    try {
      this.logger.info('Fetching student by id', { id });
      const student = await this.studentService.getStudentById(id);
      this.logger.info('Student fetched', { id });
      return student;
    } catch (error) {
      if (error instanceof Error && error.name === 'StudentNotFoundException') {
        this.logger.warn('Student not found', { id });
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @RequireAuth(UserRoleEnum.ADMIN)
  @Get('cpf/:cpf')
  @ApiOperation({ summary: 'Busca um aluno por CPF' })
  @ApiOkResponse({ description: 'Aluno encontrado com sucesso.' })
  @ApiNotFoundResponse({ description: 'Aluno nao encontrado.' })
  async findByCpf(@Param('cpf') cpf: string) {
    try {
      this.logger.info('Fetching student by cpf', { cpf });
      const student = await this.studentService.getStudentByCpf(cpf);
      this.logger.info('Student fetched', { cpf });
      return student;
    } catch (error) {
      if (error instanceof Error && error.name === 'StudentNotFoundException') {
        this.logger.warn('Student not found', { cpf });
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @RequireAuth(UserRoleEnum.ADMIN, UserRoleEnum.STUDENT)
  @Put(':id')
  @ApiOperation({ summary: 'Atualiza completamente os dados de um aluno' })
  @ApiBody({ type: UpdateStudentDto })
  @ApiOkResponse({ description: 'Aluno atualizado com sucesso.' })
  @ApiNotFoundResponse({ description: 'Aluno nao encontrado.' })
  @ApiBadRequestResponse({ description: 'Erro de validacao.' })
  @ApiConflictResponse({ description: 'E-mail ja cadastrado na plataforma.' })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    this.assertSelfOrAdmin(user, id);
    try {
      this.logger.info('Updating student', { id });
      const command: UpdateStudentCommand = { ...updateStudentDto };
      const student = await this.studentService.updateStudent(id, command);
      this.logger.info('Student updated', { id });
      return student;
    } catch (error) {
      if (error instanceof Error && error.name === 'StudentNotFoundException') {
        this.logger.warn('Student not found', { id });
        throw new NotFoundException(error.message);
      }

      if (
        error instanceof Error &&
        error.name === 'UserAlreadyExistsException'
      ) {
        this.logger.warn('Student update conflict: email already in use', {
          id,
        });
        throw new ConflictException(error.message);
      }

      if (error instanceof Error && error.name === 'DomainException') {
        this.logger.error('Student update domain error');
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  @RequireAuth(UserRoleEnum.ADMIN, UserRoleEnum.STUDENT)
  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza parcialmente os dados de um aluno' })
  @ApiBody({ type: PatchStudentDto })
  @ApiOkResponse({ description: 'Aluno atualizado com sucesso.' })
  @ApiNotFoundResponse({ description: 'Aluno nao encontrado.' })
  @ApiBadRequestResponse({ description: 'Erro de validacao.' })
  @ApiConflictResponse({ description: 'E-mail ja cadastrado na plataforma.' })
  async patch(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() patchStudentDto: PatchStudentDto,
  ) {
    this.assertSelfOrAdmin(user, id);
    try {
      this.logger.info('Patching student', { id });
      const command: PatchStudentCommand = { ...patchStudentDto };
      const student = await this.studentService.patchStudent(id, command);
      this.logger.info('Student patched', { id });
      return student;
    } catch (error) {
      if (error instanceof Error && error.name === 'StudentNotFoundException') {
        this.logger.warn('Student not found', { id });
        throw new NotFoundException(error.message);
      }

      if (
        error instanceof Error &&
        error.name === 'UserAlreadyExistsException'
      ) {
        this.logger.warn('Student patch conflict: email already in use', {
          id,
        });
        throw new ConflictException(error.message);
      }

      if (error instanceof Error && error.name === 'DomainException') {
        this.logger.error('Student patch domain error');
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  @RequireAuth(UserRoleEnum.ADMIN)
  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Deleta (soft delete) uma lista de alunos (Admin apenas)',
  })
  @ApiOkResponse({
    description: 'Retorna um objeto com os IDs que não foram encontrados.',
  })
  async removeStudents(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DeleteStudentsDto,
  ) {
    this.logger.info('Deleting students', { ids: dto.ids, adminId: user.id });
    return this.studentService.deleteStudents(dto.ids);
  }
}
