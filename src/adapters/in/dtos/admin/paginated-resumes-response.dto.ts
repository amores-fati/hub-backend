import { ApiProperty } from '@nestjs/swagger';

export class ResumeListItemDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  studentId: string;

  @ApiProperty({ example: '123.456.789-00' })
  cpf: string;

  @ApiProperty({ example: 'João da Silva' })
  fullName: string;

  @ApiProperty({ example: 'Joãozinho', required: false })
  socialName?: string;

  @ApiProperty({ example: 'aluno@email.com' })
  email: string;

  @ApiProperty({ example: true })
  isAvailable: boolean;

  @ApiProperty({ example: 'Desenvolvedor Full Stack com experiência em...', required: false })
  about?: string;

  @ApiProperty({ example: 'https://linkedin.com/in/joao', required: false })
  linkedin?: string;

  @ApiProperty({ example: 'https://github.com/joao', required: false })
  github?: string;

  @ApiProperty({ example: 'Remoto', required: false })
  preference?: string;

  @ApiProperty({ example: '(51) 99999-9999', required: false })
  phone?: string;

  @ApiProperty({ example: 'Porto Alegre', required: false })
  city?: string;

  @ApiProperty({ example: 'RS', required: false })
  state?: string;
}

export class PaginatedResumesMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}

export class PaginatedResumesResponseDto {
  @ApiProperty({ type: [ResumeListItemDto] })
  data: ResumeListItemDto[];

  @ApiProperty({ type: PaginatedResumesMetaDto })
  meta: PaginatedResumesMetaDto;
}
