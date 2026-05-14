import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { DomainException } from '../../../core/exceptions/domain.exception';
import { UserRoleEnum } from '../../../core/domain/enums/user-role.enum';
import { CourseReportService } from '../../../core/services/course-report.service';
import { StudentReportService } from '../../../core/services/student-report.service';
import { CurrentUser } from '../../../utils/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../utils/decorators/current-user.decorator';
import { RequireAuth } from '../../../utils/decorators/api-auth.decorator';
import { ExportCoursesReportDto } from '../dtos/reports/export-courses-report.dto';
import { ExportStudentsReportDto } from '../dtos/reports/export-students-report.dto';

@ApiTags('Admin Reports')
@RequireAuth(UserRoleEnum.ADMIN)
@Controller('admin/reports')
export class AdminReportsController {
  constructor(
    private readonly courseReportService: CourseReportService,
    private readonly studentReportService: StudentReportService,
  ) {}

  @Post('courses')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exporta o relatorio de cursos em PDF' })
  @ApiBody({ type: ExportCoursesReportDto })
  @ApiOkResponse({
    description: 'PDF do relatorio de cursos gerado com sucesso.',
    content: {
      'application/pdf': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Payload ou filtros invalidos.' })
  @ApiUnauthorizedResponse({ description: 'JWT ausente ou invalido.' })
  @ApiForbiddenResponse({ description: 'Usuario sem perfil admin.' })
  async exportCoursesReport(
    @Body() body: ExportCoursesReportDto,
    @CurrentUser() user: AuthenticatedUser,
    @Res() response: Response,
  ): Promise<void> {
    try {
      const report = await this.courseReportService.generateReport({
        mode: body.mode,
        ids: body.ids,
        filters: body.filters,
        generatedBy: {
          id: user.id,
          name: user.email,
        },
      });

      response.setHeader('Content-Type', 'application/pdf');
      response.setHeader(
        'Content-Disposition',
        `attachment; filename="${report.filename}"`,
      );
      response.send(report.buffer);
    } catch (error) {
      if (error instanceof DomainException) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  @Post('students')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exporta o relatorio de alunos em PDF' })
  @ApiBody({ type: ExportStudentsReportDto })
  @ApiOkResponse({
    description: 'PDF do relatorio de alunos gerado com sucesso.',
    content: {
      'application/pdf': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Payload ou filtros invalidos.' })
  @ApiUnauthorizedResponse({ description: 'JWT ausente ou invalido.' })
  @ApiForbiddenResponse({ description: 'Usuario sem perfil admin.' })
  async exportStudentsReport(
    @Body() body: ExportStudentsReportDto,
    @CurrentUser() user: AuthenticatedUser,
    @Res() response: Response,
  ): Promise<void> {
    try {
      const report = await this.studentReportService.generateReport({
        mode: body.mode,
        ids: body.ids,
        filters: body.filters,
        generatedBy: {
          id: user.id,
          name: user.email,
        },
      });

      response.setHeader('Content-Type', 'application/pdf');
      response.setHeader(
        'Content-Disposition',
        `attachment; filename="${report.filename}"`,
      );
      response.send(report.buffer);
    } catch (error) {
      if (error instanceof DomainException) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }
}
