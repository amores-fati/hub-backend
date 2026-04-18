import { DomainException } from '../exceptions/domain.exception';

export class Disability {
  readonly #studentId: string;
  #hasDisability: boolean;
  #description?: string;
  #hasReport?: string;
  #type?: string;

  constructor(
    studentId: string,
    hasDisability: boolean,
    description?: string,
    hasReport?: string,
    type?: string,
  ) {
    this.#studentId = studentId;
    this.#hasDisability = hasDisability;
    this.#description = description;
    this.#hasReport = hasReport;
    this.#type = type;
    this.validateDisability();
  }

  get studentId(): string {
    return this.#studentId;
  }

  get hasDisability(): boolean {
    return this.#hasDisability;
  }

  get description(): string | undefined {
    return this.#description;
  }

  get hasReport(): string | undefined {
    return this.#hasReport;
  }

  get type(): string | undefined {
    return this.#type;
  }

  public updateDetails(data: {
    hasDisability?: boolean;
    description?: string;
    hasReport?: string;
    type?: string;
  }): void {
    if (data.hasDisability !== undefined) {
      this.#hasDisability = data.hasDisability;
    }
    if (data.description !== undefined) this.#description = data.description;
    if (data.hasReport !== undefined) this.#hasReport = data.hasReport;
    if (data.type !== undefined) this.#type = data.type;

    this.validateDisability();
  }

  private validateDisability(): void {
    if (!this.#studentId || this.#studentId.trim().length === 0) {
      throw new DomainException(
        'O identificador do estudante Ã© obrigatÃ³rio para deficiÃªncia.',
      );
    }

    if (this.#hasReport && this.#hasReport.length > 30) {
      throw new DomainException(
        'A informaÃ§Ã£o sobre laudo nÃ£o pode ter mais que 30 caracteres.',
      );
    }

    if (this.#type && this.#type.length > 50) {
      throw new DomainException(
        'O tipo de deficiÃªncia nÃ£o pode ter mais que 50 caracteres.',
      );
    }
  }

  toJSON() {
    return {
      studentId: this.studentId,
      hasDisability: this.hasDisability,
      description: this.description,
      hasReport: this.hasReport,
      type: this.type,
    };
  }
}
