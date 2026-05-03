import { DomainException } from '../exceptions/domain.exception';

export class Course {
  readonly #id: string;
  #name: string;
  #banner: string;
  #courseLoad: string;
  #startDate: Date;
  #endDate: Date;
  #startRegistrations: Date;
  #endRegistrations: Date;
  #modality: string;
  #linkAccess: string;
  #description?: string;

  constructor(
    id: string,
    name: string,
    banner: string,
    courseLoad: string,
    startDate: Date,
    endDate: Date,
    startRegistrations: Date,
    endRegistrations: Date,
    modality: string,
    linkAccess: string,
    description?: string,
  ) {
    this.#id = id;
    this.#name = name;
    this.#banner = banner;
    this.#courseLoad = courseLoad;
    this.#startDate = startDate;
    this.#endDate = endDate;
    this.#startRegistrations = startRegistrations;
    this.#endRegistrations = endRegistrations;
    this.#modality = modality;
    this.#linkAccess = linkAccess;
    this.#description = description;
    this.validateCourse();
  }

  get id(): string {
    return this.#id;
  }

  get name(): string {
    return this.#name;
  }

  get banner(): string {
    return this.#banner;
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

  get linkAccess(): string {
    return this.#linkAccess;
  }

  private validateCourse(): void {
    this.validateRequiredText(this.#name, 'O nome do curso e obrigatorio.');
    this.validateRequiredText(this.#banner, 'O banner do curso e obrigatorio.');
    this.validateRequiredText(
      this.#courseLoad,
      'A carga horaria do curso e obrigatoria.',
    );
    this.validateRequiredText(
      this.#modality,
      'A modalidade do curso e obrigatoria.',
    );
    this.validateRequiredText(
      this.#linkAccess,
      'O link de acesso do curso e obrigatorio.',
    );
    this.validateOptionalText(this.#description);
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

  private validateOptionalText(value?: string): void {
    if (value !== undefined && value.trim().length === 0) {
      throw new DomainException(
        'A descricao do curso nao pode ser uma string vazia.',
      );
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
      banner: this.banner,
      description: this.description ?? null,
      courseLoad: this.courseLoad,
      startDate: this.startDate,
      endDate: this.endDate,
      startRegistrations: this.startRegistrations,
      endRegistrations: this.endRegistrations,
      modality: this.modality,
      linkAccess: this.linkAccess,
    };
  }
}
