import { Company } from '../domain/company.entity';
import { ICompanyRepository } from '../ports/company.repository.interface';
import { randomUUID } from 'crypto';
import { CompanyNotFoundException } from '../exceptions/company-not-found.exception';
import { CompanyAlreadyExistsException } from '../exceptions/company-already-exists.exception';
import {
  CreateCompanyCommand,
  PatchCompanyCommand,
  UpdateCompanyCommand,
} from '../command/company.command';
import { Contact } from '../domain/contact.entity';

export class CompanyService {
  constructor(private readonly companyRepository: ICompanyRepository) {}

  async createCompany(command: CreateCompanyCommand): Promise<Company> {
    const existingCompany = await this.companyRepository.findByCnpj(
      command.cnpj,
    );
    if (existingCompany) {
      throw new CompanyAlreadyExistsException(command.cnpj);
    }

    const companyId = randomUUID();

    const contact = new Contact(
      companyId,
      command.contact.phone,
      command.contact.neighbourhood,
      command.contact.state,
      command.contact.city,
      command.contact.address,
      command.contact.cep,
      command.contact.complement,
    );

    const company = new Company(
      companyId,
      command.email,
      command.password,
      command.name,
      command.cnpj,
      command.ownerName,
      contact,
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

  async updateCompany(
    id: string,
    command: UpdateCompanyCommand,
  ): Promise<Company> {
    const company = await this.getCompanyById(id);

    company.changeEmail(command.email);
    company.changePassword(command.password);
    company.changeName(command.name);
    company.changeOwnerName(command.ownerName);

    company.contact.changePhone(command.contact.phone);
    company.contact.changeAddress({
      neighbourhood: command.contact.neighbourhood,
      state: command.contact.state,
      city: command.contact.city,
      address: command.contact.address,
      cep: command.contact.cep,
      complement: command.contact.complement,
    });

    return this.companyRepository.update(company);
  }

  async patchCompany(
    id: string,
    command: PatchCompanyCommand,
  ): Promise<Company> {
    const company = await this.getCompanyById(id);

    if (command.email !== undefined) company.changeEmail(command.email);
    if (command.password !== undefined)
      company.changePassword(command.password);
    if (command.name !== undefined) company.changeName(command.name);
    if (command.ownerName !== undefined)
      company.changeOwnerName(command.ownerName);

    if (command.contact) {
      if (command.contact.phone !== undefined)
        company.contact.changePhone(command.contact.phone);
      if (command.contact.neighbourhood !== undefined)
        company.contact.changeAddress({
          neighbourhood: command.contact.neighbourhood,
        });
      if (command.contact.state !== undefined)
        company.contact.changeAddress({ state: command.contact.state });
      if (command.contact.city !== undefined)
        company.contact.changeAddress({ city: command.contact.city });
      if (command.contact.address !== undefined)
        company.contact.changeAddress({ address: command.contact.address });
      if (command.contact.cep !== undefined)
        company.contact.changeAddress({ cep: command.contact.cep });
      if (command.contact.complement !== undefined)
        company.contact.changeAddress({
          complement: command.contact.complement,
        });
    }

    return this.companyRepository.update(company);
  }

  async deleteCompany(id: string): Promise<void> {
    const company = await this.getCompanyById(id);
    await this.companyRepository.delete(company.id);
  }
}
