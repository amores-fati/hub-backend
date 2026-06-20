import { CompanyStatus } from '../domain/company-status.enum';
import { DomainException } from '../exceptions/domain.exception';
import {
  CompanyFilterOptions,
  CompanyReportProjection,
  ICompanyRepository,
} from '../ports/company.repository.interface';
import {
  CompanyReportXlsxRow,
  ICompanyReportXlsxGenerator,
} from '../ports/company-report-xlsx-generator.interface';

export type CompanyReportMode = 'selected' | 'all';

export const COMPANY_REPORT_MAX_ROWS = 1000;

export interface CompanyReportLogger {
  info(message: unknown, ...meta: unknown[]): void;
}

export interface GenerateCompanyReportCommand {
  mode: CompanyReportMode;
  ids?: string[];
  filters?: {
    search?: string;
    state?: string;
    city?: string;
    status?: CompanyStatus;
  };
  generatedBy: {
    id: string;
    name: string;
  };
}

export interface GeneratedCompanyReport {
  filename: string;
  buffer: Buffer;
  count: number;
}

export class CompanyReportService {
  constructor(
    private readonly companyRepository: ICompanyRepository,
    private readonly xlsxGenerator: ICompanyReportXlsxGenerator,
    private readonly logger: CompanyReportLogger,
  ) {}

  async generateReport(
    command: GenerateCompanyReportCommand,
  ): Promise<GeneratedCompanyReport> {
    const filters = this.normalizeFilters(command.filters);

    this.logger.info('Received companies report request', {
      userId: command.generatedBy.id,
      mode: command.mode,
      idsCount: command.ids?.length ?? 0,
      filterKeys: Object.keys(filters),
      hasSensitiveSearch: this.hasSensitiveSearch(filters.search),
    });

    const companies = await this.findCompanies(command, filters);

    if (companies.length > COMPANY_REPORT_MAX_ROWS) {
      throw new DomainException(
        'Limite de 1000 empresas excedido. Refine os filtros para exportar o relatorio.',
      );
    }

    const generatedAt = new Date();
    const rows = companies.map((company) => this.toXlsxRow(company));

    this.logger.info('Generating companies report', {
      userId: command.generatedBy.id,
      mode: command.mode,
      count: rows.length,
    });

    const buffer = await this.xlsxGenerator.generate({ rows });

    return {
      filename: this.buildFilename(generatedAt),
      buffer,
      count: rows.length,
    };
  }

  private async findCompanies(
    command: GenerateCompanyReportCommand,
    filters: CompanyFilterOptions,
  ): Promise<CompanyReportProjection[]> {
    if (command.mode === 'selected') {
      if (!command.ids || command.ids.length === 0) {
        throw new DomainException(
          'A lista de empresas selecionadas nao pode ser vazia.',
        );
      }

      return this.companyRepository.findManyForReportByIds(command.ids);
    }

    if (command.mode === 'all') {
      return this.companyRepository.findManyForReportByFilters(filters);
    }

    throw new DomainException('Modo de exportacao de empresas invalido.');
  }

  private normalizeFilters(
    filters?: GenerateCompanyReportCommand['filters'],
  ): CompanyFilterOptions {
    if (!filters) {
      return {};
    }

    const normalized: CompanyFilterOptions = {};

    const search = filters.search?.trim();
    if (search) normalized.search = search;

    const state = this.normalizeState(filters.state);
    if (state) normalized.state = state;

    const city = filters.city?.trim();
    if (city) normalized.city = city;

    if (filters.status) normalized.status = filters.status;

    return normalized;
  }

  private toXlsxRow(company: CompanyReportProjection): CompanyReportXlsxRow {
    return {
      name: company.name,
      cnpj: this.formatCnpj(company.cnpj),
      email: company.email,
      phone: this.formatPhone(company.phone),
      state: company.state?.trim() || '-',
      city: company.city?.trim() || '-',
      neighbourhood: company.neighbourhood?.trim() || '-',
      status: company.status,
      createdAt: this.formatDate(company.createdAt),
    };
  }

  private formatCnpj(value: string): string {
    const digits = value.replace(/\D/g, '');

    if (digits.length !== 14) {
      return value.trim();
    }

    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(
      5,
      8,
    )}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  }

  private formatPhone(value: string): string {
    let digits = value.replace(/\D/g, '');

    if (digits.length === 13 && digits.startsWith('55')) {
      digits = digits.slice(2);
    }

    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }

    if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }

    return value.trim();
  }

  private formatDate(value: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'UTC',
    }).format(value);
  }

  private normalizeState(value?: string): string | undefined {
    const normalized = this.normalizeKey(value);

    if (!normalized) {
      return undefined;
    }

    const aliases: Record<string, string> = {
      acre: 'AC',
      alagoas: 'AL',
      amapa: 'AP',
      amazonas: 'AM',
      bahia: 'BA',
      ceara: 'CE',
      distrito_federal: 'DF',
      espirito_santo: 'ES',
      goias: 'GO',
      maranhao: 'MA',
      mato_grosso: 'MT',
      mato_grosso_do_sul: 'MS',
      minas_gerais: 'MG',
      para: 'PA',
      paraiba: 'PB',
      parana: 'PR',
      pernambuco: 'PE',
      piaui: 'PI',
      rio_de_janeiro: 'RJ',
      rio_grande_do_norte: 'RN',
      rio_grande_do_sul: 'RS',
      rondonia: 'RO',
      roraima: 'RR',
      santa_catarina: 'SC',
      sao_paulo: 'SP',
      sergipe: 'SE',
      tocantins: 'TO',
    };

    return aliases[normalized] ?? value!.trim().toUpperCase();
  }

  private hasSensitiveSearch(value?: string): boolean {
    if (!value) {
      return false;
    }

    const digits = value.replace(/\D/g, '');
    return /\S+@\S+\.\S+/.test(value) || digits.length >= 10;
  }

  private normalizeKey(value?: string): string {
    return (
      value
        ?.trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[\s-]+/g, '_')
        .toLowerCase() ?? ''
    );
  }

  private buildFilename(date: Date): string {
    const year = date.getFullYear();
    const month = this.pad(date.getMonth() + 1);
    const day = this.pad(date.getDate());
    const hour = this.pad(date.getHours());
    const minute = this.pad(date.getMinutes());
    const second = this.pad(date.getSeconds());

    return `relatorio_empresas_${year}-${month}-${day}_${hour}${minute}${second}.xlsx`;
  }

  private pad(value: number): string {
    return String(value).padStart(2, '0');
  }
}
