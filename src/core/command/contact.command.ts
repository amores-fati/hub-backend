export interface CreateContactCommand {
  phone: string;
  neighbourhood?: string;
  state?: string;
  city?: string;
  address?: string;
  cep?: string;
  complement?: string;
}

export type UpdateContactCommand = CreateContactCommand;

export type PatchContactCommand = Partial<CreateContactCommand>;
