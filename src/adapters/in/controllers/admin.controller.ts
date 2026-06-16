// src/adapters/in/controllers/admin.controller.ts
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { DomainException } from '../../../core/exceptions/domain.exception';
import { AdminService } from '../../../core/services/admin.service';
import { VacancyReportService } from '../../../core/services/vacancy-report.service';
import { RequireAuth } from '../../../utils/decorators/api-auth.decorator';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../../utils/decorators/current-user.decorator';
import { AmoresFatiLogger } from '../../../utils/logger';
import { CreateAdminDto } from '../dtos/admin/create-admin.dto';
import {
  DisabilityCount,
  StudentCityCount,
} from '../../../core/ports/student.repository.interface';
import { StudentResumeResponseDto } from '../dtos/admin/student-resume-response.dto';
import {
  GetLocationsQueryDto,
  LocationResponseDto,
} from '../dtos/admin/get-locations.dto';
import { GetResumesQueryDto } from '../dtos/admin/get-resumes.dto';
import { PaginatedResumesResponseDto } from '../dtos/admin/paginated-resumes-response.dto';
import { GetAdminVacanciesDto } from '../dtos/vacancy/get-admin-vacancies.dto';
import { PaginatedAdminVacanciesResponseDto } from '../dtos/vacancy/paginated-admin-vacancies-response.dto';
import { UserRoleEnum } from '../../../core/domain/enums/user-role.enum';

@ApiTags('Admins')
@RequireAuth(UserRoleEnum.ADMIN)
@Controller('admins')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly vacancyReportService: VacancyReportService,
    private readonly logger: AmoresFatiLogger,
  ) {
    this.logger.setContext(AdminController.name);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequireAuth()
  @ApiOperation({
    summary: 'Registra um novo Administrador do sistema',
    description: 'Cria uma conta de acesso com privilégios administrativos.',
  })
  @ApiBody({ type: CreateAdminDto })
  @ApiCreatedResponse({ description: 'Administrador criado com sucesso.' })
  @ApiBadRequestResponse({ description: 'Erro de validação nos dados.' })
  @ApiConflictResponse({ description: 'O e-mail fornecido já está em uso.' })
  async create(@Body() createAdminDto: CreateAdminDto) {
    try {
      this.logger.info('Creating admin', { email: createAdminDto.email });
      const admin = await this.adminService.createAdmin(createAdminDto);
      this.logger.info('Admin created', { id: admin.id, email: admin.email });
      return { id: admin.id, email: admin.email };
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === 'UserAlreadyExistsException'
      ) {
        this.logger.warn('Admin creation conflict: email already in use', {
          email: createAdminDto.email,
        });
        throw new ConflictException(error.message);
      }
      if (error instanceof DomainException) {
        this.logger.error('Admin creation domain error');
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Get('students/:id/resume')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retorna o currículo de um aluno em modo leitura' })
  @ApiOkResponse({ type: StudentResumeResponseDto })
  @ApiNotFoundResponse({
    description: 'Aluno não encontrado ou sem currículo cadastrado.',
  })
  async getStudentResume(
    @Param('id') id: string,
  ): Promise<StudentResumeResponseDto> {
    return this.adminService.getStudentResume(id);
  }

  @Get('locations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retorna todas as localidades cadastradas no sistema',
    description:
      'Retorna cidades e UFs únicas com base no escopo (STUDENT ou COMPANY).',
  })
  @ApiOkResponse({
    type: [LocationResponseDto],
    description: 'Lista de localidades retornada com sucesso.',
  })
  async getLocations(
    @Query() query: GetLocationsQueryDto,
  ): Promise<LocationResponseDto[]> {
    return this.adminService.getLocations(query.scope);
  }

  @Get('resumes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lista currículos com paginação e filtros',
    description:
      'Retorna lista paginada de currículos com suporte a busca por nome, email, CPF, área de interesse e status.',
  })
  @ApiOkResponse({ type: PaginatedResumesResponseDto })
  async getResumes(
    @Query() query: GetResumesQueryDto,
  ): Promise<PaginatedResumesResponseDto> {
    return this.adminService.getResumes(query);
  }

  @Get('students/disability-stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retorna contagem de alunos por tipo de deficiência',
  })
  @ApiOkResponse({
    description: 'Contagem retornada com sucesso.',
    schema: {
      example: [
        { disabilityType: 'Visual', count: 45 },
        { disabilityType: 'Auditiva', count: 30 },
      ],
    },
  })
  async getDisabilityStats(): Promise<DisabilityCount[]> {
    return this.adminService.getDisabilityStats();
  }

  @Get('vacancies/filter')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lista vagas com filtros e paginação para admins' })
  @ApiOkResponse({
    description: 'Retorna vagas paginadas com filtros opcionais.',
    type: PaginatedAdminVacanciesResponseDto,
  })
  async findAllVacanciesWithFilter(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filters: GetAdminVacanciesDto,
  ): Promise<PaginatedAdminVacanciesResponseDto> {
    this.logger.info('Listing vacancies with admin filters', {
      page: filters.page,
      limit: filters.limit,
      adminId: user.id,
    });
    const result = await this.vacancyReportService.findAllVacanciesWithFilter({
      search: filters.search,
      isPcd: filters.isPcd,
      workType: filters.workType,
      page: filters.page,
      limit: filters.limit,
    });
    return {
      items: result.items.map((v) => ({
        id: v.id,
        title: v.name,
        companyName: v.companyName,
        openingsCount: v.openingsCount,
        isPcd: v.isPcd,
        announcementDate: v.announcementDate,
        workplaceType: v.workplaceType,
      })),
      meta: {
        page: filters.page,
        limit: filters.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / filters.limit),
      },
    };
  }

  @Get('students/count-by-city')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retorna quantidade de alunos por cidade/UF',
  })
  @ApiOkResponse({
    description: 'Contagem por cidade retornada com sucesso.',
    schema: {
      example: [
        { cityName: 'Porto Alegre', uf: 'RS', studentsCount: 45 },
        { cityName: 'São Paulo', uf: 'SP', studentsCount: 38 },
      ],
    },
  })
  async getStudentCountByCity(): Promise<StudentCityCount[]> {
    return this.adminService.getStudentCountByCity();
  }
  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retorna estatísticas gerais do dashboard administrativo',
  })
  @ApiOkResponse({
    description: 'Estatísticas retornadas com sucesso.',
    schema: {
      example: {
        totalStudents: 152,
        totalPcdStudents: 128,
        totalOpenedJobs: 23,
      },
    },
  })
  async getDashboardStats(): Promise<{
    totalStudents: number;
    totalPcdStudents: number;
    totalOpenedJobs: number;
  }> {
    return this.adminService.getDashboardStats();
  }

  @Get('students/count-by-month')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retorna a contagem de alunos cadastrados por mês',
  })
  @ApiOkResponse({
    description: 'Contagem por mês retornada com sucesso.',
    schema: {
      example: [
        { month: '2026-05', count: 10 },
        { month: '2026-06', count: 15 },
      ],
    },
  })
  async getStudentCountByMonth(): Promise<{ month: string; count: number }[]> {
    return this.adminService.getStudentCountByMonth();
  }
}
