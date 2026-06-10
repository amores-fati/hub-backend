import { Company } from '../domain/company.entity';
import { CompanyStatus } from '../domain/company-status.enum';

export const ICompanyRepository = Symbol('ICompanyRepository');

export interface CompanyFilterOptions {
  search?: string;
  status?: CompanyStatus;
}

export interface CompanyWithStatus {
  company: Company;
  status: CompanyStatus;
}

export interface ICompanyRepository {
  create(company: Company): Promise<Company>;
  findAll(): Promise<Company[]>;
  findById(id: string): Promise<Company | null>;
  existsById(id: string): Promise<boolean>;
  findByCnpj(cnpj: string): Promise<Company | null>;
  update(company: Company): Promise<Company>;
  delete(id: string): Promise<void>;
  findLocations(): Promise<{ city: string; uf: string }[]>;
  findManyByFilters(
    filters: CompanyFilterOptions,
    page: number,
    limit: number
  ): Promise<{ data: CompanyWithStatus[]; total: number }>;
}
