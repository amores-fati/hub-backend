import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ExportVacanciesReportMode {
  SELECTED = 'selected',
  ALL = 'all',
}

export class ExportVacanciesReportFiltersDto {
  @ApiPropertyOptional({ example: 'Desenvolvedor' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPcd?: boolean;

  @ApiPropertyOptional({ example: '2026-04-01' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-04-30' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

export class ExportVacanciesReportDto {
  @ApiProperty({
    enum: ExportVacanciesReportMode,
    example: ExportVacanciesReportMode.ALL,
  })
  @IsEnum(ExportVacanciesReportMode)
  mode: ExportVacanciesReportMode;

  @ApiPropertyOptional({
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  ids?: string[];

  @ApiPropertyOptional({ type: ExportVacanciesReportFiltersDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExportVacanciesReportFiltersDto)
  filters?: ExportVacanciesReportFiltersDto;
}
