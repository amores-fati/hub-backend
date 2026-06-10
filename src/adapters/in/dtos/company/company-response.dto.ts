import { ApiProperty } from '@nestjs/swagger';
import { Company } from '../../../../core/domain/company.entity';
import { CompanyStatus } from '../../../../core/domain/company-status.enum';

export class CompanyResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: 'Tech Corp Ltda' })
  name!: string;

  @ApiProperty({ example: '60680743000181' })
  cnpj!: string;

  @ApiProperty({ example: 'contato@techcorp.com' })
  email!: string;

  @ApiProperty({ example: 'João da Silva' })
  responsibleName!: string;

  @ApiProperty({ enum: CompanyStatus, example: CompanyStatus.ATIVO })
  status!: CompanyStatus;
}

export function toCompanyResponse(
  company: Company,
  status: CompanyStatus,
): CompanyResponseDto {
  return {
    id: company.id,
    name: company.name,
    cnpj: company.cnpj,
    email: company.email,
    responsibleName: company.responsibleName,
    status,
  };
}
