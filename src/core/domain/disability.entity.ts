import { DomainException } from '../exceptions/domain.exception';

export class Disability {
  constructor(
    private readonly _studentId: string,
    private _hasDisability: boolean,
    private _description?: string,
    private _hasReport?: string,
    private _type?: string,
  ) {
    this.validateDisability();
  }

  get studentId(): string {
    return this._studentId;
  }

  get hasDisability(): boolean {
    return this._hasDisability;
  }

  get description(): string | undefined {
    return this._description;
  }

  get hasReport(): string | undefined {
    return this._hasReport;
  }

  get type(): string | undefined {
    return this._type;
  }

  public updateDetails(data: {
    hasDisability?: boolean;
    description?: string;
    hasReport?: string;
    type?: string;
  }): void {
    if (data.hasDisability !== undefined) this._hasDisability = data.hasDisability;
    if (data.description !== undefined) this._description = data.description;
    if (data.hasReport !== undefined) this._hasReport = data.hasReport;
    if (data.type !== undefined) this._type = data.type;

    this.validateDisability();
  }

  private validateDisability(): void {
    if (!this._studentId || this._studentId.trim().length === 0) {
      throw new DomainException(
        'O identificador do estudante é obrigatório para deficiência.',
      );
    }

    if (this._hasReport && this._hasReport.length > 30) {
      throw new DomainException(
        'A informação sobre laudo não pode ter mais que 30 caracteres.',
      );
    }

    if (this._type && this._type.length > 50) {
      throw new DomainException(
        'O tipo de deficiência não pode ter mais que 50 caracteres.',
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