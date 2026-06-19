import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CompanyStatus } from '../../../../core/domain/company-status.enum';

export class FilterCompaniesDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit = 10;

  @ApiPropertyOptional({
    example: 'DB Server',
    description:
      'Busca parcial por razão social, CNPJ ou e-mail, case-insensitive.',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    example: 'RS',
    description: 'Filtro por UF da empresa.',
  })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({
    example: 'Porto Alegre',
    description: 'Filtro por cidade da empresa.',
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    enum: CompanyStatus,
    example: CompanyStatus.ATIVO,
    description: 'Filtro por situação da empresa.',
  })
  @IsEnum(CompanyStatus)
  @IsOptional()
  status?: CompanyStatus;
}
