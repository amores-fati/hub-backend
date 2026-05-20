import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, Max } from 'class-validator';
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
}
