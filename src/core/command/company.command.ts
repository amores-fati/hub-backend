import {
  CreateContactCommand,
  UpdateContactCommand,
  PatchContactCommand,
} from './contact.command';

export interface CreateCompanyCommand {
  email: string;
  password: string;
  name: string;
  cnpj: string;
  ownerName: string;
  contact: CreateContactCommand;
}

export type UpdateCompanyCommand = Omit<
  CreateCompanyCommand,
  'cnpj' | 'contact'
> & {
  contact: UpdateContactCommand;
};

export type PatchCompanyCommand = Partial<
  Omit<CreateCompanyCommand, 'cnpj' | 'contact'>
> & {
  contact?: PatchContactCommand;
};
