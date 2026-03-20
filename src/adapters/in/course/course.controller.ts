import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { CourseService } from '../../../core/services/course.service';
import { CreateCourseDto } from './create-course.dto';

@ApiTags('Courses')
@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Cria um novo curso',
    description:
      'Recebe os dados do curso e orquestra o caso de uso de criação na camada Core.',
  })
  @ApiBody({
    type: CreateCourseDto,
    description: 'Payload contendo Título e Descrição obrigatórios.',
  })
  @ApiCreatedResponse({
    description:
      'O curso foi criado e persistido no banco de dados com sucesso.',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'NestJS Avançado',
        description: 'Arquitetura Hexagonal na prática',
        createdAt: '2023-10-01T12:00:00Z',
        updatedAt: '2023-10-01T12:00:00Z',
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      'Erro de validação (ex: campos vazios). Retorna detalhes pelo class-validator.',
  })
  async create(@Body() createCourseDto: CreateCourseDto) {
    return this.courseService.createCourse(
      createCourseDto.title,
      createCourseDto.description,
    );
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
          title: 'NestJS Avançado',
          description: 'Arquitetura Hexagonal na prática',
          createdAt: '2023-10-01T12:00:00Z',
          updatedAt: '2023-10-01T12:00:00Z',
        },
      ],
    },
  })
  async findAll() {
    return this.courseService.getAllCourses();
  }
}
