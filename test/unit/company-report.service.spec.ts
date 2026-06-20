/* eslint-disable @typescript-eslint/unbound-method */
import { CompanyStatus } from '../../src/core/domain/company-status.enum';
import { DomainException } from '../../src/core/exceptions/domain.exception';
import { ICompanyRepository } from '../../src/core/ports/company.repository.interface';
import { ICompanyReportXlsxGenerator } from '../../src/core/ports/company-report-xlsx-generator.interface';
import {
  COMPANY_REPORT_MAX_ROWS,
  CompanyReportLogger,
  CompanyReportService,
} from '../../src/core/services/company-report.service';

describe('CompanyReportService', () => {
  let repository: ICompanyRepository;
  let xlsxGenerator: ICompanyReportXlsxGenerator;
  let logger: CompanyReportLogger;
  let service: CompanyReportService;

  const company = {
    id: '123e4567-e89b-42d3-a456-426614174000',
    name: 'HP',
    cnpj: '92797901000174',
    email: 'hp@email.com',
    phone: '11988888888',
    state: 'SC',
    city: 'Florianopolis',
    neighbourhood: 'Centro',
    status: CompanyStatus.ATIVO,
    createdAt: new Date('2026-04-23T12:00:00.000Z'),
  };

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      existsById: jest.fn(),
      findByCnpj: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findLocations: jest.fn(),
      findManyByFilters: jest.fn(),
      findManyForReportByIds: jest.fn(),
      findManyForReportByFilters: jest.fn(),
    };
    xlsxGenerator = {
      generate: jest.fn().mockResolvedValue(Buffer.from('PK')),
    };
    logger = {
      info: jest.fn(),
    };
    service = new CompanyReportService(repository, xlsxGenerator, logger);
  });

  it('should export selected companies and log before XLSX generation', async () => {
    const events: string[] = [];
    (repository.findManyForReportByIds as jest.Mock).mockResolvedValue([
      company,
    ]);
    (logger.info as jest.Mock).mockImplementation((message: string) => {
      if (message === 'Generating companies report') events.push('log');
    });
    (xlsxGenerator.generate as jest.Mock).mockImplementation(() => {
      events.push('xlsx');
      return Promise.resolve(Buffer.from('PK'));
    });

    const result = await service.generateReport({
      mode: 'selected',
      ids: [company.id],
      generatedBy: { id: 'admin-id', name: 'admin@test.com' },
    });

    expect(result.count).toBe(1);
    expect(result.filename).toMatch(
      /^relatorio_empresas_\d{4}-\d{2}-\d{2}_\d{6}\.xlsx$/,
    );
    expect(repository.findManyForReportByIds).toHaveBeenCalledWith([
      company.id,
    ]);
    expect(logger.info).toHaveBeenCalledWith('Generating companies report', {
      userId: 'admin-id',
      mode: 'selected',
      count: 1,
    });
    expect(events).toEqual(['log', 'xlsx']);
  });

  it('should reject selected mode with an empty id list', async () => {
    await expect(
      service.generateReport({
        mode: 'selected',
        ids: [],
        generatedBy: { id: 'admin-id', name: 'admin@test.com' },
      }),
    ).rejects.toThrow(DomainException);

    expect(repository.findManyForReportByIds).not.toHaveBeenCalled();
    expect(xlsxGenerator.generate).not.toHaveBeenCalled();
  });

  it('should export all companies with normalized filters', async () => {
    (repository.findManyForReportByFilters as jest.Mock).mockResolvedValue([
      company,
    ]);

    await service.generateReport({
      mode: 'all',
      filters: {
        search: ' hp ',
        state: ' Santa Catarina ',
        city: ' Florianopolis ',
        status: CompanyStatus.ATIVO,
      },
      generatedBy: { id: 'admin-id', name: 'admin@test.com' },
    });

    expect(repository.findManyForReportByFilters).toHaveBeenCalledWith({
      search: 'hp',
      state: 'SC',
      city: 'Florianopolis',
      status: CompanyStatus.ATIVO,
    });
  });

  it('should reject exports above the 1000 company limit', async () => {
    (repository.findManyForReportByFilters as jest.Mock).mockResolvedValue(
      Array.from({ length: COMPANY_REPORT_MAX_ROWS + 1 }, () => company),
    );

    await expect(
      service.generateReport({
        mode: 'all',
        generatedBy: { id: 'admin-id', name: 'admin@test.com' },
      }),
    ).rejects.toThrow('Limite de 1000 empresas excedido');

    expect(xlsxGenerator.generate).not.toHaveBeenCalled();
  });

  it('should format CNPJ, phone, status and registration date for XLSX rows', async () => {
    (repository.findManyForReportByIds as jest.Mock).mockResolvedValue([
      company,
    ]);

    await service.generateReport({
      mode: 'selected',
      ids: [company.id],
      generatedBy: { id: 'admin-id', name: 'admin@test.com' },
    });

    expect(xlsxGenerator.generate).toHaveBeenCalledWith({
      rows: [
        {
          name: 'HP',
          cnpj: '92.797.901/0001-74',
          email: 'hp@email.com',
          phone: '(11) 98888-8888',
          state: 'SC',
          city: 'Florianopolis',
          neighbourhood: 'Centro',
          status: 'ATIVO',
          createdAt: '23/04/2026',
        },
      ],
    });
  });

  it('should not log raw sensitive search values', async () => {
    (repository.findManyForReportByFilters as jest.Mock).mockResolvedValue([
      company,
    ]);

    await service.generateReport({
      mode: 'all',
      filters: { search: 'hp@email.com' },
      generatedBy: { id: 'admin-id', name: 'admin@test.com' },
    });

    const serializedLogs = JSON.stringify(
      (logger.info as jest.Mock).mock.calls,
    );

    expect(serializedLogs).not.toContain('hp@email.com');
    expect(serializedLogs).toContain('hasSensitiveSearch');
  });
});
