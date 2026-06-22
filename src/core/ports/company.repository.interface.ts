import { Company } from '../domain/company.entity';
import { CompanyStatus } from '../domain/company-status.enum';

export const ICompanyRepository = Symbol('ICompanyRepository');

export interface CompanyFilterOptions {
  search?: string;
  status?: CompanyStatus;
  state?: string;
  city?: string[];
}

export interface CompanyWithStatus {
  company: Company;
  status: CompanyStatus;
}

export interface CompanyReportProjection {
  id: string;
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  state?: string;
  city?: string;
  neighbourhood?: string;
  status: CompanyStatus;
  createdAt: Date;
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
    limit: number,
  ): Promise<{ data: CompanyWithStatus[]; total: number }>;
  findManyForReportByIds(ids: string[]): Promise<CompanyReportProjection[]>;
  findManyForReportByFilters(
    filters?: CompanyFilterOptions,
  ): Promise<CompanyReportProjection[]>;
}
