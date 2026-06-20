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
  responsibleName: string;
  contact: CreateContactCommand;
}

export interface UpdateCompanyMeCommand {
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  neighbourhood?: string;
  address?: string;
  complement?: string;
  cep?: string;
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
