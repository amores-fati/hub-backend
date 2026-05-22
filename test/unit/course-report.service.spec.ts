/* eslint-disable @typescript-eslint/unbound-method */
import { Course } from '../../src/core/domain/course.entity';
import { CourseStatus } from '../../src/core/domain/course-status.enum';
import { DomainException } from '../../src/core/exceptions/domain.exception';
import { ICourseRepository } from '../../src/core/ports/course.repository.interface';
import { ICourseReportPdfGenerator } from '../../src/core/ports/course-report-pdf-generator.interface';
import {
  COURSE_REPORT_MAX_ROWS,
  CourseReportLogger,
  CourseReportService,
} from '../../src/core/services/course-report.service';

describe('CourseReportService', () => {
  let repository: ICourseRepository;
  let pdfGenerator: ICourseReportPdfGenerator;
  let logger: CourseReportLogger;
  let service: CourseReportService;

  const course = new Course(
    '123e4567-e89b-42d3-a456-426614174000',
    'Curso Online',
    'https://fatilab.com/banner.png',
    '40h',
    new Date('2026-02-23T00:00:00.000Z'),
    new Date('2026-03-23T00:00:00.000Z'),
    new Date('2026-01-01T00:00:00.000Z'),
    new Date('2026-01-20T00:00:00.000Z'),
    'ONLINE',
    'https://fatilab.com/cursos/online',
    20,
    'Descricao',
    CourseStatus.ATIVO,
  );

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findAllWithLocation: jest.fn(),
      findById: jest.fn(),
      findManyByIdsWithLocation: jest.fn(),
      findManyWithLocationByFilters: jest.fn(),
    };
    pdfGenerator = {
      generate: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.3')),
    };
    logger = {
      info: jest.fn(),
    };
    service = new CourseReportService(repository, pdfGenerator, logger);
  });

  it('should export selected courses and log before PDF generation', async () => {
    const events: string[] = [];
    (repository.findManyByIdsWithLocation as jest.Mock).mockResolvedValue([
      { course, location: null },
    ]);
    (logger.info as jest.Mock).mockImplementation(() => events.push('log'));
    (pdfGenerator.generate as jest.Mock).mockImplementation(() => {
      events.push('pdf');
      return Promise.resolve(Buffer.from('%PDF-1.3'));
    });

    const result = await service.generateReport({
      mode: 'selected',
      ids: [course.id],
      generatedBy: { id: 'admin-id', name: 'admin@test.com' },
    });

    expect(result.count).toBe(1);
    expect(result.filename).toMatch(
      /^relatorio_cursos_\d{4}-\d{2}-\d{2}_\d{6}\.pdf$/,
    );
    expect(repository.findManyByIdsWithLocation).toHaveBeenCalledWith([
      course.id,
    ]);
    expect(logger.info).toHaveBeenCalledWith('Generating courses report', {
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

    expect(repository.findManyByIdsWithLocation).not.toHaveBeenCalled();
    expect(pdfGenerator.generate).not.toHaveBeenCalled();
  });

  it('should export all courses with filters', async () => {
    (repository.findManyWithLocationByFilters as jest.Mock).mockResolvedValue([
      { course, location: 'Porto Alegre - RS' },
    ]);

    await service.generateReport({
      mode: 'all',
      filters: { status: CourseStatus.ATIVO },
      generatedBy: { id: 'admin-id', name: 'admin@test.com' },
    });

    expect(repository.findManyWithLocationByFilters).toHaveBeenCalledWith({
      status: CourseStatus.ATIVO,
    });
  });

  it('should reject exports above the 1000 course limit', async () => {
    (repository.findManyWithLocationByFilters as jest.Mock).mockResolvedValue(
      Array.from({ length: COURSE_REPORT_MAX_ROWS + 1 }, () => ({
        course,
        location: null,
      })),
    );

    await expect(
      service.generateReport({
        mode: 'all',
        generatedBy: { id: 'admin-id', name: 'admin@test.com' },
      }),
    ).rejects.toThrow('Limite de 1000 cursos excedido');

    expect(pdfGenerator.generate).not.toHaveBeenCalled();
  });

  it('should format empty address and dates for PDF rows', async () => {
    (repository.findManyByIdsWithLocation as jest.Mock).mockResolvedValue([
      { course, location: '' },
    ]);

    await service.generateReport({
      mode: 'selected',
      ids: [course.id],
      generatedBy: { id: 'admin-id', name: 'admin@test.com' },
    });

    expect(pdfGenerator.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        rows: [
          expect.objectContaining({
            address: '-',
            startDate: '23/02/2026',
            status: CourseStatus.ATIVO,
          }),
        ],
      }),
    );
  });
});
