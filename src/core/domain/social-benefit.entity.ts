import { DomainException } from '../exceptions/domain.exception';
import { SocialBenefitType } from './enums/social-benefit.enum';

export class SocialBenefit {
  readonly #id: number;
  readonly #studentId: string;
  #benefit: SocialBenefitType;

  constructor(id: number, studentId: string, benefit: SocialBenefitType) {
    this.#id = id;
    this.#studentId = studentId;
    this.#benefit = benefit;
    this.validateSocialBenefit();
  }

  get id(): number {
    return this.#id;
  }

  get studentId(): string {
    return this.#studentId;
  }

  get benefit(): SocialBenefitType {
    return this.#benefit;
  }

  public changeBenefit(newBenefit: SocialBenefitType): void {
    this.#benefit = newBenefit;
    this.validateSocialBenefit();
  }

  private validateSocialBenefit(): void {
    if (!this.#studentId || this.#studentId.trim().length === 0) {
      throw new DomainException(
        'O identificador do estudante e obrigatorio para beneficio social.',
      );
    }
  }

  toJSON() {
    return {
      id: this.id,
      studentId: this.studentId,
      benefit: this.benefit,
    };
  }
}
