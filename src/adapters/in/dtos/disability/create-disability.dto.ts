import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDisabilityDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  hasDisability: boolean;

  @ApiPropertyOptional({ example: 'Física' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  type?: string;
}
