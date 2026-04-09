import { Company } from '../domain/company.entity';

export const ICompanyRepository = Symbol('ICompanyRepository');

export interface ICompanyRepository {
  create(company: Company): Promise<Company>;
  findAll(): Promise<Company[]>;
}
