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

export interface CreateStudentCommand {
  email: string;
  password: string;
  cpf: string;
  socialName?: string;
  birthDate: string;
  gender: string;
  race: string;
  education?: string;
  courseName?: string;
  institution?: string;
  activityArea?: string;
  hasProgrammingExperience?: boolean;
  hasTechCourses?: boolean;
  techCoursesList?: string;
  sendCurriculum?: boolean;
  fatilabMotivation?: string;
  howHeard?: string;
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
    'cpf' | 'contact' | 'disability' | 'socialBenefits' | 'accessibilityResources'
  >
> & {
  contact?: PatchContactCommand;
  disability?: PatchDisabilityCommand;
  socialBenefits?: PatchSocialBenefitCommand[];
  accessibilityResources?: PatchAccessibilityResourceCommand[];
};