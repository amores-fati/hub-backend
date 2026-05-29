/* eslint-disable @typescript-eslint/unbound-method */
import { DomainException } from '../../src/core/exceptions/domain.exception';
import { IVacancyReportPdfGenerator } from '../../src/core/ports/vacancy-report-pdf-generator.interface';
import { IVacancyReportRepository } from '../../src/core/ports/vacancy-report.repository.interface';
import {
  VACANCY_REPORT_MAX_ROWS,
  VacancyReportLogger,
  VacancyReportService,
} from '../../src/core/services/vacancy-report.service';

describe('VacancyReportService', () => {
  let repository: IVacancyReportRepository;
  let pdfGenerator: IVacancyReportPdfGenerator;
  let logger: VacancyReportLogger;
  let service: VacancyReportService;

  const vacancy = {
    id: '123e4567-e89b-42d3-a456-426614174000',
    name: 'Desenvolvedor Frontend',
    openingsCount: 3,
    isPcd: true,
    announcementDate: new Date('2026-04-23T00:00:00.000Z'),
  };

  beforeEach(() => {
    repository = {
      findManyByIds: jest.fn(),
      findManyByFilters: jest.fn(),
    };
    pdfGenerator = {
      generate: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.3')),
    };
    logger = {
      info: jest.fn(),
    };
    service = new VacancyReportService(repository, pdfGenerator, logger);
  });

  it('should export selected vacancies and log before PDF generation', async () => {
    const events: string[] = [];
    (repository.findManyByIds as jest.Mock).mockResolvedValue([vacancy]);
    (logger.info as jest.Mock).mockImplementation((message: string) => {
      if (message === 'Generating vacancies report') events.push('log');
    });
    (pdfGenerator.generate as jest.Mock).mockImplementation(() => {
      events.push('pdf');
      return Promise.resolve(Buffer.from('%PDF-1.3'));
    });

    const result = await service.generateReport({
      mode: 'selected',
      ids: [vacancy.id],
      generatedBy: { id: 'admin-id', name: 'admin@test.com' },
    });

    expect(result.count).toBe(1);
    expect(result.filename).toMatch(
      /^relatorio_vagas_\d{4}-\d{2}-\d{2}_\d{6}\.pdf$/,
    );
    expect(repository.findManyByIds).toHaveBeenCalledWith([vacancy.id]);
    expect(logger.info).toHaveBeenCalledWith('Generating vacancies report', {
      userId: 'admin-id',
      mode: 'selected',
      count: 1,
    });
    expect(events).toEqual(['log', 'pdf']);
  });

  it('should reject selected mode with an empty id list', async () => {
    await expect(
      service.generateReport({
        mode: 'selected',
        ids: [],
        generatedBy: { id: 'admin-id', name: 'admin@test.com' },
      }),
    ).rejects.toThrow(DomainException);

    expect(repository.findManyByIds).not.toHaveBeenCalled();
    expect(pdfGenerator.generate).not.toHaveBeenCalled();
  });

  it('should export all vacancies with normalized filters', async () => {
    (repository.findManyByFilters as jest.Mock).mockResolvedValue([vacancy]);

    await service.generateReport({
      mode: 'all',
      filters: {
        search: ' Frontend ',
        isPcd: false,
        dateFrom: ' 2026-04-01 ',
        dateTo: ' 2026-04-30 ',
      },
      generatedBy: { id: 'admin-id', name: 'admin@test.com' },
    });

    expect(repository.findManyByFilters).toHaveBeenCalledWith({
      search: 'Frontend',
      isPcd: false,
      dateFrom: '2026-04-01',
      dateTo: '2026-04-30',
    });
  });

  it('should reject exports above the 1000 vacancy limit', async () => {
    (repository.findManyByFilters as jest.Mock).mockResolvedValue(
      Array.from({ length: VACANCY_REPORT_MAX_ROWS + 1 }, () => vacancy),
    );

    await expect(
      service.generateReport({
        mode: 'all',
        generatedBy: { id: 'admin-id', name: 'admin@test.com' },
      }),
    ).rejects.toThrow('Limite de 1000 vagas excedido');

    expect(pdfGenerator.generate).not.toHaveBeenCalled();
  });

  it('should format PCD and announcement date for PDF rows', async () => {
    (repository.findManyByIds as jest.Mock).mockResolvedValue([
      vacancy,
      {
        ...vacancy,
        id: '223e4567-e89b-42d3-a456-426614174000',
        name: 'Analista de Dados',
        openingsCount: 1,
        isPcd: false,
      },
    ]);

    await service.generateReport({
      mode: 'selected',
      ids: [vacancy.id],
      generatedBy: { id: 'admin-id', name: 'admin@test.com' },
    });

    expect(pdfGenerator.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        rows: [
          expect.objectContaining({
            name: 'Desenvolvedor Frontend',
            openingsCount: '3',
            isPcd: 'SIM',
            announcementDate: '23/04/2026',
          }),
          expect.objectContaining({
            name: 'Analista de Dados',
            openingsCount: '1',
            isPcd: 'N\u00c3O',
            announcementDate: '23/04/2026',
          }),
        ],
      }),
    );
  });

  it('should not log full filters values when receiving the request', async () => {
    (repository.findManyByFilters as jest.Mock).mockResolvedValue([vacancy]);

    await service.generateReport({
      mode: 'all',
      filters: { search: 'desenvolvedor' },
      generatedBy: { id: 'admin-id', name: 'admin@test.com' },
    });

    const serializedLogs = JSON.stringify(
      (logger.info as jest.Mock).mock.calls,
    );

    expect(serializedLogs).not.toContain('desenvolvedor');
    expect(serializedLogs).toContain('filterKeys');
  });
});
