import { WorkplaceTypeEnum } from '../domain/enums/workplace-type.enum';

export interface CreateJobOpeningCommand {
  companyId: string;
  name: string;
  description: string;
  applicationLink?: string;
  openingsCount: number;
  isPcd: boolean;
  workplaceType: WorkplaceTypeEnum;
  skills?: string[];
}

export interface UpdateJobOpeningCommand {
  name: string;
  description: string;
  applicationLink?: string;
  openingsCount: number;
  isPcd: boolean;
  workplaceType: WorkplaceTypeEnum;
  skills?: string[];
}
