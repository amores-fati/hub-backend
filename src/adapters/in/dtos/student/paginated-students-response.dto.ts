import { ApiProperty } from '@nestjs/swagger';

export class StudentListItemDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'aluno@email.com' })
  email: string;

  @ApiProperty({ example: '123.***.***-09' })
  cpf: string;

  @ApiProperty({ example: 'João da Silva Full Name' })
  fullName: string;

  @ApiProperty({ example: 'Joãozinho', required: false })
  socialName?: string;

  @ApiProperty({ example: 'Porto Alegre', required: false })
  city?: string;

  @ApiProperty({ example: 'RS', required: false })
  state?: string;

  @ApiProperty({ example: true, required: false })
  hasDisability?: boolean;

  @ApiProperty({ example: 'visual', required: false })
  disabilityType?: string;

  @ApiProperty({
    example: 'ONLINE',
    enum: ['ONLINE', 'PRESENCIAL', 'NAO_INSCRITO'],
  })
  enrollmentStatus: 'ONLINE' | 'PRESENCIAL' | 'NAO_INSCRITO';
}

export class PaginatedStudentsMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20, enum: [20, 50] })
  pageSize: 20 | 50;

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}

export class PaginatedStudentsResponseDto {
  @ApiProperty({ type: [StudentListItemDto] })
  items: StudentListItemDto[];

  @ApiProperty({ type: PaginatedStudentsMetaDto })
  meta: PaginatedStudentsMetaDto;
}
