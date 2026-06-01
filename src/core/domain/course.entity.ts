import { DomainException } from '../exceptions/domain.exception';
import { CourseStatus } from './course-status.enum';

export class Course {
  readonly #id: string;
  #name: string;
  #banner: string | undefined;
  #bannerImage: Buffer | undefined;
  #bannerImageMimeType: string | undefined;
  #courseLoad: string;
  #startDate: Date;
  #endDate: Date;
  #startRegistrations: Date;
  #endRegistrations: Date;
  #modality: string;
  #linkAccess?: string;
  #vacancyCount: number;
  #shift: string | undefined;
  #address: string | undefined;
  #description?: string;
  #status: CourseStatus;

  constructor(
    id: string,
    name: string,
    banner: string | undefined,
    courseLoad: string,
    startDate: Date,
    endDate: Date,
    startRegistrations: Date,
    endRegistrations: Date,
    modality: string,
    linkAccess: string | undefined,
    vacancyCount: number,
    shift?: string,
    address?: string,
    description?: string,
    status: CourseStatus = CourseStatus.ATIVO,
    bannerImage?: Buffer,
    bannerImageMimeType?: string,
  ) {
    this.#id = id;
    this.#name = name;
    this.#banner = banner;
    this.#bannerImage = bannerImage;
    this.#bannerImageMimeType = bannerImageMimeType;
    this.#courseLoad = courseLoad;
    this.#startDate = startDate;
    this.#endDate = endDate;
    this.#startRegistrations = startRegistrations;
    this.#endRegistrations = endRegistrations;
    this.#modality = modality;
    this.#linkAccess = linkAccess;
    this.#vacancyCount = vacancyCount;
    this.#shift = shift;
    this.#address = address;
    this.#description = description;
    this.#status = status;
    this.validateCourse();
  }

  get id(): string {
    return this.#id;
  }

  get name(): string {
    return this.#name;
  }

  get banner(): string | undefined {
    return this.#banner;
  }

  get bannerImage(): Buffer | undefined {
    return this.#bannerImage;
  }

  get bannerImageMimeType(): string | undefined {
    return this.#bannerImageMimeType;
  }

  get description(): string | undefined {
    return this.#description;
  }

  get courseLoad(): string {
    return this.#courseLoad;
  }

  get startDate(): Date {
    return this.#startDate;
  }

  get endDate(): Date {
    return this.#endDate;
  }

  get startRegistrations(): Date {
    return this.#startRegistrations;
  }

  get endRegistrations(): Date {
    return this.#endRegistrations;
  }

  get modality(): string {
    return this.#modality;
  }

  get linkAccess(): string | undefined {
    return this.#linkAccess;
  }

  get vacancyCount(): number {
    return this.#vacancyCount;
  }

  get status(): CourseStatus {
    return this.#status;
  }

  get shift(): string | undefined {
    return this.#shift;
  }

  get address(): string | undefined {
    return this.#address;
  }

  private validateCourse(): void {
    this.validateRequiredText(this.#name, 'O nome do curso e obrigatorio.');
    this.validateBannerPresence();
    this.validateRequiredText(
      this.#courseLoad,
      'A carga horaria do curso e obrigatoria.',
    );
    this.validateRequiredText(
      this.#modality,
      'A modalidade do curso e obrigatoria.',
    );
    if (
      this.#linkAccess !== undefined &&
      this.#linkAccess.trim().length === 0
    ) {
      throw new DomainException(
        'O link de acesso do curso nao pode ser uma string vazia.',
      );
    }
    this.validateOptionalText(this.#description);
    this.validateVacancyCount(this.#vacancyCount);
    this.validateStatus(this.#status);
    this.validateDateRange(
      this.#startDate,
      this.#endDate,
      'A data final do curso nao pode ser anterior a data inicial.',
    );
    this.validateDateRange(
      this.#startRegistrations,
      this.#endRegistrations,
      'A data final das inscricoes nao pode ser anterior a data inicial.',
    );
  }

  private validateRequiredText(value: string, message: string): void {
    if (!value || value.trim().length === 0) {
      throw new DomainException(message);
    }
  }

  private validateBannerPresence(): void {
    const hasBannerUrl = !!this.#banner && this.#banner.trim().length > 0;
    const hasBannerImage = !!this.#bannerImage && this.#bannerImage.length > 0;

    if (!hasBannerUrl && !hasBannerImage) {
      throw new DomainException(
        'O banner do curso e obrigatorio (informe uma URL ou envie uma imagem).',
      );
    }

    if (hasBannerImage && !this.#bannerImageMimeType?.trim()) {
      throw new DomainException(
        'O mime type da imagem do banner e obrigatorio quando ha imagem.',
      );
    }
  }

  private validateOptionalText(value?: string): void {
    if (value !== undefined && value.trim().length === 0) {
      throw new DomainException(
        'A descricao do curso nao pode ser uma string vazia.',
      );
    }
  }

  private validateVacancyCount(value: number): void {
    if (!Number.isInteger(value) || value < 0) {
      throw new DomainException(
        'A quantidade de vagas precisa ser um inteiro maior ou igual a zero.',
      );
    }
  }

  private validateStatus(value: CourseStatus): void {
    if (!Object.values(CourseStatus).includes(value)) {
      throw new DomainException('O status do curso precisa ser valido.');
    }
  }

  private validateDateRange(
    startDate: Date,
    endDate: Date,
    message: string,
  ): void {
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new DomainException('As datas do curso precisam ser validas.');
    }

    if (endDate < startDate) {
      throw new DomainException(message);
    }
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      banner: this.banner ?? null,
      hasBannerImage: !!this.bannerImage && this.bannerImage.length > 0,
      bannerImageMimeType: this.bannerImageMimeType ?? null,
      description: this.description ?? null,
      courseLoad: this.courseLoad,
      startDate: this.startDate,
      endDate: this.endDate,
      startRegistrations: this.startRegistrations,
      endRegistrations: this.endRegistrations,
      modality: this.modality,
      linkAccess: this.linkAccess,
      vacancyCount: this.vacancyCount,
      status: this.status,
      shift: this.shift ?? null,
      address: this.address ?? null,
    };
  }
}
