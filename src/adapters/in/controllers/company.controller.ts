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
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
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
import { CurrentUser } from '../../../utils/decorators/current-user.decorator';
import type { AuthenticatedUser as BaseAuthenticatedUser } from '../../../utils/decorators/current-user.decorator';
import { AmoresFatiLogger } from '../../../utils/logger';
import { CreateCompanyDto } from '../dtos/company/create-company.dto';
import { PatchCompanyDto } from '../dtos/company/patch-company.dto';
import { UpdateCompanyDto } from '../dtos/company/update-company.dto';
import { ListMyVacanciesQueryDto } from '../dtos/vacancy/list-my-vacancies-query.dto';
import { UserRoleEnum } from '../../../core/domain/enums/user-role.enum';

interface AuthenticatedUser extends BaseAuthenticatedUser {
  companyId: string | null;
}

@ApiTags('Companies')
@Controller('companies')
export class CompanyController {
  constructor(
    private readonly companyService: CompanyService,
    private readonly logger: AmoresFatiLogger,
  ) {
    this.logger.setContext(CompanyController.name);
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

  @RequireAuth(UserRoleEnum.COMPANY)
  @Get('me/vacancies')
  @ApiOperation({
    summary: 'Lista as vagas da empresa autenticada com filtros e paginacao',
  })
  @ApiOkResponse({ description: 'Vagas listadas com sucesso.' })
  async listMyVacancies(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListMyVacanciesQueryDto,
  ) {
    this.logger.info('Listando vagas da empresa autenticada', {
      userId: user.id,
    });

    try {
      return await this.companyService.listMyVacancies(user.id, {
        page: query.page ?? 1,
        limit: query.limit ?? 10,
        search: query.search,
        vacancyCount: query.vacancyCount,
        isPcd: query.isPcd,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'CompanyNotFoundException') {
        this.logger.warn('Company not found for authenticated user', {
          userId: user.id,
        });
        throw new NotFoundException(error.message);
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

  @RequireAuth(UserRoleEnum.COMPANY)
  @Delete('me/vacancies/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deleta uma vaga da empresa autenticada' })
  @ApiNoContentResponse({ description: 'Vaga deletada com sucesso.' })
  @ApiNotFoundResponse({ description: 'Vaga nao encontrada.' })
  async deleteVacancy(
    @Req() req: Request & { user: AuthenticatedUser },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    try {
      this.logger.log(`Iniciando exclusão da vaga ${id}`);
      const companyId = req.user.companyId;
      if (!companyId) {
        throw new ForbiddenException('Token inválido: companyId ausente');
      }
      await this.companyService.deleteVacancy(id, companyId);
      this.logger.info('Vacancy deleted', { id });
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn('Vacancy not found', { id });
        throw new NotFoundException(error.message);
      }

      if (error instanceof ForbiddenException) {
        this.logger.warn('Forbidden deleting vacancy', { id });
        throw new ForbiddenException(error.message);
      }

      throw error;
    }
  }
}
