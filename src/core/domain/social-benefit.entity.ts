import { DomainException } from '../exceptions/domain.exception';
import { SocialBenefitType } from './enums/social-benefit.enum';

export class SocialBenefit {
  readonly #id: number;
  readonly #studentId: string;
  #benefit: SocialBenefitType;
  #benefitOther?: string;

  constructor(
    id: number,
    studentId: string,
    benefit: SocialBenefitType,
    benefitOther?: string,
  ) {
    this.#id = id;
    this.#studentId = studentId;
    this.#benefit = benefit;
    this.#benefitOther = benefitOther;
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

  get benefitOther(): string | undefined {
    return this.#benefitOther;
  }

  public changeBenefit(
    newBenefit: SocialBenefitType,
    benefitOther?: string,
  ): void {
    this.#benefit = newBenefit;
    this.#benefitOther = benefitOther;
    this.validateSocialBenefit();
  }

  private validateSocialBenefit(): void {
    if (!this.#studentId || this.#studentId.trim().length === 0) {
      throw new DomainException(
        'O identificador do estudante Ã© obrigatÃ³rio para benefÃ­cio social.',
      );
    }

    if (this.#benefitOther && this.#benefitOther.length > 100) {
      throw new DomainException(
        'A descriÃ§Ã£o complementar do benefÃ­cio nÃ£o pode ter mais que 100 caracteres.',
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
