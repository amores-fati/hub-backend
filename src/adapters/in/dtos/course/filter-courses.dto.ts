import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterCoursesDto {
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

  @ApiPropertyOptional({ example: 'web', description: 'Busca parcial por nome, case-insensitive.' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: 'ONLINE', description: 'Modalidade: ONLINE, PRESENCIAL ou HIBRIDO.' })
  @IsString()
  @IsOptional()
  modality?: string;

  @ApiPropertyOptional({ example: '2025-01-01', description: 'Filtro: cursos com startDate >= este valor.' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-12-31', description: 'Filtro: cursos com endDate <= este valor.' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
