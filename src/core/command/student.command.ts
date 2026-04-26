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
  EducationLevel,
  Gender,
  HowHeardChannel,
  Race,
  FamilyIncome,
} from '../domain/enums/student-profile.enum';

export interface CreateStudentCommand {
  email: string;
  password: string;
  cpf: string;
  birthDate: string | Date;
  gender: Gender;
  race: Race;
  education?: EducationLevel;
  courseName?: string;
  institution?: string;
  activityArea?: string;
  hasProgrammingExperience?: boolean;
  motivation?: string;
  howHeard?: HowHeardChannel;
  hasComputer?: boolean;
  hasInternet?: boolean;
  committedToParticipate?: boolean;
  contact: CreateContactCommand;
  disability?: CreateDisabilityCommand;
  socialBenefits?: CreateSocialBenefitCommand[];
  socialName?: string;
  familyIncome?: FamilyIncome;
}

export interface UpdateStudentMeCommand {
  fullName?: string;
  socialName?: string;
  birthDate?: string;
  gender?: string;
  race?: string;
  phone?: string;
  city?: string;
  state?: string;
  address?: string;
  cep?: string;
  isPcd?: boolean;
  disabilityType?: string;
  educationLevel?: string;
  courseName?: string;
  institution?: string;
  workArea?: string | null;
  hasProgrammingExperience?: boolean;
  fatilabMotivation?: string;
  howHeard?: string;
  hasComputer?: boolean;
  hasInternet?: boolean;
  familyIncome?: string;
  householdSize?: number;
  socialBenefits?: string;
}

export type UpdateStudentCommand = Omit<
  CreateStudentCommand,
  'cpf' | 'contact' | 'disability' | 'socialBenefits'
> & {
  contact: UpdateContactCommand;
  disability?: UpdateDisabilityCommand;
  socialBenefits?: UpdateSocialBenefitCommand[];
};

export type PatchStudentCommand = Partial<
  Omit<
    CreateStudentCommand,
    'cpf' | 'contact' | 'disability' | 'socialBenefits'
  >
> & {
  contact?: PatchContactCommand;
  disability?: PatchDisabilityCommand;
  socialBenefits?: PatchSocialBenefitCommand[];
};
