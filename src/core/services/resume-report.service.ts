import { DomainException } from '../exceptions/domain.exception';
import {
  IResumeReportPdfGenerator,
  ResumeReportPdfRow,
} from '../ports/resume-report-pdf-generator.interface';
import {
  IResumeReportRepository,
  ResumeReportFilters,
  ResumeReportProjection,
  ResumeReportStatus,
} from '../ports/resume-report.repository.interface';

export type ResumeReportMode = 'selected' | 'all';

export const RESUME_REPORT_MAX_ROWS = 1000;

export interface ResumeReportLogger {
  info(message: unknown, ...meta: unknown[]): void;
}

export interface GenerateResumeReportCommand {
  mode: ResumeReportMode;
  ids?: string[];
  filters?: {
    search?: string;
    interestArea?: string;
    preference?: string;
    status?: string;
  };
  generatedBy: {
    id: string;
    name: string;
  };
}

export interface GeneratedResumeReport {
  filename: string;
  buffer: Buffer;
  count: number;
}

export class ResumeReportService {
  constructor(
    private readonly resumeRepository: IResumeReportRepository,
    private readonly pdfGenerator: IResumeReportPdfGenerator,
    private readonly logger: ResumeReportLogger,
  ) {}

  async generateReport(
    command: GenerateResumeReportCommand,
  ): Promise<GeneratedResumeReport> {
    const filters = this.normalizeFilters(command.filters);

    this.logger.info('Received resumes report request', {
      userId: command.generatedBy.id,
      mode: command.mode,
      idsCount: command.ids?.length ?? 0,
      filterKeys: Object.keys(filters),
      hasSensitiveSearch: this.hasSensitiveSearch(filters.search),
    });

    const resumes = await this.findResumes(command, filters);

    if (resumes.length > RESUME_REPORT_MAX_ROWS) {
      throw new DomainException(
        'Limite de 1000 curriculos excedido. Refine os filtros para exportar o relatorio.',
      );
    }

    const generatedAt = new Date();
    const rows = resumes.map((resume) => this.toPdfRow(resume));

    this.logger.info('Generating resumes report', {
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

  private async findResumes(
    command: GenerateResumeReportCommand,
    filters: ResumeReportFilters,
  ): Promise<ResumeReportProjection[]> {
    if (command.mode === 'selected') {
      if (!command.ids || command.ids.length === 0) {
        throw new DomainException(
          'A lista de curriculos selecionados nao pode ser vazia.',
        );
      }

      return this.resumeRepository.findManyByIds(command.ids);
    }

    if (command.mode === 'all') {
      return this.resumeRepository.findManyByFilters(filters);
    }

    throw new DomainException('Modo de exportacao de curriculos invalido.');
  }

  private normalizeFilters(
    filters?: GenerateResumeReportCommand['filters'],
  ): ResumeReportFilters {
    if (!filters) {
      return {};
    }

    const normalized: ResumeReportFilters = {};

    const search = filters.search?.trim();
    if (search) normalized.search = search;

    const interestArea = filters.interestArea?.trim();
    if (interestArea) normalized.interestArea = interestArea;

    const preference = filters.preference?.trim();
    if (preference) normalized.preference = preference;

    const status = this.normalizeStatus(filters.status);
    if (status) normalized.status = status;

    return normalized;
  }

  private normalizeStatus(value?: string): ResumeReportStatus | undefined {
    const normalized = value?.trim().toUpperCase();

    if (!normalized) {
      return undefined;
    }

    if (normalized === 'ATIVO' || normalized === 'INATIVO') {
      return normalized;
    }

    throw new DomainException('Status de curriculo invalido.');
  }

  private toPdfRow(resume: ResumeReportProjection): ResumeReportPdfRow {
    return {
      studentName: resume.socialName?.trim() || resume.studentName,
      cpf: this.maskCpf(resume.cpf),
      interestArea: resume.interestArea?.trim() || '-',
      preference: resume.preference?.trim() || '-',
      status: resume.isAvailable ? 'ATIVO' : 'INATIVO',
    };
  }

  private maskCpf(cpf: string): string {
    const digits = cpf.replace(/\D/g, '');

    if (digits.length < 5) {
      return '***';
    }

    return `${digits.slice(0, 3)}.***.***-${digits.slice(-2)}`;
  }

  private hasSensitiveSearch(value?: string): boolean {
    if (!value) {
      return false;
    }

    const digits = value.replace(/\D/g, '');
    return /\S+@\S+\.\S+/.test(value) || digits.length >= 10;
  }

  private buildFilename(date: Date): string {
    const year = date.getFullYear();
    const month = this.pad(date.getMonth() + 1);
    const day = this.pad(date.getDate());
    const hour = this.pad(date.getHours());
    const minute = this.pad(date.getMinutes());
    const second = this.pad(date.getSeconds());

    return `relatorio_curriculos_${year}-${month}-${day}_${hour}${minute}${second}.pdf`;
  }

  private pad(value: number): string {
    return String(value).padStart(2, '0');
  }
}
