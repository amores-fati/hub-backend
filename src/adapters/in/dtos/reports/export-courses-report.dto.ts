import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseStatus } from '../../../../core/domain/course-status.enum';

export enum ExportCoursesReportMode {
  SELECTED = 'selected',
  ALL = 'all',
}

export class ExportCoursesReportFiltersDto {
  @ApiPropertyOptional({ example: 'Desenvolvimento Web' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'ONLINE' })
  @IsOptional()
  @IsString()
  modality?: string;

  @ApiPropertyOptional({ enum: CourseStatus, example: CourseStatus.ATIVO })
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;

  @ApiPropertyOptional({ example: '2026-02-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class ExportCoursesReportDto {
  @ApiProperty({
    enum: ExportCoursesReportMode,
    example: ExportCoursesReportMode.ALL,
  })
  @IsEnum(ExportCoursesReportMode)
  mode: ExportCoursesReportMode;

  @ApiPropertyOptional({
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  ids?: string[];

  @ApiPropertyOptional({ type: ExportCoursesReportFiltersDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExportCoursesReportFiltersDto)
  filters?: ExportCoursesReportFiltersDto;
}
