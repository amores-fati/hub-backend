/* eslint-disable @typescript-eslint/unbound-method */
import { CompanyService } from '../../src/core/services/company.service';
import { ICompanyRepository } from '../../src/core/ports/company.repository.interface';
import { Company } from '../../src/core/domain/company.entity';
import { CompanyNotFoundException } from '../../src/core/exceptions/company-not-found.exception';
import { CompanyAlreadyExistsException } from '../../src/core/exceptions/company-already-exists.exception';
import { Contact } from '../../src/core/domain/contact.entity';
import {
  CreateCompanyCommand,
  UpdateCompanyCommand,
  PatchCompanyCommand,
} from '../../src/core/command/company.command';
import { IUserRepository } from '../../src/core/ports/user.repository.interface';
import { IHashService } from '../../src/core/ports/hash.service.interface';
import { IVacancyReportRepository } from '../../src/core/ports/vacancy-report.repository.interface';
import { IJobOpeningRepository } from '../../src/core/ports/job-open.company.repository.interface';
import { UserAlreadyExistsException } from '../../src/core/exceptions/user-already-exists.exception';
import { CompanyStatus } from '../../src/core/domain/company-status.enum';

describe('CompanyService', () => {
  let service: CompanyService;

  const mockRepository: ICompanyRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCnpj: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    existsById: jest.fn(),
    findLocations: jest.fn(),
    findManyByFilters: jest.fn(),
  };

  const mockUserRepository: IUserRepository = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
  };

  const mockHashService: IHashService = {
    hash: jest.fn(),
    compare: jest.fn(),
  };

  const mockVacancyRepository: IVacancyReportRepository = {
    findManyByIds: jest.fn(),
    findManyByFilters: jest.fn(),
    findMyVacancies: jest.fn(),
    findAllForAdmin: jest.fn(),
    findCompanyIdById: jest.fn(),
    deleteById: jest.fn(),
  };

  const mockJobOpeningRepository: IJobOpeningRepository = {
    countActive: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  let mockContact: Contact;
  let mockCompany: Company;

  beforeEach(() => {
    jest.clearAllMocks();

    mockContact = new Contact(
      'contact-id',
      '11999999999',
      'Bela Vista',
      'SP',
      'São Paulo',
      'Avenida Paulista',
      '01310100',
      'Bloco A',
    );

    mockCompany = new Company(
      '123e4567-e89b-12d3-a456-426614174000',
      'contato@techcorp.com',
      'hashedPassword',
      'Tech Corp LTDA',
      '12345678000199',
      'João da Silva',
      mockContact,
    );

    service = new CompanyService(
      mockRepository,
      mockUserRepository,
      mockHashService,
      mockVacancyRepository,
      mockJobOpeningRepository,
    );
  });

  describe('createCompany', () => {
    it('should create a company if CNPJ is unique', async () => {
      const command: CreateCompanyCommand = {
        name: mockCompany.name,
        cnpj: mockCompany.cnpj,
        email: mockCompany.email,
        password: 'password123',
        responsibleName: mockCompany.responsibleName,
        contact: {
          phone: mockContact.phone,
          neighbourhood: mockContact.neighbourhood,
          state: mockContact.state,
          city: mockContact.city,
          address: mockContact.address,
          cep: mockContact.cep,
          complement: mockContact.complement,
        },
      };

      (mockRepository.findByCnpj as jest.Mock).mockResolvedValue(null);
      (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (mockHashService.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (mockRepository.create as jest.Mock).mockImplementation((company) =>
        Promise.resolve(company),
      );

      const result = await service.createCompany(command);

      expect(result.id).toBeDefined();
      expect(result.cnpj).toBe(mockCompany.cnpj);
      expect(result.password).toBe('hashedPassword');
      expect(mockRepository.create).toHaveBeenCalledTimes(1);
    });

    it('should throw CompanyAlreadyExistsException if CNPJ already exists', async () => {
      const command: CreateCompanyCommand = {
        name: mockCompany.name,
        cnpj: mockCompany.cnpj,
        email: mockCompany.email,
        password: 'password123',
        responsibleName: mockCompany.responsibleName,
        contact: { phone: '11999999999' },
      };

      (mockRepository.findByCnpj as jest.Mock).mockResolvedValue(mockCompany);

      await expect(service.createCompany(command)).rejects.toThrow(
        CompanyAlreadyExistsException,
      );
    });

    it('should throw UserAlreadyExistsException if email already exists', async () => {
      const command: CreateCompanyCommand = {
        name: mockCompany.name,
        cnpj: mockCompany.cnpj,
        email: mockCompany.email,
        password: 'password123',
        responsibleName: mockCompany.responsibleName,
        contact: { phone: '11999999999' },
      };

      (mockRepository.findByCnpj as jest.Mock).mockResolvedValue(null);
      (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(
        mockCompany,
      );

      await expect(service.createCompany(command)).rejects.toThrow(
        UserAlreadyExistsException,
      );
    });
  });

  describe('findAllCompanies', () => {
    it('should return an array of companies', async () => {
      (mockRepository.findAll as jest.Mock).mockResolvedValue([mockCompany]);

      const result = await service.findAllCompanies();

      expect(result).toHaveLength(1);
      expect(result[0].cnpj).toBe(mockCompany.cnpj);
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCompanyById', () => {
    it('should return a company by ID', async () => {
      (mockRepository.findById as jest.Mock).mockResolvedValue(mockCompany);

      const result = await service.getCompanyById(mockCompany.id);

      expect(result).toBe(mockCompany);
      expect(mockRepository.findById).toHaveBeenCalledWith(mockCompany.id);
    });

    it('should throw CompanyNotFoundException if ID is not found', async () => {
      (mockRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.getCompanyById('invalid-id')).rejects.toThrow(
        CompanyNotFoundException,
      );
    });
  });

  describe('updateCompany', () => {
    const updateCommand: UpdateCompanyCommand = {
      name: 'Tech Corp S.A.',
      email: 'novo@techcorp.com',
      password: 'newpassword123',
      responsibleName: 'Maria Souza',
      contact: {
        phone: '21999999999',
        neighbourhood: 'Copacabana',
        state: 'RJ',
        city: 'Rio de Janeiro',
        address: 'Avenida Atlântica',
        cep: '22070000',
        complement: '100',
      },
    };

    it('should update and return the company', async () => {
      (mockRepository.findById as jest.Mock).mockResolvedValue(mockCompany);
      (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (mockHashService.hash as jest.Mock).mockResolvedValue(
        'hashedPassword-new',
      );
      (mockRepository.update as jest.Mock).mockImplementation((company) =>
        Promise.resolve(company),
      );

      const result = await service.updateCompany(mockCompany.id, updateCommand);

      expect(result.name).toBe(updateCommand.name);
      expect(result.contact.city).toBe(updateCommand.contact.city);
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should throw UserAlreadyExistsException when updating to a duplicated email', async () => {
      (mockRepository.findById as jest.Mock).mockResolvedValue(mockCompany);
      (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(
        new Company(
          '223e4567-e89b-12d3-a456-426614174111',
          'duplicado@techcorp.com',
          'hashedPassword',
          'Outra Tech',
          '10987654000100',
          'Maria Souza',
          mockContact,
        ),
      );

      await expect(
        service.updateCompany(mockCompany.id, {
          ...updateCommand,
          email: 'duplicado@techcorp.com',
        }),
      ).rejects.toThrow(UserAlreadyExistsException);
    });
  });

  describe('patchCompany', () => {
    it('should partially update and return the company', async () => {
      (mockRepository.findById as jest.Mock).mockResolvedValue(
        new Company(
          mockCompany.id,
          mockCompany.email,
          mockCompany.password,
          mockCompany.name,
          mockCompany.cnpj,
          mockCompany.responsibleName,
          mockContact,
        ),
      );
      (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (mockRepository.update as jest.Mock).mockImplementation((company) =>
        Promise.resolve(company),
      );

      const partialData: PatchCompanyCommand = { name: 'Tech Corp Global' };
      const result = await service.patchCompany(mockCompany.id, partialData);

      expect(result.name).toBe(partialData.name);
      expect(result.email).toBe(mockCompany.email);
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should partially update password and return the company', async () => {
      (mockRepository.findById as jest.Mock).mockResolvedValue(mockCompany);
      (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (mockHashService.hash as jest.Mock).mockResolvedValue(
        'hashedPassword-new',
      );
      (mockRepository.update as jest.Mock).mockImplementation((company) =>
        Promise.resolve(company),
      );

      const partialData: PatchCompanyCommand = { password: 'newpassword123' };
      const result = await service.patchCompany(mockCompany.id, partialData);

      expect(result.password).toBe('hashedPassword-new');
      expect(mockHashService.hash).toHaveBeenCalledWith('newpassword123');
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should throw UserAlreadyExistsException when patching to a duplicated email', async () => {
      (mockRepository.findById as jest.Mock).mockResolvedValue(mockCompany);
      (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(
        new Company(
          '223e4567-e89b-12d3-a456-426614174111',
          'duplicado@techcorp.com',
          'hashedPassword',
          'Outra Tech',
          '10987654000100',
          'Maria Souza',
          mockContact,
        ),
      );

      await expect(
        service.patchCompany(mockCompany.id, {
          email: 'duplicado@techcorp.com',
        }),
      ).rejects.toThrow(UserAlreadyExistsException);
    });
  });

  describe('deleteCompany', () => {
    it('should delete a company', async () => {
      (mockRepository.findById as jest.Mock).mockResolvedValue(mockCompany);
      (mockRepository.delete as jest.Mock).mockResolvedValue(undefined);

      await service.deleteCompany(mockCompany.id);

      expect(mockRepository.delete).toHaveBeenCalledWith(mockCompany.id);
    });
  });

  describe('listMyVacancies', () => {
    it('should return paginated vacancies for the company', async () => {
      const filters = { page: 1, limit: 10 };
      const expectedResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      };

      (mockRepository.findById as jest.Mock).mockResolvedValue(mockCompany);
      (mockVacancyRepository.findMyVacancies as jest.Mock).mockResolvedValue(
        expectedResult,
      );

      const result = await service.listMyVacancies(mockCompany.id, filters);

      expect(result).toEqual(expectedResult);
      expect(mockRepository.findById).toHaveBeenCalledWith(mockCompany.id);
      expect(mockVacancyRepository.findMyVacancies).toHaveBeenCalledWith({
        companyId: mockCompany.id,
        ...filters,
      });
    });

    it('should pass search filter to repository', async () => {
      const filters = { page: 1, limit: 10, search: 'desenvolvedor' };
      (mockRepository.findById as jest.Mock).mockResolvedValue(mockCompany);
      (mockVacancyRepository.findMyVacancies as jest.Mock).mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      });

      await service.listMyVacancies(mockCompany.id, filters);

      expect(mockVacancyRepository.findMyVacancies).toHaveBeenCalledWith({
        companyId: mockCompany.id,
        page: 1,
        limit: 10,
        search: 'desenvolvedor',
      });
    });

    it('should pass isPcd filter to repository', async () => {
      const filters = { page: 1, limit: 10, isPcd: true };
      (mockRepository.findById as jest.Mock).mockResolvedValue(mockCompany);
      (mockVacancyRepository.findMyVacancies as jest.Mock).mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      });

      await service.listMyVacancies(mockCompany.id, filters);

      expect(mockVacancyRepository.findMyVacancies).toHaveBeenCalledWith({
        companyId: mockCompany.id,
        page: 1,
        limit: 10,
        isPcd: true,
      });
    });

    it('should throw CompanyNotFoundException if authenticated user is not a company', async () => {
      (mockRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        service.listMyVacancies('missing-company-id', { page: 1, limit: 10 }),
      ).rejects.toThrow(CompanyNotFoundException);
    });
  });

  describe('filterCompanies', () => {
    const make245Companies = () =>
      Array.from({ length: 245 }, (_, i) => ({
        company: new Company(
          `id-${i}`,
          `empresa${i}@test.com`,
          'hashedPassword',
          `Empresa ${i}`,
          `${String(i).padStart(14, '0')}`,
          'Responsável',
          mockContact,
        ),
        status: CompanyStatus.ATIVO,
      }));

    it('should return 10 companies and total=245 when page=1&limit=10', async () => {
      (mockRepository.findManyByFilters as jest.Mock).mockResolvedValue({
        data: make245Companies().slice(0, 10),
        total: 245,
      });

      const result = await service.filterCompanies({ page: 1, limit: 10 });

      expect(result.total).toBe(245);
      expect(result.data).toHaveLength(10);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should return correct slice for page 2', async () => {
      (mockRepository.findManyByFilters as jest.Mock).mockResolvedValue({
        data: make245Companies().slice(10, 20),
        total: 245,
      });

      const result = await service.filterCompanies({ page: 2, limit: 10 });

      expect(result.data).toHaveLength(10);
      expect(result.data[0].company.id).toBe('id-10');
    });

    it('should pass search filter to repository', async () => {
      (mockRepository.findManyByFilters as jest.Mock).mockResolvedValue({
        data: [{ company: mockCompany, status: CompanyStatus.ATIVO }],
        total: 1,
      });

      await service.filterCompanies({ page: 1, limit: 10, search: 'db' });

      expect(mockRepository.findManyByFilters).toHaveBeenCalledWith({ search: 'db' }, 1, 10);
    });

    it('should pass status filter to repository', async () => {
      (mockRepository.findManyByFilters as jest.Mock).mockResolvedValue({
        data: [],
        total: 0,
      });

      await service.filterCompanies({ page: 1, limit: 10, status: CompanyStatus.INATIVO });

      expect(mockRepository.findManyByFilters).toHaveBeenCalledWith({ status: CompanyStatus.INATIVO }, 1, 10);
    });

    it('should return empty data when no companies match', async () => {
      (mockRepository.findManyByFilters as jest.Mock).mockResolvedValue({
        data: [],
        total: 0,
      });

      const result = await service.filterCompanies({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
});
