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
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { CreateStudentDto } from './create-student.dto';
import { StudentService } from '../../../core/services/student.service';

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
      return await this.studentService.createStudent(
        createStudentDto.name,
        createStudentDto.socialName,
        createStudentDto.cpf,
        createStudentDto.birthDate,
        createStudentDto.phone,
        createStudentDto.email,
        createStudentDto.password,
        createStudentDto.gender,
        createStudentDto.race,
        createStudentDto.cep,
        createStudentDto.address,
        createStudentDto.complement,
        createStudentDto.neighborhood,
        createStudentDto.city,
        createStudentDto.state,
        createStudentDto.education,
        createStudentDto.courseName,
        createStudentDto.institution,
        createStudentDto.fatilabMotivation,
        createStudentDto.howHeard,
        createStudentDto.hasComputer,
        createStudentDto.hasInternet,
        createStudentDto.committedToParticipate,
        createStudentDto.familyIncome,
        createStudentDto.householdSize,
        createStudentDto.socialBenefits,
        createStudentDto.hasProgrammingExperience,
        createStudentDto.hasTechCourses,
        createStudentDto.techCoursesList,
        createStudentDto.isEmployed,
        createStudentDto.workArea,
        createStudentDto.isPcd,
        createStudentDto.disabilityType,
        createStudentDto.disabilityDescription,
        createStudentDto.hasMedicalReport,
        createStudentDto.accessibilityResources,
        createStudentDto.specificAccessibilityNeeds,
        createStudentDto.authorizesImageUse,
        createStudentDto.acceptsLgpd,
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === 'StudentAlreadyExistsException'
      ) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }
}