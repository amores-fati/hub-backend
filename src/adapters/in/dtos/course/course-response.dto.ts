import { ApiProperty } from '@nestjs/swagger';
import { Course } from '../../../../core/domain/course.entity';

export type CourseModalityResponse = 'presencial' | 'online' | 'hibrido';

export class CourseResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Desenvolvimento Web Full Stack' })
  title: string;

  @ApiProperty({
    example: 'Curso completo de desenvolvimento web.',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({ enum: ['presencial', 'online', 'hibrido'], example: 'online' })
  modality: CourseModalityResponse;

  @ApiProperty({ example: 120 })
  workloadHours: number;

  @ApiProperty({ example: 30 })
  vacancyCount: number;

  @ApiProperty({ example: '2025-02-01T00:00:00.000Z' })
  startDate: string;

  @ApiProperty({ example: '2025-06-30T00:00:00.000Z' })
  endDate: string;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  enrollmentStart: string;

  @ApiProperty({ example: '2025-01-28T00:00:00.000Z' })
  enrollmentEnd: string;

  @ApiProperty({ example: 'Porto Alegre - RS', nullable: true })
  location: string | null;

  @ApiProperty({ example: 'morning', nullable: true })
  shift: string | null;

  @ApiProperty({
    example: 'https://fatilab.com/banners/web.jpg',
    nullable: true,
  })
  imageUrl: string | null;

  @ApiProperty({ example: 'https://fatilab.com/cursos/web', nullable: true })
  externalLink: string | null;
}

function normalizeModality(raw: string): CourseModalityResponse {
  const value = (raw ?? '').trim().toLowerCase();
  if (value === 'presencial') return 'presencial';
  if (value === 'hibrido' || value === 'híbrido') return 'hibrido';
  return 'online';
}

function parseWorkloadHours(raw: string): number {
  const match = (raw ?? '').match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

function toIsoString(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString();
}

export function toCourseResponse(
  course: Course,
  location: string | null = null,
): CourseResponseDto {
  return {
    id: course.id,
    title: course.name,
    description: course.description ?? null,
    modality: normalizeModality(course.modality),
    workloadHours: parseWorkloadHours(course.courseLoad),
    vacancyCount: course.vacancyCount,
    startDate: toIsoString(course.startDate),
    endDate: toIsoString(course.endDate),
    enrollmentStart: toIsoString(course.startRegistrations),
    enrollmentEnd: toIsoString(course.endRegistrations),
    location,
    shift: course.shift ?? null,
    imageUrl: course.banner?.trim() ? course.banner : null,
    externalLink: course.linkAccess?.trim() ? course.linkAccess : null,
  };
}
