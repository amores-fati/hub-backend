import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CompanyStatus } from '../../../../core/domain/company-status.enum';

export enum ExportCompaniesReportMode {
  SELECTED = 'selected',
  ALL = 'all',
}

export class ExportCompaniesReportFiltersDto {
  @ApiPropertyOptional({ example: 'DB Server' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'RS' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    example: ['Porto Alegre/RS'],
    type: [String],
    description: 'Filtro por cidade. Formato: "Cidade/UF" ou "Cidade".',
  })
  @Transform(
    ({ value }) =>
      (Array.isArray(value) ? value : value ? [value] : []) as string[],
  )
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  city?: string[];

  @ApiPropertyOptional({
    enum: CompanyStatus,
    example: CompanyStatus.ATIVO,
  })
  @IsOptional()
  @IsEnum(CompanyStatus)
  status?: CompanyStatus;
}

export class ExportCompaniesReportDto {
  @ApiProperty({
    enum: ExportCompaniesReportMode,
    example: ExportCompaniesReportMode.ALL,
  })
  @IsEnum(ExportCompaniesReportMode)
  mode: ExportCompaniesReportMode;

  @ApiPropertyOptional({
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  ids?: string[];

  @ApiPropertyOptional({ type: ExportCompaniesReportFiltersDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExportCompaniesReportFiltersDto)
  filters?: ExportCompaniesReportFiltersDto;
}
