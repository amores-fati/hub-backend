import { SocialBenefitType } from '../domain/enums/social-benefit.enum';

export interface CreateSocialBenefitCommand {
  benefit: SocialBenefitType;
  benefitOther?: string;
}

export type UpdateSocialBenefitCommand = CreateSocialBenefitCommand;

export type PatchSocialBenefitCommand = Partial<CreateSocialBenefitCommand>;