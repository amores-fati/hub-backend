import {
  BadRequestException,
  Body,
  Controller,
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
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AdminCourseCommand } from '../../../core/command/course.command';
import { DomainException } from '../../../core/exceptions/domain.exception';
import { AdminCourseService } from '../../../core/services/admin-course.service';
import { UserRoleEnum } from '../../../core/domain/enums/user-role.enum';
import { RequireAuth } from '../../../utils/decorators/api-auth.decorator';
import { AmoresFatiLogger } from '../../../utils/logger';
import { AdminCourseDto } from '../dtos/course/admin-course.dto';

@ApiTags('Admin - Courses')
@RequireAuth(UserRoleEnum.ADMIN)
@Controller('admin/courses')
export class AdminCourseController {
  constructor(
    private readonly adminCourseService: AdminCourseService,
    private readonly logger: AmoresFatiLogger,
  ) {
    this.logger.setContext(AdminCourseController.name);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cria um novo curso (admin)' })
  @ApiBody({ type: AdminCourseDto })
  @ApiCreatedResponse({ description: 'Curso criado com sucesso.' })
  @ApiBadRequestResponse({
    description: 'Erro de validação ou inconsistência de domínio.',
  })
  @ApiForbiddenResponse({ description: 'Acesso negado. Requer perfil admin.' })
  async create(@Body() dto: AdminCourseDto) {
    this.logger.info('Creating admin course', { name: dto.name });
    try {
      const command: AdminCourseCommand = { ...dto };
      const course = await this.adminCourseService.createCourse(command);
      this.logger.info('Admin course created', { id: course.id });
      return course;
    } catch (error) {
      if (error instanceof DomainException) {
        this.logger.error('Admin course creation domain error');
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualiza um curso existente (admin)' })
  @ApiParam({ name: 'id', description: 'UUID do curso', type: String })
  @ApiBody({ type: AdminCourseDto })
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
  @ApiForbiddenResponse({ description: 'Acesso negado. Requer perfil admin.' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminCourseDto,
  ) {
    this.logger.info('Updating admin course', { id });
    try {
      const command: AdminCourseCommand = { ...dto };
      const course = await this.adminCourseService.updateCourse(id, command);
      this.logger.info('Admin course updated', { id });
      return course;
    } catch (error) {
      if (error instanceof Error && error.name === 'CourseNotFoundException') {
        this.logger.warn('Admin course not found', { id });
        throw new NotFoundException({
          statusCode: 404,
          message: 'Curso não encontrado',
          errorKind: 'NOT_FOUND',
        });
      }
      if (error instanceof DomainException) {
        this.logger.error('Admin course update domain error', { id });
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
