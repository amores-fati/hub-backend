import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetAdminStudentsDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page = 1;

  @ApiPropertyOptional({ example: 20, enum: [20, 50], default: 20 })
  @Type(() => Number)
  @IsInt()
  @IsIn([20, 50])
  @IsOptional()
  pageSize: 20 | 50 = 20;

  @ApiPropertyOptional({
    example: 'joao',
    description: 'Busca por nome social, nome legal, e-mail ou CPF.',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: ['Porto Alegre/RS'], type: [String] })
  @Transform(
    ({ value }) =>
      (Array.isArray(value) ? value : value ? [value] : []) as string[],
  )
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  city?: string[];

  @ApiPropertyOptional({ example: ['visual'], type: [String] })
  @Transform(
    ({ value }) =>
      (Array.isArray(value) ? value : value ? [value] : []) as string[],
  )
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  disabilityType?: string[];

  @ApiPropertyOptional({ example: 'ONLINE', enum: ['ONLINE', 'PRESENCIAL'] })
  @IsString()
  @IsOptional()
  modality?: string;
}
