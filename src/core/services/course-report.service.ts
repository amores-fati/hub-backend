import { DomainException } from '../exceptions/domain.exception';
import { Course } from '../domain/course.entity';
import {
  CourseReportFilters,
  ICourseRepository,
} from '../ports/course.repository.interface';
import {
  CourseReportPdfRow,
  ICourseReportPdfGenerator,
} from '../ports/course-report-pdf-generator.interface';

export type CourseReportMode = 'selected' | 'all';

export const COURSE_REPORT_MAX_ROWS = 1000;

export interface CourseReportLogger {
  info(message: unknown, ...meta: unknown[]): void;
}

export interface GenerateCourseReportCommand {
  mode: CourseReportMode;
  ids?: string[];
  filters?: CourseReportFilters;
  generatedBy: {
    id: string;
    name: string;
  };
}

export interface GeneratedCourseReport {
  filename: string;
  buffer: Buffer;
  count: number;
}

export class CourseReportService {
  constructor(
    private readonly courseRepository: ICourseRepository,
    private readonly pdfGenerator: ICourseReportPdfGenerator,
    private readonly logger: CourseReportLogger,
  ) {}

  async generateReport(
    command: GenerateCourseReportCommand,
  ): Promise<GeneratedCourseReport> {
    const courses = await this.findCourses(command);

    if (courses.length > COURSE_REPORT_MAX_ROWS) {
      throw new DomainException(
        'Limite de 1000 cursos excedido. Refine os filtros para exportar o relatorio.',
      );
    }

    const generatedAt = new Date();
    const rows = courses.map((course) => this.toPdfRow(course));

    this.logger.info('Generating courses report', {
      userId: command.generatedBy.id,
      mode: command.mode,
      count: rows.length,
    });

    const buffer = await this.pdfGenerator.generate({
      generatedAt,
      generatedBy: command.generatedBy.name,
      rows,
    });

    return {
      filename: this.buildFilename(generatedAt),
      buffer,
      count: rows.length,
    };
  }

  private async findCourses(
    command: GenerateCourseReportCommand,
  ): Promise<Course[]> {
    if (command.mode === 'selected') {
      if (!command.ids || command.ids.length === 0) {
        throw new DomainException(
          'A lista de cursos selecionados nao pode ser vazia.',
        );
      }

      return this.courseRepository.findManyByIds(command.ids);
    }

    if (command.mode === 'all') {
      return this.courseRepository.findManyByFilters(command.filters);
    }

    throw new DomainException('Modo de exportacao de cursos invalido.');
  }

  private toPdfRow(course: Course): CourseReportPdfRow {
    return {
      name: course.name,
      modality: course.modality,
      address: course.address?.trim() ? course.address : '-',
      status: course.status,
      startDate: this.formatDate(course.startDate),
      endDate: this.formatDate(course.endDate),
    };
  }

  private formatDate(value: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'UTC',
    }).format(value);
  }

  private buildFilename(date: Date): string {
    const year = date.getFullYear();
    const month = this.pad(date.getMonth() + 1);
    const day = this.pad(date.getDate());
    const hour = this.pad(date.getHours());
    const minute = this.pad(date.getMinutes());
    const second = this.pad(date.getSeconds());

    return `relatorio_cursos_${year}-${month}-${day}_${hour}${minute}${second}.pdf`;
  }

  private pad(value: number): string {
    return String(value).padStart(2, '0');
  }
}
