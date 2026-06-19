import { DomainException } from '../exceptions/domain.exception';
import {
  IVacancyReportPdfGenerator,
  VacancyReportPdfRow,
} from '../ports/vacancy-report-pdf-generator.interface';
import {
  AdminVacancyFilters,
  IVacancyReportRepository,
  PaginatedAdminVacanciesResult,
  VacancyReportFilters,
  VacancyReportProjection,
} from '../ports/vacancy-report.repository.interface';

export type VacancyReportMode = 'selected' | 'all';

export const VACANCY_REPORT_MAX_ROWS = 1000;

export interface VacancyReportLogger {
  info(message: unknown, ...meta: unknown[]): void;
}

export interface GenerateVacancyReportCommand {
  mode: VacancyReportMode;
  ids?: string[];
  filters?: VacancyReportFilters;
  generatedBy: {
    id: string;
    name: string;
  };
}

export interface GeneratedVacancyReport {
  filename: string;
  buffer: Buffer;
  count: number;
}

export class VacancyReportService {
  constructor(
    private readonly vacancyRepository: IVacancyReportRepository,
    private readonly pdfGenerator: IVacancyReportPdfGenerator,
    private readonly logger: VacancyReportLogger,
  ) {}

  async findAllVacanciesWithFilter(
    filters: AdminVacancyFilters,
  ): Promise<PaginatedAdminVacanciesResult> {
    return this.vacancyRepository.findAllForAdmin(filters);
  }

  async generateReport(
    command: GenerateVacancyReportCommand,
  ): Promise<GeneratedVacancyReport> {
    const filters = this.normalizeFilters(command.filters);

    this.logger.info('Received vacancies report request', {
      userId: command.generatedBy.id,
      mode: command.mode,
      idsCount: command.ids?.length ?? 0,
      filterKeys: Object.keys(filters),
    });

    const vacancies = await this.findVacancies(command, filters);

    if (vacancies.length > VACANCY_REPORT_MAX_ROWS) {
      throw new DomainException(
        'Limite de 1000 vagas excedido. Refine os filtros para exportar o relatorio.',
      );
    }

    const generatedAt = new Date();
    const rows = vacancies.map((vacancy) => this.toPdfRow(vacancy));

    this.logger.info('Generating vacancies report', {
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

  private async findVacancies(
    command: GenerateVacancyReportCommand,
    filters: VacancyReportFilters,
  ): Promise<VacancyReportProjection[]> {
    if (command.mode === 'selected') {
      if (!command.ids || command.ids.length === 0) {
        throw new DomainException(
          'A lista de vagas selecionadas nao pode ser vazia.',
        );
      }

      return this.vacancyRepository.findManyByIds(command.ids);
    }

    if (command.mode === 'all') {
      return this.vacancyRepository.findManyByFilters(filters);
    }

    throw new DomainException('Modo de exportacao de vagas invalido.');
  }

  private normalizeFilters(
    filters?: GenerateVacancyReportCommand['filters'],
  ): VacancyReportFilters {
    if (!filters) {
      return {};
    }

    const normalized: VacancyReportFilters = {};

    const search = filters.search?.trim();
    if (search) normalized.search = search;

    if (typeof filters.isPcd === 'boolean') {
      normalized.isPcd = filters.isPcd;
    }

    const dateFrom = filters.dateFrom?.trim();
    if (dateFrom) normalized.dateFrom = dateFrom;

    const dateTo = filters.dateTo?.trim();
    if (dateTo) normalized.dateTo = dateTo;

    return normalized;
  }

  private toPdfRow(vacancy: VacancyReportProjection): VacancyReportPdfRow {
    return {
      name: vacancy.name,
      openingsCount: String(vacancy.openingsCount),
      isPcd: vacancy.isPcd ? 'SIM' : 'N\u00c3O',
      announcementDate: this.formatDate(vacancy.announcementDate),
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

    return `relatorio_vagas_${year}-${month}-${day}_${hour}${minute}${second}.pdf`;
  }

  private pad(value: number): string {
    return String(value).padStart(2, '0');
  }
}
