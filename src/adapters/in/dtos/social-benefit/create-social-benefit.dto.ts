import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SocialBenefitType } from '../../../../core/domain/enums/social-benefit.enum';

export class CreateSocialBenefitDto {
  @ApiProperty({
    example: SocialBenefitType.bolsaFamilia,
  })
  @IsEnum(SocialBenefitType)
  benefit: SocialBenefitType;

  @ApiPropertyOptional({ example: 'Outro benefício específico' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  benefitOther?: string;
}
