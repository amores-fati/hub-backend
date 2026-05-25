import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ExportResumesReportMode {
  SELECTED = 'selected',
  ALL = 'all',
}

export enum ExportResumesReportStatus {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
}

export class ExportResumesReportFiltersDto {
  @ApiPropertyOptional({ example: 'Maria' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'Backend' })
  @IsOptional()
  @IsString()
  interestArea?: string;

  @ApiPropertyOptional({ example: 'Remoto' })
  @IsOptional()
  @IsString()
  preference?: string;

  @ApiPropertyOptional({
    enum: ExportResumesReportStatus,
    example: ExportResumesReportStatus.ATIVO,
  })
  @IsOptional()
  @IsEnum(ExportResumesReportStatus)
  status?: ExportResumesReportStatus;
}

export class ExportResumesReportDto {
  @ApiProperty({
    enum: ExportResumesReportMode,
    example: ExportResumesReportMode.ALL,
  })
  @IsEnum(ExportResumesReportMode)
  mode: ExportResumesReportMode;

  @ApiPropertyOptional({
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  ids?: string[];

  @ApiPropertyOptional({ type: ExportResumesReportFiltersDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExportResumesReportFiltersDto)
  filters?: ExportResumesReportFiltersDto;
}
