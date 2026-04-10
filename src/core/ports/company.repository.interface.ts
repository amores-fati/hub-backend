import { Company } from '../domain/company.entity';

export const ICompanyRepository = Symbol('ICompanyRepository');

export interface ICompanyRepository {
  create(company: Company): Promise<Company>;
  findAll(): Promise<Company[]>;
  findById(id: string): Promise<Company | null>;
  findByCnpj(cnpj: string): Promise<Company | null>;
  update(company: Company): Promise<Company>;
  delete(id: string): Promise<void>;
}
