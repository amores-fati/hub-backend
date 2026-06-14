import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class GetAdminVacanciesDto {
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

  @ApiPropertyOptional({
    example: 'estagiário',
    description: 'Busca parcial no título da vaga ou nome da empresa.',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Filtra vagas exclusivas para PCD.',
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  isPcd?: boolean;

  @ApiPropertyOptional({
    example: 'presencial',
    description: 'Tipo de vaga: presencial, online ou híbrida.',
    enum: ['presencial', 'online', 'híbrida'],
  })
  @IsString()
  @IsOptional()
  workType?: string;
}
