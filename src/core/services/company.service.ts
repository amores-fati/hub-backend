import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Company } from '../domain/company.entity';
import { ICompanyRepository } from '../ports/company.repository.interface';
import { CompanyNotFoundException } from '../exceptions/company-not-found.exception';
import { CompanyAlreadyExistsException } from '../exceptions/company-already-exists.exception';
import {
  CreateCompanyCommand,
  PatchCompanyCommand,
  UpdateCompanyCommand,
} from '../command/company.command';
import { Contact } from '../domain/contact.entity';
import { IHashService } from '../ports/hash.service.interface';
import { IUserRepository } from '../ports/user.repository.interface';
import {
  IVacancyReportRepository,
  MyVacanciesFilters,
  PaginatedVacanciesResult,
} from '../ports/vacancy-report.repository.interface';
import {
  IJobOpeningRepository,
  JobOpeningResult,
} from '../ports/job-open.company.repository.interface';
import {
  CreateJobOpeningCommand,
  UpdateJobOpeningCommand,
} from '../command/job-opening.command';
import { UserAlreadyExistsException } from '../exceptions/user-already-exists.exception';

export class CompanyService {
  constructor(
    private readonly companyRepository: ICompanyRepository,
    private readonly userRepository: IUserRepository,
    private readonly hashService: IHashService,
    private readonly vacancyRepository: IVacancyReportRepository,
    private readonly jobOpeningRepository: IJobOpeningRepository,
  ) {}

  async createCompany(command: CreateCompanyCommand): Promise<Company> {
    const existingCompany = await this.companyRepository.findByCnpj(
      command.cnpj,
    );
    if (existingCompany) {
      throw new CompanyAlreadyExistsException(command.cnpj);
    }

    await this.assertEmailAvailable(command.email);

    const companyId = randomUUID();

    const hashedPassword = await this.hashService.hash(command.password);

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
      hashedPassword,
      command.name,
      command.cnpj,
      command.responsibleName,
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

    await this.assertEmailAvailable(command.email, company.id);
    company.changeEmail(command.email);

    if (command.password) {
      const hashedPassword = await this.hashService.hash(command.password);
      company.changePassword(hashedPassword);
    }

    company.changeName(command.name);
    company.changeResponsibleName(command.responsibleName);

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

    if (command.email !== undefined) {
      await this.assertEmailAvailable(command.email, company.id);
      company.changeEmail(command.email);
    }
    if (command.password !== undefined) {
      const hashedPassword = await this.hashService.hash(command.password);
      company.changePassword(hashedPassword);
    }
    if (command.name !== undefined) company.changeName(command.name);
    if (command.responsibleName !== undefined)
      company.changeResponsibleName(command.responsibleName);

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

  async createVacancy(
    companyId: string,
    command: Omit<CreateJobOpeningCommand, 'companyId'>,
  ): Promise<JobOpeningResult> {
    await this.getCompanyById(companyId);
    return this.jobOpeningRepository.create({ ...command, companyId });
  }

  async updateVacancy(
    vacancyId: string,
    companyId: string,
    command: UpdateJobOpeningCommand,
  ): Promise<JobOpeningResult> {
    const ownerCompanyId =
      await this.vacancyRepository.findCompanyIdById(vacancyId);

    if (!ownerCompanyId) {
      throw new NotFoundException('Vaga não encontrada');
    }

    if (ownerCompanyId !== companyId) {
      throw new ForbiddenException('A vaga pertence a outra empresa.');
    }

    return this.jobOpeningRepository.update(vacancyId, command);
  }

  async deleteVacancy(vacancyId: string, companyId: string): Promise<void> {
    const vacancyCompanyId =
      await this.vacancyRepository.findCompanyIdById(vacancyId);

    if (!vacancyCompanyId) {
      throw new NotFoundException('Vaga não encontrada');
    }

    if (vacancyCompanyId !== companyId) {
      throw new ForbiddenException(
        'Você não tem permissão para excluir esta vaga',
      );
    }

    await this.vacancyRepository.deleteById(vacancyId);
  }

  async listMyVacancies(
    userId: string,
    filters: Omit<MyVacanciesFilters, 'companyId'>,
  ): Promise<PaginatedVacanciesResult> {
    const company = await this.getCompanyById(userId);
    return this.vacancyRepository.findMyVacancies({
      companyId: company.id,
      ...filters,
    });
  }

  private async assertEmailAvailable(
    email: string,
    currentUserId?: string,
  ): Promise<void> {
    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser && existingUser.id !== currentUserId) {
      throw new UserAlreadyExistsException(email);
    }
  }
}
