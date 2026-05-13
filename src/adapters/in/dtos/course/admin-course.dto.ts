import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CourseModality {
  PRESENTIAL = 'presential',
  ONLINE = 'online',
}

export enum CourseShift {
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  EVENING = 'evening',
}

export class AdminCourseDto {
  @ApiProperty({ example: 'Desenvolvimento Web Full Stack' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Curso completo de desenvolvimento web com React e Node.js.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: CourseModality, example: CourseModality.ONLINE })
  @IsEnum(CourseModality)
  modality: CourseModality;

  @ApiProperty({ enum: CourseShift, example: CourseShift.MORNING })
  @IsEnum(CourseShift)
  shift: CourseShift;

  @ApiPropertyOptional({ example: 'https://fatilab.com/banners/web.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'Rua Siqueira Campos, 1184 - Porto Alegre' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 30, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  vacancyCount?: number;

  @ApiPropertyOptional({ example: 120, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  workloadHours?: number;

  @ApiPropertyOptional({
    example: '2025-02-01',
    description: 'Formato YYYY-MM-DD',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2025-06-30',
    description: 'Formato YYYY-MM-DD',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    example: '2025-01-01',
    description: 'Formato YYYY-MM-DD',
  })
  @IsOptional()
  @IsDateString()
  enrollmentStart?: string;

  @ApiPropertyOptional({
    example: '2025-01-28',
    description: 'Formato YYYY-MM-DD',
  })
  @IsOptional()
  @IsDateString()
  enrollmentEnd?: string;
}
