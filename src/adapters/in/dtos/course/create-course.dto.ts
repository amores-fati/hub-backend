import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({
    example: 'Desenvolvimento Web Full Stack',
    description: 'Nome do curso.',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'https://fatilab.com/banners/web.jpg',
    description: 'URL do banner de divulgacao do curso.',
  })
  @IsString()
  @IsNotEmpty()
  banner: string;

  @ApiPropertyOptional({
    example: 'Curso completo de desenvolvimento web com React e Node.js.',
    description: 'Descricao detalhada do curso.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: '120h',
    description: 'Carga horaria apresentada ao usuario.',
  })
  @IsString()
  @IsNotEmpty()
  courseLoad: string;

  @ApiProperty({
    example: '2025-02-01T00:00:00.000Z',
    description: 'Data de inicio do curso.',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    example: '2025-06-30T00:00:00.000Z',
    description: 'Data de encerramento do curso.',
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    example: '2025-01-01T00:00:00.000Z',
    description: 'Data de abertura das inscricoes.',
  })
  @IsDateString()
  startRegistrations: string;

  @ApiProperty({
    example: '2025-01-28T00:00:00.000Z',
    description: 'Data final das inscricoes.',
  })
  @IsDateString()
  endRegistrations: string;

  @ApiProperty({
    example: 'https://fatilab.com/cursos/web',
    description: 'Link de acesso ou landing page do curso.',
  })
  @IsString()
  @IsNotEmpty()
  linkAccess: string;
}
