import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
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
} from '../../../core/command/student.command';
import { StudentService } from '../../../core/services/student.service';
import { RequireAuth } from '../../../utils/decorators/api-auth.decorator';
import { AmoresFatiLogger } from '../../../utils/logger';
import { CreateStudentDto } from '../dtos/student/create-student.dto';
import { DeleteStudentsDto } from '../dtos/student/delete-student.dto';
import { GetAdminStudentsDto } from '../dtos/student/get-admin-students.dto';
import { PaginatedStudentsResponseDto } from '../dtos/student/paginated-students-response.dto';
import { PatchStudentDto } from '../dtos/student/patch-student.dto';
import { UpdateStudentDto } from '../dtos/student/update-student.dto';

@ApiTags('Students')
@Controller('students')
export class StudentController {
  constructor(
    private readonly studentService: StudentService,
    private readonly logger: AmoresFatiLogger,
  ) {
    this.logger.setContext(StudentController.name);
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

  @RequireAuth()
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

  @RequireAuth()
  @Get('filter')
  @ApiOperation({ summary: 'Lista alunos com filtros e paginacao para admins' })
  @ApiOkResponse({
    description: 'Retorna alunos paginados, sem usuarios excluidos.',
    type: PaginatedStudentsResponseDto,
  })
  async findAllWithFilter(@Query() filters: GetAdminStudentsDto) {
    this.logger.info('Listing students with admin filters', {
      page: filters.page,
      pageSize: filters.pageSize,
    });
    const students =
      await this.studentService.findAllStudentsWithFilter(filters);
    this.logger.info('Students listed with admin filters', {
      count: students.items.length,
      total: students.meta.total,
    });
    return students;
  }

  @RequireAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Busca um aluno por ID' })
  @ApiOkResponse({ description: 'Aluno encontrado com sucesso.' })
  @ApiNotFoundResponse({ description: 'Aluno nao encontrado.' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
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

  @RequireAuth()
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

  @RequireAuth()
  @Put(':id')
  @ApiOperation({ summary: 'Atualiza completamente os dados de um aluno' })
  @ApiBody({ type: UpdateStudentDto })
  @ApiOkResponse({ description: 'Aluno atualizado com sucesso.' })
  @ApiNotFoundResponse({ description: 'Aluno nao encontrado.' })
  @ApiBadRequestResponse({ description: 'Erro de validacao.' })
  @ApiConflictResponse({ description: 'E-mail ja cadastrado na plataforma.' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
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

  @RequireAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza parcialmente os dados de um aluno' })
  @ApiBody({ type: PatchStudentDto })
  @ApiOkResponse({ description: 'Aluno atualizado com sucesso.' })
  @ApiNotFoundResponse({ description: 'Aluno nao encontrado.' })
  @ApiBadRequestResponse({ description: 'Erro de validacao.' })
  @ApiConflictResponse({ description: 'E-mail ja cadastrado na plataforma.' })
  async patch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() patchStudentDto: PatchStudentDto,
  ) {
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

  @RequireAuth()
  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deleta (soft delete) uma lista de alunos' })
  @ApiOkResponse({
    description: 'Retorna um objeto com os IDs que não foram encontrados.',
  })
  async removeStudents(@Body() dto: DeleteStudentsDto) {
    this.logger.info('Deleting students', { ids: dto.ids });
    return this.studentService.deleteStudents(dto.ids);
  }
}
