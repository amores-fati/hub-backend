import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { IsCpf } from '../../../../utils/validators/cpf.validator';
import { CreateContactDto } from '../contact/create-contact.dto';
import { CreateDisabilityDto } from '../disability/create-disability.dto';
import { CreateSocialBenefitDto } from '../social-benefit/create-social-benefit.dto';
import {
  EducationLevel,
  Gender,
  HowHeardChannel,
  Race,
  FamilyIncome,
} from '../../../../core/domain/enums/student-profile.enum';

export class CreateStudentDto {
  @ApiProperty({
    example: 'joao@email.com',
    description: 'E-mail do aluno',
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
  email: string;

  @ApiProperty({
    example: 'SenhaForte123!',
    description: 'Senha de acesso a plataforma',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  password: string;

  @ApiProperty({
    example: 'João da Silva',
    description: 'Nome legal do aluno',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName: string;

  @ApiPropertyOptional({
    example: 'Joãozinho',
    description: 'Nome social do aluno',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  socialName?: string;

  @ApiProperty({
    example: '52998224725',
    description: 'CPF do aluno',
  })
  @IsCpf()
  @IsNotEmpty()
  @MaxLength(14)
  cpf: string;

  @ApiProperty({ example: '1995-05-20' })
  @IsDateString()
  @IsNotEmpty()
  birthDate: string;

  @ApiProperty({ enum: Gender, example: Gender.MALE })
  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender;

  @ApiProperty({ enum: Race, example: Race.BROWN })
  @IsEnum(Race)
  @IsNotEmpty()
  race: Race;

  @ApiPropertyOptional({
    enum: EducationLevel,
    example: EducationLevel.SECONDARY,
  })
  @IsEnum(EducationLevel)
  @IsOptional()
  education?: EducationLevel;

  @ApiPropertyOptional({ example: 'ETEC' })
  @IsString()
  @IsOptional()
  institution?: string;

  @ApiPropertyOptional({ example: 'Tecnologia' })
  @IsString()
  @IsOptional()
  activityArea?: string;

  @ApiPropertyOptional({ example: 'Programação Web' })
  @IsString()
  @IsOptional()
  courseName?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  hasProgrammingExperience?: boolean;

  @ApiPropertyOptional({
    enum: FamilyIncome,
    example: FamilyIncome.TO1_SALARY,
  })
  @IsEnum(FamilyIncome)
  @IsOptional()
  familyIncome?: FamilyIncome;

  @ApiPropertyOptional({ example: 'Quero aprender programacao.' })
  @IsString()
  @IsOptional()
  motivation?: string;

  @ApiPropertyOptional({
    enum: HowHeardChannel,
    example: HowHeardChannel.INSTAGRAM,
  })
  @IsEnum(HowHeardChannel)
  @IsOptional()
  howHeard?: HowHeardChannel;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  hasComputer?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  hasInternet?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  committedToParticipate?: boolean;

  @ApiProperty({ type: () => CreateContactDto })
  @ValidateNested()
  @Type(() => CreateContactDto)
  contact: CreateContactDto;

  @ApiPropertyOptional({ type: () => CreateDisabilityDto })
  @ValidateNested()
  @Type(() => CreateDisabilityDto)
  @IsOptional()
  disability?: CreateDisabilityDto;

  @ApiPropertyOptional({ type: () => [CreateSocialBenefitDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSocialBenefitDto)
  @IsOptional()
  socialBenefits?: CreateSocialBenefitDto[];

  @ApiPropertyOptional({ example: 4 })
  @IsInt()
  @Min(1)
  @IsOptional()
  householdSize?: number;
}
