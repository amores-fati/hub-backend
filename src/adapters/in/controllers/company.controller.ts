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
import { CreateCompanyDto } from '../dtos/company/create-company.dto';
import { PatchCompanyDto } from '../dtos/company/patch-company.dto';
import { UpdateCompanyDto } from '../dtos/company/update-company.dto';

@ApiTags('Companies')
@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

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
      const command: CreateCompanyCommand = { ...createCompanyDto };
      return await this.companyService.createCompany(command);
    } catch (error) {
      if (
        error instanceof Error &&
        (error.name === 'CompanyAlreadyExistsException' ||
          error.name === 'UserAlreadyExistsException')
      ) {
        throw new ConflictException(error.message);
      }

      if (error instanceof Error && error.name === 'DomainException') {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  @RequireAuth()
  @Get()
  @ApiOperation({ summary: 'Lista todas as empresas' })
  @ApiOkResponse({
    description: 'Retorna um array com todas as empresas cadastradas.',
  })
  async findAll() {
    return this.companyService.findAllCompanies();
  }

  @RequireAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Busca uma empresa por ID' })
  @ApiOkResponse({ description: 'Empresa encontrada com sucesso.' })
  @ApiNotFoundResponse({ description: 'Empresa nao encontrada.' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    try {
      return await this.companyService.getCompanyById(id);
    } catch (error) {
      if (error instanceof Error && error.name === 'CompanyNotFoundException') {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @RequireAuth()
  @Get('cnpj/:cnpj')
  @ApiOperation({ summary: 'Busca uma empresa por CNPJ' })
  @ApiOkResponse({ description: 'Empresa encontrada com sucesso.' })
  @ApiNotFoundResponse({ description: 'Empresa nao encontrada.' })
  async findByCnpj(@Param('cnpj') cnpj: string) {
    try {
      return await this.companyService.getCompanyByCnpj(cnpj);
    } catch (error) {
      if (error instanceof Error && error.name === 'CompanyNotFoundException') {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @RequireAuth()
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
      const command: UpdateCompanyCommand = { ...updateCompanyDto };
      return await this.companyService.updateCompany(id, command);
    } catch (error) {
      if (error instanceof Error && error.name === 'CompanyNotFoundException') {
        throw new NotFoundException(error.message);
      }

      if (
        error instanceof Error &&
        error.name === 'UserAlreadyExistsException'
      ) {
        throw new ConflictException(error.message);
      }

      if (error instanceof Error && error.name === 'DomainException') {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  @RequireAuth()
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
      return await this.companyService.patchCompany(id, patchCompanyDto);
    } catch (error) {
      if (error instanceof Error && error.name === 'CompanyNotFoundException') {
        throw new NotFoundException(error.message);
      }

      if (
        error instanceof Error &&
        error.name === 'UserAlreadyExistsException'
      ) {
        throw new ConflictException(error.message);
      }

      if (error instanceof Error && error.name === 'DomainException') {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  @RequireAuth()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deleta uma empresa pelo ID' })
  @ApiNoContentResponse({ description: 'Empresa deletada com sucesso.' })
  @ApiNotFoundResponse({ description: 'Empresa nao encontrada.' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    try {
      await this.companyService.deleteCompany(id);
    } catch (error) {
      if (error instanceof Error && error.name === 'CompanyNotFoundException') {
        throw new NotFoundException(error.message);
      }

      if (error instanceof Error && error.name === 'DomainException') {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }
}
