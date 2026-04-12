import {
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ConflictException,
  NotFoundException,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { CreateStudentDto } from '../dtos/student/create-student.dto';
import { UpdateStudentDto } from '../dtos/student/update-student.dto';
import { PatchStudentDto } from '../dtos/student/patch-student.dto';
import { StudentService } from '../../../core/services/student.service';
import {
  CreateStudentCommand,
  UpdateStudentCommand,
  PatchStudentCommand,
} from '../../../core/command/student.command';

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
  @ApiBadRequestResponse({ description: 'Erro de validação.' })
  @ApiConflictResponse({ description: 'CPF já cadastrado na plataforma.' })
  async register(@Body() createStudentDto: CreateStudentDto) {
    try {
      const command: CreateStudentCommand = { ...createStudentDto };
      return await this.studentService.createStudent(command);
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === 'StudentAlreadyExistsException'
      ) {
        throw new ConflictException(error.message);
      }

      if (error instanceof Error && error.name === 'DomainException') {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os alunos' })
  @ApiOkResponse({
    description: 'Retorna um array com todos os alunos cadastrados.',
  })
  async findAll() {
    return this.studentService.findAllStudents();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um aluno por ID' })
  @ApiOkResponse({ description: 'Aluno encontrado com sucesso.' })
  @ApiNotFoundResponse({ description: 'Aluno não encontrado.' })
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

  @Get('cpf/:cpf')
  @ApiOperation({ summary: 'Busca um aluno por CPF' })
  @ApiOkResponse({ description: 'Aluno encontrado com sucesso.' })
  @ApiNotFoundResponse({ description: 'Aluno não encontrado.' })
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

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza completamente os dados de um aluno' })
  @ApiBody({ type: UpdateStudentDto })
  @ApiOkResponse({ description: 'Aluno atualizado com sucesso.' })
  @ApiNotFoundResponse({ description: 'Aluno não encontrado.' })
  @ApiBadRequestResponse({ description: 'Erro de validação.' })
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

      if (error instanceof Error && error.name === 'DomainException') {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza parcialmente os dados de um aluno' })
  @ApiBody({ type: PatchStudentDto })
  @ApiOkResponse({ description: 'Aluno atualizado com sucesso.' })
  @ApiNotFoundResponse({ description: 'Aluno não encontrado.' })
  @ApiBadRequestResponse({ description: 'Erro de validação.' })
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

      if (error instanceof Error && error.name === 'DomainException') {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deleta um aluno pelo ID' })
  @ApiNoContentResponse({ description: 'Aluno deletado com sucesso.' })
  @ApiNotFoundResponse({ description: 'Aluno não encontrado.' })
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
