/* eslint-disable @typescript-eslint/unbound-method */
import { DomainException } from '../../src/core/exceptions/domain.exception';
import { IStudentRepository } from '../../src/core/ports/student.repository.interface';
import { IStudentReportPdfGenerator } from '../../src/core/ports/student-report-pdf-generator.interface';
import {
  STUDENT_REPORT_MAX_ROWS,
  StudentReportLogger,
  StudentReportService,
} from '../../src/core/services/student-report.service';

describe('StudentReportService', () => {
  let repository: IStudentRepository;
  let pdfGenerator: IStudentReportPdfGenerator;
  let logger: StudentReportLogger;
  let service: StudentReportService;

  const student = {
    id: '123e4567-e89b-42d3-a456-426614174000',
    email: 'maria@email.com',
    cpf: '12345678900',
    fullName: 'Maria Silva',
    socialName: undefined,
    phoneNumber: '11988888888',
    city: 'Sao Paulo',
    state: 'SP',
    courseNames: ['Curso Online'],
    hasDisability: true,
    disabilityType: 'fisica',
  };

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findAllWithFilter: jest.fn(),
      findManyForReportByIds: jest.fn(),
      findManyForReportByFilters: jest.fn(),
      findById: jest.fn(),
      existsById: jest.fn(),
      findByCpf: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      softDeleteMany: jest.fn(),
    };
    pdfGenerator = {
      generate: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.3')),
    };
    logger = {
      info: jest.fn(),
    };
    service = new StudentReportService(repository, pdfGenerator, logger);
  });

  it('should export selected students and log before PDF generation', async () => {
    const events: string[] = [];
    (repository.findManyForReportByIds as jest.Mock).mockResolvedValue([
      student,
    ]);
    (logger.info as jest.Mock).mockImplementation((message: string) => {
      if (message === 'Generating students report') events.push('log');
    });
    (pdfGenerator.generate as jest.Mock).mockImplementation(() => {
      events.push('pdf');
      return Promise.resolve(Buffer.from('%PDF-1.3'));
    });

    const result = await service.generateReport({
      mode: 'selected',
      ids: [student.id],
      generatedBy: { id: 'admin-id', name: 'admin@test.com' },
    });

    expect(result.count).toBe(1);
    expect(result.filename).toMatch(
      /^relatorio_alunos_\d{4}-\d{2}-\d{2}_\d{6}\.pdf$/,
    );
    expect(repository.findManyForReportByIds).toHaveBeenCalledWith([
      student.id,
    ]);
    expect(logger.info).toHaveBeenCalledWith('Generating students report', {
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

    expect(repository.findManyForReportByIds).not.toHaveBeenCalled();
    expect(pdfGenerator.generate).not.toHaveBeenCalled();
  });

  it('should export all students with normalized filters', async () => {
    (repository.findManyForReportByFilters as jest.Mock).mockResolvedValue([
      student,
    ]);

    await service.generateReport({
      mode: 'all',
      filters: {
        search: ' Maria ',
        course: ' Curso ',
        location: ' Sao Paulo/SP ',
        pcdType: ' FISICO ',
        status: 'matriculado',
      },
      generatedBy: { id: 'admin-id', name: 'admin@test.com' },
    });

    expect(repository.findManyForReportByFilters).toHaveBeenCalledWith({
      search: 'Maria',
      course: 'Curso',
      location: 'Sao Paulo/SP',
      pcdType: 'FISICO',
      status: 'ENROLLMENT',
    });
  });

  it('should reject invalid status filters', async () => {
    await expect(
      service.generateReport({
        mode: 'all',
        filters: { status: 'ativo' },
        generatedBy: { id: 'admin-id', name: 'admin@test.com' },
      }),
    ).rejects.toThrow('Status de vinculo de aluno invalido');

    expect(repository.findManyForReportByFilters).not.toHaveBeenCalled();
  });

  it('should reject exports above the 1000 student limit', async () => {
    (repository.findManyForReportByFilters as jest.Mock).mockResolvedValue(
      Array.from({ length: STUDENT_REPORT_MAX_ROWS + 1 }, () => student),
    );

    await expect(
      service.generateReport({
        mode: 'all',
        generatedBy: { id: 'admin-id', name: 'admin@test.com' },
      }),
    ).rejects.toThrow('Limite de 1000 alunos excedido');

    expect(pdfGenerator.generate).not.toHaveBeenCalled();
  });

  it('should mask cpf, format contact and format pcd for PDF rows', async () => {
    (repository.findManyForReportByIds as jest.Mock).mockResolvedValue([
      student,
    ]);

    await service.generateReport({
      mode: 'selected',
      ids: [student.id],
      generatedBy: { id: 'admin-id', name: 'admin@test.com' },
    });

    expect(pdfGenerator.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        rows: [
          expect.objectContaining({
            cpf: '123.***.***-00',
            email: 'maria@email.com',
            phone: '(11) 98888-8888',
            location: 'Sao Paulo/SP',
            pcd: 'F\u00cdSICO',
          }),
        ],
      }),
    );
    expect(
      JSON.stringify((pdfGenerator.generate as jest.Mock).mock.calls),
    ).not.toContain('12345678900');
  });

  it('should render pcd as NAO when the student is not pcd', async () => {
    (repository.findManyForReportByIds as jest.Mock).mockResolvedValue([
      {
        ...student,
        hasDisability: false,
        disabilityType: undefined,
        courseNames: [],
      },
    ]);

    await service.generateReport({
      mode: 'selected',
      ids: [student.id],
      generatedBy: { id: 'admin-id', name: 'admin@test.com' },
    });

    expect(pdfGenerator.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        rows: [
          expect.objectContaining({
            course: '-',
            pcd: 'N\u00c3O',
          }),
        ],
      }),
    );
  });

  it('should not log full sensitive search values', async () => {
    (repository.findManyForReportByFilters as jest.Mock).mockResolvedValue([
      student,
    ]);

    await service.generateReport({
      mode: 'all',
      filters: { search: 'maria@email.com' },
      generatedBy: { id: 'admin-id', name: 'admin@test.com' },
    });

    const serializedLogs = JSON.stringify(
      (logger.info as jest.Mock).mock.calls,
    );

    expect(serializedLogs).not.toContain('maria@email.com');
    expect(serializedLogs).toContain('hasSensitiveSearch');
  });
});
