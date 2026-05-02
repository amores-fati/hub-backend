import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class FilterStudentDto {
  @ApiPropertyOptional({
    description: 'Nome do aluno para filtrar a listagem.',
    example: 'João',
  })
  @IsOptional()
  @IsString()
  textFilter?: string;
  @IsOptional()
  @IsString()
  courseType?: string;
  @IsOptional()
  @IsString()
  location?: string;
  @IsOptional()
  @IsString()
  disability?: string;
}
