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
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateCourseCommand, UpdateCourseCommand } from '../../../core/command/course.command';
import { CourseService } from '../../../core/services/course.service';
import { EnrollmentService } from '../../../core/services/enrollment.service';
import { EnrollmentType } from '../../../core/domain/enrollment.entity';
import { RequireAuth } from '../../../utils/decorators/api-auth.decorator';
import { CurrentUser } from '../../../utils/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../utils/decorators/current-user.decorator';
import { AmoresFatiLogger } from '../../../utils/logger';
import { CreateCourseDto } from '../dtos/course/create-course.dto';
import { toCourseResponse } from '../dtos/course/course-response.dto';
import { UserRoleEnum } from '../../../core/domain/enums/user-role.enum';

@ApiTags('Courses')
@Controller('courses')
export class CourseController {
  constructor(
    private readonly courseService: CourseService,
    private readonly enrollmentService: EnrollmentService,
    private readonly logger: AmoresFatiLogger,
  ) {
    this.logger.setContext(CourseController.name);
  }

  @RequireAuth(UserRoleEnum.ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Cria um novo curso',
    description:
      'Recebe os dados estruturais do curso e orquestra o caso de uso de criacao na camada Core.',
  })
  @ApiBody({
    type: CreateCourseDto,
    description:
      'Payload contendo os campos estruturais do curso.',
  })
  @ApiCreatedResponse({
    description:
      'O curso foi criado e persistido no banco de dados com sucesso.',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Desenvolvimento Web Full Stack',
        banner: 'https://fatilab.com/banners/web.jpg',
        description:
          'Curso completo de desenvolvimento web com React e Node.js.',
        courseLoad: '120h',
        startDate: '2025-02-01T00:00:00.000Z',
        endDate: '2025-06-30T00:00:00.000Z',
        startRegistrations: '2025-01-01T00:00:00.000Z',
        endRegistrations: '2025-01-28T00:00:00.000Z',
        linkAccess: 'https://fatilab.com/cursos/web',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Erro de validacao ou inconsistencia de dominio.',
  })
  async create(@Body() createCourseDto: CreateCourseDto) {
    try {
      this.logger.info('Creating course', { name: createCourseDto.name });
      const command: CreateCourseCommand = { ...createCourseDto };
      const course = await this.courseService.createCourse(command);
      this.logger.info('Course created', {
        id: (course as { id?: string })?.id,
        name: createCourseDto.name,
      });
      return course;
    } catch (error) {
      if (error instanceof Error && error.name === 'DomainException') {
        this.logger.error('Course creation domain error');
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  @RequireAuth(UserRoleEnum.ADMIN)
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualiza um curso existente (admin)' })
  @ApiParam({ name: 'id', description: 'UUID do curso', type: String })
  @ApiBody({ type: CreateCourseDto })
  @ApiOkResponse({ description: 'Curso atualizado com sucesso.' })
  @ApiNotFoundResponse({
    description: 'Curso não encontrado.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Curso não encontrado',
        errorKind: 'NOT_FOUND',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Erro de validação ou inconsistência de domínio.',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCourseDto,
  ) {
    this.logger.info('Updating course', { id });
    try {
      const command: UpdateCourseCommand = { ...dto };
      const course = await this.courseService.updateCourse(id, command);
      this.logger.info('Course updated', { id });
      return course;
    } catch (error) {
      if (error instanceof Error && error.name === 'CourseNotFoundException') {
        this.logger.warn('Course not found', { id });
        throw new NotFoundException({
          statusCode: 404,
          message: 'Curso não encontrado',
          errorKind: 'NOT_FOUND',
        });
      }
      if (error instanceof Error && error.name === 'DomainException') {
        this.logger.error('Course update domain error', { id });
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Lista todos os cursos',
    description:
      'Retorna a lista completa de todos os cursos persistidos na base de dados, ja em formato pronto para consumo do frontend.',
  })
  @ApiOkResponse({
    description: 'Cursos retornados com sucesso.',
    schema: {
      example: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Desenvolvimento Web Full Stack',
          description:
            'Curso completo de desenvolvimento web com React e Node.js.',
          modality: 'presencial',
          workloadHours: 120,
          vacancyCount: 30,
          startDate: '2025-02-01T00:00:00.000Z',
          endDate: '2025-06-30T00:00:00.000Z',
          enrollmentStart: '2025-01-01T00:00:00.000Z',
          enrollmentEnd: '2025-01-28T00:00:00.000Z',
          location: 'Porto Alegre',
          imageUrl: 'https://fatilab.com/banners/web.jpg',
          externalLink: 'https://fatilab.com/cursos/web',
        },
      ],
    },
  })
  async findAll() {
    this.logger.info('Listing courses');
    const courses = await this.courseService.getAllCoursesWithLocation();
    this.logger.info('Courses listed', { count: courses.length });
    return courses.map(({ course, location }) =>
      toCourseResponse(course, location),
    );
  }

  @RequireAuth(UserRoleEnum.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Exclui um curso' })
  @ApiParam({ name: 'id', description: 'UUID do curso', type: String })
  @ApiNoContentResponse({ description: 'Curso excluído com sucesso.' })
  @ApiNotFoundResponse({
    description: 'Curso não encontrado.',
    schema: {
      example: { statusCode: 404, message: 'Curso não encontrado', errorKind: 'NOT_FOUND' },
    },
  })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.info('Deleting course', { id });
    try {
      await this.courseService.deleteCourse(id);
    } catch (error) {
      if (error instanceof Error && error.name === 'CourseNotFoundException') {
        throw new NotFoundException({
          statusCode: 404,
          message: 'Curso não encontrado',
          errorKind: 'NOT_FOUND',
        });
      }
      throw error;
    }
  }

  @RequireAuth(UserRoleEnum.STUDENT)
  @Get('me/enrollments')
  @ApiOperation({
    summary: 'Lista os vínculos do aluno autenticado',
    description:
      'Retorna todos os registros de matrícula e interesse do aluno autenticado. Requer perfil student.',
  })
  @ApiOkResponse({
    description: 'Vínculos retornados com sucesso.',
    schema: {
      example: [
        {
          courseId: 'def12345-e89b-12d3-a456-426614174000',
          status: 'enrolled',
          enrolledAt: '2025-01-15T10:00:00.000Z',
        },
      ],
    },
  })
  async findMyEnrollments(@CurrentUser() user: AuthenticatedUser) {
    this.logger.info('Listing enrollments for student', { userId: user.id });
    const enrollments = await this.enrollmentService.getEnrollmentsByStudentId(
      user.id,
    );
    return enrollments.map((enrollment) => ({
      courseId: enrollment.courseId,
      status:
        enrollment.type === EnrollmentType.ENROLLMENT
          ? 'enrolled'
          : 'interested',
      enrolledAt: enrollment.createdAt,
    }));
  }

  @RequireAuth(UserRoleEnum.STUDENT)
  @Post(':id/interest')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registra interesse do aluno em um curso',
    description:
      'Manifesta interesse do aluno autenticado no curso informado. Requer perfil student.',
  })
  @ApiParam({ name: 'id', description: 'UUID do curso', type: String })
  @ApiCreatedResponse({
    description: 'Interesse registrado com sucesso.',
    schema: {
      example: {
        courseId: 'uuid-do-curso',
        status: 'interested',
        enrolledAt: '2024-01-16T09:00:00.000Z',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Curso não encontrado.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Curso não encontrado',
        errorKind: 'NOT_FOUND',
      },
    },
  })
  @ApiConflictResponse({
    description: 'Aluno já possui vínculo com este curso.',
    schema: {
      example: {
        statusCode: 409,
        message: 'Você já possui um vínculo com este curso',
        errorKind: 'CONFLICT',
      },
    },
  })
  async registerInterest(
    @Param('id', ParseUUIDPipe) courseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.logger.info('Registering interest', { userId: user.id, courseId });
    try {
      const enrollment = await this.enrollmentService.registerInterest(
        user.id,
        courseId,
      );
      return {
        courseId: enrollment.courseId,
        status: 'interested',
        enrolledAt: enrollment.createdAt,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'CourseNotFoundException') {
        throw new NotFoundException({
          statusCode: 404,
          message: 'Curso não encontrado',
          errorKind: 'NOT_FOUND',
        });
      }
      if (
        error instanceof Error &&
        error.name === 'EnrollmentAlreadyExistsException'
      ) {
        throw new ConflictException({
          statusCode: 409,
          message: 'Você já possui um vínculo com este curso',
          errorKind: 'CONFLICT',
        });
      }
      throw error;
    }
  }

  @RequireAuth(UserRoleEnum.STUDENT)
  @Post(':id/enroll')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Matricula o aluno em um curso',
    description:
      'Realiza a matrícula do aluno autenticado no curso informado. Requer perfil student.',
  })
  @ApiParam({ name: 'id', description: 'UUID do curso', type: String })
  @ApiCreatedResponse({
    description: 'Matrícula realizada com sucesso.',
    schema: {
      example: {
        courseId: 'uuid-do-curso',
        status: 'enrolled',
        enrolledAt: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Curso não encontrado.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Curso não encontrado',
        errorKind: 'NOT_FOUND',
      },
    },
  })
  @ApiConflictResponse({
    description: 'Aluno já possui vínculo com este curso.',
    schema: {
      example: {
        statusCode: 409,
        message: 'Você já possui um vínculo com este curso',
        errorKind: 'CONFLICT',
      },
    },
  })
  async enroll(
    @Param('id', ParseUUIDPipe) courseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.logger.info('Enrolling student', { userId: user.id, courseId });
    try {
      const enrollment = await this.enrollmentService.enroll(user.id, courseId);
      return {
        courseId: enrollment.courseId,
        status: 'enrolled',
        enrolledAt: enrollment.createdAt,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'CourseNotFoundException') {
        throw new NotFoundException({
          statusCode: 404,
          message: 'Curso não encontrado',
          errorKind: 'NOT_FOUND',
        });
      }
      if (
        error instanceof Error &&
        error.name === 'EnrollmentAlreadyExistsException'
      ) {
        throw new ConflictException({
          statusCode: 409,
          message: 'Você já possui um vínculo com este curso',
          errorKind: 'CONFLICT',
        });
      }
      throw error;
    }
  }
}
