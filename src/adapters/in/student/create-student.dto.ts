import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
  Equals,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsCpf } from '../../../utils/validators/cpf.validator';
import { IsCep } from '../../../utils/validators/cep.validator';

export class CreateStudentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  socialName?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsCpf()
  cpf!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  birthDate!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty()
  @IsEmail({}, { message: 'Deve ser um e-mail válido' })
  @IsNotEmpty()
  email!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  gender!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  race!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsCep()
  cep!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  complement?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  neighborhood?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  education!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  institution?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fatilabMotivation!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  howHeard?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasComputer?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasInternet?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  committedToParticipate?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  familyIncome?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  householdSize?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  socialBenefits?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasProgrammingExperience?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasTechCourses?: boolean;

  @ValidateIf((o) => o.hasTechCourses === true)
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  techCoursesList?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isEmployed?: boolean;

  @ValidateIf((o) => o.isEmployed === true)
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  workArea?: string;

  @ApiProperty()
  @IsBoolean()
  isPcd!: boolean;

  @ValidateIf((o) => o.isPcd === true)
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  disabilityType?: string;

  @ValidateIf((o) => o.isPcd === true)
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  disabilityDescription?: string;

  @ValidateIf((o) => o.isPcd === true)
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  hasMedicalReport?: string;

  @ValidateIf((o) => o.isPcd === true)
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  accessibilityResources?: string;

  @ValidateIf((o) => o.isPcd === true)
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  specificAccessibilityNeeds?: string;

  @ApiProperty()
  @IsBoolean()
  authorizesImageUse!: boolean;

  @ApiProperty()
  @Equals(true, {
    message: 'acceptsLgpd deve ser verdadeiro para realizar o cadastro',
  })
  acceptsLgpd!: boolean;
}