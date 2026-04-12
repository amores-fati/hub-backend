import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDisabilityDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  hasDisability: boolean;

  @ApiPropertyOptional({ example: 'Paraplegia nos membros inferiores' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'Sim' })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  hasReport?: string;

  @ApiPropertyOptional({ example: 'Física' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  type?: string;
}
