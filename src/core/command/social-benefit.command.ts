import { SocialBenefitType } from '../domain/enums/social-benefit.enum';

export interface CreateSocialBenefitCommand {
  benefit: SocialBenefitType;
}

export type UpdateSocialBenefitCommand = CreateSocialBenefitCommand;

export type PatchSocialBenefitCommand = Partial<CreateSocialBenefitCommand>;
