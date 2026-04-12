import { DomainException } from '../exceptions/domain.exception';
import { SocialBenefitType } from './enums/social-benefit.enum';

export class SocialBenefit {
  constructor(
    private readonly _id: number,
    private readonly _studentId: string,
    private _benefit: SocialBenefitType,
    private _benefitOther?: string,
  ) {
    this.validateSocialBenefit();
  }

  get id(): number {
    return this._id;
  }

  get studentId(): string {
    return this._studentId;
  }

  get benefit(): SocialBenefitType{
    return this._benefit;
  }

  get benefitOther(): string | undefined {
    return this._benefitOther;
  }

  public changeBenefit(
    newBenefit: SocialBenefitType,
    benefitOther?: string,
  ): void {
    this._benefit = newBenefit;
    this._benefitOther = benefitOther;
    this.validateSocialBenefit();
  }

  private validateSocialBenefit(): void {
    if (!this._studentId || this._studentId.trim().length === 0) {
      throw new DomainException(
        'O identificador do estudante é obrigatório para benefício social.',
      );
    }

    if (this._benefitOther && this._benefitOther.length > 100) {
      throw new DomainException(
        'A descrição complementar do benefício não pode ter mais que 100 caracteres.',
      );
    }
  }

  toJSON() {
    return {
      id: this.id,
      studentId: this.studentId,
      benefit: this.benefit,
      benefitOther: this.benefitOther,
    };
  }
}