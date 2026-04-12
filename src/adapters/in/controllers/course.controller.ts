import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateCourseCommand } from '../../../core/command/course.command';
import { CourseService } from '../../../core/services/course.service';
import { RequireAuth } from '../../../utils/decorators/api-auth.decorator';
import { CreateCourseDto } from '../dtos/course/create-course.dto';

@ApiTags('Courses')
@RequireAuth()
@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Cria um novo curso',
    description:
      'Recebe os dados estruturais do curso e orquestra o caso de uso de criacao na camada Core.',
  })
  @ApiBody({
    type: CreateCourseDto,
    description: 'Payload contendo os campos obrigatorios persistidos em courses.',
  })
  @ApiCreatedResponse({
    description: 'O curso foi criado e persistido no banco de dados com sucesso.',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Desenvolvimento Web Full Stack',
        banner: 'https://fatilab.com/banners/web.jpg',
        description: 'Curso completo de desenvolvimento web com React e Node.js.',
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
      const command: CreateCourseCommand = { ...createCourseDto };
      return await this.courseService.createCourse(command);
    } catch (error) {
      if (error instanceof Error && error.name === 'DomainException') {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Lista todos os cursos',
    description:
      'Retorna a lista completa de todos os cursos persistidos na base de dados.',
  })
  @ApiOkResponse({
    description: 'Cursos retornados com sucesso.',
    schema: {
      example: [
        {
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
      ],
    },
  })
  async findAll() {
    return this.courseService.getAllCourses();
  }
}
