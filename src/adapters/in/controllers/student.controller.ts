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
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
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
import { CreateStudentDto } from '../dtos/student/create-student.dto';
import { PatchStudentDto } from '../dtos/student/patch-student.dto';
import { UpdateStudentDto } from '../dtos/student/update-student.dto';

@ApiTags('Students')
@Controller('students')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

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
      const command: CreateStudentCommand = { ...createStudentDto };
      return await this.studentService.createStudent(command);
    } catch (error) {
      if (
        error instanceof Error &&
        (error.name === 'StudentAlreadyExistsException' ||
          error.name === 'UserAlreadyExistsException')
      ) {
        throw new ConflictException(error.message);
      }

      if (error instanceof Error && error.name === 'DomainException') {
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
    return this.studentService.findAllStudents();
  }

  @RequireAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Busca um aluno por ID' })
  @ApiOkResponse({ description: 'Aluno encontrado com sucesso.' })
  @ApiNotFoundResponse({ description: 'Aluno nao encontrado.' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    try {
      return await this.studentService.getStudentById(id);
    } catch (error) {
      if (error instanceof Error && error.name === 'StudentNotFoundException') {
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
      return await this.studentService.getStudentByCpf(cpf);
    } catch (error) {
      if (error instanceof Error && error.name === 'StudentNotFoundException') {
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
      const command: UpdateStudentCommand = { ...updateStudentDto };
      return await this.studentService.updateStudent(id, command);
    } catch (error) {
      if (error instanceof Error && error.name === 'StudentNotFoundException') {
        throw new NotFoundException(error.message);
      }

      if (
        error instanceof Error &&
        error.name === 'UserAlreadyExistsException'
      ) {
        throw new ConflictException(error.message);
      }

      if (error instanceof Error && error.name === 'DomainException') {
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
      const command: PatchStudentCommand = { ...patchStudentDto };
      return await this.studentService.patchStudent(id, command);
    } catch (error) {
      if (error instanceof Error && error.name === 'StudentNotFoundException') {
        throw new NotFoundException(error.message);
      }

      if (
        error instanceof Error &&
        error.name === 'UserAlreadyExistsException'
      ) {
        throw new ConflictException(error.message);
      }

      if (error instanceof Error && error.name === 'DomainException') {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  @RequireAuth()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deleta um aluno pelo ID' })
  @ApiNoContentResponse({ description: 'Aluno deletado com sucesso.' })
  @ApiNotFoundResponse({ description: 'Aluno nao encontrado.' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    try {
      await this.studentService.deleteStudent(id);
    } catch (error) {
      if (error instanceof Error && error.name === 'StudentNotFoundException') {
        throw new NotFoundException(error.message);
      }

      if (error instanceof Error && error.name === 'DomainException') {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }
}
