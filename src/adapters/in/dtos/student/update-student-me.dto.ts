import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateStudentMeDto {
  @ApiPropertyOptional({ example: 'João da Silva' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  fullName?: string;

  @ApiPropertyOptional({ example: 'João' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  socialName?: string;

  @ApiPropertyOptional({ example: '1995-05-20' })
  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @ApiPropertyOptional({ example: 'Masculino' })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({ example: 'Pardo' })
  @IsString()
  @IsOptional()
  race?: string;

  @ApiPropertyOptional({ example: '11999998888' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: 'São Paulo' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'SP' })
  @IsString()
  @IsOptional()
  @MaxLength(2)
  state?: string;

  @ApiPropertyOptional({ example: 'Rua das Flores, 123' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ example: '01234567' })
  @IsString()
  @IsOptional()
  @MaxLength(9)
  cep?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isPcd?: boolean;

  @ApiPropertyOptional({ example: 'Física' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  disabilityType?: string;

  @ApiPropertyOptional({ example: 'Ensino Médio Completo' })
  @IsString()
  @IsOptional()
  educationLevel?: string;

  @ApiPropertyOptional({ example: 'Técnico em Informática' })
  @IsString()
  @IsOptional()
  courseName?: string;

  @ApiPropertyOptional({ example: 'ETEC' })
  @IsString()
  @IsOptional()
  institution?: string;

  @ApiPropertyOptional({ example: 'Tecnologia' })
  @IsString()
  @IsOptional()
  workArea?: string | null;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  hasProgrammingExperience?: boolean;

  @ApiPropertyOptional({ example: 'Quero aprender programação...' })
  @IsString()
  @IsOptional()
  fatilabMotivation?: string;

  @ApiPropertyOptional({ example: 'Redes sociais' })
  @IsString()
  @IsOptional()
  howHeard?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  hasComputer?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  hasInternet?: boolean;

  @ApiPropertyOptional({ example: 'Até 1 salário mínimo' })
  @IsString()
  @IsOptional()
  familyIncome?: string;

  @ApiPropertyOptional({ example: 4 })
  @IsInt()
  @Min(1)
  @IsOptional()
  householdSize?: number;

  @ApiPropertyOptional({ example: 'Bolsa Família' })
  @IsString()
  @IsOptional()
  socialBenefits?: string;
}
