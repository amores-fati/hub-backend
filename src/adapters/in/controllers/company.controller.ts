import {
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ConflictException,
  NotFoundException,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { CreateCompanyDto } from '../dtos/company/create-company.dto';
import { UpdateCompanyDto } from '../dtos/company/update-company.dto';
import { PatchCompanyDto } from '../dtos/company/patch-company.dto';
import { CompanyService } from '../../../core/services/company.service';
import {
  CreateCompanyCommand,
  UpdateCompanyCommand,
} from '../../../core/command/company.command';

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
  @ApiBadRequestResponse({ description: 'Erro de validação.' })
  @ApiConflictResponse({ description: 'CNPJ já cadastrado na plataforma.' })
  async register(@Body() createCompanyDto: CreateCompanyDto) {
    try {
      const command: CreateCompanyCommand = { ...createCompanyDto };
      return await this.companyService.createCompany(command);
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === 'CompanyAlreadyExistsException'
      ) {
        throw new ConflictException(error.message);
      }

      if (error instanceof Error && error.name === 'DomainException') {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as empresas' })
  @ApiOkResponse({
    description: 'Retorna um array com todas as empresas cadastradas.',
  })
  async findAll() {
    return this.companyService.findAllCompanies();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma empresa por ID' })
  @ApiOkResponse({ description: 'Empresa encontrada com sucesso.' })
  @ApiNotFoundResponse({ description: 'Empresa não encontrada.' })
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

  @Get('cnpj/:cnpj')
  @ApiOperation({ summary: 'Busca uma empresa por CNPJ' })
  @ApiOkResponse({ description: 'Empresa encontrada com sucesso.' })
  @ApiNotFoundResponse({ description: 'Empresa não encontrada.' })
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

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza completamente os dados de uma empresa' })
  @ApiBody({ type: UpdateCompanyDto })
  @ApiOkResponse({ description: 'Empresa atualizada com sucesso.' })
  @ApiNotFoundResponse({ description: 'Empresa não encontrada.' })
  @ApiBadRequestResponse({ description: 'Erro de validação.' })
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

      if (error instanceof Error && error.name === 'DomainException') {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza parcialmente os dados de uma empresa' })
  @ApiBody({ type: PatchCompanyDto })
  @ApiOkResponse({ description: 'Empresa atualizada com sucesso.' })
  @ApiNotFoundResponse({ description: 'Empresa não encontrada.' })
  @ApiBadRequestResponse({ description: 'Erro de validação.' })
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

      if (error instanceof Error && error.name === 'DomainException') {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deleta uma empresa pelo ID' })
  @ApiNoContentResponse({ description: 'Empresa deletada com sucesso.' })
  @ApiNotFoundResponse({ description: 'Empresa não encontrada.' })
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
