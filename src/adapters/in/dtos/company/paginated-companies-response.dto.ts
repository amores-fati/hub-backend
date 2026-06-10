import { ApiProperty } from '@nestjs/swagger';
import { CompanyResponseDto } from './company-response.dto';

export class PaginatedCompaniesResponseDto {
  @ApiProperty({ type: [CompanyResponseDto] })
  data: CompanyResponseDto[];

  @ApiProperty({ example: 245 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;
}
