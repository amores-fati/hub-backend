import { AccessibilityResourceType } from '../../../../core/domain/enums/accessibility-resource.enum';
import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAccessibilityResourceDto {
  @ApiProperty({
    example: AccessibilityResourceType.wheelchair,
  })
  @IsEnum(AccessibilityResourceType)
  resource: AccessibilityResourceType;
}
