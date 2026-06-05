import { Transform, Type } from 'class-transformer';
import { IsBoolean } from 'class-validator';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetResumesQueryDto {
  @ApiPropertyOptional({
    example: 1,
    default: 1,
    description: 'Número da página (mínimo 1)',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page = 1;

  @ApiPropertyOptional({
    example: 20,
    default: 20,
    description: 'Número de itens por página (mínimo 1, máximo 50)',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit = 20;

  @ApiPropertyOptional({
    example: 'ana',
    description: 'Busca por nome completo, email ou CPF (apenas dígitos)',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    example: ['design', 'desenvolvimento'],
    type: [String],
    description:
      'Filtro por área de atuação do aluno. Aceita múltiplos valores.',
  })
  @Transform(
    ({ value }) =>
      (Array.isArray(value) ? value : value ? [value] : []) as string[],
  )
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  activityArea?: string[];

  @ApiPropertyOptional({
    example: 'Remoto',
    description: 'Filtro por preferência de trabalho',
  })
  @IsString()
  @IsOptional()
  preference?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Filtra currículos de alunos PCD',
  })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  @IsOptional()
  isPcd?: boolean;

  @ApiPropertyOptional({
    example: 'available',
    description: 'Filtro por status de disponibilidade',
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    example: ['Porto Alegre/RS', 'Canoas/RS'],
    type: [String],
    description:
      'Filtro por cidade do aluno. Use o formato "Cidade/UF" para filtrar por cidade e estado.',
  })
  @Transform(
    ({ value }) =>
      (Array.isArray(value) ? value : value ? [value] : []) as string[],
  )
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  city?: string[];
}
