import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SocialBenefitType } from '../../../../core/domain/enums/social-benefit.enum';

export class CreateSocialBenefitDto {
  @ApiProperty({
    example: SocialBenefitType.BOLSA_FAMILIA,
  })
  @IsEnum(SocialBenefitType)
  benefit: SocialBenefitType;
}
