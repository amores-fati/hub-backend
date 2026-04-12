import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { CreateStudentDto } from '../dtos/student/create-student.dto';
import { StudentService } from '../../../core/services/student.service';
import { CreateStudentCommand } from '../../../core/command/student.command';

@ApiTags('Students')
@Controller('auth/register/student')
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
}
