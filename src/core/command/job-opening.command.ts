import { WorkplaceTypeEnum } from '../domain/enums/workplace-type.enum';

export interface CreateJobOpeningCommand {
  companyId: string;
  title: string;
  description: string;
  link: string;
  vacancyCount: number;
  isPcd: boolean;
  workplaceType: WorkplaceTypeEnum;
  skills?: string[];
}

export interface UpdateJobOpeningCommand {
  title: string;
  description: string;
  link: string;
  vacancyCount: number;
  isPcd: boolean;
  workplaceType: WorkplaceTypeEnum;
  skills?: string[];
}
