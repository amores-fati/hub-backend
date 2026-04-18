import {
  CreateContactCommand,
  UpdateContactCommand,
  PatchContactCommand,
} from './contact.command';
import {
  CreateDisabilityCommand,
  UpdateDisabilityCommand,
  PatchDisabilityCommand,
} from './disability.command';
import {
  CreateSocialBenefitCommand,
  UpdateSocialBenefitCommand,
  PatchSocialBenefitCommand,
} from './social-benefit.command';
import {
  CreateAccessibilityResourceCommand,
  UpdateAccessibilityResourceCommand,
  PatchAccessibilityResourceCommand,
} from './accessibility-resource.command';
import {
  EducationLevel,
  Gender,
  HowHeardChannel,
  Race,
} from '../domain/enums/student-profile.enum';

export interface CreateStudentCommand {
  email: string;
  password: string;
  cpf: string;
  birthDate: string | Date;
  gender: Gender;
  race: Race;
  education?: EducationLevel;
  institution?: string;
  activityArea?: string;
  hasProgrammingExperience?: boolean;
  hasTechnologyCourse?: boolean;
  sendCurriculum?: boolean;
  motivation?: string;
  howHeard?: HowHeardChannel;
  hasComputer?: boolean;
  hasInternet?: boolean;
  committedToParticipate?: boolean;
  contact: CreateContactCommand;
  disability?: CreateDisabilityCommand;
  socialBenefits?: CreateSocialBenefitCommand[];
  accessibilityResources?: CreateAccessibilityResourceCommand[];
}

export type UpdateStudentCommand = Omit<
  CreateStudentCommand,
  'cpf' | 'contact' | 'disability' | 'socialBenefits' | 'accessibilityResources'
> & {
  contact: UpdateContactCommand;
  disability?: UpdateDisabilityCommand;
  socialBenefits?: UpdateSocialBenefitCommand[];
  accessibilityResources?: UpdateAccessibilityResourceCommand[];
};

export type PatchStudentCommand = Partial<
  Omit<
    CreateStudentCommand,
    | 'cpf'
    | 'contact'
    | 'disability'
    | 'socialBenefits'
    | 'accessibilityResources'
  >
> & {
  contact?: PatchContactCommand;
  disability?: PatchDisabilityCommand;
  socialBenefits?: PatchSocialBenefitCommand[];
  accessibilityResources?: PatchAccessibilityResourceCommand[];
};
