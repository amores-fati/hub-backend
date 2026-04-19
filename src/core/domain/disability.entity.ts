import { DomainException } from '../exceptions/domain.exception';

export class Disability {
  readonly #studentId: string;
  #hasDisability: boolean;
  #type?: string;

  constructor(studentId: string, hasDisability: boolean, type?: string) {
    this.#studentId = studentId;
    this.#hasDisability = hasDisability;
    this.#type = type;
    this.validateDisability();
  }

  get studentId(): string {
    return this.#studentId;
  }

  get hasDisability(): boolean {
    return this.#hasDisability;
  }

  get type(): string | undefined {
    return this.#type;
  }

  public updateDetails(data: { hasDisability?: boolean; type?: string }): void {
    if (data.hasDisability !== undefined) {
      this.#hasDisability = data.hasDisability;
    }
    if (data.type !== undefined) this.#type = data.type;

    this.validateDisability();
  }

  private validateDisability(): void {
    if (!this.#studentId || this.#studentId.trim().length === 0) {
      throw new DomainException(
        'O identificador do estudante Ã© obrigatÃ³rio para deficiÃªncia.',
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
      type: this.type,
    };
  }
}
