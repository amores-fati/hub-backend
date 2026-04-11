/* eslint-disable @typescript-eslint/unbound-method */
import { CompanyService } from '../../src/core/services/company.service';
import { ICompanyRepository } from '../../src/core/ports/company.repository.interface';
import { Company } from '../../src/core/domain/company.entity';
import { CompanyNotFoundException } from '../../src/core/exceptions/company-not-found.exception';
import { CompanyAlreadyExistsException } from '../../src/core/exceptions/company-already-exists.exception';

describe('CompanyService', () => {
  let service: CompanyService;

  const mockRepository: ICompanyRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCnpj: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockDate = new Date();
  const mockCompany = new Company(
    '123e4567-e89b-12d3-a456-426614174000',
    'Tech Corp LTDA',
    '12345678000199',
    'contato@techcorp.com',
    'São Paulo',
    'SP',
    'Avenida Paulista',
    'Bela Vista',
    '01310100',
    1000,
    'João da Silva',
    '11999999999',
    mockDate,
    mockDate,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CompanyService(mockRepository);
  });

  describe('createCompany', () => {
    it('should create a company if CNPJ is unique', async () => {
      (mockRepository.findByCnpj as jest.Mock).mockResolvedValue(null);
      (mockRepository.create as jest.Mock).mockImplementation((company) =>
        Promise.resolve(company),
      );

      const result = await service.createCompany(
        mockCompany.name,
        mockCompany.cnpj,
        mockCompany.email,
        mockCompany.city,
        mockCompany.state,
        mockCompany.street,
        mockCompany.neighborhood,
        mockCompany.cep,
        mockCompany.number,
        mockCompany.responsibleName,
        mockCompany.phone,
        'password123',
      );

      expect(result.id).toBeDefined();
      expect(result.cnpj).toBe(mockCompany.cnpj);
      expect(mockRepository.create).toHaveBeenCalledTimes(1);
    });

    it('should throw CompanyAlreadyExistsException if CNPJ already exists', async () => {
      (mockRepository.findByCnpj as jest.Mock).mockResolvedValue(mockCompany);

      await expect(
        service.createCompany(
          mockCompany.name,
          mockCompany.cnpj,
          mockCompany.email,
          mockCompany.city,
          mockCompany.state,
          mockCompany.street,
          mockCompany.neighborhood,
          mockCompany.cep,
          mockCompany.number,
          mockCompany.responsibleName,
          mockCompany.phone,
          'password123',
        ),
      ).rejects.toThrow(CompanyAlreadyExistsException);
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

  describe('getCompanyByCnpj', () => {
    it('should return a company by CNPJ', async () => {
      (mockRepository.findByCnpj as jest.Mock).mockResolvedValue(mockCompany);

      const result = await service.getCompanyByCnpj(mockCompany.cnpj);

      expect(result).toBe(mockCompany);
      expect(mockRepository.findByCnpj).toHaveBeenCalledWith(mockCompany.cnpj);
    });

    it('should throw CompanyNotFoundException if CNPJ is not found', async () => {
      (mockRepository.findByCnpj as jest.Mock).mockResolvedValue(null);

      await expect(service.getCompanyByCnpj('00000000000000')).rejects.toThrow(
        CompanyNotFoundException,
      );
    });
  });

  describe('updateCompany', () => {
    const updateData = {
      name: 'Tech Corp S.A.',
      cnpj: '12345678000199',
      email: 'novo@techcorp.com',
      city: 'Rio de Janeiro',
      state: 'RJ',
      street: 'Avenida Atlântica',
      neighborhood: 'Copacabana',
      cep: '22070000',
      number: 100,
      responsibleName: 'Maria Souza',
      phone: '21999999999',
    };

    it('should update and return the company', async () => {
      (mockRepository.findById as jest.Mock).mockResolvedValue(mockCompany);
      (mockRepository.update as jest.Mock).mockImplementation((company) =>
        Promise.resolve(company),
      );

      const result = await service.updateCompany(mockCompany.id, updateData);

      expect(result.name).toBe(updateData.name);
      expect(result.city).toBe(updateData.city);
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should throw CompanyNotFoundException if ID does not exist', async () => {
      (mockRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateCompany('invalid-id', updateData),
      ).rejects.toThrow(CompanyNotFoundException);
    });
  });

  describe('patchCompany', () => {
    it('should partially update and return the company', async () => {
      (mockRepository.findById as jest.Mock).mockResolvedValue(
        new Company(
          mockCompany.id,
          mockCompany.name,
          mockCompany.cnpj,
          mockCompany.email,
          mockCompany.city,
          mockCompany.state,
          mockCompany.street,
          mockCompany.neighborhood,
          mockCompany.cep,
          mockCompany.number,
          mockCompany.responsibleName,
          mockCompany.phone,
          mockCompany.createdAt,
          mockCompany.updatedAt,
        ),
      );
      (mockRepository.update as jest.Mock).mockImplementation((company) =>
        Promise.resolve(company),
      );

      const partialData = { name: 'Tech Corp Global' };
      const result = await service.patchCompany(mockCompany.id, partialData);

      expect(result.name).toBe(partialData.name);
      expect(result.email).toBe(mockCompany.email);
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should throw CompanyNotFoundException if ID does not exist', async () => {
      (mockRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        service.patchCompany('invalid-id', { name: 'Test' }),
      ).rejects.toThrow(CompanyNotFoundException);
    });
  });

  describe('deleteCompany', () => {
    it('should delete a company', async () => {
      (mockRepository.findById as jest.Mock).mockResolvedValue(mockCompany);
      (mockRepository.delete as jest.Mock).mockResolvedValue(undefined);

      await service.deleteCompany(mockCompany.id);

      expect(mockRepository.delete).toHaveBeenCalledWith(mockCompany.id);
    });

    it('should throw CompanyNotFoundException if ID does not exist', async () => {
      (mockRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.deleteCompany('invalid-id')).rejects.toThrow(
        CompanyNotFoundException,
      );
    });
  });
});
