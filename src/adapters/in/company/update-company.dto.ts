import { OmitType } from '@nestjs/swagger';
import { CreateCompanyDto } from './create-company.dto';

export class UpdateCompanyDto extends OmitType(CreateCompanyDto, [
  'password',
] as const) {}
