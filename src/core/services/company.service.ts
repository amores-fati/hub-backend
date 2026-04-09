import { Company } from '../domain/company.entity';
import { ICompanyRepository } from '../ports/company.repository.interface';
import { randomUUID } from 'crypto';

export class CompanyService {
  constructor(private readonly companyRepository: ICompanyRepository) {}

  async createCompany(name: string, cnpj: string, email: string, city: string, state: string, street: string, neighborhood: string, cep: number, number: number, responsibleName: string, phone: number, password: string): Promise<Company> {
    const company = new Company(
      randomUUID(),
      name,
      cnpj,
      email,
      city,
      state,
      street,
      neighborhood,
      cep,
      number,
      responsibleName,
      phone,
      new Date(),
      new Date()
    );
    return this.companyRepository.create(company);
  }

  async findAllCompanies(): Promise<Company[]> {
    return this.companyRepository.findAll();
  }
}
