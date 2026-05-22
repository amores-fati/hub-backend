import { DomainException } from '../exceptions/domain.exception';
import {
  IStudentRepository,
  StudentReportFilters,
  StudentReportProjection,
  StudentReportStatus,
} from '../ports/student.repository.interface';
import {
  IStudentReportPdfGenerator,
  StudentReportPdfRow,
} from '../ports/student-report-pdf-generator.interface';

export type StudentReportMode = 'selected' | 'all';

export const STUDENT_REPORT_MAX_ROWS = 1000;

export interface StudentReportLogger {
  info(message: unknown, ...meta: unknown[]): void;
}

export interface GenerateStudentReportCommand {
  mode: StudentReportMode;
  ids?: string[];
  filters?: {
    search?: string;
    course?: string;
    location?: string;
    pcdType?: string;
    status?: string;
  };
  generatedBy: {
    id: string;
    name: string;
  };
}

export interface GeneratedStudentReport {
  filename: string;
  buffer: Buffer;
  count: number;
}

export class StudentReportService {
  constructor(
    private readonly studentRepository: IStudentRepository,
    private readonly pdfGenerator: IStudentReportPdfGenerator,
    private readonly logger: StudentReportLogger,
  ) {}

  async generateReport(
    command: GenerateStudentReportCommand,
  ): Promise<GeneratedStudentReport> {
    const filters = this.normalizeFilters(command.filters);

    this.logger.info('Received students report request', {
      userId: command.generatedBy.id,
      mode: command.mode,
      idsCount: command.ids?.length ?? 0,
      filterKeys: Object.keys(filters),
      hasSensitiveSearch: this.hasSensitiveSearch(filters.search),
    });

    const students = await this.findStudents(command, filters);

    if (students.length > STUDENT_REPORT_MAX_ROWS) {
      throw new DomainException(
        'Limite de 1000 alunos excedido. Refine os filtros para exportar o relatorio.',
      );
    }

    const generatedAt = new Date();
    const rows = students.map((student) => this.toPdfRow(student));

    this.logger.info('Generating students report', {
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

  private async findStudents(
    command: GenerateStudentReportCommand,
    filters: StudentReportFilters,
  ): Promise<StudentReportProjection[]> {
    if (command.mode === 'selected') {
      if (!command.ids || command.ids.length === 0) {
        throw new DomainException(
          'A lista de alunos selecionados nao pode ser vazia.',
        );
      }

      return this.studentRepository.findManyForReportByIds(command.ids);
    }

    if (command.mode === 'all') {
      return this.studentRepository.findManyForReportByFilters(filters);
    }

    throw new DomainException('Modo de exportacao de alunos invalido.');
  }

  private normalizeFilters(
    filters?: GenerateStudentReportCommand['filters'],
  ): StudentReportFilters {
    if (!filters) {
      return {};
    }

    const normalized: StudentReportFilters = {};

    const search = this.normalizeText(filters.search);
    if (search) normalized.search = search;

    const course = this.normalizeText(filters.course);
    if (course) normalized.course = course;

    const location = this.normalizeText(filters.location);
    if (location) normalized.location = location;

    const pcdType = this.normalizeText(filters.pcdType);
    if (pcdType) normalized.pcdType = pcdType;

    const status = this.normalizeStatus(filters.status);
    if (status) normalized.status = status;

    return normalized;
  }

  private normalizeText(value?: string): string | undefined {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }

  private normalizeStatus(value?: string): StudentReportStatus | undefined {
    const normalized = this.normalizeKey(value);

    if (!normalized) {
      return undefined;
    }

    const aliases: Record<string, StudentReportStatus> = {
      enrollment: 'ENROLLMENT',
      enrolled: 'ENROLLMENT',
      matriculado: 'ENROLLMENT',
      matricula: 'ENROLLMENT',
      interest: 'INTEREST',
      interested: 'INTEREST',
      interessado: 'INTEREST',
      interesse: 'INTEREST',
      nao_inscrito: 'NAO_INSCRITO',
      naoinscrito: 'NAO_INSCRITO',
      not_enrolled: 'NAO_INSCRITO',
      notenrolled: 'NAO_INSCRITO',
      sem_vinculo: 'NAO_INSCRITO',
      semvinculo: 'NAO_INSCRITO',
    };

    const status = aliases[normalized];

    if (!status) {
      throw new DomainException('Status de vinculo de aluno invalido.');
    }

    return status;
  }

  private toPdfRow(student: StudentReportProjection): StudentReportPdfRow {
    return {
      name: student.socialName?.trim() || student.fullName,
      cpf: this.maskCpf(student.cpf),
      course: student.courseNames.length ? student.courseNames.join('\n') : '-',
      email: student.email,
      phone: this.formatPhone(student.phoneNumber),
      location: this.formatLocation(student.city, student.state),
      pcd: this.formatPcd(student.hasDisability, student.disabilityType),
    };
  }

  private maskCpf(cpf: string): string {
    const digits = cpf.replace(/\D/g, '');

    if (digits.length < 5) {
      return '***';
    }

    return `${digits.slice(0, 3)}.***.***-${digits.slice(-2)}`;
  }

  private formatPhone(phone: string): string {
    let digits = phone.replace(/\D/g, '');

    if (digits.length === 13 && digits.startsWith('55')) {
      digits = digits.slice(2);
    }

    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }

    if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }

    return phone.trim();
  }

  private formatLocation(city?: string, state?: string): string {
    const normalizedCity = city?.trim();
    const normalizedState = state?.trim();

    if (normalizedCity && normalizedState) {
      return `${normalizedCity}/${normalizedState}`;
    }

    return normalizedCity || normalizedState || '-';
  }

  private formatPcd(hasDisability?: boolean, type?: string): string {
    if (!hasDisability) {
      return 'N\u00c3O';
    }

    const normalizedType = this.normalizeKey(type);

    if (!normalizedType) {
      return 'N\u00c3O';
    }

    const labels: Record<string, string> = {
      fisica: 'F\u00cdSICO',
      fisico: 'F\u00cdSICO',
      visual: 'OCULAR',
      ocular: 'OCULAR',
      auditiva: 'AUDITIVO',
      auditivo: 'AUDITIVO',
      intelectual: 'INTELECTUAL',
      psicossocial: 'PSICOSSOCIAL',
      multipla: 'M\u00daLTIPLA',
      multiplo: 'M\u00daLTIPLA',
      tea: 'TEA',
      outra: 'OUTRA',
      outro: 'OUTRA',
    };

    return labels[normalizedType] ?? type!.trim().toUpperCase();
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

    return `relatorio_alunos_${year}-${month}-${day}_${hour}${minute}${second}.pdf`;
  }

  private pad(value: number): string {
    return String(value).padStart(2, '0');
  }
}
