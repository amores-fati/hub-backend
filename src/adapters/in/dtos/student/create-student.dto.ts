import { IsString, IsNotEmpty, IsEmail, IsOptional, IsBoolean, MaxLength, ValidateNested, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsCpf } from '../../../../utils/validators/cpf.validator';
import { CreateContactDto } from '../contact/create-contact.dto';
import { CreateDisabilityDto } from '../disability/create-disability.dto';
import { CreateSocialBenefitDto } from '../social-benefit/create-social-benefit.dto';
import { CreateAccessibilityResourceDto } from '../accessibility-resource/create-accessibility-resource.dto';

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
    description: 'Senha de acesso à plataforma',
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

  @ApiPropertyOptional({ example: 'João social' })
  @IsString()
  @IsOptional()
  socialName?: string;

  @ApiProperty({ example: '1995-05-20' })
  @IsString()
  @IsNotEmpty()
  birthDate: string;

  @ApiProperty({ example: 'Masculino' })
  @IsString()
  @IsNotEmpty()
  gender: string;

  @ApiProperty({ example: 'Parda' })
  @IsString()
  @IsNotEmpty()
  race: string;

  @ApiPropertyOptional({ example: 'Médio completo' })
  @IsString()
  @IsOptional()
  education?: string;

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
  activityArea?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  hasProgrammingExperience?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  hasTechCourses?: boolean;

  @ApiPropertyOptional({ example: 'Excel, Informática Básica' })
  @IsString()
  @IsOptional()
  techCoursesList?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  sendCurriculum?: boolean;

  @ApiPropertyOptional({ example: 'Quero aprender programação.' })
  @IsString()
  @IsOptional()
  fatilabMotivation?: string;

  @ApiPropertyOptional({ example: 'Instagram' })
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