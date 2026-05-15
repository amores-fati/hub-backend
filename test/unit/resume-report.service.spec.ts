/* eslint-disable @typescript-eslint/unbound-method */
import { DomainException } from '../../src/core/exceptions/domain.exception';
import { IResumeReportPdfGenerator } from '../../src/core/ports/resume-report-pdf-generator.interface';
import { IResumeReportRepository } from '../../src/core/ports/resume-report.repository.interface';
import {
  RESUME_REPORT_MAX_ROWS,
  ResumeReportLogger,
  ResumeReportService,
} from '../../src/core/services/resume-report.service';

describe('ResumeReportService', () => {
  let repository: IResumeReportRepository;
  let pdfGenerator: IResumeReportPdfGenerator;
  let logger: ResumeReportLogger;
  let service: ResumeReportService;

  const resume = {
    id: '123e4567-e89b-42d3-a456-426614174000',
    studentName: 'Maria Silva',
    socialName: undefined,
    cpf: '12345678900',
    interestArea: 'Backend',
    preference: 'Remoto',
    isAvailable: true,
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
    service = new ResumeReportService(repository, pdfGenerator, logger);
  });

  it('should export selected resumes and log before PDF generation', async () => {
    const events: string[] = [];
    (repository.findManyByIds as jest.Mock).mockResolvedValue([resume]);
    (logger.info as jest.Mock).mockImplementation((message: string) => {
      if (message === 'Generating resumes report') events.push('log');
    });
    (pdfGenerator.generate as jest.Mock).mockImplementation(() => {
      events.push('pdf');
      return Promise.resolve(Buffer.from('%PDF-1.3'));
    });

    const result = await service.generateReport({
      mode: 'selected',
      ids: [resume.id],
      generatedBy: { id: 'admin-id', name: 'admin@test.com' },
    });

    expect(result.count).toBe(1);
    expect(result.filename).toMatch(
      /^relatorio_curriculos_\d{4}-\d{2}-\d{2}_\d{6}\.pdf$/,
    );
    expect(repository.findManyByIds).toHaveBeenCalledWith([resume.id]);
    expect(logger.info).toHaveBeenCalledWith('Generating resumes report', {
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

  it('should export all resumes with normalized filters', async () => {
    (repository.findManyByFilters as jest.Mock).mockResolvedValue([resume]);

    await service.generateReport({
      mode: 'all',
      filters: {
        search: ' Maria ',
        interestArea: ' Backend ',
        preference: ' Remoto ',
        status: ' ativo ',
      },
      generatedBy: { id: 'admin-id', name: 'admin@test.com' },
    });

    expect(repository.findManyByFilters).toHaveBeenCalledWith({
      search: 'Maria',
      interestArea: 'Backend',
      preference: 'Remoto',
      status: 'ATIVO',
    });
  });

  it('should reject invalid status filters', async () => {
    await expect(
      service.generateReport({
        mode: 'all',
        filters: { status: 'PUBLICADO' },
        generatedBy: { id: 'admin-id', name: 'admin@test.com' },
      }),
    ).rejects.toThrow('Status de curriculo invalido');

    expect(repository.findManyByFilters).not.toHaveBeenCalled();
  });

  it('should reject exports above the 1000 resume limit', async () => {
    (repository.findManyByFilters as jest.Mock).mockResolvedValue(
      Array.from({ length: RESUME_REPORT_MAX_ROWS + 1 }, () => resume),
    );

    await expect(
      service.generateReport({
        mode: 'all',
        generatedBy: { id: 'admin-id', name: 'admin@test.com' },
      }),
    ).rejects.toThrow('Limite de 1000 curriculos excedido');

    expect(pdfGenerator.generate).not.toHaveBeenCalled();
  });

  it('should mask cpf and format missing fields for PDF rows', async () => {
    (repository.findManyByIds as jest.Mock).mockResolvedValue([
      resume,
      {
        ...resume,
        id: '223e4567-e89b-42d3-a456-426614174000',
        studentName: 'Joao Santos',
        socialName: 'Joao S.',
        interestArea: undefined,
        preference: undefined,
        isAvailable: false,
      },
    ]);

    await service.generateReport({
      mode: 'selected',
      ids: [resume.id],
      generatedBy: { id: 'admin-id', name: 'admin@test.com' },
    });

    expect(pdfGenerator.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        rows: [
          expect.objectContaining({
            studentName: 'Maria Silva',
            cpf: '123.***.***-00',
            interestArea: 'Backend',
            preference: 'Remoto',
            status: 'ATIVO',
          }),
          expect.objectContaining({
            studentName: 'Joao S.',
            interestArea: '-',
            preference: '-',
            status: 'INATIVO',
          }),
        ],
      }),
    );
    expect(
      JSON.stringify((pdfGenerator.generate as jest.Mock).mock.calls),
    ).not.toContain('12345678900');
  });

  it('should not log full sensitive search values', async () => {
    (repository.findManyByFilters as jest.Mock).mockResolvedValue([resume]);

    await service.generateReport({
      mode: 'all',
      filters: { search: '123.456.789-00' },
      generatedBy: { id: 'admin-id', name: 'admin@test.com' },
    });

    const serializedLogs = JSON.stringify(
      (logger.info as jest.Mock).mock.calls,
    );

    expect(serializedLogs).not.toContain('123.456.789-00');
    expect(serializedLogs).toContain('hasSensitiveSearch');
  });
});
