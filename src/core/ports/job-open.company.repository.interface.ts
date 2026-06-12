import {
  CreateJobOpeningCommand,
  UpdateJobOpeningCommand,
} from '../command/job-opening.command';

export const IJobOpeningRepository = Symbol('IJobOpeningRepository');

export interface JobOpeningResult {
  id: string;
  name: string;
  description: string;
  openingsCount: number;
  applicationLink: string | null;
  isPcd: boolean;
  workplaceType: string;
  announcementDate: Date;
  skills: { id: string; name: string }[];
}

export interface IJobOpeningRepository {
  countActive(): Promise<number>;
  findById(id: string): Promise<JobOpeningResult | null>;
  create(command: CreateJobOpeningCommand): Promise<JobOpeningResult>;
  update(
    id: string,
    command: UpdateJobOpeningCommand,
  ): Promise<JobOpeningResult>;
}
