import { Company } from '../domain/company.entity';
import { ICompanyRepository } from '../ports/company.repository.interface';
import { randomUUID } from 'crypto';
import { CompanyNotFoundException } from '../exceptions/company-not-found.exception';
import { CompanyAlreadyExistsException } from '../exceptions/company-already-exists.exception';

export type CompanyUpdateData = Omit<Company, 'id' | 'createdAt' | 'updatedAt'>;

export class CompanyService {
  constructor(private readonly companyRepository: ICompanyRepository) {}

  async createCompany(
    name: string,
    cnpj: string,
    email: string,
    city: string,
    state: string,
    street: string,
    neighborhood: string,
    cep: string,
    number: number,
    responsibleName: string,
    phone: string,
    password: string,
  ): Promise<Company> {
    const existingCompany = await this.companyRepository.findByCnpj(cnpj);
    if (existingCompany) {
      throw new CompanyAlreadyExistsException(cnpj);
    }

    console.log(password); // temporary fix

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
      new Date(),
    );
    return this.companyRepository.create(company);
  }

  async findAllCompanies(): Promise<Company[]> {
    return this.companyRepository.findAll();
  }

  async getCompanyById(id: string): Promise<Company> {
    const company = await this.companyRepository.findById(id);
    if (!company) {
      throw new CompanyNotFoundException(id);
    }
    return company;
  }

  async getCompanyByCnpj(cnpj: string): Promise<Company> {
    const company = await this.companyRepository.findByCnpj(cnpj);
    if (!company) {
      throw new CompanyNotFoundException(cnpj);
    }
    return company;
  }

  async updateCompany(id: string, data: CompanyUpdateData): Promise<Company> {
    const company = await this.getCompanyById(id);

    company.name = data.name;
    company.cnpj = data.cnpj;
    company.email = data.email;
    company.city = data.city;
    company.state = data.state;
    company.street = data.street;
    company.neighborhood = data.neighborhood;
    company.cep = data.cep;
    company.number = data.number;
    company.responsibleName = data.responsibleName;
    company.phone = data.phone;

    return this.companyRepository.update(company);
  }

  async patchCompany(
    id: string,
    data: Partial<CompanyUpdateData>,
  ): Promise<Company> {
    const company = await this.getCompanyById(id);

    if (data.name !== undefined) company.name = data.name;
    if (data.cnpj !== undefined) company.cnpj = data.cnpj;
    if (data.email !== undefined) company.email = data.email;
    if (data.city !== undefined) company.city = data.city;
    if (data.state !== undefined) company.state = data.state;
    if (data.street !== undefined) company.street = data.street;
    if (data.neighborhood !== undefined)
      company.neighborhood = data.neighborhood;
    if (data.cep !== undefined) company.cep = data.cep;
    if (data.number !== undefined) company.number = data.number;
    if (data.responsibleName !== undefined)
      company.responsibleName = data.responsibleName;
    if (data.phone !== undefined) company.phone = data.phone;

    return this.companyRepository.update(company);
  }

  async deleteCompany(id: string): Promise<void> {
    const company = await this.getCompanyById(id);
    await this.companyRepository.delete(company.id);
  }
}
