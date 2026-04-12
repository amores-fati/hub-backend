import { DomainException } from '../exceptions/domain.exception';

export class Course {
  constructor(
    private readonly _id: string,
    private _name: string,
    private _banner: string,
    private _courseLoad: string,
    private _startDate: Date,
    private _endDate: Date,
    private _startRegistrations: Date,
    private _endRegistrations: Date,
    private _linkAccess: string,
    private _description?: string,
  ) {
    this.validateCourse();
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get banner(): string {
    return this._banner;
  }

  get description(): string | undefined {
    return this._description;
  }

  get courseLoad(): string {
    return this._courseLoad;
  }

  get startDate(): Date {
    return this._startDate;
  }

  get endDate(): Date {
    return this._endDate;
  }

  get startRegistrations(): Date {
    return this._startRegistrations;
  }

  get endRegistrations(): Date {
    return this._endRegistrations;
  }

  get linkAccess(): string {
    return this._linkAccess;
  }

  private validateCourse(): void {
    this.validateRequiredText(this._name, 'O nome do curso e obrigatorio.');
    this.validateRequiredText(this._banner, 'O banner do curso e obrigatorio.');
    this.validateRequiredText(
      this._courseLoad,
      'A carga horaria do curso e obrigatoria.',
    );
    this.validateRequiredText(
      this._linkAccess,
      'O link de acesso do curso e obrigatorio.',
    );
    this.validateOptionalText(this._description);
    this.validateDateRange(
      this._startDate,
      this._endDate,
      'A data final do curso nao pode ser anterior a data inicial.',
    );
    this.validateDateRange(
      this._startRegistrations,
      this._endRegistrations,
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
      linkAccess: this.linkAccess,
    };
  }
}
