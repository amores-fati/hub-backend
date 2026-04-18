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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { IsCpf } from '../../../../utils/validators/cpf.validator';
import { CreateAccessibilityResourceDto } from '../accessibility-resource/create-accessibility-resource.dto';
import { CreateContactDto } from '../contact/create-contact.dto';
import { CreateDisabilityDto } from '../disability/create-disability.dto';
import { CreateSocialBenefitDto } from '../social-benefit/create-social-benefit.dto';
import {
  EducationLevel,
  Gender,
  HowHeardChannel,
  Race,
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

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  hasProgrammingExperience?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  hasTechnologyCourse?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  sendCurriculum?: boolean;

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

  @ApiPropertyOptional({ type: () => [CreateAccessibilityResourceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAccessibilityResourceDto)
  @IsOptional()
  accessibilityResources?: CreateAccessibilityResourceDto[];
}
