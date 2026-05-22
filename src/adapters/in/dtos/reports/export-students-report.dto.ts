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

export enum ExportStudentsReportMode {
  SELECTED = 'selected',
  ALL = 'all',
}

export class ExportStudentsReportFiltersDto {
  @ApiPropertyOptional({ example: 'Maria' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsString()
  course?: string;

  @ApiPropertyOptional({ example: 'Porto Alegre/RS' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'FISICO' })
  @IsOptional()
  @IsString()
  pcdType?: string;

  @ApiPropertyOptional({
    example: 'ENROLLMENT',
    enum: ['ENROLLMENT', 'INTEREST', 'NAO_INSCRITO'],
  })
  @IsOptional()
  @IsString()
  status?: string;
}

export class ExportStudentsReportDto {
  @ApiProperty({
    enum: ExportStudentsReportMode,
    example: ExportStudentsReportMode.ALL,
  })
  @IsEnum(ExportStudentsReportMode)
  mode: ExportStudentsReportMode;

  @ApiPropertyOptional({
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  ids?: string[];

  @ApiPropertyOptional({ type: ExportStudentsReportFiltersDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExportStudentsReportFiltersDto)
  filters?: ExportStudentsReportFiltersDto;
}
