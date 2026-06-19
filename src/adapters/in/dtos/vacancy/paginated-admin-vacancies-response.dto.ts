import { ApiProperty } from '@nestjs/swagger';

export class VacancyAdminListItemDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Estagiário Frontend' })
  title: string;

  @ApiProperty({ example: 'Empresa XPTO' })
  companyName: string;

  @ApiProperty({ example: 3 })
  openingsCount: number;

  @ApiProperty({ example: false })
  isPcd: boolean;

  @ApiProperty({ example: '2026-01-15T00:00:00.000Z' })
  announcementDate: Date;

  @ApiProperty({
    example: 'presencial',
    enum: ['presencial', 'online', 'híbrida'],
  })
  workplaceType: string;
}

export class PaginatedAdminVacanciesMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 245 })
  total: number;

  @ApiProperty({ example: 25 })
  totalPages: number;
}

export class PaginatedAdminVacanciesResponseDto {
  @ApiProperty({ type: [VacancyAdminListItemDto] })
  items: VacancyAdminListItemDto[];

  @ApiProperty({ type: PaginatedAdminVacanciesMetaDto })
  meta: PaginatedAdminVacanciesMetaDto;
}
