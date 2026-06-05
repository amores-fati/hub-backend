import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseStatus } from '../../../../core/domain/course-status.enum';

export class CreateCourseDto {
  @ApiProperty({
    example: 'Desenvolvimento Web Full Stack',
    description: 'Nome do curso.',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'https://fatilab.com/banners/web.jpg',
    description:
      'URL externa do banner de divulgacao do curso. Opcional quando bannerImage e enviado.',
  })
  @IsOptional()
  @IsString()
  banner?: string;

  @ApiPropertyOptional({
    example: 'iVBORw0KGgoAAAANSUhEUgAAA...',
    description:
      'Imagem do banner codificada em base64 (somente os bytes, sem o prefixo data:). Armazenada como BYTEA no banco.',
  })
  @IsOptional()
  @IsString()
  bannerImage?: string;

  @ApiPropertyOptional({
    example: 'image/png',
    description:
      'Mime type da imagem enviada em bannerImage. Obrigatorio quando bannerImage e enviado.',
  })
  @IsOptional()
  @IsString()
  bannerImageMimeType?: string;

  @ApiProperty({
    example: 'Curso completo de desenvolvimento web com React e Node.js.',
    description: 'Descricao detalhada do curso.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

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
    example: 'online',
    description: 'Modalidade do curso (Ex: online, presencial).',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['online', 'presencial', 'ONLINE', 'PRESENCIAL'])
  modality: string;

  @ApiProperty({
    example: 'morning',
    description: 'Turno do curso (morning, afternoon ou evening).',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['morning', 'afternoon', 'evening', 'manha-tarde'])
  shift: string;

  @ApiPropertyOptional({
    example: 'Instituto Caldeira, Porto Alegre - RS',
    description: 'Endereço do curso presencial.',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    example: 'https://fatilab.com/cursos/web',
    description:
      'URL do formulário de inscrição no site do parceiro responsável pelo curso. O aluno é redirecionado para este link ao se inscrever.',
  })
  @IsOptional()
  @IsString()
  linkAccess?: string;

  @ApiProperty({
    example: 30,
    description: 'Quantidade de vagas oferecidas no curso.',
  })
  @IsInt()
  @Min(0)
  vacancyCount: number;

  @ApiPropertyOptional({
    enum: CourseStatus,
    example: CourseStatus.ATIVO,
    description: 'Status administrativo do curso.',
  })
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;
}
