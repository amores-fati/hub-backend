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
import { CompanyReportService } from '../../../core/services/company-report.service';
import { CourseReportService } from '../../../core/services/course-report.service';
import { ResumeReportService } from '../../../core/services/resume-report.service';
import { StudentReportService } from '../../../core/services/student-report.service';
import { VacancyReportService } from '../../../core/services/vacancy-report.service';
import { CurrentUser } from '../../../utils/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../utils/decorators/current-user.decorator';
import { RequireAuth } from '../../../utils/decorators/api-auth.decorator';
import { ExportCompaniesReportDto } from '../dtos/reports/export-companies-report.dto';
import { ExportCoursesReportDto } from '../dtos/reports/export-courses-report.dto';
import { ExportResumesReportDto } from '../dtos/reports/export-resumes-report.dto';
import { ExportStudentsReportDto } from '../dtos/reports/export-students-report.dto';
import { ExportVacanciesReportDto } from '../dtos/reports/export-vacancies-report.dto';

@ApiTags('Admin Reports')
@RequireAuth(UserRoleEnum.ADMIN)
@Controller('admin/reports')
export class AdminReportsController {
  constructor(
    private readonly companyReportService: CompanyReportService,
    private readonly courseReportService: CourseReportService,
    private readonly studentReportService: StudentReportService,
    private readonly vacancyReportService: VacancyReportService,
    private readonly resumeReportService: ResumeReportService,
  ) {}

  @Post('companies')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exporta o relatorio de empresas em XLSX' })
  @ApiBody({ type: ExportCompaniesReportDto })
  @ApiOkResponse({
    description: 'XLSX do relatorio de empresas gerado com sucesso.',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Payload ou filtros invalidos.' })
  @ApiUnauthorizedResponse({ description: 'JWT ausente ou invalido.' })
  @ApiForbiddenResponse({ description: 'Usuario sem perfil admin.' })
  async exportCompaniesReport(
    @Body() body: ExportCompaniesReportDto,
    @CurrentUser() user: AuthenticatedUser,
    @Res() response: Response,
  ): Promise<void> {
    try {
      const report = await this.companyReportService.generateReport({
        mode: body.mode,
        ids: body.ids,
        filters: body.filters,
        generatedBy: {
          id: user.id,
          name: user.email,
        },
      });

      response.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
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

  @Post('vacancies')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exporta o relatorio de vagas em PDF' })
  @ApiBody({ type: ExportVacanciesReportDto })
  @ApiOkResponse({
    description: 'PDF do relatorio de vagas gerado com sucesso.',
    content: {
      'application/pdf': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Payload ou filtros invalidos.' })
  @ApiUnauthorizedResponse({ description: 'JWT ausente ou invalido.' })
  @ApiForbiddenResponse({ description: 'Usuario sem perfil admin.' })
  async exportVacanciesReport(
    @Body() body: ExportVacanciesReportDto,
    @CurrentUser() user: AuthenticatedUser,
    @Res() response: Response,
  ): Promise<void> {
    try {
      const report = await this.vacancyReportService.generateReport({
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

  @Post('resumes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exporta o relatorio de curriculos em PDF' })
  @ApiBody({ type: ExportResumesReportDto })
  @ApiOkResponse({
    description: 'PDF do relatorio de curriculos gerado com sucesso.',
    content: {
      'application/pdf': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Payload ou filtros invalidos.' })
  @ApiUnauthorizedResponse({ description: 'JWT ausente ou invalido.' })
  @ApiForbiddenResponse({ description: 'Usuario sem perfil admin.' })
  async exportResumesReport(
    @Body() body: ExportResumesReportDto,
    @CurrentUser() user: AuthenticatedUser,
    @Res() response: Response,
  ): Promise<void> {
    try {
      const report = await this.resumeReportService.generateReport({
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
