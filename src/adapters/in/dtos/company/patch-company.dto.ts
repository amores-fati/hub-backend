import { PartialType } from '@nestjs/swagger';
import { UpdateCompanyDto } from './update-company.dto';

export class PatchCompanyDto extends PartialType(UpdateCompanyDto) {}
