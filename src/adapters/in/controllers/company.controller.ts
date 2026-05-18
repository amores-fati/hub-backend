import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
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
  ApiTags,
} from '@nestjs/swagger';

import {
  CreateCompanyCommand,
  UpdateCompanyCommand,
} from '../../../core/command/company.command';
import { CompanyService } from '../../../core/services/company.service';
import { RequireAuth } from '../../../utils/decorators/api-auth.decorator';
import { AmoresFatiLogger } from '../../../utils/logger';
import { CreateCompanyDto } from '../dtos/company/create-company.dto';
import { PatchCompanyDto } from '../dtos/company/patch-company.dto';
import { UpdateCompanyDto } from '../dtos/company/update-company.dto';
import { UserRoleEnum } from '../../../core/domain/enums/user-role.enum';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../../utils/decorators/current-user.decorator';
import appDataSource from '../../../config/typeorm.datasource';
import { JobOpeningOrmEntity } from '../../out/orm/job-opening.orm-entity';
import { JobSkillOrmEntity } from '../../out/orm/job-skill.orm-entity';
import { SkillOrmEntity } from '../../out/orm/skill.orm-entity';
import { CompanyOrmEntity } from '../../out/orm/company.orm-entity';
import { CreateUpdateJobOpeningDto } from '../dtos/job-opening/create-update-job-opening.dto';
import { randomUUID } from 'crypto';

@ApiTags('Companies')
@Controller('companies')
export class CompanyController {
  constructor(
    private readonly companyService: CompanyService,
    private readonly logger: AmoresFatiLogger,
  ) {
    this.logger.setContext(CompanyController.name);
  }

  @RequireAuth(UserRoleEnum.COMPANY)
  @Post('me/vacancies')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cria uma nova vaga para a empresa autenticada' })
  @ApiBody({ type: CreateUpdateJobOpeningDto })
  @ApiCreatedResponse({ description: 'Vaga criada com sucesso.' })
  @ApiBadRequestResponse({ description: 'Erro de validacao.' })
  async createMyVacancy(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createDto: CreateUpdateJobOpeningDto,
  ) {
    this.logger.info('Creating job opening for company (me)', {
      userId: user.id,
    });

    const companyRepo = appDataSource.getRepository(CompanyOrmEntity);
    const jobRepo = appDataSource.getRepository(JobOpeningOrmEntity);
    const skillRepo = appDataSource.getRepository(SkillOrmEntity);
    const jobSkillRepo = appDataSource.getRepository(JobSkillOrmEntity);

    const company = await companyRepo.findOne({ where: { id: user.id } });
    if (!company) {
      this.logger.warn('Company not found for user', { userId: user.id });
      throw new NotFoundException('Empresa nao encontrada.');
    }

    const job = jobRepo.create({
      company,
      name: createDto.title,
      description: createDto.description,
      openingsCount: createDto.vacancyCount,
      applicationLink: createDto.link,
      isPcd: createDto.isPcd,
      workplaceType: createDto.workplaceType,
    });

    await jobRepo.save(job);

    if (createDto.skills && createDto.skills.length > 0) {
      for (const skillName of createDto.skills) {
        let skill = await skillRepo.findOne({ where: { name: skillName } });
        if (!skill) {
          skill = skillRepo.create({ id: randomUUID(), name: skillName });
          await skillRepo.save(skill);
        }

        const jobSkill = jobSkillRepo.create({
          jobId: job.id,
          skillId: skill.id,
        });
        await jobSkillRepo.save(jobSkill);
      }
    }

    this.logger.info('Job opening created', {
      jobId: job.id,
      companyId: company.id,
    });
    return job;
  }

  @RequireAuth(UserRoleEnum.COMPANY)
  @Put('me/vacancies/:id')
  @ApiOperation({ summary: 'Atualiza uma vaga da propria empresa' })
  @ApiBody({ type: CreateUpdateJobOpeningDto })
  @ApiOkResponse({ description: 'Vaga atualizada com sucesso.' })
  @ApiNotFoundResponse({ description: 'Vaga nao encontrada.' })
  @ApiBadRequestResponse({ description: 'Erro de validacao.' })
  async updateMyVacancy(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: CreateUpdateJobOpeningDto,
  ) {
    this.logger.info('Updating job opening for company (me)', {
      userId: user.id,
      jobId: id,
    });

    const jobRepo = appDataSource.getRepository(JobOpeningOrmEntity);
    const skillRepo = appDataSource.getRepository(SkillOrmEntity);
    const jobSkillRepo = appDataSource.getRepository(JobSkillOrmEntity);

    const job = await jobRepo.findOne({
      where: { id },
      relations: ['company'],
    });
    if (!job) {
      this.logger.warn('Job opening not found', { jobId: id });
      throw new NotFoundException('Vaga nao encontrada.');
    }

    if (!job.company || job.company.id !== user.id) {
      this.logger.warn('Forbidden update attempt on job', {
        jobId: id,
        userId: user.id,
      });
      throw new ForbiddenException('A vaga pertence a outra empresa.');
    }

    job.name = updateDto.title;
    job.description = updateDto.description;
    job.openingsCount = updateDto.vacancyCount;
    job.applicationLink = updateDto.link;
    job.isPcd = updateDto.isPcd;
    job.workplaceType = updateDto.workplaceType;

    await jobRepo.save(job);

    await jobSkillRepo.delete({ jobId: job.id });

    if (updateDto.skills && updateDto.skills.length > 0) {
      for (const skillName of updateDto.skills) {
        let skill = await skillRepo.findOne({ where: { name: skillName } });
        if (!skill) {
          skill = skillRepo.create({ id: randomUUID(), name: skillName });
          await skillRepo.save(skill);
        }

        const jobSkill = jobSkillRepo.create({
          jobId: job.id,
          skillId: skill.id,
        });
        await jobSkillRepo.save(jobSkill);
      }
    }

    this.logger.info('Job opening updated', { jobId: job.id });
    return job;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registra uma nova empresa',
    description:
      'Recebe os dados da empresa e orquestra o caso de uso de registro.',
  })
  @ApiBody({ type: CreateCompanyDto })
  @ApiCreatedResponse({ description: 'Empresa registrada com sucesso.' })
  @ApiBadRequestResponse({ description: 'Erro de validacao.' })
  @ApiConflictResponse({
    description: 'CNPJ ou e-mail ja cadastrado na plataforma.',
  })
  async register(@Body() createCompanyDto: CreateCompanyDto) {
    try {
      this.logger.info('Creating company', {
        cnpj: createCompanyDto.cnpj,
        email: createCompanyDto.email,
      });
      const command: CreateCompanyCommand = { ...createCompanyDto };
      const company = await this.companyService.createCompany(command);
      this.logger.info('Company created', {
        id: (company as { id?: string })?.id,
      });
      return company;
    } catch (error) {
      if (
        error instanceof Error &&
        (error.name === 'CompanyAlreadyExistsException' ||
          error.name === 'UserAlreadyExistsException')
      ) {
        this.logger.warn('Company creation conflict: already registered', {
          cnpj: createCompanyDto.cnpj,
          email: createCompanyDto.email,
        });
        throw new ConflictException(error.message);
      }

      if (error instanceof Error && error.name === 'DomainException') {
        this.logger.error('Company creation domain error');
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  @RequireAuth(UserRoleEnum.ADMIN, UserRoleEnum.COMPANY)
  @Get()
  @ApiOperation({ summary: 'Lista todas as empresas' })
  @ApiOkResponse({
    description: 'Retorna um array com todas as empresas cadastradas.',
  })
  async findAll() {
    this.logger.info('Listing companies');
    const companies = await this.companyService.findAllCompanies();
    this.logger.info('Companies listed', { count: companies.length });
    return companies;
  }

  @RequireAuth(UserRoleEnum.ADMIN, UserRoleEnum.COMPANY)
  @Get(':id')
  @ApiOperation({ summary: 'Busca uma empresa por ID' })
  @ApiOkResponse({ description: 'Empresa encontrada com sucesso.' })
  @ApiNotFoundResponse({ description: 'Empresa nao encontrada.' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    try {
      this.logger.info('Fetching company by id', { id });
      const company = await this.companyService.getCompanyById(id);
      this.logger.info('Company fetched', { id });
      return company;
    } catch (error) {
      if (error instanceof Error && error.name === 'CompanyNotFoundException') {
        this.logger.warn('Company not found', { id });
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @RequireAuth(UserRoleEnum.ADMIN, UserRoleEnum.COMPANY)
  @Get('cnpj/:cnpj')
  @ApiOperation({ summary: 'Busca uma empresa por CNPJ' })
  @ApiOkResponse({ description: 'Empresa encontrada com sucesso.' })
  @ApiNotFoundResponse({ description: 'Empresa nao encontrada.' })
  async findByCnpj(@Param('cnpj') cnpj: string) {
    try {
      this.logger.info('Fetching company by cnpj', { cnpj });
      const company = await this.companyService.getCompanyByCnpj(cnpj);
      this.logger.info('Company fetched', { cnpj });
      return company;
    } catch (error) {
      if (error instanceof Error && error.name === 'CompanyNotFoundException') {
        this.logger.warn('Company not found', { cnpj });
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @RequireAuth(UserRoleEnum.ADMIN, UserRoleEnum.COMPANY)
  @Put(':id')
  @ApiOperation({ summary: 'Atualiza completamente os dados de uma empresa' })
  @ApiBody({ type: UpdateCompanyDto })
  @ApiOkResponse({ description: 'Empresa atualizada com sucesso.' })
  @ApiNotFoundResponse({ description: 'Empresa nao encontrada.' })
  @ApiBadRequestResponse({ description: 'Erro de validacao.' })
  @ApiConflictResponse({ description: 'E-mail ja cadastrado na plataforma.' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    try {
      this.logger.info('Updating company', { id });
      const command: UpdateCompanyCommand = { ...updateCompanyDto };
      const company = await this.companyService.updateCompany(id, command);
      this.logger.info('Company updated', { id });
      return company;
    } catch (error) {
      if (error instanceof Error && error.name === 'CompanyNotFoundException') {
        this.logger.warn('Company not found', { id });
        throw new NotFoundException(error.message);
      }

      if (
        error instanceof Error &&
        error.name === 'UserAlreadyExistsException'
      ) {
        this.logger.warn('Company update conflict: email already in use', {
          id,
        });
        throw new ConflictException(error.message);
      }

      if (error instanceof Error && error.name === 'DomainException') {
        this.logger.error('Company update domain error');
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  @RequireAuth(UserRoleEnum.ADMIN, UserRoleEnum.COMPANY)
  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza parcialmente os dados de uma empresa' })
  @ApiBody({ type: PatchCompanyDto })
  @ApiOkResponse({ description: 'Empresa atualizada com sucesso.' })
  @ApiNotFoundResponse({ description: 'Empresa nao encontrada.' })
  @ApiBadRequestResponse({ description: 'Erro de validacao.' })
  @ApiConflictResponse({ description: 'E-mail ja cadastrado na plataforma.' })
  async patch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() patchCompanyDto: PatchCompanyDto,
  ) {
    try {
      this.logger.info('Patching company', { id });
      const company = await this.companyService.patchCompany(
        id,
        patchCompanyDto,
      );
      this.logger.info('Company patched', { id });
      return company;
    } catch (error) {
      if (error instanceof Error && error.name === 'CompanyNotFoundException') {
        this.logger.warn('Company not found', { id });
        throw new NotFoundException(error.message);
      }

      if (
        error instanceof Error &&
        error.name === 'UserAlreadyExistsException'
      ) {
        this.logger.warn('Company patch conflict: email already in use', {
          id,
        });
        throw new ConflictException(error.message);
      }

      if (error instanceof Error && error.name === 'DomainException') {
        this.logger.error('Company patch domain error');
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  @RequireAuth(UserRoleEnum.ADMIN, UserRoleEnum.COMPANY)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deleta uma empresa pelo ID' })
  @ApiNoContentResponse({ description: 'Empresa deletada com sucesso.' })
  @ApiNotFoundResponse({ description: 'Empresa nao encontrada.' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    try {
      this.logger.info('Deleting company', { id });
      await this.companyService.deleteCompany(id);
      this.logger.info('Company deleted', { id });
    } catch (error) {
      if (error instanceof Error && error.name === 'CompanyNotFoundException') {
        this.logger.warn('Company not found', { id });
        throw new NotFoundException(error.message);
      }

      if (error instanceof Error && error.name === 'DomainException') {
        this.logger.error('Company deletion domain error');
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }
}
