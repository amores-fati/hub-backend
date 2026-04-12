export interface CreateDisabilityCommand {
  hasDisability: boolean;
  description?: string;
  hasReport?: string;
  type?: string;
}

export type UpdateDisabilityCommand = CreateDisabilityCommand;

export type PatchDisabilityCommand = Partial<CreateDisabilityCommand>;