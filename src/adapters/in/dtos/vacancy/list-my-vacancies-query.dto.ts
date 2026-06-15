import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
  Min,
  IsEnum,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { WorkplaceTypeEnum } from '../../../../core/domain/enums/workplace-type.enum';

export class ListMyVacanciesQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'desenvolvedor' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  vacancyCount?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isPcd?: boolean;

  @ApiPropertyOptional({ example: 'presencial', enum: WorkplaceTypeEnum })
  @IsOptional()
  @IsEnum(WorkplaceTypeEnum)
  workType?: WorkplaceTypeEnum;
}
