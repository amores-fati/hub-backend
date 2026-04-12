import { AccessibilityResourceType } from '../../../../core/domain/enums/accessibility-resource.enum';

import {
  IsString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAccessibilityResourceDto {
  @ApiProperty({
  example: AccessibilityResourceType.wheelchair,
})
@IsEnum(AccessibilityResourceType)
resource: AccessibilityResourceType;

  @ApiPropertyOptional({ example: 'Outro recurso específico' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  resourceOther?: string;
}